"use client";

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
    </div>
  );
}
