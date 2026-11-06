import { type NextRequest } from "next/server";
import { z } from "zod";
import { confirmEmailChange, passwordLogin, resetStudentPassword, startEmailChange, startRecovery, startSignup, verifySignup } from "../../../../lib/student-auth/accounts";
import { ageRangeInput, AuthError, authFailure, authJSON, authOrigin, authTransaction, emailInput, nameInput, passwordInput, rateLimit, studentPayload, tokenInput, updateStudent } from "../../../../lib/student-auth/core";
import { googleCallback, startGoogle } from "../../../../lib/student-auth/google";
import { profile, requestStudent, requireCurrentStudent, revokeStudentSession, studentCookieHeader } from "../../../../lib/student-auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const routePrefix = "/api/student-auth/";
const operation = (request: NextRequest) => request.nextUrl.pathname.slice(routePrefix.length).replace(/\/$/, "");
const emailBody = z.object({ email: emailInput }).strict();
const verifyBody = z.object({ token: tokenInput, name: nameInput, password: passwordInput.optional() }).strict();
const credentialsBody = z.object({ email: emailInput, password: z.string().min(1).max(128) }).strict();
const resetBody = z.object({ token: tokenInput, password: passwordInput }).strict();
const confirmBody = z.object({ token: tokenInput }).strict();
const profileBody = z.object({
    name: nameInput.optional(),
    city: z.string().trim().max(120).transform(value => value || null).nullable().optional(),
    ageRange: ageRangeInput.nullable().optional(),
}).strict().refine(value => Object.keys(value).length > 0);

function readBody<T>(schema: z.ZodType<T>, data: unknown) {
    const value = schema.safeParse(data);
    if (!value.success) throw new AuthError("INVALID_INPUT");
    return value.data;
}

async function readJSON(request: NextRequest) {
    if (request.headers.get("origin") !== authOrigin().origin || request.headers.get("sec-fetch-site") === "cross-site" ||
        request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new AuthError("INVALID_INPUT");
    if (!request.body) throw new AuthError("INVALID_INPUT");
    const reader = request.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let size = 0;
    let text = "";
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 4096) {
                await reader.cancel();
                throw new AuthError("INVALID_INPUT");
            }
            text += decoder.decode(value, { stream: true });
        }
        return JSON.parse(text + decoder.decode()) as unknown;
    } catch {
        throw new AuthError("INVALID_INPUT");
    } finally {
        reader.releaseLock();
    }
}

function withCookie(response: Response, token?: string) {
    response.headers.set("Set-Cookie", studentCookieHeader(token));
    return response;
}

export async function GET(request: NextRequest) {
    try {
        const action = operation(request);
        if (!["google/start", "google/callback", "me"].includes(action)) return authJSON({ error: { code: "INVALID_INPUT", message: "Unknown operation." } }, 404);
        const payload = await studentPayload();
        if (action === "google/start") return await startGoogle(payload, request);
        if (action === "google/callback") return await googleCallback(payload, request);
        const identity = await requestStudent(payload, request);
        if (!identity?.user._verified) throw new AuthError("UNAUTHENTICATED");
        return authJSON({ student: profile(identity.user) });
    } catch (error) {
        return authFailure(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await readJSON(request);
        const payload = await studentPayload();
        const action = operation(request);
        switch (action) {
            case "register":
            case "resend-verification": {
                const { email } = readBody(emailBody, data);
                await rateLimit(payload, request, "register", email, [5, 25], 30);
                startSignup(payload, email);
                return authJSON({ ok: true }, 202);
            }
            case "verify": {
                const input = readBody(verifyBody, data);
                await rateLimit(payload, request, "verify", input.token, [8, 40]);
                await verifySignup(payload, input);
                return authJSON({ ok: true });
            }
            case "login": {
                const { email, password } = readBody(credentialsBody, data);
                await rateLimit(payload, request, "login", email, [10, 50]);
                const { token, user } = await passwordLogin(payload, email, password);
                return withCookie(authJSON({ student: profile(user) }), token);
            }
            case "forgot-password": {
                const { email } = readBody(emailBody, data);
                await rateLimit(payload, request, "forgot-password", email, [5, 25], 30);
                startRecovery(payload, email);
                return authJSON({ ok: true }, 202);
            }
            case "reset-password": {
                const { token, password } = readBody(resetBody, data);
                await rateLimit(payload, request, "reset-password", token, [8, 40]);
                await resetStudentPassword(payload, token, password);
                return authJSON({ ok: true });
            }
            case "logout": {
                readBody(z.object({}).strict(), data);
                const identity = await requestStudent(payload, request);
                if (identity) {
                    await authTransaction(payload, async context => {
                        try {
                            await requireCurrentStudent(payload, context, identity);
                        } catch (error) {
                            if (error instanceof AuthError && error.code === "UNAUTHENTICATED") return;
                            throw error;
                        }
                        await revokeStudentSession(payload, context, identity);
                    }, identity.user.id);
                }
                return withCookie(authJSON({ ok: true }));
            }
            case "email-change": {
                const { email } = readBody(emailBody, data);
                const identity = await requestStudent(payload, request);
                if (!identity) throw new AuthError("UNAUTHENTICATED");
                await rateLimit(payload, request, "email-change", String(identity.user.id), [5, 25], 30);
                await startEmailChange(payload, identity, email);
                return authJSON({ ok: true }, 202);
            }
            case "email-change/confirm": {
                const { token } = readBody(confirmBody, data);
                await rateLimit(payload, request, "email-change-confirm", token, [8, 40]);
                await confirmEmailChange(payload, token);
                return authJSON({ ok: true });
            }
            default:
                return authJSON({ error: { code: "INVALID_INPUT", message: "Unknown operation." } }, 404);
        }
    } catch (error) {
        return authFailure(error);
    }
}

export async function PATCH(request: NextRequest) {
    try {
        if (operation(request) !== "profile") return authJSON({ error: { code: "INVALID_INPUT", message: "Unknown operation." } }, 404);
        const update = readBody(profileBody, await readJSON(request));
        const payload = await studentPayload();
        const identity = await requestStudent(payload, request);
        if (!identity) throw new AuthError("UNAUTHENTICATED");
        const student = await authTransaction(payload, async context => {
            const current = await requireCurrentStudent(payload, context, identity);
            await updateStudent(payload, context, current.id, { ...update, updatedAt: new Date().toISOString() });
            return profile({ ...current, ...update });
        }, identity.user.id);
        return authJSON({ student });
    } catch (error) {
        return authFailure(error);
    }
}
