export const dynamic = "force-dynamic";
export const revalidate = 0;
// optional but helpful in some hosts:
export const runtime = "nodejs";
import Script from "next/script";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import "../styles/globals.css";
import { LocaleProvider } from "@/providers/locale-provider";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { getSiteConfig, getUiStrings, type UIStrings } from "@/lib/content";
import { getDirection } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n.server";
import { getDefaultMetadata, siteUrl } from "@/lib/seo";
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
    const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
    const sameAs =
        site.socials?.map((social) => social.href).filter(Boolean) ?? [];
    const organizationId = `${siteUrl}#organization`;
    const personId = `${siteUrl}#ibrahim-ben-abdallah`;

    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": organizationId,
        name: site.brand.footer.en ?? "Barhoum Coaching",
        alternateName: site.brand.footer.ar ?? "برهوم",
        url: siteUrl,
        logo: `${siteUrl}/images/logo.png`,
        slogan: site.brand.tagline.en ?? "For a Better World",
        areaServed: "Worldwide",
        contactPoint: [
            {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: ["en", "ar"],
            },
        ],
        ...(sameAs.length ? { sameAs } : {}),
    };

    const personJsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": personId,
        name: "Ibrahim ben Abdallah",
        alternateName: ["إبراهيم بن عبد الله", "Barhoum"],
        jobTitle: "Coach and facilitator",
        url: siteUrl,
        image: `${siteUrl}/images/hero.jpeg`,
        worksFor: {
            "@id": organizationId,
        },
        knowsLanguage: ["en", "ar"],
        ...(sameAs.length ? { sameAs } : {}),
    };

    const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Barhoum Coaching",
        description:
            "Personal and leadership coaching programs that blend psychology, spirituality, and strategy to help leaders, teams, and creatives move with clarity.",
        provider: {
            "@id": organizationId,
        },
        serviceType: [
            "Leadership coaching",
            "Team facilitation",
            "Creative mentoring",
        ],
        availableLanguage: ["en", "ar"],
        areaServed: "Worldwide",
        url: siteUrl,
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "What is Barhoum Coaching?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "Barhoum Coaching is the personal practice of Ibrahim ben Abdallah, offering reflective and strategic coaching for people seeking grounded transformation.",
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
                name: "How can I start working with Barhoum Coaching?",
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
            <body>
                {measurementId ? (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                            strategy="afterInteractive"
                        />
                        <Script id="ga4-init" strategy="afterInteractive">
                            {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${measurementId}', { send_page_view: false });
              `}
                        </Script>
                    </>
                ) : null}
                <Script
                    id="structured-data"
                    type="application/ld+json"
                    strategy="beforeInteractive"
                >
                    {structuredData}
                </Script>
                <LocaleProvider initialLocale={locale}>
                    <AnalyticsProvider>
                        <VercelAnalytics />
                        <SiteHeader ui={ui} site={site} />
                        <main>{children}</main>
                        <Footer site={site} />
                    </AnalyticsProvider>
                </LocaleProvider>
            </body>
        </html>
    );
}
