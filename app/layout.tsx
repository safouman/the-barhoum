export const dynamic = 'force-dynamic';
export const revalidate = 0;
// optional but helpful in some hosts:
export const runtime = 'nodejs';
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import "../styles/globals.css";
import { LocaleProvider } from "@/providers/locale-provider";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { getPayments, getSiteConfig, getUiStrings, type UIStrings } from "@/lib/content";
import { getDirection } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n.server";
import { getDefaultMetadata } from "@/lib/seo";
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-noto-naskh",
  display: "swap",
});

async function loadUi(): Promise<Record<"ar" | "en", UIStrings>> {
  const [ar, en] = await Promise.all([getUiStrings("ar"), getUiStrings("en")]);
  return { ar, en };
}

export const metadata = getDefaultMetadata();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = resolveLocale();
  const direction = getDirection(locale);
  const [ui, payments, site] = await Promise.all([loadUi(), getPayments(), getSiteConfig()]);
  const defaultPaymentSlug = payments[0]?.slug;
  const fontClass = `${inter.variable} ${notoNaskhArabic.variable}`;

  return (
    <html lang={locale} dir={direction} className={fontClass}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <SiteHeader ui={ui} site={site} paymentSlug={defaultPaymentSlug} />
          <main>{children}</main>
          <Footer site={site} />
        </LocaleProvider>
      </body>
    </html>
  );
}
