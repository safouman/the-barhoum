import Stripe from "stripe";
import { after } from "next/server";
import { notifyCommerceOperator } from "@/lib/commerce/course-payments/alerts";
import { studentPayload } from "../../../../lib/student-auth/core";
import { CommerceError, commerceFailure, commerceJSON } from "../../../../lib/commerce/course-payments/core";
import { courseStripe } from "../../../../lib/commerce/course-payments/stripe";
import { handledCourseEvent, processCourseEvent } from "../../../../lib/commerce/course-payments/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    let processingVerifiedEvent = false;
    try {
        const secret = process.env.COURSE_STRIPE_WEBHOOK_SECRET;
        if (!secret || !secret.startsWith("whsec_")) throw new CommerceError("UNAVAILABLE");
        const signature = request.headers.get("stripe-signature");
        if (!signature) throw new CommerceError("INVALID_INPUT");
        let event: Stripe.Event;
        try {
            event = Stripe.webhooks.constructEvent(await request.text(), signature, secret);
        } catch {
            throw new CommerceError("INVALID_INPUT");
        }
        if (!handledCourseEvent(event)) return commerceJSON({ ok: true });
        processingVerifiedEvent = true;
        const provider = await courseStripe();
        if (event.livemode !== provider.livemode || (event.account && event.account !== provider.account)) return commerceJSON({ ok: true });
        await processCourseEvent(await studentPayload(), provider, event);
        return commerceJSON({ ok: true });
    } catch (error) {
        if (processingVerifiedEvent) {
            console.warn({ event: "course_commerce_webhook_processing_failed" });
            after(async () => {
                const alertDelivery = await notifyCommerceOperator(null);
                console.info({ event: "course_commerce_webhook_alert", alertDelivery });
            });
        }
        return commerceFailure(error);
    }
}
