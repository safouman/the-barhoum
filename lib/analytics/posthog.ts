"use client";

import posthog from "posthog-js";
import type { PostHog } from "posthog-js";
import type { AnalyticsEventName, AnalyticsEventPayload } from "@/lib/analytics/shared";

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

export function capturePosthogEvent(
  name: AnalyticsEventName,
  payload: AnalyticsEventPayload
): void {
  const client = ensureClient();
  if (!client || typeof client.capture !== "function") {
    return;
  }

  // PostHog keeps the opt-out state internally, so skip sending when disabled.
  const hasOptedOut = typeof client.has_opted_out_capturing === "function" ? client.has_opted_out_capturing() : false;
  if (hasOptedOut) {
    return;
  }

  client.capture(name, payload);
}
