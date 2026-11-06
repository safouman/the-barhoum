import "server-only";

import * as oidc from "openid-client";
import type { NextRequest } from "next/server";
import type { Payload } from "payload";
import { z } from "zod";
import { createStudent } from "./accounts";
import { consumeChallenge, createChallenge } from "./challenges";
import { AuthError, authOrigin, authTransaction, digest, emailInput, getStudent, lockEmail, lockGoogleSubject, lockStudent, noStore, opaqueToken, rateLimit, tokenInput, updateStudent } from "./core";
import { queueStudentEmail, requireStudentEmail } from "./email";
import { issueGoogleSession, requestStudent, requireCurrentStudent, setStudentSessions, studentCookieHeader } from "./session";

const googleIssuer = new URL("https://accounts.google.com");
const callbackPath = "/api/student-auth/google/callback";
const stateCookie = "barhoum-google-state";
const stateMinutes = 10;
const intentInput = z.enum(["login", "link", "reauth"]);
const stateInput = z.object({
    intent: intentInput, verifier: z.string(), nonce: z.string(), browserHash: z.string(),
    returnTo: z.string(), studentID: z.number().int().positive().optional(), sid: z.uuid().optional(),
});

let configuration: Promise<oidc.Configuration> | undefined;

function googleConfiguration() {
    const id = process.env.GOOGLE_CLIENT_ID;
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    if (!id || !secret) throw new AuthError("UNAVAILABLE");
    configuration ??= oidc.discovery(googleIssuer, id, secret, oidc.ClientSecretPost(secret), {
        execute: [oidc.enableNonRepudiationChecks],
        timeout: 10,
    }).catch(() => {
        configuration = undefined;
        throw new AuthError("UNAVAILABLE");
    });
    return configuration;
}

export function safeStudentReturn(path: string | null, fallback = "/my-learning") {
    if (!path || path.length > 1024 || !path.startsWith("/") || path.startsWith("//") || /[\\\x00-\x20]/.test(path)) return fallback;
    const url = new URL(path, "https://barhoum.invalid");
    if (url.origin !== "https://barhoum.invalid" || !/^\/(?:courses(?:\/[a-z0-9-]+(?:\/lessons\/[a-zA-Z0-9_-]+)?)?|my-learning|account)\/?$/.test(url.pathname)) return fallback;
    return url.pathname + url.search;
}

function redirect(location: URL | string, ...cookies: string[]) {
    const headers = new Headers({ ...noStore, Location: typeof location === "string" ? new URL(location, authOrigin()).href : location.href });
    for (const cookie of cookies) headers.append("Set-Cookie", cookie);
    return new Response(null, { status: 303, headers });
}

function requireOAuthHost(request: NextRequest, origin: URL) {
    // Next normalizes localhost and loopback IPs in nextUrl.
    // Match the HTTP host to the configured callback instead.
    if (request.headers.get("host")?.toLowerCase() !== origin.host ||
        (process.env.VERCEL === "1" && request.headers.get("x-forwarded-proto") !== "https")) {
        throw new AuthError("INVALID_INPUT");
    }
}

function stateCookieHeader(token?: string) {
    return `${stateCookie}=${token ?? ""}; Path=/api/student-auth/google/callback; HttpOnly; SameSite=Lax; Max-Age=${token ? stateMinutes * 60 : 0}${authOrigin().protocol === "https:" ? "; Secure" : ""}`;
}

export async function startGoogle(payload: Payload, request: NextRequest) {
    const origin = authOrigin();
    requireOAuthHost(request, origin);
    const parsed = intentInput.safeParse(request.nextUrl.searchParams.get("intent") ?? "login");
    if (!parsed.success) throw new AuthError("INVALID_INPUT");
    const intent = parsed.data;
    const returnTo = safeStudentReturn(request.nextUrl.searchParams.get("returnTo"), intent === "reauth" ? "/account" : "/my-learning");
    await rateLimit(payload, request, "google-start", undefined, [8, 40]);
    const browserToken = opaqueToken();
    const verifier = oidc.randomPKCECodeVerifier();
    const nonce = oidc.randomNonce();
    const identity = intent === "login" ? null : await requestStudent(payload, request);
    if (intent !== "login" && (!identity || request.headers.get("sec-fetch-site") === "cross-site")) {
        return redirect("/account?status=reauth-required");
    }
    if (identity) {
        try {
            await authTransaction(payload, async context => {
                const student = await requireCurrentStudent(payload, context, identity, intent === "link");
                if (intent === "reauth" && !student.googleSubject) throw new AuthError("REAUTH_REQUIRED");
            }, identity.user.id);
        } catch (error) {
            if (error instanceof AuthError) return redirect("/account?status=reauth-required");
            throw error;
        }
    }
    const configuration = await googleConfiguration();
    const state = await authTransaction(payload, context => createChallenge(context, "google-oauth", {
        intent, verifier, nonce, browserHash: digest(browserToken), returnTo, studentID: identity?.user.id, sid: identity?.sid,
    }, stateMinutes));
    const destination = oidc.buildAuthorizationUrl(configuration, {
        redirect_uri: new URL(callbackPath, origin).href, scope: "openid email profile",
        code_challenge: await oidc.calculatePKCECodeChallenge(verifier), code_challenge_method: "S256",
        state, nonce, prompt: "select_account",
    });
    return redirect(destination, stateCookieHeader(browserToken));
}

type GoogleClaims = { sub: string; email: string; name: string; authoritative: boolean };

function verifiedClaims(claims: oidc.IDToken | undefined): GoogleClaims {
    const parsed = z.object({
        sub: z.string().min(1).max(255), email: emailInput, name: z.string().optional(),
        email_verified: z.boolean().optional(), hd: z.string().optional(),
    }).safeParse(claims);
    if (!parsed.success) throw new AuthError("INVALID_CREDENTIALS");
    const { sub, email, name, email_verified, hd } = parsed.data;
    const domain = email.split("@").at(-1);
    return {
        sub, email, name: name?.trim().slice(0, 120) || email.split("@")[0].slice(0, 120),
        authoritative: email_verified === true && (domain === "gmail.com" || Boolean(hd && hd.toLowerCase() === domain)),
    };
}

async function loginGoogle(payload: Payload, claims: GoogleClaims) {
    const linked = await getStudent(payload, "googleSubject", claims.sub);
    if (linked) {
        return authTransaction(payload, async context => {
            const fresh = await getStudent(payload, "id", linked.id, context.req);
            if (!fresh) throw new AuthError("INVALID_CREDENTIALS");
            return issueGoogleSession(payload, context, fresh, claims.sub);
        }, linked.id);
    }
    return authTransaction(payload, async context => {
        await lockEmail(context, claims.email);
        await lockGoogleSubject(context, claims.sub);
        if (await getStudent(payload, "googleSubject", claims.sub, context.req)) throw new AuthError("INVALID_CREDENTIALS");
        if (await getStudent(payload, "email", claims.email, context.req)) return "collision" as const;
        if (!claims.authoritative) {
            requireStudentEmail();
            const token = await createChallenge(context, "google-signup", { email: claims.email, subject: claims.sub }, 30);
            return { inboxToken: token };
        }
        const student = await createStudent(payload, context, { email: claims.email, name: claims.name, subject: claims.sub });
        await lockStudent(context, student.id);
        const record = await getStudent(payload, "id", student.id, context.req);
        if (!record) throw new AuthError("UNAVAILABLE");
        return issueGoogleSession(payload, context, record, claims.sub);
    });
}

export async function googleCallback(payload: Payload, request: NextRequest) {
    const origin = authOrigin();
    const closeCookie = stateCookieHeader();
    let state: z.infer<typeof stateInput> | undefined;
    try {
        requireOAuthHost(request, origin);
        const browser = tokenInput.parse(request.cookies.get(stateCookie)?.value);
        const token = tokenInput.parse(request.nextUrl.searchParams.get("state"));
        await rateLimit(payload, request, "google-callback", undefined, [8, 40]);
        state = await authTransaction(payload, async context => {
            const challenge = await consumeChallenge(context, token, ["google-oauth"]);
            const result = stateInput.parse(challenge.context);
            if (result.browserHash !== digest(browser)) throw new AuthError("INVALID_TOKEN");
            return result;
        });
        const back = state.intent === "login" ? "/login" : "/account";
        const canceled = request.nextUrl.searchParams.get("error") === "access_denied";
        if (canceled) return redirect(`${back}?status=google-canceled`, closeCookie);
        const callback = new URL(callbackPath, origin);
        callback.search = request.nextUrl.search;
        const configuration = await googleConfiguration();
        const tokens = await oidc.authorizationCodeGrant(configuration, callback, {
            pkceCodeVerifier: state.verifier, expectedState: token, expectedNonce: state.nonce,
        });
        const claims = verifiedClaims(tokens.claims());
        if (state.intent === "login") {
            const result = await loginGoogle(payload, claims);
            if (result === "collision") {
                const params = new URLSearchParams({ status: "google-link-required", returnTo: state.returnTo });
                return redirect(`/login?${params}`, closeCookie);
            }
            if ("inboxToken" in result) {
                queueStudentEmail(payload, claims.email, "google-signup", result.inboxToken);
                return redirect("/verify-email?status=check-inbox", closeCookie);
            }
            return redirect(safeStudentReturn(state.returnTo), closeCookie, studentCookieHeader(result.token));
        }

        const intent = state.intent;
        const identity = await requestStudent(payload, request);
        if (!identity || identity.user.id !== state.studentID || identity.sid !== state.sid) throw new AuthError("REAUTH_REQUIRED");
        const result = await authTransaction(payload, async context => {
            const student = await requireCurrentStudent(payload, context, identity, intent === "link");
            if (intent === "reauth") {
                if (student.googleSubject !== claims.sub) throw new AuthError("REAUTH_REQUIRED");
                return issueGoogleSession(payload, context, student, claims.sub, identity.sid);
            }
            if (student.googleSubject && student.googleSubject !== claims.sub) throw new AuthError("INVALID_CREDENTIALS");
            await lockEmail(context, claims.email);
            await lockGoogleSubject(context, claims.sub);
            const linked = await getStudent(payload, "googleSubject", claims.sub, context.req);
            const emailOwner = await getStudent(payload, "email", claims.email, context.req);
            if ((linked && linked.id !== student.id) || (emailOwner && emailOwner.id !== student.id)) {
                throw new AuthError("INVALID_CREDENTIALS");
            }
            await setStudentSessions(payload, context, student.id, []);
            await updateStudent(payload, context, student.id, {
                googleSubject: claims.sub, resetPasswordToken: null, resetPasswordExpiration: null,
            });
            return null;
        }, identity.user.id);
        return result
            ? redirect(safeStudentReturn(state.returnTo, "/account"), closeCookie, studentCookieHeader(result.token))
            : redirect("/login?status=google-linked", closeCookie, studentCookieHeader());
    } catch (error) {
        const status = error instanceof AuthError && ["UNAUTHENTICATED", "REAUTH_REQUIRED"].includes(error.code) ? "reauth-required" : "google-failed";
        return redirect(`${state && state.intent !== "login" ? "/account" : "/login"}?status=${status}`, ...(state ? [closeCookie] : []));
    }
}
