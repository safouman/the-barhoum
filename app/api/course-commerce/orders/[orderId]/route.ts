import type { NextRequest } from "next/server";
import { authTransaction, studentPayload } from "../../../../../lib/student-auth/core";
import { requestStudent } from "../../../../../lib/student-auth/session";
import { CommerceError, commerceFailure, commerceJSON, orderIdPattern } from "../../../../../lib/commerce/course-payments/core";
import { findOrder, orderStatus } from "../../../../../lib/commerce/course-payments/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/course-commerce/orders/[orderId]">) {
    try {
        const { orderId } = await context.params;
        if (!orderIdPattern.test(orderId)) throw new CommerceError("NOT_FOUND");
        const payload = await studentPayload();
        const identity = await requestStudent(payload, request);
        if (!identity?.user._verified) throw new CommerceError("UNAUTHENTICATED");
        const order = await authTransaction(payload, tx => findOrder(tx, orderId, identity.user.id));
        if (!order) throw new CommerceError("NOT_FOUND");
        return commerceJSON(orderStatus(order));
    } catch (error) {
        return commerceFailure(error);
    }
}
