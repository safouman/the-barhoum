import type { NextRequest } from "next/server";
import { z } from "zod";
import { studentPayload } from "../../../../lib/student-auth/core";
import { CommerceError, commerceFailure, commerceJSON, orderIdPattern, readCommerceJSON, stripeSessionPattern } from "../../../../lib/commerce/course-payments/core";
import { orderStatus } from "../../../../lib/commerce/course-payments/orders";
import { reconcileOrder } from "../../../../lib/commerce/course-payments/reconcile";
import { courseStripe } from "../../../../lib/commerce/course-payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const input = z.object({ orderId: z.string().regex(orderIdPattern), stripeSessionId: z.string().regex(stripeSessionPattern).optional() }).strict();

export async function POST(request: NextRequest) {
    try {
        const parsed = input.safeParse(await readCommerceJSON(request));
        if (!parsed.success) throw new CommerceError("INVALID_INPUT");
        const payload = await studentPayload();
        const { user } = await payload.auth({ headers: request.headers });
        if (user?.collection !== "admins") throw new CommerceError("UNAUTHENTICATED");
        const order = await reconcileOrder(payload, await courseStripe(), parsed.data.orderId, { sessionID: parsed.data.stripeSessionId });
        if (!order) throw new CommerceError("NOT_FOUND");
        return commerceJSON(orderStatus(order));
    } catch (error) {
        return commerceFailure(error);
    }
}
