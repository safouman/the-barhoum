import type { AnalyticsEventName, AnalyticsEventPayload, SharedAnalyticsContext } from "@/lib/analytics/shared";
import { ANALYTICS_DEFAULTS, sanitizeAnalyticsParams } from "@/lib/analytics/shared";

type GtagFunction = (command: "event" | "config", target: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: GtagFunction;
  }
}

let sharedContext: SharedAnalyticsContext = { ...ANALYTICS_DEFAULTS };

function getMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  if (typeof id !== "string" || id.trim().length === 0) {
    return null;
  }
  return id.trim();
}

function ensureDataLayer() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
}

function pushToDataLayer(eventName: AnalyticsEventName, params: AnalyticsEventPayload) {
  ensureDataLayer();
  if (typeof window === "undefined") return;
  window.dataLayer?.push({
    event: eventName,
    ...params,
  });
}

function sendWithGtag(eventName: AnalyticsEventName, params: AnalyticsEventPayload) {
  if (typeof window === "undefined") return;
  const measurementId = getMeasurementId();
  if (!measurementId) return;
  const gtag = window.gtag;
  if (typeof gtag !== "function") {
    pushToDataLayer(eventName, params);
    return;
  }

  if (eventName === "page_view") {
    gtag("config", measurementId, {
      ...params,
      page_path: params.page_path ?? params.page_location,
    });
  }

  gtag("event", eventName, params);
}

export function initAnalyticsContext(initial: Partial<SharedAnalyticsContext>) {
  const sanitized = sanitizeAnalyticsParams(initial as Record<string, unknown>) as Partial<SharedAnalyticsContext>;
  sharedContext = {
    ...ANALYTICS_DEFAULTS,
    ...sanitized,
  };
}

export function updateAnalyticsContext(update: Partial<SharedAnalyticsContext>) {
  const sanitized = sanitizeAnalyticsParams(update as Record<string, unknown>) as Partial<SharedAnalyticsContext>;
  sharedContext = {
    ...sharedContext,
    ...sanitized,
  };
}

export function getAnalyticsContext(): SharedAnalyticsContext {
  return { ...sharedContext };
}

export function event(name: AnalyticsEventName, props: AnalyticsEventPayload = {}) {
  const measurementId = getMeasurementId();
  const sanitizedProps = sanitizeAnalyticsParams(props);
  const payload: AnalyticsEventPayload = {
    ...sharedContext,
    ...sanitizedProps,
  };

  if (!measurementId) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[analytics]", name, payload);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", name, payload);
  }

  sendWithGtag(name, payload);
}
