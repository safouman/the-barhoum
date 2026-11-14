import "server-only";

import Stripe from "stripe";
import { CommerceError, priceIdPattern } from "./core";
import { courseStripeMetadata } from "./marker";
import type { ChargePrice, Order } from "./orders";

type StripeContext = { stripe: Stripe; account: string; livemode: boolean };

type CachedClient = { key: string; account: string; livemode: boolean; client: Promise<StripeContext> };
const clients: Partial<Record<"request" | "scheduled", CachedClient>> = {};

export function courseStripe(traffic: "request" | "scheduled" = "request") {
    const key = process.env.COURSE_STRIPE_SECRET_KEY;
    const account = process.env.COURSE_STRIPE_ACCOUNT_ID;
    const mode = process.env.COURSE_STRIPE_LIVEMODE;
    const livemode = mode === "true";
    if (!key || !account || !/^acct_[A-Za-z0-9]{1,100}$/.test(account) || !["true", "false"].includes(mode ?? "") ||
        !new RegExp(`^(?:sk|rk)_${livemode ? "live" : "test"}_`).test(key) ||
        (livemode && process.env.VERCEL_ENV === "preview")) throw new CommerceError("UNAVAILABLE");

    const cached = clients[traffic];
    if (!cached || cached.key !== key || cached.account !== account || cached.livemode !== livemode) {
        const scheduled = traffic === "scheduled";
        const stripe = new Stripe(key, {
            typescript: true,
            httpClient: Stripe.createFetchHttpClient(),
            maxNetworkRetries: scheduled ? 0 : 1,
            timeout: scheduled ? 4_000 : 8_000,
        });
        const client = stripe.accounts.retrieve().then(result => {
            if (result.id !== account) throw new CommerceError("UNAVAILABLE");
            return { stripe, account, livemode };
        }).catch(() => {
            if (clients[traffic]?.client === client) delete clients[traffic];
            throw new CommerceError("UNAVAILABLE");
        });
        clients[traffic] = { key, account, livemode, client };
    }
    return clients[traffic]!.client;
}

export type CourseStripe = Awaited<ReturnType<typeof courseStripe>>;

export function matchesStripeOrder(provider: CourseStripe, order: Order) {
    return provider.account === order.stripe_account && provider.livemode === order.livemode;
}

export async function readStripePrice(provider: CourseStripe, id: string): Promise<ChargePrice> {
    if (!priceIdPattern.test(id)) throw new CommerceError("OFFER_UNAVAILABLE");
    let price: Stripe.Price;
    try {
        price = await provider.stripe.prices.retrieve(id, { expand: ["product"] });
    } catch (error) {
        if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing") throw new CommerceError("OFFER_UNAVAILABLE");
        throw error;
    }
    const product = price.product;
    if (price.id !== id || price.livemode !== provider.livemode || !price.active || price.type !== "one_time" ||
        price.billing_scheme !== "per_unit" || price.custom_unit_amount || price.recurring ||
        !price.unit_amount || !Number.isSafeInteger(price.unit_amount) || price.unit_amount < 1 || price.unit_amount > 2147483647 ||
        !/^[a-z]{3}$/.test(price.currency) || typeof product === "string" || product.deleted || !product.active) {
        throw new CommerceError("OFFER_UNAVAILABLE");
    }
    return { amountMinor: price.unit_amount, currency: price.currency };
}

export async function createStripeSession(provider: CourseStripe, order: Order) {
    if (!matchesStripeOrder(provider, order)) throw new CommerceError("UNAVAILABLE");
    const metadata = courseStripeMetadata(order.id);
    const success = new URL("/checkout/return", order.checkout_origin);
    success.searchParams.set("orderId", order.id);
    const cancel = new URL(`/courses/${encodeURIComponent(order.cancel_course_slug)}`, order.checkout_origin);
    return provider.stripe.checkout.sessions.create({
        mode: "payment",
        locale: "en",
        payment_method_types: ["card"],
        line_items: [{ price: order.stripe_price_id, quantity: 1 }],
        currency: order.currency,
        adaptive_pricing: { enabled: false },
        allow_promotion_codes: false,
        automatic_tax: { enabled: false },
        client_reference_id: order.id,
        metadata,
        payment_intent_data: { metadata },
        success_url: success.href,
        cancel_url: cancel.href,
    }, { idempotencyKey: `barhoum-course-checkout-${order.id}` });
}

export function stripeID(value: string | { id: string } | null | undefined) {
    return typeof value === "string" ? value : value?.id ?? null;
}
