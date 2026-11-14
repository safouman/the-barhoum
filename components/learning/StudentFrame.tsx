import type { ReactNode } from "react";
import type { Locale, SiteConfig } from "@/lib/content";
import { BrandSiteChrome } from "@/components/BrandSiteChrome";
import { LocaleProvider } from "@/providers/locale-provider";
import { AnalyticsProvider } from "@/providers/analytics-provider";

export function StudentFrame({ children, signedIn, site, locale, checkout, fontClassName }: {
  children: ReactNode;
  signedIn: boolean;
  site: SiteConfig;
  locale: Locale;
  checkout: boolean;
  fontClassName: string;
}) {
  const language = checkout ? "en" : locale;
  return (
    <html lang={language} dir={language === "ar" ? "rtl" : "ltr"} className={fontClassName}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <AnalyticsProvider>
            <BrandSiteChrome signedIn={signedIn} site={site}>{children}</BrandSiteChrome>
          </AnalyticsProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
