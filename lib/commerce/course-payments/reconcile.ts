import "server-only";

import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import type Stripe from "stripe";
import { authTransaction } from "../../student-auth/core";
import { CommerceError } from "./core";
import { isCourseStripeMetadata } from "./marker";
import { findOrder, lockCourseCommerce, type Order, type OrderStatus } from "./orders";
import { trustedCheckoutURL } from "../checkout-url";
import { matchesStripeOrder, stripeID, type CourseStripe } from "./stripe";

export type ProviderEvent = { id: string; type: string; reference: string | null; amount: number | null };

type CanonicalOrder = {
    session: Stripe.Checkout.Session;
    intent: string | null;
    tax: number | null;
    total: number | null;
    status: OrderStatus;
    reason: string | null;
    grant: "active" | "suspended" | "revoked" | null;
};

function orderMetadata(metadata: Stripe.Metadata | null, order: Order) {
    return isCourseStripeMetadata(metadata) && metadata?.barhoum_order_id === order.id;
}

function canonicalState(session: Stripe.Checkout.Session): CanonicalOrder {
    return {
        session, intent: stripeID(session.payment_intent), tax: session.total_details?.amount_tax ?? null, total: session.amount_total,
        status: "processing", reason: null, grant: null,
    };
}

async function canonicalOrder(provider: CourseStripe, order: Order, sessionID: string): Promise<CanonicalOrder | null> {
    const stripe = provider.stripe;
    const session = await stripe.checkout.sessions.retrieve(sessionID);
    const state = canonicalState(session);
    if (session.id !== sessionID || (order.stripe_session_id && session.id !== order.stripe_session_id) ||
        session.livemode !== order.livemode || session.client_reference_id !== order.id || !orderMetadata(session.metadata, order) ||
        (order.stripe_payment_intent_id && state.intent !== order.stripe_payment_intent_id)) return null;
    if (session.status === "expired" && session.payment_status === "unpaid") return { ...state, status: "expired" };
    const list = await stripe.checkout.sessions.listLineItems(session.id, { limit: 2 });
    const item = list.data[0];
    const tax = state.tax ?? 0;
    if (session.mode !== "payment" || session.payment_method_types.length !== 1 || session.payment_method_types[0] !== "card" ||
        session.currency !== order.currency || session.amount_subtotal !== order.amount_minor ||
        !Number.isSafeInteger(tax) || tax < 0 || session.amount_total !== order.amount_minor + tax ||
        (session.total_details?.amount_discount ?? 0) !== 0 || (session.total_details?.amount_shipping ?? 0) !== 0 ||
        list.has_more || list.data.length !== 1 || item.quantity !== 1 || item.currency !== order.currency ||
        item.price?.id !== order.stripe_price_id || item.amount_subtotal !== order.amount_minor || item.amount_total !== session.amount_total) {
        return { ...state, status: "support_required", reason: "checkout_amount_mismatch" };
    }
    if (session.status === "open" && session.payment_status === "unpaid" && trustedCheckoutURL(session.url)) return { ...state, status: "open" };
    if (session.status !== "complete" || !state.intent) return state;

    const intent = await stripe.paymentIntents.retrieve(state.intent, { expand: ["latest_charge"] });
    if (intent.id !== state.intent || intent.livemode !== order.livemode || !orderMetadata(intent.metadata, order) ||
        intent.currency !== order.currency || intent.amount !== session.amount_total) {
        return { ...state, status: "support_required", reason: "payment_intent_mismatch" };
    }
    if (session.payment_status !== "paid" || intent.status !== "succeeded") {
        if (["canceled", "requires_payment_method"].includes(intent.status) && session.payment_status === "unpaid") {
            return { ...state, status: "failed", reason: "payment_failed" };
        }
        return state;
    }
    const charge = intent.latest_charge;
    if (!charge || typeof charge === "string") throw new CommerceError("UNAVAILABLE");
    if (charge.livemode !== order.livemode || stripeID(charge.payment_intent) !== intent.id ||
        !charge.paid || !charge.captured || charge.amount_captured !== session.amount_total ||
        charge.currency !== order.currency || intent.amount_received !== session.amount_total) {
        return { ...state, status: "support_required", reason: "charge_mismatch" };
    }

    const [refunds, disputes] = await Promise.all([
        stripe.refunds.list({ charge: charge.id, limit: 100 }),
        stripe.disputes.list({ charge: charge.id, limit: 100 }),
    ]);
    if (refunds.has_more || disputes.has_more || (charge.disputed && disputes.data.length === 0)) {
        throw new CommerceError("UNAVAILABLE");
    }
    const refunded = refunds.data.filter(refund => refund.status === "succeeded")
        .reduce((sum, refund) => sum + refund.amount, 0);
    if (refunded >= intent.amount_received) return { ...state, status: "failed", reason: "full_refund", grant: "revoked" };
    if (disputes.data.some(dispute => dispute.status === "lost")) {
        return { ...state, status: "failed", reason: "dispute_lost", grant: "revoked" };
    }
    if (disputes.data.some(dispute => !["won", "warning_closed", "prevented"].includes(dispute.status))) {
        return { ...state, status: "support_required", reason: "dispute_open", grant: "suspended" };
    }
    return { ...state, status: "fulfilled", reason: refunded > 0 ? "partial_refund" : null, grant: "active" };
}

export async function reconcileOrder(payload: Payload, provider: CourseStripe, orderID: string, options: { sessionID?: string; event?: ProviderEvent } = {}) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const snapshot = await authTransaction(payload, context => findOrder(context, orderID));
        if (!snapshot || !matchesStripeOrder(provider, snapshot)) return undefined;
        const sessionID = options.sessionID ?? snapshot.stripe_session_id;
        if (!sessionID) return snapshot;
        const canonical = await canonicalOrder(provider, snapshot, sessionID);
        const result = await authTransaction(payload, async context => {
            const { tx } = context;
            await lockCourseCommerce(context, snapshot.student_id, snapshot.course_id);
            const order = await findOrder(context, orderID);
            if (!order) return undefined;
            // Re-fetch provider state if another observer already committed a decision.
            if (order.revision !== snapshot.revision) return "retry" as const;

            const event = options.event;
            if (event) {
                const insertion = await tx.execute(sql`
                    INSERT INTO course_payment_events (stripe_account, livemode, stripe_event_id, event_type, order_id,
                        outcome, provider_reference, amount_minor)
                    VALUES (${provider.account}, ${provider.livemode}, ${event.id}, ${event.type}, ${order.id}::uuid,
                        'processing', ${event.reference}, ${event.amount})
                    ON CONFLICT DO NOTHING RETURNING stripe_event_id
                `);
                if (!insertion.rows.length) return order;
            }
            const finishEvent = async (outcome: string) => {
                if (!event) return;
                await tx.execute(sql`
                    UPDATE course_payment_events SET outcome = ${outcome}
                    WHERE stripe_account = ${provider.account} AND livemode = ${provider.livemode} AND stripe_event_id = ${event.id}
                `);
            };
            if (!canonical) {
                await finishEvent("association_mismatch");
                if (options.event) return order;
                throw new CommerceError("UNAVAILABLE");
            }

            const priorPaid = order.status === "fulfilled" || ["full_refund", "dispute_lost", "dispute_open", "duplicate_payment", "duplicate_payment_refunded"].includes(order.reason ?? "");
            const finalRevocation = ["full_refund", "dispute_lost", "duplicate_payment_refunded"].includes(order.reason ?? "");
            const terminalUnpaid = ["failed", "expired"].includes(order.status) && ["open", "processing"].includes(canonical.status);
            if (terminalUnpaid || (priorPaid && !canonical.grant) || (finalRevocation && canonical.grant !== "revoked")) {
                await finishEvent("stale_state");
                return order;
            }

            let { grant, status, reason } = canonical;
            const duplicate = order.reason?.startsWith("duplicate_payment");
            if (grant === "active") {
                const other = await tx.execute(sql`
                    SELECT 1 FROM course_entitlements
                    WHERE student_id = ${order.student_id} AND course_id = ${order.course_id}
                      AND module_id IS NOT DISTINCT FROM ${order.module_id}::integer
                      AND status = 'active' AND source_order_id <> ${order.id}::uuid
                    LIMIT 1
                `);
                if (duplicate || other.rows.length) {
                    grant = "revoked";
                    status = "support_required";
                    reason = "duplicate_payment";
                }
            } else if (duplicate) {
                grant = "revoked";
                status = reason === "full_refund" ? "failed" : "support_required";
                reason = reason === "full_refund" ? "duplicate_payment_refunded" : "duplicate_payment";
            }
            if (grant) {
                await tx.execute(sql`
                    INSERT INTO course_entitlements (student_id, course_id, module_id, source_order_id, status, reason)
                    VALUES (${order.student_id}, ${order.course_id}, ${order.module_id}, ${order.id}::uuid, ${grant}, ${reason})
                    ON CONFLICT (source_order_id) DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason, updated_at = now()
                `);
            }
            await tx.execute(sql`
                UPDATE course_orders SET status = ${status}, reason = ${reason},
                    stripe_session_id = ${canonical.session.id},
                    stripe_payment_intent_id = COALESCE(${canonical.intent}, stripe_payment_intent_id),
                    checkout_url = ${status === "open" ? trustedCheckoutURL(canonical.session.url) : null},
                    expires_at = to_timestamp(${canonical.session.expires_at}),
                    tax_minor = ${canonical.tax}, total_minor = ${canonical.total}, updated_at = now()
                WHERE id = ${order.id}::uuid
            `);
            await finishEvent(reason ?? status);
            return findOrder(context, orderID);
        });
        if (result !== "retry") return result;
    }
    throw new CommerceError("UNAVAILABLE");
}
