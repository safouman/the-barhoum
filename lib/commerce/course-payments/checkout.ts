import "server-only";

import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { authTransaction } from "../../student-auth/core";
import type { StudentIdentity } from "../../student-auth/session";
import { checkoutEnabled, CommerceError, commerceOrigin } from "./core";
import { findOrder, lockCourseCommerce, readOffers, reserveOrder, type Order } from "./orders";
import { reconcileOrder } from "./reconcile";
import { courseStripe, createStripeSession, matchesStripeOrder, readStripePrice, type CourseStripe } from "./stripe";

// Stripe retains idempotency keys for at least 24 hours. Leave a margin for in-flight requests.
const idempotencyWindow = 23 * 60 * 60 * 1000;

async function markAmbiguous(payload: Payload, order: Order) {
    await authTransaction(payload, async context => {
        await lockCourseCommerce(context, order.student_id, order.course_id);
        await context.tx.execute(sql`
            UPDATE course_orders SET status = 'support_required', reason = 'ambiguous_checkout', updated_at = now()
            WHERE id = ${order.id}::uuid AND status = 'creating' AND stripe_session_id IS NULL
        `);
    });
}

async function reconcileOrCreate(payload: Payload, provider: CourseStripe, order: Order) {
    if (order.stripe_session_id) return reconcileOrder(payload, provider, order.id);
    if (order.status !== "creating") throw new CommerceError("UNAVAILABLE");
    if (Date.now() - new Date(order.created_at).getTime() >= idempotencyWindow) {
        await markAmbiguous(payload, order);
        throw new CommerceError("UNAVAILABLE");
    }
    try {
        const session = await createStripeSession(provider, order);
        return reconcileOrder(payload, provider, order.id, { sessionID: session.id });
    } catch (error) {
        const current = await authTransaction(payload, context => findOrder(context, order.id));
        if (current?.stripe_session_id) return reconcileOrder(payload, provider, order.id);
        throw error;
    }
}

export async function createCheckout(payload: Payload, identity: StudentIdentity, offerID: number) {
    if (!checkoutEnabled()) throw new CommerceError("UNAVAILABLE");
    const origin = commerceOrigin();
    const [offer] = await authTransaction(payload, context => readOffers(context, { offerId: offerID }));
    if (!offer) throw new CommerceError("OFFER_UNAVAILABLE");
    const provider = await courseStripe();
    const price = await readStripePrice(provider, offer.stripe_price_id);
    for (let attempt = 0; attempt < 3; attempt++) {
        const order = await reserveOrder(payload, identity, offer, price, { ...provider, origin });
        if (!matchesStripeOrder(provider, order)) throw new CommerceError("UNAVAILABLE");
        const reconciled = await reconcileOrCreate(payload, provider, order);
        if (!reconciled) throw new CommerceError("UNAVAILABLE");
        if (reconciled.status === "fulfilled") throw new CommerceError("ALREADY_OWNED");
        if (reconciled.status === "expired" || reconciled.status === "failed") continue;
        if (reconciled.status !== "open" || !reconciled.checkout_url || !reconciled.stripe_session_id) throw new CommerceError("UNAVAILABLE");
        if (reconciled.stripe_price_id !== offer.stripe_price_id ||
            reconciled.amount_minor !== price.amountMinor || reconciled.currency !== price.currency) {
            try {
                await provider.stripe.checkout.sessions.expire(reconciled.stripe_session_id);
            } catch {
                // The session could have completed while this request tried to retire it.
                const current = await reconcileOrder(payload, provider, reconciled.id);
                if (current?.status === "fulfilled") throw new CommerceError("ALREADY_OWNED");
                if (current?.status !== "expired") throw new CommerceError("UNAVAILABLE");
                continue;
            }
            await reconcileOrder(payload, provider, reconciled.id);
            continue;
        }
        return { orderId: reconciled.id, checkoutUrl: reconciled.checkout_url };
    }
    throw new CommerceError("UNAVAILABLE");
}
