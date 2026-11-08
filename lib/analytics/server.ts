import { randomUUID } from "node:crypto";
import type { AnalyticsEventName, AnalyticsEventPayload, SharedAnalyticsContext } from "@/lib/analytics/shared";
import { ANALYTICS_DEFAULTS, sanitizeAnalyticsParams } from "@/lib/analytics/shared";

type ServerEventOptions = {
  clientId?: string;
  userId?: string;
  analyticsConsent?: boolean;
};

const GA4_MEASUREMENT_ID =
  process.env.GA4_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
  "";
const GA4_API_SECRET = process.env.GA4_API_SECRET || "";

const ANALYTICS_ENDPOINT =
  GA4_MEASUREMENT_ID && GA4_API_SECRET
    ? `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
        GA4_MEASUREMENT_ID
      )}&api_secret=${encodeURIComponent(GA4_API_SECRET)}`
    : null;

const SERVER_DEFAULTS: SharedAnalyticsContext = {
  ...ANALYTICS_DEFAULTS,
  referrer: "server",
};

function buildPayload(
  name: AnalyticsEventName,
  params: AnalyticsEventPayload,
  context: Partial<SharedAnalyticsContext>,
) {
  const mergedContext = {
    ...SERVER_DEFAULTS,
    ...sanitizeAnalyticsParams(context as Record<string, unknown>),
  };

  const mergedParams = {
    ...mergedContext,
    ...sanitizeAnalyticsParams(params as Record<string, unknown>),
    debug_mode: process.env.NODE_ENV !== "production",
  };

  const payload: {
    client_id: string;
    events: Array<{ name: AnalyticsEventName; params: AnalyticsEventPayload }>;
  } = {
    client_id: randomUUID(),
    events: [
      {
        name,
        params: mergedParams,
      },
    ],
  };

  return payload;
}

export async function trackServerEvent(
  name: AnalyticsEventName,
  params: AnalyticsEventPayload = {},
  context: Partial<SharedAnalyticsContext> = {},
  options: ServerEventOptions = {}
) {
  // Webhooks and notification jobs have no browser consent. A consented
  // caller must opt in explicitly, and test environments never send events.
  if (!ANALYTICS_ENDPOINT || process.env.VERCEL_ENV !== "production" || options.analyticsConsent !== true) return;

  try {
    const payload = buildPayload(name, params, context);
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[analytics-server] delivery failed", { status: response.status, event: name });
    }
  } catch {
    console.error("[analytics-server] delivery failed", { event: name });
  }
}

export async function trackAutomationEvent(
  name: Exclude<
    AnalyticsEventName,
    | "page_view"
    | "scroll_25"
    | "scroll_50"
    | "scroll_75"
    | "scroll_100"
    | "section_engaged"
    | "audio_played"
    | "audio_completed"
    | "social_link_clicked"
    | "video_started"
    | "video_played"
    | "video_completed"
    | "pdf_download"
    | "category_view"
    | "package_click"
    | "pay_page_view"
  >,
  params: AnalyticsEventPayload = {},
  context: Partial<SharedAnalyticsContext> = {},
  options: ServerEventOptions = {}
) {
  await trackServerEvent(name, params, context, options);
}
