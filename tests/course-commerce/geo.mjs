import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

const host = process.env.COURSE_COMMERCE_ORIGIN;
const stateFile = process.env.COURSE_COMMERCE_TEST_STATE;
const scenario = process.argv[2];
const browserOrigin = "https://course-geo.fixture.invalid";
const coursePath = "/courses/test-commerce-renamed";
const readFixture = () => JSON.parse(readFileSync(stateFile, "utf8"));
const { baseOffer, freeLesson } = readFixture();
assert.match(host, /^http:\/\/127\.0\.0\.1:\d+$/);
assert.ok(baseOffer && freeLesson);
assert.ok(["production", "preview-override", "disabled"].includes(scenario));

function request(path, { country, cookie, data, headers } = {}) {
    return fetch(host + path, {
        method: data ? "POST" : "GET",
        headers: {
            ...(data ? { "Content-Type": "application/json", Origin: browserOrigin } : {}),
            ...(country ? { "x-vercel-ip-country": country } : {}),
            ...(cookie ? { Cookie: cookie } : {}),
            ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
    });
}

async function signIn(email) {
    const response = await request("/api/student-auth/login", { data: { email, password: "Temporary-commerce-fixture-2026" } });
    assert.equal(response.status, 200);
    return response.headers.getSetCookie().find(value => value.startsWith("barhoum-student=")).split(";")[0];
}

async function page(path, headers) {
    const response = await request(path, headers);
    assert.equal(response.status, 200);
    return response.text();
}

const other = await signIn("commerce-two@example.invalid");
const checkout = (country, data = { offerId: baseOffer }, headers = {}) =>
    request("/api/course-commerce/checkout", { country, cookie: other, data, headers });
const db = new URL(process.env.DATABASE_URL);
assert.equal(db.hostname, "127.0.0.1");
assert.match(db.pathname, /^\/barhoum_phase5_/);
const client = new pg.Client(db.href);
await client.connect();
try {
    if (scenario === "production") {
        const before = readFixture().stripeCalls;
        const ordersBefore = await client.query("SELECT count(*) FROM course_orders");
        const blocked = await page(coursePath, { country: "TN" });
        assert.match(blocked, />(Coming soon|قريبًا)</);
        assert.doesNotMatch(blocked, />(Sign in to purchase|سجّل الدخول للشراء)</);
        assert.match(blocked, /Watch free preview|شاهد الدرس المجاني/);
        assert.match(await page(coursePath + "/lessons/" + freeLesson, { country: "TN" }), /Free checkout fixture/);

        const attempt = await checkout("TN", undefined, { "x-country": "FR", "x-forwarded-for": "8.8.8.8" });
        assert.equal(attempt.status, 403);
        assert.equal((await attempt.json()).error.code, "GEOGRAPHIC_RESTRICTION");
        assert.equal((await checkout("TN", { offerId: baseOffer, country: "FR" })).status, 400);
        assert.equal((await checkout()).status, 503);
        assert.equal((await checkout("TN,FR")).status, 503);
        assert.equal(readFixture().stripeCalls, before);
        assert.deepEqual((await client.query("SELECT count(*) FROM course_orders")).rows, ordersBefore.rows);

        const owner = await signIn("commerce-one@example.invalid");
        assert.match(await page(coursePath, { country: "TN", cookie: owner }), /You own this course|هذه الدورة ضمن دوراتك/);
        const permitted = await page(coursePath, { country: "FR", cookie: other });
        assert.match(permitted, />(Buy course|اشترِ الدورة)</);
        const catalog = await page("/courses", { country: "FR", cookie: other });
        assert.match(catalog, /EUR\s*59\.00/);
        assert.match(permitted, /EUR\s*59\.00/);
        assert.match(catalog, /Technical catalog fixture/);
        const ownedCatalog = await page("/courses", { country: "FR", cookie: owner });
        assert.match(ownedCatalog, /Continue Learning|تابع التعلّم|هذه الدورة ضمن دوراتك|ضمن دوراتك/);
        assert.equal((await checkout("FR")).status, 200);
    } else if (scenario === "preview-override") {
        assert.doesNotMatch(await page("/courses", { country: "TN" }), /Technical catalog fixture/);
        assert.match(await page("/courses/phase-5-checkout-test", { country: "TN" }), /Technical catalog fixture/);
        assert.match(await page(coursePath, { country: "TN", cookie: other }), />(Buy course|اشترِ الدورة)</);
        assert.equal((await checkout("TN")).status, 200);
    } else {
        const before = readFixture().stripeCalls;
        const disabled = await page(coursePath, { country: "FR" });
        assert.doesNotMatch(disabled, />(Coming soon|قريبًا|Sign in to purchase|سجّل الدخول للشراء)</);
        assert.match(disabled, /Watch free preview|شاهد الدرس المجاني/);
        assert.equal((await checkout("FR")).status, 503);
        assert.equal(readFixture().stripeCalls, before);

        const existing = (await client.query("SELECT id, stripe_session_id, stripe_payment_intent_id FROM course_orders WHERE status='fulfilled' AND module_id IS NULL")).rows[0];
        assert.ok(existing?.stripe_session_id && existing?.stripe_payment_intent_id);
        const fixture = readFixture();
        const intent = fixture.intents[existing.stripe_payment_intent_id];
        const charge = fixture.charges[intent.latest_charge];
        const refund = { id: "re_disabled_fixture", object: "refund", amount: intent.amount, status: "succeeded", charge: charge.id, payment_intent: intent.id };
        fixture.refunds[charge.id] = [refund];
        charge.amount_refunded = refund.amount;
        writeFileSync(stateFile, JSON.stringify(fixture));
        const body = JSON.stringify({ id: "evt_" + randomUUID().replaceAll("-", ""), object: "event", type: "refund.updated", livemode: false, data: { object: refund } });
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = createHmac("sha256", process.env.COURSE_STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest("hex");
        const delivered = await fetch(host + "/api/course-commerce/webhook", { method: "POST", body, headers: { "stripe-signature": `t=${timestamp},v1=${signature}` } });
        assert.equal(delivered.status, 200);
        const access = await client.query("SELECT status FROM course_entitlements WHERE source_order_id=$1", [existing.id]);
        assert.equal(access.rows[0].status, "revoked");
        const ops = await request("/api/course-commerce/reconcile/scheduled", { headers: { Authorization: "Bearer " + process.env.CRON_SECRET } });
        assert.equal(ops.status, 200);
        assert.equal((await ops.json()).alertDelivery, "unconfigured");
    }
    console.log("Passed geographic checkout and course rendering scenario " + scenario);
} finally {
    await client.end();
}
