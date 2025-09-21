import { Cairo, Inter, Scheherazade_New } from "next/font/google";
import "../styles/globals.css";
import { LocaleProvider } from "@/providers/locale-provider";
import { SiteHeader } from "@/components/SiteHeader";
import { getPayments, getUiStrings, type UIStrings } from "@/lib/content";
import { getDirection } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n.server";
import { getDefaultMetadata } from "@/lib/seo";
const brand = { ar: "برهوم", en: "Barhoum" };

const inter = Inter({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-inter", display: "swap" });
const scheherazade = Scheherazade_New({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-scheherazade", display: "swap" });
const cairo = Cairo({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-cairo", display: "swap" });

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
  const fontClass = [inter.variable, scheherazade.variable, cairo.variable].join(" ");

  return (
    <html lang={locale} dir={direction} className={fontClass}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <SiteHeader ui={ui} brand={brand} paymentSlug={defaultPaymentSlug} />
          <main>{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
