import { resolveLocaleFromRequest, type AppLocale } from "@/lib/i18n.server";
import { getDirection } from "@/lib/i18n";
import { LocaleProvider } from "@/providers/locale-provider";

export default async function LocaleGate({ children }: { children: React.ReactNode }) {
  const locale: AppLocale = await resolveLocaleFromRequest();
  const dir = getDirection(locale);
  return (
    <html lang={locale} dir={dir}>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}