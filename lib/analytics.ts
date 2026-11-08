"use client";

import type {
  AnalyticsEventName,
  AnalyticsEventPayload,
  SharedAnalyticsContext,
} from "@/lib/analytics/shared";
import { ANALYTICS_DEFAULTS, analyticsLocation, sanitizeAnalyticsParams } from "@/lib/analytics/shared";
import { hasAnalyticsConsent } from "@/lib/consent";
import { capturePosthogEvent, isPosthogConfigured } from "@/lib/analytics/posthog";

export type GtagFunction = {
  (command: "js", initializedAt: Date): void;
  (command: "event", eventName: string, params?: Record<string, unknown>): void;
  (command: "config", target: string, params?: Record<string, unknown>): void;
  (command: "consent", action: "default" | "update", params: Record<string, unknown>): void;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: GtagFunction;
  }
}

let sharedContext: SharedAnalyticsContext = { ...ANALYTICS_DEFAULTS };

function getMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA4_PRIVACY_VERIFIED === "true"
    ? process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID : undefined;
  if (typeof id !== "string" || id.trim().length === 0) {
    return null;
  }
  return id.trim();
}

function sendWithGtag(name: AnalyticsEventName, params: AnalyticsEventPayload) {
  const measurementId = getMeasurementId();
  if (!measurementId || typeof window.gtag !== "function") return;

  window.gtag("event", name, {
    ...params,
    send_to: measurementId,
    page_referrer: "",
    page_title: params.page_path,
    // Keep the event when navigation to Stripe starts immediately afterwards.
    transport_type: "beacon",
  });
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

export function event(name: AnalyticsEventName, props: AnalyticsEventPayload = {}): boolean {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return false;
  const location = analyticsLocation(window.location.href);
  if (!location) return false;

  if (typeof window.gtag !== "function" && !isPosthogConfigured()) return false;

  const payload = sanitizeAnalyticsParams({
    ...sharedContext,
    ...props,
    page_path: new URL(location).pathname,
    page_location: location,
  });

  if (name.startsWith("course_") && !payload.course_key) return false;

  try {
    capturePosthogEvent(name, payload);
  } catch {
    // A blocked analytics provider must not interfere with product actions.
  }
  try {
    sendWithGtag(name, payload);
  } catch {
    // A blocked analytics provider must not interfere with product actions.
  }
  return true;
}
