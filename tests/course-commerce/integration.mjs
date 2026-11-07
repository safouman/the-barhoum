import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { getPayload } from "payload";
import pg from "pg";
import config from "../../payload.config.ts";

const origin = process.env.COURSE_COMMERCE_ORIGIN;
const stateFile = process.env.COURSE_COMMERCE_TEST_STATE;
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const db = new URL(process.env.DATABASE_URL);
assert.equal(db.hostname, "127.0.0.1");
assert.match(db.pathname, /^\/barhoum_phase5_[a-z0-9_]+$/);
assert.ok(stateFile);
const state = () => JSON.parse(readFileSync(stateFile, "utf8"));
const edit = (change) => {
    const current = state();
    const value = change(current);
    writeFileSync(stateFile, JSON.stringify(current));
    return value;
};
const courseSecret = process.env.COURSE_STRIPE_WEBHOOK_SECRET;
const legacySecret = process.env.STRIPE_WEBHOOK_SECRET;
const password = "Temporary-commerce-fixture-2026";
const students = ["commerce-one@example.invalid", "commerce-two@example.invalid"];

async function json(path, status, { method = "GET", data, cookie, admin, sameOrigin = true } = {}) {
    const response = await fetch(origin + path, {
        method, body: data === undefined ? undefined : JSON.stringify(data),
        headers: {
            ...(sameOrigin ? { Origin: origin } : { Origin: "https://other.example.invalid" }),
            ...(data === undefined ? {} : { "Content-Type": "application/json" }),
            ...(cookie ? { Cookie: cookie } : {}),
            ...(admin ? { Authorization: "Bearer " + admin } : {}),
        },
    });
    const body = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(body.error ?? body.errors ?? body.message ?? {}).slice(0, 650)}`);
    return { body, response };
}

function event(type, object, values = {}) {
    return { id: "evt_" + randomUUID().replaceAll("-", ""), object: "event", type, livemode: false,
        created: Math.floor(Date.now() / 1000), data: { object }, ...values };
}

async function deliver(value, { secret = courseSecret, legacy = false, status = 200 } = {}) {
    const body = JSON.stringify(value);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const response = await fetch(origin + (legacy ? "/api/stripe/webhook" : "/api/course-commerce/webhook"), {
        method: "POST", body, headers: { "stripe-signature": `t=${timestamp},v1=${signature}` },
    });
    assert.equal(response.status, status, `${value.type}: ${await response.text()}`);
}

const payload = await getPayload({ config });
const studentIDs = [];
for (const email of students) {
    studentIDs.push((await payload.create({
        collection: "students", disableVerificationEmail: true,
        data: { email, password, name: "Commerce Test", hasPassword: true, _verified: true },
    })).id);
}
await payload.db.destroy();

const dbClient = new pg.Client({ connectionString: db.href });
await dbClient.connect();
try {
    await json("/api/admins/first-register", 200, { method: "POST", data: { email: "commerce-admin@example.invalid", password } });
    const { body: adminLogin } = await json("/api/admins/login", 200, { method: "POST", data: { email: "commerce-admin@example.invalid", password } });
    const admin = adminLogin.token;
    async function studentLogin(email) {
        const { response } = await json("/api/student-auth/login", 200, { method: "POST", data: { email, password } });
        return response.headers.getSetCookie().find(value => value.startsWith("barhoum-student=")).split(";")[0];
    }
    const [cookie, other] = await Promise.all(students.map(studentLogin));
    async function createAdmin(path, data) {
        return (await json(path, 201, { method: "POST", data, admin })).body.doc;
    }
    const cover = await createAdmin("/api/course-covers", { alt: "Commerce", publicURL: "/images/hero.jpeg" });
    const course = await createAdmin("/api/courses?draft=true", { title: "Test commerce", slug: "test-commerce", description: "Fixture", cover: cover.id });
    const premium = await createAdmin("/api/modules", { title: "Premium", course: course.id, classification: "premium", _status: "published" });
    const updateCourse = data => json("/api/courses/" + course.id, 200, { method: "PATCH", data, admin });
    await updateCourse({ structure: "modular", modules: [{ module: premium.id }], _status: "published" });
    const offers = (await dbClient.query(`
        INSERT INTO course_offers (course_id, module_id, enabled, stripe_price_id) VALUES
        ($1, NULL, true, 'price_FixtureBase'), ($1, $2, true, 'price_FixturePremium')
        RETURNING id
    `, [course.id, premium.id])).rows;
    const [baseOffer, premiumOffer] = offers.map(offer => offer.id);
    const orderRoute = id => "/api/course-commerce/orders/" + id;
    const checkout = async (offerId, status = 200, student = cookie, extras) => (await json("/api/course-commerce/checkout", status, {
        method: "POST", data: { offerId, ...extras }, cookie: student,
    })).body;
    const order = async id => (await dbClient.query("SELECT * FROM course_orders WHERE id=$1", [id])).rows[0];
    const grant = async id => (await dbClient.query("SELECT * FROM course_entitlements WHERE source_order_id=$1", [id])).rows[0];
    const refresh = async (id, expect) => assert.equal((await json(orderRoute(id) + "/refresh", 200, { method: "POST", cookie })).body.status, expect);
    const settle = (id, paid = true) => edit(store => {
        const session = store.sessions[id];
        const number = id.match(/\d+$/)[0];
        const pi = "pi_Fixture" + number;
        const charge = "ch_Fixture" + number;
        Object.assign(session, { status: "complete", payment_status: paid ? "paid" : "unpaid", payment_intent: pi, url: null });
        store.intents[pi] = {
            id: pi, object: "payment_intent", amount: session.amount_total,
            amount_received: paid ? session.amount_total : 0, status: paid ? "succeeded" : "processing",
            currency: session.currency, livemode: false, metadata: session.intent_metadata, latest_charge: paid ? charge : null,
        };
        if (paid) store.charges[charge] = {
            id: charge, object: "charge", paid: true, captured: true, currency: session.currency, livemode: false,
            amount_captured: session.amount_total, amount_refunded: 0, payment_intent: pi,
        };
        return { session, intent: store.intents[pi], charge };
    });
    async function setRefund({ intent, charge }, amount, type = "refund.updated") {
        const refund = { id: "re_Fixture" + amount, object: "refund", amount, status: "succeeded", charge, payment_intent: intent.id };
        edit(store => { store.refunds[charge] = [refund]; store.charges[charge].amount_refunded = amount; });
        await deliver(event(type, refund));
    }
    async function setDispute({ intent, charge }, status, type) {
        const dispute = { id: "dp_Fixture", object: "dispute", amount: intent.amount, status, charge, payment_intent: intent.id };
        edit(store => { store.disputes[charge] = [dispute]; });
        await deliver(event(type, dispute));
    }

    await json("/api/course-commerce/checkout", 401, { method: "POST", data: { offerId: baseOffer } });
    await json("/api/course-commerce/checkout", 400, { method: "POST", data: { offerId: baseOffer }, cookie, sameOrigin: false });
    await checkout(baseOffer, 400, cookie, { amountMinor: 1 });
    assert.equal((await checkout(premiumOffer, 409)).error.code, "BASE_REQUIRED");

    edit(store => { store.failCreates = 2; });
    await checkout(baseOffer, 503);
    const reserved = (await dbClient.query("SELECT * FROM course_orders")).rows;
    assert.equal(reserved.length, 1);
    assert.equal(reserved[0].status, "creating");
    await updateCourse({ slug: "test-commerce-renamed", _status: "published" });
    const concurrent = await Promise.all([checkout(baseOffer), checkout(baseOffer)]);
    assert.equal(concurrent[0].orderId, concurrent[1].orderId);
    assert.equal(concurrent[0].orderId, reserved[0].id);
    assert.match(concurrent[0].checkoutUrl, /^https:\/\/checkout\.stripe\.com\//);
    assert.equal(Object.keys(state().sessions).length, 1);
    const initial = concurrent[0].orderId;
    const params = new URLSearchParams(Object.values(state().requests)[0].body);
    assert.equal(params.get("payment_method_types[0]"), "card");
    assert.equal(params.get("adaptive_pricing[enabled]"), "false");
    assert.equal(params.get("allow_promotion_codes"), "false");
    assert.equal(params.get("line_items[0][quantity]"), "1");
    assert.equal(params.get("cancel_url"), origin + "/courses/test-commerce");
    assert.equal(params.get("success_url"), origin + "/checkout/return?orderId=" + initial);
    await json(orderRoute(initial), 404, { cookie: other });
    await json(orderRoute(initial) + "/refresh", 404, { cookie: other, method: "POST" });
    assert.deepEqual((await json(orderRoute(initial), 200, { cookie })).body, {
        orderId: initial, status: "processing", courseSlug: "test-commerce-renamed",
    });

    const sessionID = (await order(initial)).stripe_session_id;
    const unpaid = settle(sessionID, false);
    const completion = event("checkout.session.completed", unpaid.session);
    await deliver(completion, { secret: legacySecret, status: 400 });
    await deliver(completion);
    assert.equal(await grant(initial), undefined);
    const paid = settle(sessionID);
    const paidIntent = event("payment_intent.succeeded", paid.intent);
    await dbClient.query(`
        CREATE FUNCTION phase5_test_abort_grant() RETURNS trigger LANGUAGE plpgsql AS
        $$ BEGIN RAISE EXCEPTION 'fixture interruption'; END; $$;
        CREATE TRIGGER phase5_test_abort_grant BEFORE INSERT ON course_entitlements
        FOR EACH ROW EXECUTE FUNCTION phase5_test_abort_grant();
    `);
    await deliver(paidIntent, { status: 503 });
    assert.equal(await grant(initial), undefined);
    assert.equal((await order(initial)).status, "processing");
    assert.equal((await dbClient.query("SELECT count(*)::int AS count FROM course_payment_events WHERE stripe_event_id=$1", [paidIntent.id])).rows[0].count, 0);
    await dbClient.query("DROP TRIGGER phase5_test_abort_grant ON course_entitlements; DROP FUNCTION phase5_test_abort_grant()");
    await Promise.all([deliver(paidIntent), deliver(paidIntent), deliver(event("checkout.session.completed", paid.session))]);
    assert.equal((await grant(initial)).status, "active");
    assert.equal((await dbClient.query("SELECT count(*)::int AS count FROM course_payment_events WHERE stripe_event_id=$1", [paidIntent.id])).rows[0].count, 1);
    await refresh(initial, "fulfilled");
    assert.equal((await checkout(baseOffer, 409)).error.code, "ALREADY_OWNED");
    for (const mismatched of [{ livemode: true }, { account: "acct_Other" }]) {
        const rejected = event("payment_intent.succeeded", paid.intent, mismatched);
        await deliver(rejected);
        assert.equal((await dbClient.query("SELECT count(*)::int AS count FROM course_payment_events WHERE stripe_event_id=$1", [rejected.id])).rows[0].count, 0);
    }

    const upgrade = (await checkout(premiumOffer)).orderId;
    await setRefund(paid, paid.intent.amount);
    assert.equal((await grant(initial)).status, "revoked");
    const premiumPaid = settle((await order(upgrade)).stripe_session_id);
    await deliver(event("checkout.session.completed", premiumPaid.session));
    assert.equal((await grant(upgrade)).status, "active");
    assert.equal((await checkout(premiumOffer, 409)).error.code, "BASE_REQUIRED");

    const replacement = (await checkout(baseOffer)).orderId;
    const repaid = settle((await order(replacement)).stripe_session_id);
    await refresh(replacement, "fulfilled");
    await setRefund(repaid, 100);
    assert.equal((await grant(replacement)).status, "active");
    await setDispute(repaid, "needs_response", "charge.dispute.created");
    assert.equal((await grant(replacement)).status, "suspended");
    await setDispute(repaid, "won", "charge.dispute.closed");
    assert.equal((await grant(replacement)).status, "active");
    await setDispute(repaid, "lost", "charge.dispute.closed");
    assert.equal((await grant(replacement)).status, "revoked");
    await deliver(event("checkout.session.completed", repaid.session));
    assert.equal((await grant(replacement)).status, "revoked");

    const outdated = (await checkout(baseOffer)).orderId;
    const outdatedSessionID = (await order(outdated)).stripe_session_id;
    await dbClient.query("UPDATE course_offers SET stripe_price_id='price_FixtureNew' WHERE id=$1", [baseOffer]);
    const current = (await checkout(baseOffer)).orderId;
    assert.notEqual(current, outdated);
    assert.equal(state().sessions[outdatedSessionID].status, "expired");
    const currentPaid = settle((await order(current)).stripe_session_id);
    await deliver(event("checkout.session.completed", currentPaid.session));
    const duplicate = settle(outdatedSessionID);
    await deliver(event("checkout.session.completed", duplicate.session));
    assert.equal((await order(outdated)).reason, "duplicate_payment");
    assert.equal((await grant(outdated)).status, "revoked");
    assert.equal((await grant(current)).status, "active");

    edit(store => { store.failCreates = 2; });
    await checkout(baseOffer, 503, other);
    const ambiguous = (await dbClient.query("SELECT * FROM course_orders WHERE student_id=$1", [studentIDs[1]])).rows[0];
    await dbClient.query("UPDATE course_orders SET created_at=now()-interval '24 hours' WHERE id=$1", [ambiguous.id]);
    await checkout(baseOffer, 503, other);
    assert.equal((await order(ambiguous.id)).reason, "ambiguous_checkout");
    const providerSession = Object.values(state().sessions).find(item => item.client_reference_id === ambiguous.id);
    await json("/api/course-commerce/reconcile", 401, { method: "POST", data: { orderId: ambiguous.id, stripeSessionId: providerSession.id }, cookie: other });
    await json("/api/course-commerce/reconcile", 200, { method: "POST", data: { orderId: ambiguous.id, stripeSessionId: providerSession.id }, admin });
    assert.equal((await checkout(baseOffer, 200, other)).orderId, ambiguous.id);

    edit(store => { store.sessions[providerSession.id].amount_total += 1; });
    await checkout(baseOffer, 503, other);
    assert.equal((await order(ambiguous.id)).reason, "checkout_amount_mismatch");
    assert.equal(await grant(ambiguous.id), undefined);
    await checkout(baseOffer, 503, other);
    assert.equal((await dbClient.query("SELECT count(*)::int AS count FROM course_orders WHERE student_id=$1", [studentIDs[1]])).rows[0].count, 1);
    edit(store => { Object.assign(store.sessions[providerSession.id], { status: "expired", url: null }); });
    assert.notEqual((await checkout(baseOffer, 200, other)).orderId, ambiguous.id);

    const legacySession = { ...currentPaid.session, metadata: { lead_id: "fixture-legacy" } };
    await deliver(event("checkout.session.completed", legacySession));
    assert.deepEqual(state().legacyLeads, []);
    await deliver(event("checkout.session.completed", currentPaid.session), { secret: legacySecret, legacy: true });
    assert.deepEqual(state().legacyLeads, []);
    await deliver(event("checkout.session.completed", legacySession), { secret: legacySecret, legacy: true });
    assert.deepEqual(state().legacyLeads, ["fixture-legacy"]);
    const baselineLegacyAnalytics = state().legacyAnalytics;
    assert.ok(baselineLegacyAnalytics.length && baselineLegacyAnalytics.every(value => value === legacySession.id));
    await deliver(event("payment_intent.succeeded", currentPaid.intent), { secret: legacySecret, legacy: true });
    assert.deepEqual(state().legacyAnalytics, baselineLegacyAnalytics);
    const legacyIntent = { ...currentPaid.intent, id: "pi_LegacyFixture", metadata: {} };
    await deliver(event("payment_intent.succeeded", legacyIntent));
    assert.deepEqual(state().legacyAnalytics, baselineLegacyAnalytics);
    await deliver(event("payment_intent.succeeded", legacyIntent), { secret: legacySecret, legacy: true });
    assert.deepEqual(state().legacyAnalytics, [...baselineLegacyAnalytics, legacyIntent.id]);
    console.log("Passed checkout reservation, ambiguous retries, course/webhook isolation, fulfillment, refunds, disputes, and repurchase.");
} finally {
    await dbClient.end();
}

process.exit(0);
