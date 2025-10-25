import type { AnalyticsEventName, AnalyticsEventPayload, SharedAnalyticsContext } from "@/lib/analytics/shared";
import { ANALYTICS_DEFAULTS, sanitizeAnalyticsParams } from "@/lib/analytics/shared";

type ServerEventOptions = {
  clientId?: string;
  userId?: string;
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
  options: ServerEventOptions
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
    user_id?: string;
    events: Array<{ name: AnalyticsEventName; params: AnalyticsEventPayload }>;
  } = {
    client_id: options.clientId ?? `server-${Date.now()}`,
    events: [
      {
        name,
        params: mergedParams,
      },
    ],
  };

  if (options.userId) {
    payload.user_id = options.userId;
  }

  return payload;
}

export async function trackServerEvent(
  name: AnalyticsEventName,
  params: AnalyticsEventPayload = {},
  context: Partial<SharedAnalyticsContext> = {},
  options: ServerEventOptions = {}
) {
  if (!ANALYTICS_ENDPOINT) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[analytics-server] skipped event",
        name,
        "(missing GA4 credentials)"
      );
    }
    return;
  }

  try {
    const payload = buildPayload(name, params, context, options);
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[analytics-server] failed", {
        status: response.status,
        body,
        event: name,
      });
    } else if (process.env.NODE_ENV !== "production") {
      console.info("[analytics-server]", name, payload.events[0].params);
    }
  } catch (error) {
    console.error("[analytics-server] error dispatching event", {
      name,
      error: error instanceof Error ? error.message : String(error),
    });
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
    | "video_play"
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
