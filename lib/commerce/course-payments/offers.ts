import "server-only";

import { cache } from "react";
import type { CourseCommerce } from "../../../components/commerce/checkout";
import { getCourseOwnership } from "../../learning/entitlements";
import { authTransaction, studentPayload } from "../../student-auth/core";
import { checkoutEnabled } from "./core";
import type { purchaseAvailability } from "./eligibility";
import { readOffers } from "./orders";
import { courseStripe, readStripePrice } from "./stripe";

const getOffers = cache(async (courseId: number) => {
    if (!checkoutEnabled() || !Number.isInteger(courseId) || courseId <= 0) return [];
    const payload = await studentPayload();
    return authTransaction(payload, context => readOffers(context, { courseId }));
});

async function listComingSoonOffers(courseId: number, baseOnly: boolean) {
    try {
        return (await getOffers(courseId)).filter(({ module_id }) => !baseOnly || module_id === null).map(({ module_id }) => module_id);
    } catch {
        return [];
    }
}

const stripePrice = cache(readStripePrice);

const listCourseOffers = cache(async (courseId: number, baseOnly: boolean) => {
    try {
        const offers = (await getOffers(courseId)).filter(({ module_id }) => !baseOnly || module_id === null);
        if (!offers.length) return [];
        const provider = await courseStripe();
        const results = await Promise.allSettled(offers.map(async offer => ({
            id: offer.id, moduleId: offer.module_id, ...await stripePrice(provider, offer.stripe_price_id),
        })));
        return results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
    } catch {
        return [];
    }
});

export async function readCourseCommerce(
    courseId: number,
    studentId: number | undefined,
    availability: ReturnType<typeof purchaseAvailability>,
    scope: "catalog" | "detail" = "detail",
): Promise<CourseCommerce> {
    const baseOnly = scope === "catalog";
    const [offers, comingSoonOffers, ownership] = await Promise.all([
        availability === "available" ? listCourseOffers(courseId, baseOnly) : [],
        availability === "coming-soon" ? listComingSoonOffers(courseId, baseOnly) : [],
        getCourseOwnership(studentId, courseId),
    ]);
    return { offers, comingSoonOffers, ownership, signedIn: studentId !== undefined };
}
