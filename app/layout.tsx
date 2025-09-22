export const dynamic = 'force-dynamic';
export const revalidate = 0;
// optional but helpful in some hosts:
export const runtime = 'nodejs';
import { Courgette, Inter, Markazi_Text } from "next/font/google";
import "../styles/globals.css";
import { LocaleProvider } from "@/providers/locale-provider";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { getPayments, getUiStrings, type UIStrings } from "@/lib/content";
import { getDirection } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n.server";
import { getDefaultMetadata } from "@/lib/seo";
const brand = { ar: "برهوم", en: "Barhoum" };

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

const markazi = Markazi_Text({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-markazi",
  display: "swap",
  fallback: ["Noto Naskh Arabic", "Amiri", "serif"],
});

const courgette = Courgette({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-courgette",
  display: "swap",
  fallback: ["Brush Script MT", "Comic Sans MS", "cursive"],
});

async function loadUi(): Promise<Record<"ar" | "en", UIStrings>> {
  const [ar, en] = await Promise.all([getUiStrings("ar"), getUiStrings("en")]);
  return { ar, en };
}

export const metadata = getDefaultMetadata();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = resolveLocale();
  const direction = getDirection(locale);
  const [ui, payments] = await Promise.all([loadUi(), getPayments()]);
  const defaultPaymentSlug = payments[0]?.slug;
  const fontClass = [inter.variable, markazi.variable, courgette.variable].join(" ");

  return (
    <html lang={locale} dir={direction} className={fontClass}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <SiteHeader ui={ui} brand={brand} paymentSlug={defaultPaymentSlug} />
          <main>{children}</main>
          <Footer ui={ui} brand={brand} locale={locale} />
        </LocaleProvider>
      </body>
    </html>
  );
}
