import "server-only";

import { cache } from "react";
import { authTransaction, studentPayload } from "../../student-auth/core";
import { checkoutEnabled } from "./core";
import { readOffers } from "./orders";
import { courseStripe, readStripePrice } from "./stripe";

const getOffers = cache(async (courseId: number) => {
    if (!checkoutEnabled() || !Number.isInteger(courseId) || courseId <= 0) return [];
    const payload = await studentPayload();
    return authTransaction(payload, context => readOffers(context, { courseId }));
});

export async function listComingSoonOffers(courseId: number) {
    try {
        return (await getOffers(courseId)).map(({ module_id }) => module_id);
    } catch {
        return [];
    }
}

export const listCourseOffers = cache(async (courseId: number) => {
    try {
        const offers = await getOffers(courseId);
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
