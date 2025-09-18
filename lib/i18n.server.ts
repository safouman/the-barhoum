import type { ReadonlyURLSearchParams } from "next/navigation";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import type { Locale } from "@/lib/content";
import { DEFAULT_LOCALE, isLocale } from "./i18n";

const COOKIE_KEY = "barhoum_locale";

export function resolveLocale(
  cookiesStore: ReadonlyRequestCookies,
  headersStore: ReadonlyHeaders,
  searchParams?: ReadonlyURLSearchParams | null
): Locale {
  const fromSearch = searchParams?.get("lang");
  if (isLocale(fromSearch)) {
    return fromSearch;
  }

  const cookieLocale = cookiesStore.get(COOKIE_KEY)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLang = headersStore.get("accept-language");
  if (acceptLang) {
    const preferred = acceptLang.split(",")[0]?.split("-")[0];
    if (isLocale(preferred)) {
      return preferred;
    }
  }

  return DEFAULT_LOCALE;
}

export function serializeLocale(cookiesStore: ReadonlyRequestCookies, locale: Locale) {
  cookiesStore.set(COOKIE_KEY, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
