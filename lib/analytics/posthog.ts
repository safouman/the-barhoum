"use client";

import posthog from "posthog-js";
import type { PostHog } from "posthog-js";
import type { NextWebVitalsMetric } from "next/app";
import type { AnalyticsEventName, AnalyticsEventPayload, AnalyticsPrimitive } from "@/lib/analytics/shared";

const DEFAULT_POSTHOG_HOST = "https://app.posthog.com";

let initialized = false;

function getPosthogKey(): string | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    return null;
  }
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPosthogHost(): string {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  if (!host) {
    return DEFAULT_POSTHOG_HOST;
  }
  return host.endsWith("/") ? host.slice(0, -1) : host;
}

function ensureClient(): PostHog | null {
  if (typeof window === "undefined") {
    return null;
  }

  const apiKey = getPosthogKey();
  if (!apiKey) {
    return null;
  }

  if (!initialized) {
    posthog.init(apiKey, {
      api_host: getPosthogHost(),
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      enable_heatmaps: false,
      request_batching: true,
    });
    initialized = true;
  }

  return posthog;
}

export function isPosthogConfigured(): boolean {
  return Boolean(getPosthogKey());
}

export function setPosthogTrackingEnabled(enabled: boolean): void {
  const client = ensureClient();
  if (!client) {
    return;
  }

  if (enabled) {
    client.opt_in_capturing();
  } else {
    client.opt_out_capturing();
  }
}

function hasOptedOut(client: PostHog): boolean {
  return typeof client.has_opted_out_capturing === "function"
    ? client.has_opted_out_capturing()
    : false;
}

function buildPageEventProps(payload: AnalyticsEventPayload): Record<string, AnalyticsPrimitive> {
  const props: Record<string, AnalyticsPrimitive> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      props[key] = value as AnalyticsPrimitive;
    }
  }

  const location =
    (payload.page_location as string | undefined) ??
    (typeof window !== "undefined" ? window.location.href : undefined);
  if (location) {
    props.$current_url = location;
    try {
      const url = new URL(location);
      props.$pathname = url.pathname + url.search;
      props.$host = url.host;
    } catch {
      // ignore invalid URL parsing
    }
  }

  if (payload.referrer) {
    props.$referrer = payload.referrer;
  } else if (typeof document !== "undefined" && document.referrer) {
    props.$referrer = document.referrer;
  }

  return props;
}

export function capturePosthogEvent(
  name: AnalyticsEventName,
  payload: AnalyticsEventPayload
): void {
  const client = ensureClient();
  if (!client || typeof client.capture !== "function") {
    return;
  }

  if (hasOptedOut(client)) {
    return;
  }

  if (name === "page_view") {
    client.capture("$pageview", buildPageEventProps(payload));
  }

  client.capture(name, payload);
}

export function capturePosthogPageLeave(payload: AnalyticsEventPayload): void {
  const client = ensureClient();
  if (!client || typeof client.capture !== "function" || hasOptedOut(client)) {
    return;
  }
  client.capture("$pageleave", buildPageEventProps(payload), {
    transport: "sendBeacon",
  });
}

export function capturePosthogWebVital(metric: NextWebVitalsMetric): void {
  const client = ensureClient();
  if (!client || typeof client.capture !== "function" || hasOptedOut(client)) {
    return;
  }

  const url = typeof window !== "undefined" ? window.location.href : undefined;
  const props: Record<string, AnalyticsPrimitive> = {
    metric_name: metric.name,
    metric_id: metric.id,
    metric_label: metric.label,
    value: metric.value,
    $current_url: url ?? "",
  };

  if ("rating" in metric && typeof metric.rating !== "undefined") {
    props.metric_rating = metric.rating as AnalyticsPrimitive;
  }

  if ("navigationType" in metric && typeof metric.navigationType !== "undefined") {
    props.navigation_type = metric.navigationType as AnalyticsPrimitive;
  }

  client.capture("$web_vitals", props);
}
