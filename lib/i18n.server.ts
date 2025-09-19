// lib/i18n.server.ts
import { cookies, headers } from "next/headers";

export type AppLocale = "ar" | "en";

export async function resolveLocaleFromRequest(): Promise<AppLocale> {
  const store = await cookies(); // request-bound
  const cookieLocale = store.get("barhoum_locale")?.value as AppLocale | undefined;
  if (cookieLocale === "ar" || cookieLocale === "en") return cookieLocale;

  const h = await headers();
  const accept = h.get("accept-language") || "";
  // ultra-simple parse; customize if needed
  if (/^ar\b|, ?ar\b/i.test(accept)) return "ar";
  return "en";
}