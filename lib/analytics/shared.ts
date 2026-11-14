const analyticsEventNames = [
    "cookie_consent_given",
    "cookie_consent_rejected",
    "page_view",
    "ai_brief_view",
    "scroll_25",
    "video_started",
    "video_played",
    "video_completed",
    "section_engaged",
    "scroll_50",
    "audio_played",
    "audio_completed",
    "category_view",
    "package_click",
    "form_opened",
    "form_started",
    "form_step_changed",
    "form_error",
    "form_retry",
    "form_submitted",
    "form_submitted_with_payment",
    "whatsapp_sent",
    "whatsapp_failed",
    "telegram_sent",
    "telegram_failed",
    "form_completed",
    "scroll_75",
    "social_link_clicked",
    "scroll_100",
    "locale_switch",
    "pdf_download",
    "stripe_link_generated",
    "pay_page_view",
    "payment_completed",
    "course_detail_viewed",
    "course_free_preview_opened",
    "course_checkout_started",
    "course_first_lesson_opened",
] as const;

export type AnalyticsEventName = typeof analyticsEventNames[number];

const posthogEventNames = new Set<string>([
    ...analyticsEventNames, "$pageview", "$web_vitals",
]);

export function isAllowedPosthogEvent(name: string): boolean {
    return posthogEventNames.has(name);
}

export type AnalyticsPrimitive = string | number | boolean;

export type AnalyticsEventPayload = Record<
    string,
    AnalyticsPrimitive | undefined
>;

export type SharedAnalyticsContext = {
    locale: string;
    device_type: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    category: string;
    program_name: string;
    form_country?: string;
    referrer: string;
    page_path?: string;
    page_location?: string;
    page_title?: string;
    debug_mode?: boolean;
};

export const ANALYTICS_DEFAULTS: SharedAnalyticsContext = {
    locale: "unknown",
    device_type: "unknown",
    utm_source: "direct",
    utm_medium: "direct",
    utm_campaign: "none",
    category: "none",
    program_name: "none",
    form_country: undefined,
    referrer: "direct",
    page_path: undefined,
    page_location: undefined,
    page_title: undefined,
    debug_mode:
        typeof window !== "undefined"
            ? process.env.NODE_ENV !== "production"
            : undefined,
};

const siteOrigins = new Set([
    "https://ibrahimbenabdallah.com",
    "https://www.ibrahimbenabdallah.com",
]);

const publicPaths = new Set(["/", "/ai-brief", "/privacy", "/terms", "/courses"]);
const detailPath = "/courses/[courseSlug]";
const lessonPath = detailPath + "/lessons/[lessonId]";

export function analyticsPath(path: string): string | undefined {
    const pathname = path.split(/[?#]/, 1)[0].replace(/\/$/, "") || "/";
    if (publicPaths.has(pathname)) return pathname;
    if (/^\/courses\/[^/]+\/lessons\/[^/]+$/.test(pathname)) return lessonPath;
    if (/^\/courses\/[^/]+$/.test(pathname)) return detailPath;
}

export function analyticsLocation(value: string): string | undefined {
    try {
        const url = new URL(value);
        if (!siteOrigins.has(url.origin)) return;
        const pathname = analyticsPath(url.pathname);
        if (pathname) return url.origin + pathname;
    } catch {
        // Invalid URLs carry no analytics location.
    }
}

// Vercel's hook can replace the page URL, but cannot replace the browser's
// automatic referrer. Drop pageviews whose referrer cannot be sent as-is.
export function analyticsVercelLocation(value: string, referrer: string): string | undefined {
    if (referrer) {
        try {
            const url = new URL(referrer);
            if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash ||
                (siteOrigins.has(url.origin) ? analyticsPath(url.pathname) !== url.pathname : url.pathname !== "/")) return;
        } catch {
            return;
        }
    }
    return analyticsLocation(value);
}

const numericFields = new Set([
    "amount", "duration", "duration_seconds", "from_step", "position_seconds",
    "sessions", "status", "step", "to_step", "value",
]);
const booleanFields = new Set(["duplicate"]);
const dimensions: Record<string, readonly string[]> = {
    action: ["select", "continue"],
    context: ["lead", "payment"],
    device_type: ["desktop", "mobile", "tablet", "unknown"],
    direction: ["next", "back"],
    locale: ["en", "ar", "fr", "unknown"],
    metric_name: ["CLS", "FCP", "FID", "INP", "LCP", "TTFB"],
    metric_rating: ["good", "needs-improvement", "poor"],
    offer_category: ["base", "premium_module"],
    platform: ["instagram", "youtube"],
    source: ["banner", "native", "vimeo", "youtube"],
    template: ["template", "text"],
};

export function sanitizeAnalyticsParams(
    input: Record<string, unknown>
): Record<string, AnalyticsPrimitive> {
    const output: Record<string, AnalyticsPrimitive> = {};
    for (const [key, value] of Object.entries(input)) {
        if (numericFields.has(key) && typeof value === "number" && Number.isFinite(value)) {
            output[key] = value;
        } else if (booleanFields.has(key) && typeof value === "boolean") {
            output[key] = value;
        } else if (typeof value === "string") {
            if (Object.hasOwn(dimensions, key) && dimensions[key].includes(value)) output[key] = value;
            if (key === "currency" && /^[a-z]{3}$/i.test(value)) output[key] = value;
            // Public, published course slug supplied by the course view, never read from a query.
            if (key === "course_key" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80) output[key] = value;
            const path = key === "page_path" ? analyticsPath(value)
                : key === "page_location" ? analyticsLocation(value) : undefined;
            if (path) output[key] = path;
        }
    }
    return output;
}
