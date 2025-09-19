export const runtime = "nodejs";

import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Inter, Nunito, Playfair_Display, Poppins, Rubik } from "next/font/google";
import "../styles/globals.css";
import { LocaleProvider } from "@/providers/locale-provider";
import { SiteHeader } from "@/components/SiteHeader";
import { getPayments, getUiStrings, type UIStrings } from "@/lib/content";
import { getDirection } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n.server";
import ThemeGate from "./_theme-gate";
const brand = { ar: "برهوم", en: "Barhoum" };

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-poppins", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-nunito", display: "swap" });
const rubik = Rubik({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-rubik", display: "swap" });

async function loadUi(): Promise<Record<"ar" | "en", UIStrings>> {
  const [ar, en] = await Promise.all([getUiStrings("ar"), getUiStrings("en")]);
  return { ar, en };
}

export const metadata: Metadata = {
  title: "Barhoum Coaching",
  description: "Personal coaching for individuals, couples, and organizations.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookiesStore = cookies();
  const headersStore = headers();
  const locale = resolveLocale(cookiesStore, headersStore, null);
  const direction = getDirection(locale);
  const [ui, payments] = await Promise.all([loadUi(), getPayments()]);
  const defaultPaymentSlug = payments[0]?.slug;
  const fontClass = [playfair.variable, inter.variable, poppins.variable, nunito.variable, rubik.variable].join(" ");

  return (
    <html lang={locale} dir={direction} className={fontClass}>
      <body>
        <ThemeGate>
          <LocaleProvider initialLocale={locale}>
            <SiteHeader ui={ui} brand={brand} paymentSlug={defaultPaymentSlug} />
            <main>{children}</main>
          </LocaleProvider>
        </ThemeGate>
      </body>
    </html>
  );
}
