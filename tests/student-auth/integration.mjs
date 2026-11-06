// Run against a fresh migrated disposable database with the provider fixture loaded.
// Required server settings are STUDENT_AUTH_ORIGIN=http://127.0.0.1:<port>,
// STUDENT_TEST_MAILBOX=<empty temporary path>, dummy Google/Resend credentials,
// and STUDENT_AUTH_EMAIL_ALLOWLIST set to the test inboxes listed below.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";

const base = process.env.STUDENT_AUTH_ORIGIN;
const mailbox = process.env.STUDENT_TEST_MAILBOX;
assert.match(base ?? "", /^http:\/\/127\.0\.0\.1:\d+$/);
assert.ok(mailbox);
const inbox = "student-fixture@example.invalid";
const newInbox = "student-new@example.invalid";
const googleInbox = "google-fixture@gmail.com";
const thirdParty = "third-party@example.invalid";
const expiredInbox = "expired-fixture@example.invalid";
const raceInbox = "race-fixture@example.invalid";
const secondRaceInbox = "second-race-fixture@example.invalid";
const password = "Fixture-password-2026";
const newPassword = "Fixture-recovered-2026";
const path = "/api/student-auth";

const call = (action, method = "GET", data, cookie, extraHeaders = {}) => fetch(base + path + "/" + action, {
    method, redirect: "manual", body: data === undefined ? undefined : JSON.stringify(data),
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(data === undefined ? {} : { Origin: base, "Content-Type": "application/json" }), ...extraHeaders },
});
async function check(result, status) {
    assert.equal(result.status, status, (await result.clone().text()).slice(0, 500));
    assert.equal(result.headers.get("cache-control"), "no-store");
    return result;
}
const post = (action, data, cookie, headers) => call(action, "POST", data, cookie, headers);
const me = cookie => call("me", "GET", undefined, cookie);
const cookie = (response, name = "barhoum-student") => {
    const value = response.headers.getSetCookie().find(value => value.startsWith(name + "="));
    assert.ok(value);
    assert.match(value, /HttpOnly/);
    assert.match(value, /SameSite=Lax/);
    assert.doesNotMatch(value, /Domain=/);
    return value.split(";")[0];
};

async function tokenFor(to, route, previous) {
    for (let i = 0; i < 50; i++) {
        const entries = (await readFile(mailbox, "utf8").catch(() => "")).trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
        const matches = entries.filter(entry => entry.to.includes(to) && entry.text.includes(route));
        if (matches.length) {
            const url = new URL(matches.at(-1).text.match(/https?:\/\/[^\s]+/)[0]);
            assert.equal(url.searchParams.has("token"), false);
            const token = new URLSearchParams(url.hash.slice(1)).get("token");
            assert.ok(token);
            if (token !== previous) return token;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("Expected fixture email not received.");
}

const login = (email = inbox, secret = password) => post("login", { email, password: secret });
const adminRequest = async (route, method = "GET", data, authorization) => fetch(base + "/api/" + route, {
    method, body: data === undefined ? undefined : JSON.stringify(data),
    headers: { ...(data === undefined ? {} : { "Content-Type": "application/json" }), ...(authorization ? { Authorization: authorization } : {}) },
});
const firstAdmin = await adminRequest("admins/first-register", "POST", { email: inbox, password });
assert.ok(firstAdmin.ok);
const adminLogin = await adminRequest("admins/login", "POST", { email: inbox, password });
assert.equal(adminLogin.status, 200);
const admin = "Bearer " + (await adminLogin.json()).token;
assert.equal((await adminRequest("admins", "GET", undefined, admin)).status, 200);
await check(await post("register", { email: inbox }, undefined, { Origin: "https://evil.invalid" }), 400);
const registration = await check(await post("register", { email: `  ${inbox.toUpperCase()}  ` }), 202);
assert.deepEqual(await registration.json(), { ok: true });
const enrollment = await tokenFor(inbox, "/verify-email");
await check(await post("resend-verification", { email: inbox }), 202);
const resent = await tokenFor(inbox, "/verify-email", enrollment);
const claims = await Promise.all([
    post("verify", { token: enrollment, name: "Fixture Student", password }),
    post("verify", { token: resent, name: "Fixture Student", password }),
]);
assert.deepEqual(claims.map(result => result.status).sort(), [200, 400]);
await check(await post("verify", { token: enrollment, name: "Fixture Student", password }), 400);
assert.deepEqual(await (await check(await post("register", { email: inbox }), 202)).json(), { ok: true });
const a = cookie(await check(await login(), 200));
const b = cookie(await check(await login(), 200));
assert.notEqual(a, b);
assert.deepEqual(Object.keys((await (await check(await me(a), 200)).json()).student).sort(), ["ageRange", "city", "email", "hasGoogle", "hasPassword", "id", "name"]);
const rawBearer = a.slice(a.indexOf("=") + 1);
const bearer = "Bearer " + rawBearer;
await check(await call("me", "GET", undefined, undefined, { Authorization: bearer }), 401);
for (const target of ["admins", "courses?draft=true", "courses/versions", "lessons/versions", "lesson-files"]) {
    const response = await adminRequest(target, "GET", undefined, bearer);
    assert.ok([401, 403, 404].includes(response.status), target + " returned " + response.status);
}
assert.equal((await adminRequest("students/login", "POST", { email: inbox, password })).status, 501);
assert.equal((await adminRequest("admins", "GET", undefined, admin)).status, 200);
for (const method of ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]) {
    const body = ["POST", "PATCH", "PUT"].includes(method) ? { value: { sort: "id" } } : undefined;
    assert.equal((await adminRequest("payload-preferences/phase4-proof", method, body, bearer)).status, 403);
}
assert.equal((await adminRequest("payload-preferences/phase4-proof", "POST", { value: { sort: "id" } }, admin)).status, 200);
assert.equal((await adminRequest("payload-preferences/phase4-proof", "GET", undefined, admin)).status, 200);
const adminSession = adminLogin.headers.getSetCookie().find(value => value.startsWith("payload-token=")).split(";")[0];
const dualCookie = a + "; " + adminSession;
assert.equal((await fetch(base + "/api/admins", { headers: { Cookie: dualCookie } })).status, 200);
await check(await me(dualCookie), 200);
assert.equal((await fetch(base + "/api/admins", { headers: { Cookie: "payload-token=" + rawBearer } })).status, 403);

async function adminDoc(route, body) {
    const response = await adminRequest(route, "POST", body, admin);
    assert.equal(response.status, 201, (await response.clone().text()).slice(0, 500));
    return (await response.json()).doc;
}
const cover = await adminDoc("course-covers", { alt: "Test cover", publicURL: "/images/hero.jpeg" });
const course = await adminDoc("courses?draft=true", { title: "Protected fixture", slug: "phase4-private-fixture", description: "Fixture", cover: cover.id });
const lesson = await adminDoc("lessons?draft=true", { title: "Private lesson", course: course.id });
function fixturePDF() {
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] >>",
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = objects.map((object, index) => {
        const offset = pdf.length;
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
        return offset;
    });
    const startXref = pdf.length;
    const entries = offsets.map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
    return pdf + `xref\n0 4\n0000000000 65535 f \n${entries}trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
}
const fileForm = new FormData();
fileForm.set("_payload", "{}");
fileForm.set("file", new Blob([fixturePDF()], { type: "application/pdf" }), process.env.STUDENT_TEST_FILE);
const uploaded = await fetch(base + "/api/lesson-files", { method: "POST", body: fileForm, headers: { Authorization: admin } });
assert.equal(uploaded.status, 201, (await uploaded.clone().text()).slice(0, 500));
const file = (await uploaded.json()).doc;
const rawFile = "/api/lesson-files/file/" + file.filename;
const freeRoute = "/api/lesson-downloads/phase4-private-fixture/" + lesson.id + "/" + file.id;
assert.equal((await fetch(base + rawFile, { headers: { Authorization: bearer } })).status, 403);
assert.equal((await fetch(base + rawFile, { headers: { Cookie: a } })).status, 403);
assert.equal((await fetch(base + rawFile, { headers: { Authorization: admin } })).status, 200);
assert.equal((await fetch(base + freeRoute, { headers: { Cookie: a } })).status, 404);
assert.equal((await adminRequest("lessons/" + lesson.id, "PATCH", {
    freePreview: true, _status: "published",
    content: [{ blockType: "resources", items: [{ blockType: "download", label: "Fixture PDF", file: file.id }] }],
}, admin)).status, 200);
assert.equal((await adminRequest("courses/" + course.id, "PATCH", { lessons: [{ lesson: lesson.id }], _status: "published" }, admin)).status, 200);
assert.equal((await fetch(base + "/courses/phase4-private-fixture/lessons/" + lesson.id)).status, 200);
const download = await fetch(base + freeRoute);
assert.equal(download.status, 200);
assert.equal(download.headers.get("content-type"), "application/pdf");

await check(await call("profile", "PATCH", { city: "Tunis", ageRange: "25-34", id: 200 }, a), 400);
const changed = await (await check(await call("profile", "PATCH", { city: "Tunis", ageRange: "25-34" }, a), 200)).json();
assert.equal(changed.student.city, "Tunis");
assert.equal(changed.student.ageRange, "25-34");
await check(await post("logout", {}, a), 200);
await check(await me(a), 401);
await check(await me(b), 200);
assert.equal((await fetch(base + "/api/admins", { headers: { Cookie: dualCookie } })).status, 200);
await check(await post("forgot-password", { email: inbox }), 202);
const recovery = await tokenFor(inbox, "/reset-password");
await check(await post("reset-password", { token: recovery, password: newPassword }), 200);
await check(await post("reset-password", { token: recovery, password: newPassword }), 400);
await check(await me(b), 401);
await check(await login(), 401);
const current = cookie(await check(await login(inbox, newPassword), 200));
await check(await post("email-change", { email: newInbox }, current), 202);
const confirmation = await tokenFor(newInbox, "/confirm-email");
await check(await post("email-change/confirm", { token: confirmation }), 200);
await check(await me(current), 401);
await check(await login(inbox, newPassword), 401);
const student = cookie(await check(await login(newInbox, newPassword), 200));

async function googleStart(intent = "login", session, returnTo = "/my-learning") {
    const result = await check(await call(`google/start?intent=${intent}&returnTo=${encodeURIComponent(returnTo)}`, "GET", undefined, session), 303);
    const url = new URL(result.headers.get("location"));
    assert.equal(url.origin, "https://accounts.google.com");
    assert.equal(url.searchParams.get("redirect_uri"), base + path + "/google/callback");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    return { params: url.searchParams, stateCookie: cookie(result, "barhoum-google-state") };
}

async function googleFinish(flow, fields = {}, { nonce, state, session, invalidSignature, canceled } = {}) {
    const { params, stateCookie } = flow;
    const code = Buffer.from(JSON.stringify({
        challenge: params.get("code_challenge"), invalidSignature, claims: { nonce: nonce ?? params.get("nonce"), ...fields },
    })).toString("base64url");
    const query = new URLSearchParams({ state: state ?? params.get("state"), ...(canceled ? { error: "access_denied" } : { code }) });
    const result = await check(await call("google/callback?" + query, "GET", undefined, [stateCookie, session].filter(Boolean).join("; ")), 303);
    assert.equal(result.headers.get("referrer-policy"), "no-referrer");
    return result;
}

let flow = await googleStart();
assert.match((await googleFinish(flow, {}, { state: randomBytes(32).toString("base64url") })).headers.get("location"), /google-failed/);
assert.match((await googleFinish(flow, {}, { nonce: "wrong-nonce" })).headers.get("location"), /google-failed/);
assert.match((await googleFinish(flow)).headers.get("location"), /google-failed/);
flow = await googleStart();
assert.match((await googleFinish(flow, {}, { invalidSignature: true })).headers.get("location"), /google-failed/);
flow = await googleStart();
assert.match((await googleFinish(flow, { iss: "https://wrong-issuer.invalid" })).headers.get("location"), /google-failed/);
flow = await googleStart();
assert.match((await googleFinish(flow, { aud: "wrong-audience" })).headers.get("location"), /google-failed/);
flow = await googleStart();
assert.match((await googleFinish(flow, {}, { canceled: true })).headers.get("location"), /google-canceled/);
flow = await googleStart();
assert.match((await googleFinish(flow, { email: newInbox })).headers.get("location"), /google-link-required/);
flow = await googleStart("link", student);
const other = cookie(await check(await login(newInbox, newPassword), 200));
assert.match((await googleFinish(flow, { email: newInbox }, { session: other })).headers.get("location"), /reauth-required/);
flow = await googleStart("link", student);
assert.match((await googleFinish(flow, { email: newInbox }, { session: student })).headers.get("location"), /google-linked/);
await check(await me(student), 401);
await check(await me(other), 401);
flow = await googleStart("login", undefined, "//evil.invalid/path");
const linked = await googleFinish(flow, { email: googleInbox });
assert.equal(new URL(linked.headers.get("location")).pathname, "/my-learning");
const g = cookie(linked);
const linkedProfile = (await (await check(await me(g), 200)).json()).student;
assert.equal(linkedProfile.email, newInbox);
assert.equal(linkedProfile.hasGoogle, true);
assert.equal(linkedProfile.hasPassword, true);
flow = await googleStart("login");
const authoritative = await googleFinish(flow, { sub: "authoritative-subject", email: "authoritative-fixture@gmail.com" });
const authoritativeProfile = (await (await check(await me(cookie(authoritative)), 200)).json()).student;
assert.equal(authoritativeProfile.hasPassword, false);
assert.equal(authoritativeProfile.hasGoogle, true);
flow = await googleStart("login");
const enrollmentGoogle = await googleFinish(flow, { sub: "third-party-subject", email: thirdParty });
assert.match(enrollmentGoogle.headers.get("location"), /check-inbox/);
const googleProof = await tokenFor(thirdParty, "/verify-email?method=google");
await check(await post("verify", { token: googleProof, name: "Third Party" }), 200);
await check(await login(thirdParty), 401);
assert.deepEqual(await (await check(await post("register", { email: thirdParty }), 202)).json(), { ok: true });
flow = await googleStart();
const googleOnly = cookie(await googleFinish(flow, { sub: "third-party-subject", email: thirdParty }));
await check(await post("forgot-password", { email: thirdParty }), 202);
const firstPassword = await tokenFor(thirdParty, "/reset-password");
await check(await post("reset-password", { token: firstPassword, password: newPassword }), 200);
await check(await me(googleOnly), 401);
await check(await login(thirdParty, newPassword), 200);
const mixed = await Promise.all([
    login(newInbox, newPassword), login(newInbox, newPassword),
    googleStart().then(flow => googleFinish(flow, { email: googleInbox })),
    googleStart().then(flow => googleFinish(flow, { email: googleInbox })),
]);
const mixedCookies = mixed.map(result => cookie(result));
assert.equal(new Set(mixedCookies).size, 4);
await Promise.all(mixedCookies.map(async value => check(await me(value), 200)));
await check(await post("forgot-password", { email: newInbox }), 202);
const mixedReset = await tokenFor(newInbox, "/reset-password");
await check(await post("reset-password", { token: mixedReset, password }), 200);
await Promise.all(mixedCookies.map(async value => check(await me(value), 401)));

await check(await post("resend-verification", { email: expiredInbox }), 202);
const expired = await tokenFor(expiredInbox, "/verify-email");
const database = new URL(process.env.DATABASE_URL_UNPOOLED);
assert.equal(database.hostname, "127.0.0.1");
assert.match(database.pathname, /phase4/);
const { Client } = (await import("pg")).default;
const client = new Client({ connectionString: database.href });
await client.connect();
try {
    await client.query("UPDATE student_auth_challenges SET expires_at = now() - interval '1 second' WHERE token_hash = $1", [createHash("sha256").update(expired).digest("hex")]);
    const currentLinked = cookie(await check(await login(newInbox, password), 200));
    const token = currentLinked.split("=")[1];
    const { sid } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    await client.query("UPDATE students_sessions SET created_at = now() - interval '6 minutes' WHERE id = $1", [sid]);
    await check(await post("email-change", { email: raceInbox }, currentLinked), 403);
    const reauthFlow = await googleStart("reauth", currentLinked, "/account");
    const refreshed = await googleFinish(reauthFlow, { email: googleInbox }, { session: currentLinked });
    assert.equal(new URL(refreshed.headers.get("location")).pathname, "/account");
    const refreshedCookie = cookie(refreshed);
    await check(await me(currentLinked), 401);
    await check(await post("email-change", { email: raceInbox }, refreshedCookie), 202);
    const raceChange = await tokenFor(raceInbox, "/confirm-email");
    await check(await post("register", { email: raceInbox }), 202);
    const raceEnroll = await tokenFor(raceInbox, "/verify-email");
    const race = await Promise.all([
        post("email-change/confirm", { token: raceChange }),
        post("verify", { token: raceEnroll, name: "Race Student", password }),
    ]);
    assert.deepEqual(race.map(result => result.status).sort(), [200, 400]);
    const currentEmail = race[0].status === 200 ? raceInbox : newInbox;
    const afterRace = await googleFinish(await googleStart(), { email: googleInbox });
    const afterRaceCookie = cookie(afterRace);
    const afterRaceProfile = (await (await check(await me(afterRaceCookie), 200)).json()).student;
    assert.equal(afterRaceProfile.email, currentEmail);
    assert.equal(afterRaceProfile.id, linkedProfile.id);
    await check(await post("email-change", { email: secondRaceInbox }, afterRaceCookie), 202);
    const secondChange = await tokenFor(secondRaceInbox, "/confirm-email");
    await check(await post("forgot-password", { email: currentEmail }), 202);
    const secondReset = await tokenFor(currentEmail, "/reset-password", currentEmail === newInbox ? mixedReset : undefined);
    const recoveryRace = await Promise.all([
        post("email-change/confirm", { token: secondChange }),
        post("reset-password", { token: secondReset, password: newPassword }),
    ]);
    assert.deepEqual(recoveryRace.map(result => result.status).sort(), [200, 400]);
    await check(await me(afterRaceCookie), 401);
    const finalEmail = recoveryRace[0].status === 200 ? secondRaceInbox : currentEmail;
    const native = await client.query("SELECT id FROM students WHERE email = $1", [finalEmail]);
    assert.deepEqual(native.rows, [{ id: linkedProfile.id }]);
    await assert.rejects(client.query("UPDATE students SET email = upper(email) WHERE id = $1", [linkedProfile.id]), error => error.code === "23514");
} finally {
    await client.end();
}
await check(await post("verify", { token: expired, name: "Expired", password }), 400);
for (let attempt = 0; attempt < 10; attempt++) {
    await check(await login("rate-limit@example.invalid"), 401);
}
await check(await login("RATE-LIMIT@EXAMPLE.INVALID"), 429);
console.log("Passed signup, replay, profile, session isolation, password recovery, verified email change, and signed Google/OIDC fixtures.");
