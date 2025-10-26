export type AnalyticsEventName =
  | "page_view"
  | "scroll_25"
  | "scroll_50"
  | "scroll_75"
  | "scroll_100"
  | "section_engaged"
  | "audio_played"
  | "audio_completed"
  | "social_link_clicked"
  | "locale_switch"
  | "form_opened"
  | "form_started"
  | "form_step_changed"
  | "form_error"
  | "form_retry"
  | "form_submitted"
  | "form_submitted_with_payment"
  | "form_completed"
  | "payment_completed"
  | "whatsapp_sent"
  | "whatsapp_failed"
  | "stripe_link_generated"
  | "video_play"
  | "pdf_download"
  | "ai_brief_view"
  | "category_view"
  | "package_click"
  | "pay_page_view";

export type AnalyticsPrimitive = string | number | boolean;

export type AnalyticsEventPayload = Record<string, AnalyticsPrimitive | undefined>;

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
  debug_mode: typeof window !== "undefined" ? process.env.NODE_ENV !== "production" : undefined,
};

function normalizeString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "unknown";
  return trimmed;
}

export function sanitizeAnalyticsParams(
  input: Record<string, unknown>
): Record<string, AnalyticsPrimitive> {
  const output: Record<string, AnalyticsPrimitive> = {};
  for (const [key, raw] of Object.entries(input)) {
    if (raw === undefined || raw === null) {
      continue;
    }
    if (typeof raw === "string") {
      output[key] = normalizeString(raw);
      continue;
    }
    if (typeof raw === "number") {
      if (Number.isFinite(raw)) {
        output[key] = raw;
      }
      continue;
    }
    if (typeof raw === "boolean") {
      output[key] = raw;
      continue;
    }
    output[key] = normalizeString(String(raw));
  }
  return output;
}
