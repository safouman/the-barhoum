export const dynamic = "force-dynamic";
export const revalidate = 0;
// optional but helpful in some hosts:
export const runtime = "nodejs";
import Script from "next/script";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import "../styles/globals.css";
import { LocaleProvider } from "@/providers/locale-provider";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { getSiteConfig, getUiStrings, type UIStrings } from "@/lib/content";
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
const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-inter",
    display: "swap",
    fallback: [
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

async function loadUi(): Promise<Record<"ar" | "en", UIStrings>> {
    const [ar, en] = await Promise.all([
        getUiStrings("ar"),
        getUiStrings("en"),
    ]);
    return { ar, en };
}

export const metadata = getDefaultMetadata();

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale = resolveLocale();
    const direction = getDirection(locale);
    const [ui, site] = await Promise.all([loadUi(), getSiteConfig()]);
    const fontClass = `${inter.variable} ${notoNaskhArabic.variable}`;
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
        url: brand.domains.primary,
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
        url: brand.domains.primary,
        image: toAbsoluteAssetUrl(brand.person.image),
        worksFor: {
            "@id": organizationId,
        },
        knowsLanguage: brand.availableLanguages,
        ...(sameAs.length ? { sameAs } : {}),
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: brand.organization.name,
        description: brand.person.description,
        provider: {
            "@id": personId,
        },
        serviceType: [
            "Leadership coaching",
            "Team facilitation",
            "Creative mentoring",
        ],
        availableLanguage,
        areaServed: brand.areaServed,
        url: brand.domains.primary,
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "What is Ibrahim Ben Abdallah?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ibrahim Ben Abdallah is the personal practice of Ibrahim Ben Abdallah, offering reflective and strategic coaching for people seeking grounded transformation.",
                },
            },
            {
                "@type": "Question",
                name: "Who does Ibrahim support?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Ibrahim works with founders, leaders, couples, and creatives who want to align their inner work with outer impact, drawing on psychology, spirituality, and conscious strategy.",
                },
            },
            {
                "@type": "Question",
                name: "How can I start working with Ibrahim Ben Abdallah?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Explore the coaching categories on the homepage, select the package that fits your context, and submit the lead form to begin a tailored onboarding conversation.",
                },
            },
        ],
    };

    const structuredData = JSON.stringify([
        organizationJsonLd,
        personJsonLd,
        serviceJsonLd,
        faqJsonLd,
    ]);

    return (
        <html lang={locale} dir={direction} className={fontClass}>
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
                        <SiteHeader ui={ui} site={site} />
                        <main>{children}</main>
                        <Footer site={site} />
                    </AnalyticsProvider>
                </LocaleProvider>
            </body>
        </html>
    );
}
