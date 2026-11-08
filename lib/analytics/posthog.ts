"use client";

import posthog from "posthog-js";
import type { PostHog } from "posthog-js";
import type { NextWebVitalsMetric } from "next/app";
import type { AnalyticsEventName, AnalyticsEventPayload } from "@/lib/analytics/shared";
import { analyticsLocation, isAllowedPosthogEvent, sanitizeAnalyticsParams } from "@/lib/analytics/shared";
import { hasAnalyticsConsent } from "@/lib/consent";

const DEFAULT_POSTHOG_HOST = "https://app.posthog.com";

let initialized = false;

function getPosthogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined;
}

function safeLocation() {
  if (typeof window !== "undefined") return analyticsLocation(window.location.href);
}

function ensureClient(): PostHog | null {
  const apiKey = getPosthogKey();
  if (!apiKey || !safeLocation() || !hasAnalyticsConsent()) return null;

  if (!initialized) {
    posthog.init(apiKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_performance: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      enable_heatmaps: false,
      save_referrer: false,
      disable_persistence: true,
      person_profiles: "never",
      opt_out_capturing_by_default: true,
      request_batching: false,
      before_send: (capture) => {
        if (!capture || !isAllowedPosthogEvent(capture.event) || !hasAnalyticsConsent()) return null;
        const location = safeLocation();
        if (!location) return null;

        // Keep the SDK's anonymous event identifier and drop automatically
        // attached identity, session, URL, device and attribution properties.
        return {
          uuid: capture.uuid,
          event: capture.event,
          timestamp: capture.timestamp,
          properties: {
            ...sanitizeAnalyticsParams(capture.properties),
            distinct_id: posthog.get_distinct_id(),
            $current_url: location,
            $pathname: new URL(location).pathname,
            $process_person_profile: false,
            $geoip_disable: true,
          },
        };
      },
    });
    initialized = true;
  }
  if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing({ captureEventName: false });
  return posthog;
}

export function isPosthogConfigured(): boolean {
  return Boolean(getPosthogKey());
}

export function setPosthogTrackingEnabled(enabled: boolean): void {
  if (enabled) ensureClient();
  else if (initialized) posthog.opt_out_capturing();
}

export function capturePosthogEvent(
  name: AnalyticsEventName,
  payload: AnalyticsEventPayload,
): void {
  ensureClient()?.capture(name === "page_view" ? "$pageview" : name, payload);
}

export function capturePosthogWebVital(metric: NextWebVitalsMetric): void {
  ensureClient()?.capture("$web_vitals", {
    metric_name: metric.name,
    value: metric.value,
    metric_rating: "rating" in metric ? metric.rating : undefined,
  });
}
