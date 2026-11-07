import "server-only";

import { checkoutEnabled } from "./core";

export function purchaseAvailability(headers: Pick<Headers, "get">) {
    if (!checkoutEnabled()) return "unavailable";

    const hosted = process.env.VERCEL === "1";
    const local = !hosted && process.env.VERCEL_ENV === undefined;
    const testMode = process.env.COURSE_STRIPE_LIVEMODE === "false";
    const restriction = process.env.COURSE_COMMERCE_GEO_RESTRICTION;
    const testOverride = local && restriction === undefined ||
        (local || (hosted && process.env.VERCEL_ENV === "preview")) && restriction === "false";
    if (testMode && testOverride) return "available";
    // Trust Vercel's IP-derived header only in a hosted Vercel environment.
    const country = hosted ? headers.get("x-vercel-ip-country") : null;
    if (country === "TN") return "coming-soon";
    if (!country || !/^[A-Z]{2}$/.test(country) || country === "XX") return "unavailable";
    return "available";
}
