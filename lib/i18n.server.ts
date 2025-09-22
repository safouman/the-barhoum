
import 'server-only';
import { cookies, headers } from 'next/headers';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { Locale } from '@/lib/content';
import { DEFAULT_LOCALE, isLocale } from './i18n';

const COOKIE_KEY = 'barhoum_locale';

// guards so static prepass/preview doesn't crash
const safeCookie = (name: string) => { try { return cookies().get(name)?.value } catch { return undefined } };
const safeHeader = (k: string) => { try { return headers().get(k) } catch { return null } };

export function resolveLocale(searchParams?: ReadonlyURLSearchParams | null): Locale {
  const fromSearch = searchParams?.get('lang');
  if (isLocale(fromSearch)) return fromSearch;

  const cookieLocale = safeCookie(COOKIE_KEY);
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptLang = safeHeader('accept-language');
  const preferred = acceptLang?.split(',')[0]?.split('-')[0];
  if (isLocale(preferred)) return preferred;

  return DEFAULT_LOCALE;
}

// If you must keep this here, wrap it. Better: move to a server action (below).
export function serializeLocale(locale: Locale) {
  try {
    cookies().set(COOKIE_KEY, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  } catch {/* ignore during static/preview */}
}