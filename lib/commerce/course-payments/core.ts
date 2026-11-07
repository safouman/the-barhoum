import "server-only";

import { AuthError } from "../../student-auth/core";

const errors = {
    UNAUTHENTICATED: [401, "Sign in to continue."],
    INVALID_INPUT: [400, "Check the information and try again."],
    NOT_FOUND: [404, "Order not found."],
    OFFER_UNAVAILABLE: [409, "This offer is unavailable."],
    GEOGRAPHIC_RESTRICTION: [403, "Course purchases are coming soon in your location."],
    ALREADY_OWNED: [409, "You already have access to this offer."],
    BASE_REQUIRED: [409, "Buy the base course before purchasing this upgrade."],
    RATE_LIMITED: [429, "Too many requests. Try again later."],
    UNAVAILABLE: [503, "Course checkout is temporarily unavailable."],
} as const;

export class CommerceError extends Error {
    constructor(readonly code: keyof typeof errors) { super(errors[code][1]); }
    get status() { return errors[this.code][0]; }
}

export const orderIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const priceIdPattern = /^price_[A-Za-z0-9]{1,100}$/;
export const stripeSessionPattern = /^cs_(?:live|test)_[A-Za-z0-9]{1,150}$/;
export const checkoutEnabled = () => process.env.COURSE_COMMERCE_ENABLED === "true";
export const privateHeaders = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };

export function commerceOrigin() {
    const value = process.env.COURSE_COMMERCE_ORIGIN;
    try {
        const origin = new URL(value ?? "");
        const local = !process.env.VERCEL && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
        if (value === origin.origin && (origin.protocol === "https:" || (local && origin.protocol === "http:"))) return origin;
    } catch {
        // Configuration errors never reveal the submitted value.
    }
    throw new CommerceError("UNAVAILABLE");
}

export function commerceJSON(data: unknown, status = 200) {
    return Response.json(data, { status, headers: privateHeaders });
}

export function commerceFailure(error: unknown) {
    const safe = error instanceof CommerceError
        ? error
        : new CommerceError(error instanceof AuthError && (error.code === "RATE_LIMITED" || error.code === "UNAUTHENTICATED") ? error.code : "UNAVAILABLE");
    return commerceJSON({ error: { code: safe.code, message: safe.message } }, safe.status);
}

export function requireCommerceOrigin(request: Request) {
    if (request.headers.get("origin") !== commerceOrigin().origin ||
        request.headers.get("sec-fetch-site") === "cross-site") throw new CommerceError("INVALID_INPUT");
}

export async function readCommerceJSON(request: Request): Promise<unknown> {
    requireCommerceOrigin(request);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json" ||
        !request.body) throw new CommerceError("INVALID_INPUT");
    const reader = request.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let size = 0;
    let text = "";
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 2048) {
                await reader.cancel();
                throw new CommerceError("INVALID_INPUT");
            }
            text += decoder.decode(value, { stream: true });
        }
        return JSON.parse(text + decoder.decode()) as unknown;
    } catch {
        throw new CommerceError("INVALID_INPUT");
    } finally {
        reader.releaseLock();
    }
}
