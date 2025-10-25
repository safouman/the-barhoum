export const dynamic = "force-dynamic";
export const revalidate = 0;
// optional but helpful in some hosts:
export const runtime = "nodejs";
import Script from "next/script";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import "../styles/globals.css";
import { LocaleProvider } from "@/providers/locale-provider";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import {
    getPayments,
    getSiteConfig,
    getUiStrings,
    type UIStrings,
} from "@/lib/content";
import { getDirection } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n.server";
import { getDefaultMetadata } from "@/lib/seo";
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
    const [ui, payments, site] = await Promise.all([
        loadUi(),
        getPayments(),
        getSiteConfig(),
    ]);
    const defaultPaymentSlug = payments[0]?.slug;
    const fontClass = `${inter.variable} ${notoNaskhArabic.variable}`;
    const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

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
                <LocaleProvider initialLocale={locale}>
                    <AnalyticsProvider>
                        <VercelAnalytics />
                        <SiteHeader
                            ui={ui}
                            site={site}
                            paymentSlug={defaultPaymentSlug}
                        />
                        <main>{children}</main>
                        <Footer site={site} />
                    </AnalyticsProvider>
                </LocaleProvider>
            </body>
        </html>
    );
}
