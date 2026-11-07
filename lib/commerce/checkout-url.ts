const checkoutOrigins = new Set([
    "https://checkout.stripe.com",
    "https://pay.whispered.life",
]);

export function trustedCheckoutURL(value: unknown): string | null {
    if (typeof value !== "string") return null;
    try {
        const url = new URL(value);
        return checkoutOrigins.has(url.origin) && !url.username && !url.password ? url.href : null;
    } catch {
        return null;
    }
}
