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
    let configured: Awaited<ReturnType<typeof getOffers>>;
    try {
        configured = (await getOffers(courseId)).filter(({ module_id }) => !baseOnly || module_id === null);
    } catch {
        return { offers: [], unavailable: [] };
    }
    if (!configured.length) return { offers: [], unavailable: [] };
    try {
        const provider = await courseStripe();
        const results = await Promise.allSettled(configured.map(async offer => ({
            id: offer.id, moduleId: offer.module_id, ...await stripePrice(provider, offer.stripe_price_id),
        })));
        return {
            offers: results.flatMap(result => result.status === "fulfilled" ? [result.value] : []),
            unavailable: configured.filter((_, index) => results[index].status === "rejected").map(offer => offer.module_id),
        };
    } catch {
        return { offers: [], unavailable: configured.map(offer => offer.module_id) };
    }
});

export async function readCourseCommerce(
    courseId: number,
    studentId: number | undefined,
    availability: ReturnType<typeof purchaseAvailability>,
    scope: "catalog" | "detail" = "detail",
): Promise<CourseCommerce> {
    const baseOnly = scope === "catalog";
    const [{ offers, unavailable }, comingSoonOffers, ownership] = await Promise.all([
        availability === "available" ? listCourseOffers(courseId, baseOnly) : { offers: [], unavailable: [] },
        availability === "coming-soon" ? listComingSoonOffers(courseId, baseOnly) : [],
        getCourseOwnership(studentId, courseId),
    ]);
    return { offers, unavailableOffers: unavailable, comingSoonOffers, ownership, signedIn: studentId !== undefined };
}
