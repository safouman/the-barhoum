import type { Locale } from "@/lib/content";

const KNOWN_LOCALES: Locale[] = ["ar", "en"];

type EnvConfig = {
  available: string | undefined;
  defaultLocale: string | undefined;
  enabledFlag: string | undefined;
};

const env: EnvConfig = {
  available: process.env.NEXT_PUBLIC_LOCALIZATION_AVAILABLE_LOCALES,
  defaultLocale: process.env.NEXT_PUBLIC_LOCALIZATION_DEFAULT_LOCALE,
  enabledFlag: process.env.NEXT_PUBLIC_LOCALIZATION_ENABLED_LOCALES,
};

function isKnownLocale(value: string): value is Locale {
  return KNOWN_LOCALES.some((locale) => locale === value);
}

function toLocaleList(source: string | undefined, fallback: Locale[], allowList = KNOWN_LOCALES): Locale[] {
  if (!source) {
    return fallback;
  }

  const parsed = source
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is Locale => isKnownLocale(value) && allowList.includes(value));

  return parsed.length > 0 ? Array.from(new Set(parsed)) : fallback;
}

const availableLocales = toLocaleList(env.available, KNOWN_LOCALES);

const defaultLocaleFromEnv = env.defaultLocale?.trim().toLowerCase();
const defaultLocale =
  defaultLocaleFromEnv && isKnownLocale(defaultLocaleFromEnv) && availableLocales.includes(defaultLocaleFromEnv)
    ? defaultLocaleFromEnv
    : availableLocales[0];

const enableAllLocales = (() => {
  const value = env.enabledFlag?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes" || value === "on";
})();

const enabledLocales: Locale[] = enableAllLocales ? availableLocales : [defaultLocale];

export const localizationConfig = {
  availableLocales,
  enabledLocales,
  defaultLocale,
  showLanguageSwitcher: enabledLocales.length > 1,
} as const;

export type LocalizationConfig = typeof localizationConfig;
