import type { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit, studentPayload } from "../../../../lib/student-auth/core";
import { requestStudent } from "../../../../lib/student-auth/session";
import { createCheckout } from "../../../../lib/commerce/course-payments/checkout";
import { CommerceError, commerceFailure, commerceJSON, readCommerceJSON } from "../../../../lib/commerce/course-payments/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const input = z.object({ offerId: z.number().int().positive().max(2147483647) }).strict();

export async function POST(request: NextRequest) {
    try {
        const parsed = input.safeParse(await readCommerceJSON(request));
        if (!parsed.success) throw new CommerceError("INVALID_INPUT");
        const payload = await studentPayload();
        const identity = await requestStudent(payload, request);
        if (!identity?.user._verified) throw new CommerceError("UNAUTHENTICATED");
        await rateLimit(payload, request, "course-checkout", String(identity.user.id), [15, 75], 5);
        return commerceJSON(await createCheckout(payload, identity, parsed.data.offerId));
    } catch (error) {
        return commerceFailure(error);
    }
}
