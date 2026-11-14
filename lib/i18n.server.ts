
import 'server-only';
import { cookies, headers } from 'next/headers';
import type { Locale } from '@/lib/content';
import { DEFAULT_LOCALE, isLocale } from './i18n';

const COOKIE_KEY = 'barhoum_locale';

// guards so static prepass/preview doesn't crash
async function safeCookie(name: string) {
  try {
    return (await cookies()).get(name)?.value;
  } catch {
    return undefined;
  }
}
async function safeHeader(name: string) {
  try {
    return (await headers()).get(name);
  } catch {
    return null;
  }
}

export async function resolveLocale(searchParams?: Pick<URLSearchParams, "get"> | null): Promise<Locale> {
  const fromSearch = searchParams?.get('lang');
  if (isLocale(fromSearch)) return fromSearch;

  const requestLocale = await safeHeader("x-barhoum-locale");
  if (isLocale(requestLocale)) return requestLocale;

  const cookieLocale = await safeCookie(COOKIE_KEY);
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptLang = await safeHeader('accept-language');
  const preferred = acceptLang?.split(',')[0]?.split('-')[0];
  if (isLocale(preferred)) return preferred;

  return DEFAULT_LOCALE;
}

// If you must keep this here, wrap it. Better: move to a server action (below).
export async function serializeLocale(locale: Locale) {
  try {
    (await cookies()).set(COOKIE_KEY, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  } catch {/* ignore during static/preview */}
}