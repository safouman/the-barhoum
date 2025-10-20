import { localizationConfig } from "@/config/localization";
import type { Locale } from "@/lib/content";

const enabledLocales =
  localizationConfig.enabledLocales.length > 0
    ? localizationConfig.enabledLocales
    : [localizationConfig.defaultLocale];

export const SUPPORTED_LOCALES: Locale[] = [...enabledLocales];
export const DEFAULT_LOCALE: Locale = localizationConfig.defaultLocale;

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && SUPPORTED_LOCALES.includes(value as Locale);
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
