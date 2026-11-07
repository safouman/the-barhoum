import "server-only";

import type { ReconciliationSummary } from "./scheduled";

const address = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const alertText = [
    "Course commerce reported payment or refund recovery, a backlog, or an issue that needs operator review.",
    "Open the current environment's Vercel Runtime Logs. Filter for course_commerce_reconciliation or course_commerce_webhook_processing_failed, then follow the Barhoum commerce operations runbook.",
    "Review the corresponding course webhook destination and payment records in the correct Stripe environment.",
].join("\n\n");

export async function notifyCommerceOperator(summary: ReconciliationSummary | null) {
    const to = process.env.COURSE_COMMERCE_ALERT_TO;
    const from = process.env.STUDENT_AUTH_FROM_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    if (!to || !address.test(to) || !from || !address.test(from) || !apiKey) return "unconfigured";

    if (summary && !summary.paidRecovered && !summary.reversalsObserved && !summary.paidPending &&
        !summary.stalePending && !summary.repeatedFailures && !summary.manualReview && !summary.backlog) return "not_needed";

    // Constant body and daily key make simultaneous invocations and retries safe.
    const environment = process.env.VERCEL_ENV ?? "development";
    const date = new Date().toISOString().slice(0, 10);
    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `barhoum-commerce-ops/${environment}/${date}`,
            },
            body: JSON.stringify({
                from, to: [to], subject: `Barhoum commerce review (${environment})`, text: alertText,
            }),
            signal: AbortSignal.timeout(5_000),
            cache: "no-store",
        });
        return response.ok ? "accepted" : "failed";
    } catch {
        return "failed";
    }
}
