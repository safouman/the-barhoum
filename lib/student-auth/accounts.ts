import "server-only";

import { pbkdf2 } from "node:crypto";
import { promisify } from "node:util";
import type { Payload } from "payload";
import { z } from "zod";
import { AuthError, authTransaction, digest, emailInput, getStudent, lockEmail, lockGoogleSubject, opaqueToken, updateStudent, type AuthTx } from "./core";
import { consumeChallenge, createChallenge, readEmailChangeChallenge } from "./challenges";
import { queueEmailWork, queueStudentEmail, requireStudentEmail, sendStudentEmail } from "./email";
import { activeSession, requireCurrentStudent, setStudentSessions, type StudentIdentity } from "./session";

const derive = promisify(pbkdf2);
const emailChallenge = z.object({ email: emailInput, subject: z.string().min(1).max(255).optional() });
const emailChange = z.object({ email: emailInput, oldEmail: emailInput, studentID: z.number().int().positive(), sid: z.uuid() });

export async function createStudent(payload: Payload, { req }: AuthTx, input: { email: string; name: string; password?: string; subject?: string }) {
    return payload.create({
        collection: "students", req, disableVerificationEmail: true,
        data: {
            email: input.email, name: input.name, password: input.password ?? opaqueToken(),
            hasPassword: Boolean(input.password), googleSubject: input.subject, _verified: true,
        },
    });
}

export function startSignup(payload: Payload, email: string, returnTo?: string) {
    requireStudentEmail();
    queueEmailWork(payload, async () => {
        const token = await authTransaction(payload, async context => {
            await lockEmail(context, email);
            if (await getStudent(payload, "email", email, context.req)) return;
            return createChallenge(context, "signup", { email }, 30);
        });
        if (token) await sendStudentEmail(payload, email, "signup", token, returnTo);
    });
}

export async function verifySignup(payload: Payload, input: { token: string; name: string; password?: string }) {
    await authTransaction(payload, async context => {
        const challenge = await consumeChallenge(context, input.token, ["signup", "google-signup"]);
        const parsed = emailChallenge.safeParse(challenge.context);
        if (!parsed.success) throw new AuthError("INVALID_TOKEN");
        const { email, subject } = parsed.data;
        if (challenge.purpose === "signup" ? !input.password : Boolean(input.password) || !subject) throw new AuthError("INVALID_INPUT");
        await lockEmail(context, email);
        if (subject) await lockGoogleSubject(context, subject);
        if (await getStudent(payload, "email", email, context.req) || (subject && await getStudent(payload, "googleSubject", subject, context.req))) {
            throw new AuthError("INVALID_TOKEN");
        }
        await createStudent(payload, context, { email, name: input.name, password: input.password, subject });
    });
}

export async function passwordLogin(payload: Payload, email: string, password: string) {
    const candidate = await getStudent(payload, "email", email);
    if (!candidate?._verified || !candidate.hasPassword) {
        await derive(password, "barhoum-student-login-padding", payload.config.auth.passwordHashIterations, 32, "sha256");
        throw new AuthError("INVALID_CREDENTIALS");
    }
    return authTransaction(payload, async ({ req }) => {
        const record = await getStudent(payload, "id", candidate.id, req);
        if (!record?._verified || !record.hasPassword || record.email !== email) throw new AuthError("INVALID_CREDENTIALS");
        try {
            const { token, user } = await payload.login({ collection: "students", data: { email, password }, req });
            if (!token || !user) throw new AuthError("INVALID_CREDENTIALS");
            return { token, user };
        } catch (error) {
            if (error instanceof AuthError || (error && typeof error === "object" && "status" in error && error.status === 401)) {
                throw new AuthError("INVALID_CREDENTIALS");
            }
            throw error;
        }
    }, candidate.id);
}

export function startRecovery(payload: Payload, email: string) {
    requireStudentEmail();
    queueEmailWork(payload, async () => {
        const candidate = await getStudent(payload, "email", email);
        if (!candidate?._verified) return;
        const token = await authTransaction(payload, async context => {
            const record = await getStudent(payload, "id", candidate.id, context.req);
            if (!record?._verified || record.email !== email) return;
            const token = await payload.forgotPassword({ collection: "students", data: { email }, disableEmail: true, req: context.req });
            if (typeof token !== "string") return;
            await updateStudent(payload, context, record.id, { resetPasswordToken: digest(token) });
            return token;
        }, candidate.id);
        if (token) await sendStudentEmail(payload, email, "reset", token);
    });
}

export async function resetStudentPassword(payload: Payload, token: string, password: string) {
    const hashed = digest(token);
    const candidate = await getStudent(payload, "resetPasswordToken", hashed);
    if (!candidate?._verified) throw new AuthError("INVALID_TOKEN");
    await authTransaction(payload, async context => {
        const record = await getStudent(payload, "id", candidate.id, context.req);
        if (!record?._verified || record.resetPasswordToken !== hashed || !(new Date(record.resetPasswordExpiration ?? 0).getTime() > Date.now())) {
            throw new AuthError("INVALID_TOKEN");
        }
        await payload.resetPassword({ collection: "students", data: { token: hashed, password }, req: context.req, overrideAccess: true });
        await setStudentSessions(payload, context, record.id, []);
        await updateStudent(payload, context, record.id, {
            hasPassword: true, resetPasswordToken: null, resetPasswordExpiration: null,
        });
    }, candidate.id);
}

export async function startEmailChange(payload: Payload, identity: StudentIdentity, email: string) {
    requireStudentEmail();
    const token = await authTransaction(payload, async context => {
        const student = await requireCurrentStudent(payload, context, identity, true);
        if (student.email === email || await getStudent(payload, "email", email, context.req)) return;
        return createChallenge(context, "email-change", { email, oldEmail: student.email, studentID: student.id, sid: identity.sid }, 30);
    }, identity.user.id);
    if (token) queueStudentEmail(payload, email, "email-change", token);
}

export async function confirmEmailChange(payload: Payload, token: string) {
    requireStudentEmail();
    const raw = await authTransaction(payload, context => readEmailChangeChallenge(context, token));
    const parsed = emailChange.safeParse(raw);
    if (!parsed.success) throw new AuthError("INVALID_TOKEN");
    const { studentID, email, oldEmail, sid } = parsed.data;
    await authTransaction(payload, async context => {
        await consumeChallenge(context, token, ["email-change"]);
        await lockEmail(context, email);
        const record = await getStudent(payload, "id", studentID, context.req);
        if (!record?._verified || record.email !== oldEmail || !activeSession(record, sid) || await getStudent(payload, "email", email, context.req)) {
            throw new AuthError("INVALID_TOKEN");
        }
        await setStudentSessions(payload, context, record.id, []);
        await updateStudent(payload, context, record.id, {
            email, resetPasswordToken: null, resetPasswordExpiration: null,
        });
    }, studentID);
    queueStudentEmail(payload, oldEmail, "email-changed");
}
