import type { Metadata } from "next";
import "../styles/globals.css";
import { Inter, Nunito, Playfair_Display, Poppins, Rubik } from "next/font/google";
import LocaleGate from "./_locale-gate";
import ThemeGate from "./_theme-gate";
import { SiteHeader } from "@/components/SiteHeader";
import { getPayments, getUiStrings, type UIStrings } from "@/lib/content";

export const runtime = "nodejs"; // explicit for Bolt’s Node web container

const brand = { ar: "برهوم", en: "Barhoum" };

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400","600","700"], variable: "--font-poppins", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400","600","700"], variable: "--font-nunito", display: "swap" });
const rubik = Rubik({ subsets: ["latin"], weight: ["400","600","700"], variable: "--font-rubik", display: "swap" });

export const metadata: Metadata = {
  title: "Barhoum Coaching",
  description: "Personal coaching for individuals, couples, and organizations.",
};

async function loadUi(): Promise<Record<"ar" | "en", UIStrings>> {
  const [ar, en] = await Promise.all([getUiStrings("ar"), getUiStrings("en")]);
  return { ar, en };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [ui, payments] = await Promise.all([loadUi(), getPayments()]);
  const defaultPaymentSlug = payments?.slug;
  const fontClass = [playfair.variable, inter.variable, poppins.variable, nunito.variable, rubik.variable].join(" ");

  return (
    <LocaleGate>
      <div className={fontClass}>
        <ThemeGate>
          <SiteHeader ui={ui} brand={brand} paymentSlug={defaultPaymentSlug} />
          <main>{children}</main>
        </ThemeGate>
      </div>
    </LocaleGate>
  );
}