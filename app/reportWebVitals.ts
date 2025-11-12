import type { NextWebVitalsMetric } from "next/app";
import { capturePosthogWebVital } from "@/lib/analytics/posthog";

export function reportWebVitals(metric: NextWebVitalsMetric) {
  capturePosthogWebVital(metric);
}
