import "server-only";

import { sql } from "@payloadcms/db-postgres";
import { authTransaction } from "../../student-auth/core";
import type Stripe from "stripe";
import type { Payload } from "payload";
import { CommerceError, orderIdPattern, stripeSessionPattern } from "./core";
import { isCourseStripeMetadata } from "./marker";
import { reconcileOrder, type ProviderEvent } from "./reconcile";
import { stripeID, type CourseStripe } from "./stripe";

function markedOrder(metadata: Stripe.Metadata | null | undefined) {
    const orderID = metadata?.barhoum_order_id;
    return isCourseStripeMetadata(metadata) && orderID && orderIdPattern.test(orderID) ? orderID : null;
}

const sessions = new Set(["checkout.session.completed", "checkout.session.expired", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"]);
const intents = new Set(["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled", "payment_intent.processing"]);
const refunds = new Set(["refund.created", "refund.updated", "refund.failed", "charge.refunded"]);
const disputes = new Set(["charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed", "charge.dispute.funds_withdrawn", "charge.dispute.funds_reinstated"]);

export function handledCourseEvent(event: Stripe.Event) {
    const type = event.type;
    if (sessions.has(type) || intents.has(type)) return isCourseStripeMetadata((event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent).metadata);
    return refunds.has(type) || disputes.has(type);
}

async function locateEvent(provider: CourseStripe, event: Stripe.Event) {
    const type = event.type;
    if (sessions.has(type)) {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderID = markedOrder(session.metadata);
        if (!orderID || !stripeSessionPattern.test(session.id)) return null;
        return { orderID, sessionID: session.id, reference: session.id, amount: session.amount_total };
    }

    let reference: string;
    let amount: number | null;
    let intentID: string | null;
    let orderID: string | null;
    if (intents.has(type)) {
        const intent = event.data.object as Stripe.PaymentIntent;
        reference = intent.id;
        amount = intent.amount_received;
        intentID = intent.id;
        orderID = markedOrder(intent.metadata);
    } else {
        const object = event.data.object as Stripe.Charge | Stripe.Refund | Stripe.Dispute;
        reference = object.id;
        amount = object.object === "charge" ? object.amount_refunded : object.amount;
        intentID = stripeID(object.payment_intent);
        if (!intentID && object.object !== "charge") {
            const chargeID = stripeID(object.charge);
            if (chargeID) intentID = stripeID((await provider.stripe.charges.retrieve(chargeID)).payment_intent);
        }
        if (!intentID) return null;
        const intent = await provider.stripe.paymentIntents.retrieve(intentID);
        if (intent.livemode !== provider.livemode) return null;
        orderID = markedOrder(intent.metadata);
    }
    if (!orderID || !intentID) return null;
    const found = await provider.stripe.checkout.sessions.list({ payment_intent: intentID, limit: 2 });
    const matching = found.data.filter(session => markedOrder(session.metadata) === orderID &&
        stripeID(session.payment_intent) === intentID && session.livemode === provider.livemode);
    if (found.has_more || matching.length !== 1 || !stripeSessionPattern.test(matching[0].id)) throw new CommerceError("UNAVAILABLE");
    return { orderID, sessionID: matching[0].id, reference, amount };
}

export async function processCourseEvent(payload: Payload, provider: CourseStripe, event: Stripe.Event) {
    if (event.livemode !== provider.livemode || (event.account && event.account !== provider.account)) return;
    const recorded = await authTransaction(payload, ({ tx }) => tx.execute(sql`
        SELECT 1 FROM course_payment_events WHERE stripe_account = ${provider.account}
            AND livemode = ${provider.livemode} AND stripe_event_id = ${event.id}
    `));
    if (recorded.rows.length) return;
    const located = await locateEvent(provider, event);
    if (!located) return;
    const snapshot: ProviderEvent = { id: event.id, type: event.type, reference: located.reference, amount: located.amount };
    const result = await reconcileOrder(payload, provider, located.orderID, { sessionID: located.sessionID, event: snapshot });
    if (!result) throw new CommerceError("UNAVAILABLE");
}
