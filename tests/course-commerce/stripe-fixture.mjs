import { readFileSync, writeFileSync } from "node:fs";

const stateFile = process.env.COURSE_COMMERCE_TEST_STATE;
const simulatedVercel = process.env.COURSE_COMMERCE_ORIGIN === "https://course-geo.fixture.invalid" &&
    /^postgresql:\/\/[^/]+@127\.0\.0\.1:\d+\/barhoum_phase5_/.test(process.env.DATABASE_URL ?? "");
if (!stateFile || process.env.COURSE_STRIPE_SECRET_KEY !== "sk_test_commerce_fixture" || (process.env.VERCEL && !simulatedVercel)) {
    throw new Error("A disposable Stripe fixture configuration is required.");
}

const nativeFetch = globalThis.fetch;
const stripeError = (status, code) => Response.json({
    error: { type: status >= 500 ? "api_error" : "invalid_request_error", message: "Fixture provider error", code },
}, { status });
const list = (data, has_more = false) => Response.json({ object: "list", has_more, data });
const price = (id, amount) => ({
    id, object: "price", active: true, livemode: false, type: "one_time", billing_scheme: "per_unit",
    custom_unit_amount: null, recurring: null, unit_amount: amount, currency: "eur",
    product: { id: "prod_Fixture", active: true, object: "product" },
});

globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.origin === "https://training-sheet.fixture.invalid") {
        const body = JSON.parse(init?.body ?? await input.text());
        const state = JSON.parse(readFileSync(stateFile, "utf8"));
        state.legacyLeads.push(body.leadId);
        writeFileSync(stateFile, JSON.stringify(state));
        return Response.json({ ok: true });
    }
    if (url.origin === "https://www.google-analytics.com") {
        const body = JSON.parse(init?.body ?? await input.text());
        const state = JSON.parse(readFileSync(stateFile, "utf8"));
        state.legacyAnalytics.push(body.client_id);
        writeFileSync(stateFile, JSON.stringify(state));
        return new Response(null, { status: 204 });
    }
    if (url.origin === "https://api.resend.com") {
        const headers = new Headers(init?.headers);
        if (headers.get("authorization") !== "Bearer resend-commerce-fixture") {
            throw new Error("Only the disposable alert fixture may call Resend.");
        }
        const state = JSON.parse(readFileSync(stateFile, "utf8"));
        const key = headers.get("idempotency-key");
        const body = JSON.parse(init.body);
        if (!key || (state.alerts[key] && JSON.stringify(state.alerts[key]) !== JSON.stringify(body))) {
            return new Response(null, { status: 409 });
        }
        state.alerts[key] = body;
        writeFileSync(stateFile, JSON.stringify(state));
        return Response.json({ id: "fixture-email" });
    }
    if (url.origin !== "https://api.stripe.com") {
        if (["127.0.0.1", "localhost"].includes(url.hostname)) return nativeFetch(input, init);
        throw new Error("Unexpected outbound fixture request.");
    }
    const state = JSON.parse(readFileSync(stateFile, "utf8"));
    const save = () => writeFileSync(stateFile, JSON.stringify(state));
    const method = init?.method ?? "GET";
    const route = url.pathname;
    state.stripeCalls++;
    save();
    if (route === "/v1/account") return Response.json({ id: "acct_Fixture", object: "account" });
    if (route.startsWith("/v1/prices/")) {
        const id = route.split("/").at(-1);
        const amount = state.prices[id];
        return amount ? Response.json(price(id, amount)) : stripeError(404, "resource_missing");
    }
    if (route === "/v1/checkout/sessions" && method === "POST") {
        const params = new URLSearchParams(init.body);
        const headers = new Headers(init.headers);
        const key = headers.get("idempotency-key");
        const previous = state.requests[key];
        if (previous && previous.body !== init.body) return stripeError(400, "idempotency_error");
        if (!previous) {
            const id = "cs_test_fixture" + String(Object.keys(state.sessions).length + 1);
            const priceID = params.get("line_items[0][price]");
            const amount = state.prices[priceID];
            if (!amount) return stripeError(400, "resource_missing");
            state.requests[key] = { body: init.body, id };
            state.sessions[id] = {
                id, object: "checkout.session", mode: "payment", livemode: false, payment_method_types: ["card"],
                client_reference_id: params.get("client_reference_id"),
                metadata: { barhoum_source: params.get("metadata[barhoum_source]"), barhoum_order_id: params.get("metadata[barhoum_order_id]") },
                intent_metadata: { barhoum_source: params.get("payment_intent_data[metadata][barhoum_source]"), barhoum_order_id: params.get("payment_intent_data[metadata][barhoum_order_id]") },
                amount_subtotal: amount, amount_total: amount, currency: params.get("currency"),
                total_details: { amount_tax: 0, amount_discount: 0, amount_shipping: 0 },
                status: "open", payment_status: "unpaid", payment_intent: null, priceID, created: Math.floor(Date.now() / 1000),
                url: `https://checkout.stripe.com/c/pay/${id}`, expires_at: Math.floor(Date.now() / 1000) + 3600,
            };
        }
        if (state.failCreates > 0) {
            state.failCreates--;
            save();
            return stripeError(500, "api_error");
        }
        save();
        return Response.json(state.sessions[state.requests[key].id]);
    }
    if (route === "/v1/checkout/sessions") {
        const paymentIntent = url.searchParams.get("payment_intent");
        if (paymentIntent) return list(Object.values(state.sessions).filter(session => session.payment_intent === paymentIntent));
        const from = Number(url.searchParams.get("created[gte]"));
        const until = Number(url.searchParams.get("created[lte]"));
        const matches = Object.values(state.sessions).filter(session => session.created >= from && session.created <= until).reverse();
        const cursor = url.searchParams.get("starting_after");
        const start = cursor ? matches.findIndex(session => session.id === cursor) + 1 : 0;
        const limit = Number(url.searchParams.get("limit"));
        return list(matches.slice(start, start + limit), matches.length > start + limit);
    }
    if (route.startsWith("/v1/checkout/sessions/")) {
        const [, , , , id, action] = route.split("/");
        const session = state.sessions[id];
        if (!session) return stripeError(404, "resource_missing");
        if (state.failRetrieve === id) return stripeError(500, "api_error");
        if (action === "line_items") {
            return list([{
                id: "li_fixture", quantity: 1, currency: session.currency, amount_subtotal: session.amount_subtotal,
                amount_total: session.amount_total, price: { id: session.priceID },
            }]);
        }
        if (action === "expire") {
            if (session.status !== "open") return stripeError(400, "checkout_session_not_open");
            session.status = "expired";
            session.url = null;
            save();
        }
        return Response.json(session);
    }
    if (route.startsWith("/v1/payment_intents/")) {
        const id = route.split("/").at(-1);
        const intent = state.intents[id];
        if (!intent) return stripeError(404, "resource_missing");
        return Response.json({ ...intent, latest_charge: url.searchParams.get("expand[0]") ? state.charges[intent.latest_charge] : intent.latest_charge });
    }
    if (route.startsWith("/v1/charges/")) return Response.json(state.charges[route.split("/").at(-1)]);
    if (route === "/v1/refunds") return list(state.refunds[url.searchParams.get("charge")] ?? []);
    if (route === "/v1/disputes") return list(state.disputes[url.searchParams.get("charge")] ?? []);
    throw new Error("Unexpected Stripe fixture request.");
};
