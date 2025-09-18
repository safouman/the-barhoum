"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/content";
import { DEFAULT_LOCALE, getDirection, SUPPORTED_LOCALES } from "@/lib/i18n";
import { event } from "@/lib/analytics";

const LOCALE_COOKIE = "barhoum_locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  direction: "rtl" | "ltr";
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function readCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const entries = document.cookie.split("; ");
  for (const entry of entries) {
    const [key, value] = entry.split("=");
    if (key === LOCALE_COOKIE && isLocale(value)) {
      return value;
    }
  }
  return null;
}

function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function LocaleProvider({ children, initialLocale = DEFAULT_LOCALE }: { children: React.ReactNode; initialLocale?: Locale; }) {
  const searchParams = useSearchParams();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const existing = readCookie();
    if (existing && existing !== locale) {
      setLocaleState(existing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const param = searchParams?.get("lang");
    if (isLocale(param) && param !== locale) {
      setLocaleState(param);
    }
  }, [searchParams, locale]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      document.documentElement.dir = getDirection(locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((value: Locale) => {
    setLocaleState(value);
    event("lang_switch", { locale: value });
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
