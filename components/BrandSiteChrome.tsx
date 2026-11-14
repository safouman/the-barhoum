"use client";

import Link from "next/link";
import { triggerConsentPreferences } from "@/lib/consent";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { SiteConfig } from "@/lib/content";
import { useLocale } from "@/providers/locale-provider";
import { LocalizedSiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { BrandHeader } from "@/components/brand/BrandHeader";

export function BrandSiteChrome({ children, site, signedIn }: {
  children: ReactNode;
  site: SiteConfig;
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const footer = {
    en: { privacy: "Privacy", terms: "Terms", cookies: "Cookie preferences", coaching: "Coaching", label: "Website information" },
    ar: { privacy: "الخصوصية", terms: "الشروط", cookies: "تفضيلات ملفات الارتباط", coaching: "المرافقة الفردية", label: "معلومات الموقع" },
    fr: { privacy: "Confidentialité", terms: "Conditions", cookies: "Préférences des cookies", coaching: "Coaching", label: "Informations du site" },
  }[locale];
  if (pathname === "/coaching") {
    return <>
      <LocalizedSiteHeader site={site} signedIn={signedIn} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Footer site={site} />
    </>;
  }
  return (
    <div className="brand-experience" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <BrandHeader locale={locale} signedIn={signedIn} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="brand-footer">
        <nav aria-label={footer.label}>
          <Link href="/privacy">{footer.privacy}</Link>
          <Link href="/terms">{footer.terms}</Link>
          <Link href="/coaching">{footer.coaching}</Link>
          <button type="button" onClick={triggerConsentPreferences}>{footer.cookies}</button>
        </nav>
      </footer>
    </div>
  );
}
