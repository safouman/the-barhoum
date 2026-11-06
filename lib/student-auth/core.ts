import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import { createLocalReq, getPayload, type Payload, type PayloadRequest } from "payload";
import { z } from "zod";
import config from "@payload-config";
import { normalizeStudentEmail, studentAgeRanges } from "../../payload/students";
import type { Student } from "../../payload-types";

const errors = {
    INVALID_INPUT: [400, "Check the information and try again."],
    INVALID_TOKEN: [400, "This link is invalid or expired."],
    INVALID_CREDENTIALS: [401, "The email or password is incorrect."],
    UNAUTHENTICATED: [401, "Sign in to continue."],
    REAUTH_REQUIRED: [403, "Sign in again before continuing."],
    RATE_LIMITED: [429, "Too many attempts. Try again later."],
    UNAVAILABLE: [503, "This service is temporarily unavailable."],
} as const;

export class AuthError extends Error {
    constructor(readonly code: keyof typeof errors) {
        super(errors[code][1]);
    }
    get status() { return errors[this.code][0]; }
}

export const noStore = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
export const emailInput = z.string().transform(normalizeStudentEmail).pipe(z.email().max(254));
export const passwordInput = z.string().min(12).max(128);
export const nameInput = z.string().trim().min(1).max(120);
export const ageRangeInput = z.enum(studentAgeRanges);
export const tokenInput = z.string().min(32).max(128).regex(/^[a-zA-Z0-9_-]+$/);
export const opaqueToken = () => randomBytes(32).toString("base64url");
export const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export const studentPayload = () => getPayload({ config });

export function authOrigin() {
    const configured = process.env.STUDENT_AUTH_ORIGIN;
    if (!configured) throw new AuthError("UNAVAILABLE");
    let url: URL;
    try { url = new URL(configured); } catch { throw new AuthError("UNAVAILABLE"); }
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (configured !== url.origin || (url.protocol !== "https:" && !(url.protocol === "http:" && loopback && !process.env.VERCEL))) {
        throw new AuthError("UNAVAILABLE");
    }
    return url;
}

type Tx = NonNullable<PostgresAdapter["sessions"][string]>["db"];
export type AuthTx = { req: PayloadRequest; tx: Tx };
export type StudentRecord = Student;

export async function authTransaction<T>(payload: Payload, run: (context: AuthTx) => Promise<T>, studentID?: number) {
    const db = payload.db as unknown as PostgresAdapter;
    const id = await db.beginTransaction();
    if (id == null) throw new AuthError("UNAVAILABLE");
    try {
        const tx = db.sessions[id].db;
        const req = await createLocalReq({ req: { transactionID: id } }, payload);
        if (studentID !== undefined) await lockStudent({ req, tx }, studentID);
        const value = await run({ req, tx });
        await db.commitTransaction(id);
        return value;
    } catch (error) {
        await db.rollbackTransaction(id);
        throw error;
    }
}

export function lockStudent({ tx }: AuthTx, id: number) {
    return tx.execute(sql`SELECT pg_advisory_xact_lock(40193, ${id}::integer)`);
}

export function lockEmail({ tx }: AuthTx, email: string) {
    return tx.execute(sql`SELECT pg_advisory_xact_lock(40194, hashtext(${email}))`);
}

export function lockGoogleSubject({ tx }: AuthTx, subject: string) {
    return tx.execute(sql`SELECT pg_advisory_xact_lock(40195, hashtext(${subject}))`);
}

export async function getStudent(payload: Payload, field: "email" | "id" | "googleSubject" | "resetPasswordToken", value: string | number, req?: PayloadRequest) {
    return await payload.db.findOne({ collection: "students", where: { [field]: { equals: value } }, req }) as StudentRecord | null;
}

export function updateStudent(payload: Payload, context: AuthTx, id: number, data: Record<string, unknown>) {
    return payload.db.updateOne({ collection: "students", id, data, req: context.req, returning: false });
}

export async function rateLimit(payload: Payload, request: Request, scope: string, account?: string, limits = [8, 30], minutes = 15) {
    // Vercel overwrites this header before forwarding to the application.
    const ip = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown" : "local";
    const keys = [[`ip:${ip}`, limits[1]], ...(account ? [[`account:${account}`, limits[0]]] : [])] as [string, number][];
    const expires = (Math.floor(Date.now() / (minutes * 60_000)) + 1) * (minutes * 60_000);
    const exceeded = await authTransaction(payload, async ({ tx }) => {
        await tx.execute(sql`DELETE FROM student_auth_rate_limits WHERE expires_at < now()`);
        for (const [value, limit] of keys) {
            const key = createHmac("sha256", payload.secret).update(`${scope}:${value}`).digest("hex");
            const { rows } = await tx.execute(sql`
                INSERT INTO student_auth_rate_limits (key, expires_at, attempts) VALUES (${key}, ${new Date(expires).toISOString()}, 1)
                ON CONFLICT (key) DO UPDATE SET attempts = CASE
                    WHEN student_auth_rate_limits.expires_at <= now() THEN 1
                    ELSE LEAST(student_auth_rate_limits.attempts + 1, ${limit + 1})
                END, expires_at = EXCLUDED.expires_at
                RETURNING attempts`);
            if (Number(rows[0].attempts) > limit) return true;
        }
        return false;
    });
    if (exceeded) throw new AuthError("RATE_LIMITED");
}

export function authJSON(data: unknown, status = 200) {
    return Response.json(data, { status, headers: noStore });
}

export function authFailure(error: unknown) {
    const safe = error instanceof AuthError ? error : new AuthError("UNAVAILABLE");
    return authJSON({ error: { code: safe.code, message: safe.message } }, safe.status);
}
