"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/content";
import { DEFAULT_LOCALE, getDirection, SUPPORTED_LOCALES } from "@/lib/i18n";
import { event, updateAnalyticsContext } from "@/lib/analytics";

const LOCALE_COOKIE = "barhoum_locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  direction: "rtl" | "ltr";
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function isLocale(value: string | Locale | null | undefined): value is Locale {
  return !!value && SUPPORTED_LOCALES.includes(value as Locale);
}

export function LocaleProvider({ children, initialLocale = DEFAULT_LOCALE }: { children: React.ReactNode; initialLocale?: Locale; }) {
  const searchParams = useSearchParams();
  const fixedLocale = usePathname() === "/checkout/return" ? "en" : undefined;
  const initialQueryLocale = searchParams?.get("lang");
  const [locale, setLocaleState] = useState<Locale>(() =>
    isLocale(initialQueryLocale) ? initialQueryLocale : isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE
  );

  useEffect(() => {
    if (fixedLocale) return;
    const param = searchParams?.get("lang");
    if (!isLocale(param)) return;

    setLocaleState((prev) => (param !== prev ? param : prev));
  }, [searchParams, fixedLocale]);

  const language = fixedLocale ?? locale;

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (!fixedLocale) document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      document.documentElement.dir = getDirection(language);
      document.documentElement.lang = language;
    }
  }, [locale, language, fixedLocale]);

  const setLocale = useCallback((value: Locale) => {
    if (fixedLocale || !isLocale(value)) {
      return;
    }

    setLocaleState((prev) => {
      if (prev === value) {
        return prev;
      }
      event("locale_switch", { from: prev, to: value });
      updateAnalyticsContext({ locale: value });
      return value;
    });
  }, [fixedLocale]);

  const direction = getDirection(language);

  const value = useMemo(() => ({ locale: language, setLocale, direction }), [language, setLocale, direction]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
