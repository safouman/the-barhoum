"use client";

import Link from "next/link";
import { triggerConsentPreferences } from "@/lib/consent";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { SiteConfig } from "@/lib/content";
import { useLocale } from "@/providers/locale-provider";
import { BrandHeader } from "@/components/brand/BrandHeader";

export function BrandSiteChrome({ children, signedIn }: {
  children: ReactNode;
  site: SiteConfig;
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();
  useEffect(() => {
    if (pathname !== "/") return;
    const anchors = new Set(["about", "method", "testimonials", "categories", "lead-form", "experience", "intro-video", "mobile-packs"]);
    function preserveLegacyAnchor() {
      if (!anchors.has(window.location.hash.slice(1))) return;
      const query = search.toString();
      router.replace("/coaching" + (query ? "?" + query : "") + window.location.hash);
    }
    preserveLegacyAnchor();
    window.addEventListener("hashchange", preserveLegacyAnchor);
    return () => window.removeEventListener("hashchange", preserveLegacyAnchor);
  }, [pathname, router, search]);
  const { locale } = useLocale();
  const checkout = pathname === "/checkout/return";
  const footer = {
    en: { privacy: "Privacy", terms: "Terms", cookies: "Cookie preferences", coaching: "Coaching", label: "Website information" },
    ar: { privacy: "الخصوصية", terms: "الشروط", cookies: "تفضيلات ملفات الارتباط", coaching: "المرافقة الفردية", label: "معلومات الموقع" },
    fr: { privacy: "Confidentialité", terms: "Conditions", cookies: "Préférences des cookies", coaching: "Coaching", label: "Informations du site" },
  }[locale];
  return (
    <div className="brand-experience" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <BrandHeader locale={locale} signedIn={signedIn} allowLanguageSwitch={!checkout} />
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
