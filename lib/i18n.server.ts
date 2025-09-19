import { cookies, headers } from "next/headers";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { Locale } from "@/lib/content";
import { DEFAULT_LOCALE, isLocale } from "./i18n";

const COOKIE_KEY = "barhoum_locale";

export function resolveLocale(searchParams?: ReadonlyURLSearchParams | null): Locale {
  const fromSearch = searchParams?.get("lang");
  if (isLocale(fromSearch)) {
    return fromSearch;
  }

  const cookieLocale = cookies().get(COOKIE_KEY)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLang = headers().get("accept-language");
  if (acceptLang) {
    const preferred = acceptLang.split(",")[0]?.split("-")[0];
    if (isLocale(preferred)) {
      return preferred;
    }
  }

  return DEFAULT_LOCALE;
}

export function serializeLocale(locale: Locale) {
  cookies().set(COOKIE_KEY, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
