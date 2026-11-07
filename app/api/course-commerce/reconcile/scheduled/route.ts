import { createHash, timingSafeEqual } from "node:crypto";
import { studentPayload } from "@/lib/student-auth/core";
import { notifyCommerceOperator } from "@/lib/commerce/course-payments/alerts";
import { CommerceError, commerceFailure, commerceJSON } from "@/lib/commerce/course-payments/core";
import { runScheduledReconciliation, type ReconciliationSummary } from "@/lib/commerce/course-payments/scheduled";
import { courseStripe } from "@/lib/commerce/course-payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function machineAuthorized(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || secret.length < 16) return false;
    const supplied = request.headers.get("authorization");
    const digest = (value: string) => createHash("sha256").update(value).digest();
    return supplied !== null && timingSafeEqual(digest(supplied), digest(`Bearer ${secret}`));
}

export async function GET(request: Request) {
    if (!machineAuthorized(request)) return commerceFailure(new CommerceError("UNAUTHENTICATED"));

    const startedAt = Date.now();
    let summary: ReconciliationSummary | null = null;
    try {
        const provider = await courseStripe("scheduled");
        summary = await runScheduledReconciliation(await studentPayload(), provider, startedAt);
    } catch {
        // A valid invocation can still fail before the job reaches individual orders.
    }

    const alertDelivery = await notifyCommerceOperator(summary);
    const signal = { event: "course_commerce_reconciliation", alertDelivery, summary };
    if (!summary || summary.failed || summary.paidPending || summary.stalePending || summary.manualReview || summary.backlog || ["failed", "unconfigured"].includes(alertDelivery)) {
        console.warn(signal);
    } else {
        console.info(signal);
    }
    if (!summary || alertDelivery === "failed") return commerceFailure(new CommerceError("UNAVAILABLE"));
    return commerceJSON({ ...summary, alertDelivery });
}
