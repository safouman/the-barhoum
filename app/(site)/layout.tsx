export const dynamic = "force-dynamic";
export const revalidate = 0;
// optional but helpful in some hosts:
export const runtime = "nodejs";
import Script from "next/script";
import type { CSSProperties } from "react";
import { Inter, Noto_Naskh_Arabic, Playfair_Display } from "next/font/google";
import "../../styles/globals.css";
import "../../styles/brand/tokens.css";
import { LocaleProvider } from "@/providers/locale-provider";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { BrandSiteChrome } from "@/components/BrandSiteChrome";
import { readHeaderSignedIn } from "@/components/SiteHeaderSession";
import { getSiteConfig } from "@/lib/content";
import { getDirection } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n.server";
import { getDefaultMetadata, siteUrl } from "@/lib/seo";
import { seoConfig } from "@/config/seo";

function toAbsoluteAssetUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }
    if (path.startsWith("/")) {
        return `${siteUrl}${path}`;
    }
    return `${siteUrl}/${path}`;
}
const playfair = Playfair_Display({
    subsets: ["latin", "latin-ext"],
    weight: ["400", "700"],
    style: ["normal", "italic"],
    variable: "--font-playfair",
    display: "swap",
});
const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-inter",
    display: "swap",
    fallback: [
        "Noto Naskh Arabic",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "sans-serif",
    ],
    preload: true,
});

const notoNaskhArabic = Noto_Naskh_Arabic({
    subsets: ["arabic"],
    weight: ["400", "700"],
    variable: "--font-noto-naskh",
    display: "swap",
    preload: true,
});

function parseFontList(value: string | undefined): string[] {
    if (!value) {
        return [];
    }
    return value
        .split(",")
        .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ""))
        .filter((entry) => entry.length > 0);
}

const interFontList = parseFontList(inter.style.fontFamily);
const notoFontList = parseFontList(notoNaskhArabic.style.fontFamily);
const primaryNotoFont = notoFontList.at(0);
const interMergedFontFamily = interFontList.length
    ? [
          interFontList[0],
          ...(primaryNotoFont ? [primaryNotoFont] : []),
          ...interFontList.slice(1),
          ...notoFontList.slice(1),
      ].join(", ")
    : "";

const fontStyleVariables = {
    ...(interMergedFontFamily
        ? { "--font-inter-merged": interMergedFontFamily }
        : {}),
    ...(primaryNotoFont ? { "--font-noto-primary": primaryNotoFont } : {}),
};

export const metadata = getDefaultMetadata();

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale = await resolveLocale();
    const direction = getDirection(locale);
    const [site, signedIn] = await Promise.all([getSiteConfig(), readHeaderSignedIn()]);
    const fontClass = `${inter.variable} ${notoNaskhArabic.variable} ${playfair.variable}`;
    const brand = seoConfig.brand;
    const sameAs = brand.socials;
    const organizationId = `${siteUrl}#organization`;
    const personId = `${siteUrl}#ibrahim-ben-abdallah`;
    const availableLanguage = brand.availableLanguages;

    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": organizationId,
        name: brand.organization.name,
        legalName: brand.organization.legalName,
        alternateName: brand.person.alternateName,
        url: siteUrl,
        logo: `${siteUrl}/images/logo.png`,
        // slogan: brand.organization.slogan.en,
        areaServed: brand.areaServed,
        contactPoint: [
            {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage,
            },
        ],
        ...(sameAs.length ? { sameAs } : {}),
    };

    const personJsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": personId,
        name: brand.person.name,
        alternateName: brand.person.alternateName,
        jobTitle: brand.person.jobTitle,
        description: brand.person.description,
        url: siteUrl,
        image: toAbsoluteAssetUrl(brand.person.image),
        worksFor: {
            "@id": organizationId,
        },
        knowsLanguage: brand.availableLanguages,
        ...(sameAs.length ? { sameAs } : {}),
    };

    const structuredData = JSON.stringify([
        organizationJsonLd,
        personJsonLd,
    ]);

    return (
        <html
            lang={locale}
            dir={direction}
            className={fontClass}
            style={fontStyleVariables as CSSProperties}
        >
            <head>
                <link
                    rel="alternate"
                    type="application/ld+json"
                    href="/data/coach.jsonld"
                />
            </head>
            <body>
                <Script
                    id="structured-data"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                >
                    {structuredData}
                </Script>
                <LocaleProvider initialLocale={locale}>
                    <AnalyticsProvider>
                        <BrandSiteChrome site={site} signedIn={signedIn}>
                            {children}
                        </BrandSiteChrome>
                    </AnalyticsProvider>
                </LocaleProvider>
            </body>
        </html>
    );
}
