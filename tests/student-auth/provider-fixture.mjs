// Load only in the disposable test server with NODE_OPTIONS=--import=<absolute path>.
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { appendFileSync } from "node:fs";

if (!process.env.STUDENT_TEST_MAILBOX || !process.env.STUDENT_AUTH_ORIGIN?.startsWith("http://127.0.0.1:") || process.env.VERCEL) {
    throw new Error("A disposable localhost test environment is required.");
}

const nativeFetch = globalThis.fetch;
const issuer = "https://accounts.google.com";
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicJWK = { ...publicKey.export({ format: "jwk" }), kid: "fixture", alg: "RS256", use: "sig" };
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");

function googleToken(data) {
    const now = Math.floor(Date.now() / 1000);
    const body = {
        iss: issuer, sub: "fixture-subject", aud: process.env.GOOGLE_CLIENT_ID, exp: now + 120, iat: now,
        email_verified: true, email: "google-fixture@gmail.com", name: "Google Fixture",
        ...data.claims,
    };
    const value = `${encode({ alg: "RS256", kid: "fixture" })}.${encode(body)}`;
    return `${value}.${data.invalidSignature ? Buffer.alloc(256).toString("base64url") : sign("RSA-SHA256", Buffer.from(value), privateKey).toString("base64url")}`;
}

globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.href === `${issuer}/.well-known/openid-configuration`) {
        return Response.json({
            issuer, authorization_endpoint: `${issuer}/o/oauth2/v2/auth`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks`,
            response_types_supported: ["code"], subject_types_supported: ["public"], id_token_signing_alg_values_supported: ["RS256"],
            token_endpoint_auth_methods_supported: ["client_secret_post"], code_challenge_methods_supported: ["S256"],
        });
    }
    if (url.href === `${issuer}/jwks`) return Response.json({ keys: [publicJWK] });
    if (url.href === `${issuer}/token`) {
        const params = new URLSearchParams(init?.body ?? await input.text());
        const data = JSON.parse(Buffer.from(params.get("code"), "base64url").toString());
        const challenge = createHash("sha256").update(params.get("code_verifier")).digest("base64url");
        if (challenge !== data.challenge || params.get("redirect_uri") !== `${process.env.STUDENT_AUTH_ORIGIN}/api/student-auth/google/callback`) {
            return Response.json({ error: "invalid_grant" }, { status: 400 });
        }
        return Response.json({ access_token: "fixture", token_type: "Bearer", id_token: googleToken(data) });
    }
    if (url.href === "https://api.resend.com/emails") {
        const data = JSON.parse(init?.body ?? await input.text());
        appendFileSync(process.env.STUDENT_TEST_MAILBOX, JSON.stringify({ to: data.to, text: data.text }) + "\n", { mode: 0o600 });
        return Response.json({ id: "fixture" });
    }
    return nativeFetch(input, init);
};
