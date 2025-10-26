"use client";

const CONSENT_COOKIE = "barhoum_consent";
const CONSENT_ACCEPTED = "accepted";
const CONSENT_REJECTED = "rejected";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 12 months
const CONSENT_EVENT_NAME = "barhoum-consent-changed";
const CONSENT_OPEN_EVENT_NAME = "barhoum-open-consent";

type ConsentValue = typeof CONSENT_ACCEPTED | typeof CONSENT_REJECTED;

function isConsentDisabled(): boolean {
    return process.env.NEXT_PUBLIC_DISABLE_CONSENT === "true";
}

function getCookieValue(rawCookie: string, key: string): string | null {
    const cookies = rawCookie.split("; ");
    for (const entry of cookies) {
        const [cookieKey, ...valueParts] = entry.split("=");
        if (cookieKey === key) {
            return valueParts.join("=") ?? "";
        }
    }
    return null;
}

function readConsentFromDocument(): ConsentValue | null {
    if (typeof document === "undefined") {
        return null;
    }
    const value = getCookieValue(document.cookie, CONSENT_COOKIE);
    if (value === CONSENT_ACCEPTED || value === CONSENT_REJECTED) {
        return value;
    }
    return null;
}

export function getAnalyticsConsent(): ConsentValue | null {
    if (isConsentDisabled()) {
        return CONSENT_ACCEPTED;
    }
    return readConsentFromDocument();
}

export function hasAnalyticsConsent(): boolean {
    if (isConsentDisabled()) {
        return true;
    }
    return readConsentFromDocument() === CONSENT_ACCEPTED;
}

export function setAnalyticsConsent(value: ConsentValue): void {
    if (typeof document === "undefined") {
        return;
    }

    const expires = new Date(Date.now() + CONSENT_MAX_AGE_SECONDS * 1000);
    const baseParts = [
        `${CONSENT_COOKIE}=${value}`,
        "path=/",
        `max-age=${CONSENT_MAX_AGE_SECONDS}`,
        "SameSite=Lax",
    ];

    if (typeof window !== "undefined") {
        const isSecureContext =
            window.location.protocol === "https:" ||
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";
        if (isSecureContext) {
            baseParts.push("Secure");
        }
    }

    baseParts.push(`expires=${expires.toUTCString()}`);

    document.cookie = baseParts.join("; ");

    if (typeof document !== "undefined") {
        document.dispatchEvent(
            new CustomEvent(CONSENT_EVENT_NAME, { detail: { value } })
        );
    }
}

export function onConsentChange(
    handler: (value: ConsentValue) => void
): () => void {
    if (typeof document === "undefined") {
        return () => {};
    }
    const wrappedHandler = (event: Event) => {
        const customEvent = event as CustomEvent<{ value: ConsentValue }>;
        const consentValue = customEvent.detail?.value;
        if (consentValue === CONSENT_ACCEPTED || consentValue === CONSENT_REJECTED) {
            handler(consentValue);
        }
    };
    document.addEventListener(CONSENT_EVENT_NAME, wrappedHandler);
    return () => document.removeEventListener(CONSENT_EVENT_NAME, wrappedHandler);
}

export function triggerConsentPreferences(): void {
    if (typeof document === "undefined") {
        return;
    }
    document.dispatchEvent(new Event(CONSENT_OPEN_EVENT_NAME));
}

export function onConsentPreferencesRequested(handler: () => void): () => void {
    if (typeof document === "undefined") {
        return () => {};
    }
    document.addEventListener(CONSENT_OPEN_EVENT_NAME, handler);
    return () => document.removeEventListener(CONSENT_OPEN_EVENT_NAME, handler);
}

export type { ConsentValue };
export const CONSENT_EVENTS = {
    change: CONSENT_EVENT_NAME,
    open: CONSENT_OPEN_EVENT_NAME,
    accepted: CONSENT_ACCEPTED,
    rejected: CONSENT_REJECTED,
} as const;
