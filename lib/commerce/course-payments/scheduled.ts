import "server-only";

import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { authTransaction } from "../../student-auth/core";
import { stripeSessionPattern } from "./core";
import { courseStripeMarker } from "./marker";
import type { OrderStatus } from "./orders";
import { PaidAccessPending, reconcileOrder } from "./reconcile";
import type { CourseStripe } from "./stripe";

const maxOrders = 12;
const concurrency = 3;
const startBudgetMs = 25_000;
const hour = 60 * 60 * 1000;
const sessionPageSize = 25;

type Claim = {
    id: string;
    status: OrderStatus;
    reason: string | null;
    created_at: Date | string;
    stripe_session_id: string | null;
    ops_session_cursor: string | null;
    ops_failures: number;
};

export type ReconciliationSummary = {
    checked: number;
    paidRecovered: number;
    reversalsObserved: number;
    paidPending: number;
    stalePending: number;
    failed: number;
    repeatedFailures: number;
    manualReview: number;
    backlog: boolean;
};

const eligible = sql`status IN ('creating', 'open', 'processing', 'fulfilled', 'support_required')`;
const reversalLane = sql`status = 'fulfilled' OR COALESCE(reason IN ('dispute_open', 'duplicate_payment'), false)`;

async function claimOrders(payload: Payload, provider: CourseStripe, lease: string, historic: boolean, limit: number) {
    return authTransaction(payload, async ({ tx }) => {
        const result = await tx.execute(sql`
            WITH due AS (
                SELECT id FROM course_orders
                WHERE stripe_account = ${provider.account} AND livemode = ${provider.livemode}
                    AND ${eligible} AND (${reversalLane}) = ${historic} AND ops_next_check_at <= now()
                    AND (ops_lease_until IS NULL OR ops_lease_until <= now())
                ORDER BY ops_next_check_at, id
                LIMIT ${limit} FOR UPDATE SKIP LOCKED
            )
            UPDATE course_orders o
            SET ops_lease_until = now() + interval '2 minutes', ops_lease_token = ${lease}::uuid
            FROM due WHERE o.id = due.id
            RETURNING o.id, o.status, o.reason, o.created_at, o.stripe_session_id, o.ops_session_cursor, o.ops_failures
        `);
        return result.rows as Claim[];
    });
}

type Schedule = { delay: number; cursor?: string | null; failed?: boolean; ambiguous?: boolean };

async function finishClaim(payload: Payload, order: Claim, lease: string, schedule: Schedule) {
    await authTransaction(payload, async ({ tx }) => {
        const markAmbiguous = sql`${Boolean(schedule.ambiguous)} AND stripe_session_id IS NULL AND status = 'creating'`;
        // A simultaneous checkout response or webhook may have recovered the order.
        await tx.execute(sql`
            UPDATE course_orders
            SET status = CASE WHEN ${markAmbiguous} THEN 'support_required' ELSE status END,
                reason = CASE WHEN ${markAmbiguous} THEN 'ambiguous_checkout' ELSE reason END,
                updated_at = CASE WHEN ${markAmbiguous} THEN now() ELSE updated_at END,
                ops_next_check_at = now() + ${schedule.delay} * interval '1 millisecond',
                ops_lease_until = NULL, ops_lease_token = NULL,
                ops_failures = ${schedule.failed ? order.ops_failures + 1 : 0},
                ops_session_cursor = ${schedule.cursor === undefined ? sql`ops_session_cursor` : schedule.cursor}
            WHERE id = ${order.id}::uuid AND ops_lease_token = ${lease}::uuid
        `);
    });
}

async function discoverSession(provider: CourseStripe, order: Claim, createdAt: number) {
    // Search a closed interval so new traffic cannot shift the page boundaries.
    // Checkout only creates/retries within 23 hours of reservation.
    const sessions = await provider.stripe.checkout.sessions.list({
        created: { gte: Math.floor(createdAt / 1000) - 60, lte: Math.ceil((createdAt + 24 * hour) / 1000) },
        limit: sessionPageSize,
        starting_after: order.ops_session_cursor ?? undefined,
    });
    const match = sessions.data.find(session =>
        stripeSessionPattern.test(session.id) && session.livemode === provider.livemode &&
        session.client_reference_id === order.id && session.metadata?.barhoum_order_id === order.id &&
        session.metadata.barhoum_source === courseStripeMarker);
    if (match) return { sessionID: match.id };
    if (!sessions.has_more) return {};
    const cursor = sessions.data.at(-1)?.id;
    if (!cursor || cursor === order.ops_session_cursor || !stripeSessionPattern.test(cursor)) {
        throw new Error("Invalid checkout session page");
    }
    return { cursor };
}

async function inspectOrder(payload: Payload, provider: CourseStripe, order: Claim, lease: string, summary: ReconciliationSummary) {
    summary.checked++;
    try {
        let sessionID = order.stripe_session_id ?? undefined;
        if (!sessionID) {
            const createdAt = new Date(order.created_at).getTime();
            const remaining = createdAt + 24 * hour - Date.now();
            if (remaining > 0) {
                await finishClaim(payload, order, lease, { delay: remaining });
                return;
            }
            const discovered = await discoverSession(provider, order, createdAt);
            sessionID = discovered.sessionID;
            if (!sessionID) {
                if (!discovered.cursor) summary.manualReview++;
                await finishClaim(payload, order, lease, {
                    delay: discovered.cursor ? hour : 7 * 24 * hour,
                    cursor: discovered.cursor ?? null,
                    ambiguous: !discovered.cursor,
                });
                return;
            }
        }
        const result = await reconcileOrder(payload, provider, order.id, { sessionID, maxAttempts: 1 });
        if (!result) throw new Error("Order unavailable");
        if (result.status === "fulfilled" && ["creating", "open", "processing"].includes(order.status)) summary.paidRecovered++;
        if (result.reason !== order.reason && ["partial_refund", "full_refund", "dispute_open", "dispute_lost"].includes(result.reason ?? "")) {
            summary.reversalsObserved++;
        }
        if (result.status === "support_required" && result.reason !== "dispute_open") summary.manualReview++;
        if (result.status === "processing" && Date.now() - new Date(order.created_at).getTime() >= 24 * hour) summary.stalePending++;
        await finishClaim(payload, order, lease, { delay: result.status === "processing" ? hour : 20 * hour, cursor: null });
    } catch (error) {
        summary.failed++;
        if (order.ops_failures >= 2) summary.repeatedFailures++;
        if (error instanceof PaidAccessPending) summary.paidPending++;
        const delay = Math.min(24, 2 ** Math.min(order.ops_failures, 5)) * hour;
        await finishClaim(payload, order, lease, { delay, failed: true });
    }
}

export async function runScheduledReconciliation(payload: Payload, provider: CourseStripe, startedAt: number) {
    const summary: ReconciliationSummary = {
        checked: 0, paidRecovered: 0, reversalsObserved: 0, paidPending: 0, stalePending: 0, failed: 0,
        repeatedFailures: 0, manualReview: 0, backlog: false,
    };

    for (let batch = 0; batch < maxOrders / concurrency && Date.now() - startedAt < startBudgetMs; batch++) {
        const lease = randomUUID();
        // Give recovery the first batch and interleave historical scans so a
        // backlog of either kind cannot consume the other's whole run.
        const historic = batch % 2 === 1;
        const orders = await claimOrders(payload, provider, lease, historic, concurrency);
        if (orders.length < concurrency) {
            orders.push(...await claimOrders(payload, provider, lease, !historic, concurrency - orders.length));
        }
        if (!orders.length) break;
        const attempts = await Promise.allSettled(orders.map(order => inspectOrder(payload, provider, order, lease, summary)));
        if (attempts.some(attempt => attempt.status === "rejected")) {
            // The unfinished leases will expire and become eligible again.
            throw new Error("Unable to persist course reconciliation progress");
        }
    }

    summary.backlog = await authTransaction(payload, async ({ tx }) => {
        const due = await tx.execute(sql`
            SELECT 1 FROM course_orders WHERE stripe_account = ${provider.account} AND livemode = ${provider.livemode}
                AND ${eligible} AND ops_next_check_at <= now()
                AND (ops_lease_until IS NULL OR ops_lease_until <= now()) LIMIT 1
        `);
        return due.rows.length > 0;
    });
    return summary;
}
