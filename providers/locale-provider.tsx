"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const initialQueryLocale = searchParams?.get("lang");
  const [locale, setLocaleState] = useState<Locale>(() =>
    isLocale(initialQueryLocale) ? initialQueryLocale : isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE
  );

  useEffect(() => {
    const param = searchParams?.get("lang");
    if (!isLocale(param)) return;

    setLocaleState((prev) => (param !== prev ? param : prev));
  }, [searchParams]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      document.documentElement.dir = getDirection(locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((value: Locale) => {
    if (!isLocale(value)) {
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
  }, []);

  const direction = getDirection(locale);

  const value = useMemo(() => ({ locale, setLocale, direction }), [locale, setLocale, direction]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
