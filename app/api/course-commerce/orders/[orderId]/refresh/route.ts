import type { NextRequest } from "next/server";
import { authTransaction, rateLimit, studentPayload } from "../../../../../../lib/student-auth/core";
import { requestStudent } from "../../../../../../lib/student-auth/session";
import { CommerceError, commerceFailure, commerceJSON, orderIdPattern, requireCommerceOrigin } from "../../../../../../lib/commerce/course-payments/core";
import { findOrder, orderStatus } from "../../../../../../lib/commerce/course-payments/orders";
import { PaidAccessPending, reconcileOrder } from "../../../../../../lib/commerce/course-payments/reconcile";
import { courseStripe } from "../../../../../../lib/commerce/course-payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext<"/api/course-commerce/orders/[orderId]/refresh">) {
    try {
        requireCommerceOrigin(request);
        const { orderId } = await context.params;
        if (!orderIdPattern.test(orderId)) throw new CommerceError("NOT_FOUND");
        const payload = await studentPayload();
        const identity = await requestStudent(payload, request);
        if (!identity?.user._verified) throw new CommerceError("UNAUTHENTICATED");
        const order = await authTransaction(payload, tx => findOrder(tx, orderId, identity.user.id));
        if (!order) throw new CommerceError("NOT_FOUND");
        await rateLimit(payload, request, "course-order-refresh", String(identity.user.id), [8, 50], 5);
        if (!order.stripe_session_id) return commerceJSON(orderStatus(order));
        try {
            const current = await reconcileOrder(payload, await courseStripe(), order.id);
            if (!current) throw new CommerceError("UNAVAILABLE");
            return commerceJSON(orderStatus(current));
        } catch (error) {
            if (!(error instanceof PaidAccessPending) || !["creating", "open", "processing"].includes(order.status)) throw error;
            return commerceJSON({ ...orderStatus(order), status: "processing", paymentConfirmed: true });
        }
    } catch (error) {
        return commerceFailure(error);
    }
}
