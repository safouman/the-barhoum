import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getFieldsToSign, jwtSign, logoutOperation, type Payload } from "payload";
import type { NextRequest } from "next/server";
import { studentSessionLifetime } from "../../payload/students";
import { AuthError, authOrigin, getStudent, studentPayload, updateStudent, type AuthTx, type StudentRecord } from "./core";

export const studentCookie = "barhoum-student";
const freshness = 5 * 60;

export type StudentProfile = {
    id: number;
    name: string;
    email: string;
    city: string | null;
    ageRange: string | null;
    hasPassword: boolean;
    hasGoogle: boolean;
};

export function profile(record: StudentRecord): StudentProfile {
    return {
        id: Number(record.id), name: record.name, email: record.email,
        city: record.city ?? null, ageRange: record.ageRange ?? null,
        hasPassword: Boolean(record.hasPassword), hasGoogle: Boolean(record.googleSubject),
    };
}

async function identityFromToken(payload: Payload, token: string | undefined) {
    if (!token || token.length > 8192) return null;
    const { user } = await payload.auth({ headers: new Headers({ Authorization: `Bearer ${token}` }) });
    if (user?.collection !== "students" || typeof user.id !== "number" || !("_sid" in user) || typeof user._sid !== "string") return null;
    return { user, sid: user._sid };
}

export type StudentIdentity = NonNullable<Awaited<ReturnType<typeof identityFromToken>>>;

export async function requestStudent(payload: Payload, request: NextRequest) {
    return identityFromToken(payload, request.cookies.get(studentCookie)?.value);
}

export async function readStudentSession(): Promise<StudentProfile | null> {
    const token = (await cookies()).get(studentCookie)?.value;
    if (!token) return null;
    const identity = await identityFromToken(await studentPayload(), token);
    return identity?.user._verified ? profile(identity.user) : null;
}

type StoredSession = { id: string; createdAt?: string | Date | null; expiresAt: string | Date };
const sessions = (record: StudentRecord): StoredSession[] => record.sessions ?? [];
export const activeSession = (record: StudentRecord, sid: string) =>
    sessions(record).find(session => session.id === sid && new Date(session.expiresAt).getTime() > Date.now());

export async function requireCurrentStudent(payload: Payload, context: AuthTx, identity: StudentIdentity, fresh = false) {
    const record = await getStudent(payload, "id", identity.user.id, context.req);
    const session = record && activeSession(record, identity.sid);
    if (!record?._verified || !session) throw new AuthError("UNAUTHENTICATED");
    if (fresh && (!session.createdAt || Date.now() - new Date(session.createdAt).getTime() > freshness * 1000)) throw new AuthError("REAUTH_REQUIRED");
    return record;
}

export function setStudentSessions(payload: Payload, context: AuthTx, id: number, sessions: StoredSession[]) {
    // Payload's PostgreSQL adapter uses a different write path for array updates.
    // Keep session-array writes separate from scalar updates.
    return updateStudent(payload, context, id, { sessions, updatedAt: null });
}

// Payload 3.93.0's native session row and signing fields are pinned and tested together.
export async function issueGoogleSession(payload: Payload, context: AuthTx, record: StudentRecord, subject: string, replaceSID?: string) {
    if (!record._verified || record.googleSubject !== subject) throw new AuthError("INVALID_CREDENTIALS");
    const sid = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + studentSessionLifetime * 1000);
    const liveSessions = sessions(record).filter(session => session.id !== replaceSID && new Date(session.expiresAt) > createdAt);
    await setStudentSessions(payload, context, record.id, [...liveSessions, { id: sid, createdAt, expiresAt }]);
    const collectionConfig = payload.collections.students.config;
    return jwtSign({ fieldsToSign: getFieldsToSign({ collectionConfig, user: record, email: record.email, sid }), secret: payload.secret, tokenExpiration: studentSessionLifetime });
}

export function revokeStudentSession(payload: Payload, context: AuthTx, identity: StudentIdentity) {
    context.req.user = identity.user;
    return logoutOperation({ collection: payload.collections.students, req: context.req });
}

export function studentCookieHeader(token?: string) {
    const secure = authOrigin().protocol === "https:" ? "; Secure" : "";
    return `${studentCookie}=${token ?? ""}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? studentSessionLifetime : 0}${secure}`;
}
