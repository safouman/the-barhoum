import "server-only";

import { cache } from "react";
import { authTransaction, studentPayload } from "../../student-auth/core";
import { checkoutEnabled } from "./core";
import { readOffers } from "./orders";
import { courseStripe, readStripePrice } from "./stripe";

export const listCourseOffers = cache(async (courseId: number) => {
    if (!checkoutEnabled() || !Number.isInteger(courseId) || courseId <= 0) return [];
    try {
        const payload = await studentPayload();
        const offers = await authTransaction(payload, context => readOffers(context, { courseId }));
        if (!offers.length) return [];
        const provider = await courseStripe();
        const results = await Promise.allSettled(offers.map(async offer => ({
            id: offer.id, moduleId: offer.module_id, ...await readStripePrice(provider, offer.stripe_price_id),
        })));
        return results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
    } catch {
        return [];
    }
});
