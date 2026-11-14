import { headers } from "next/headers";
import { resolveLocale } from "@/lib/i18n.server";
import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic, Playfair_Display } from "next/font/google";
import { StudentFrame } from "@/components/learning/StudentFrame";
import { readHeaderSignedIn } from "@/components/SiteHeaderSession";
import { getSiteConfig } from "@/lib/content";
import "../../styles/globals.css";
import "../../styles/brand/tokens.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });

const noto = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "600"], variable: "--font-noto-naskh", display: "swap" });

const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-playfair", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const [site, signedIn, locale, requestHeaders] = await Promise.all([getSiteConfig(), readHeaderSignedIn(), resolveLocale(), headers()]);
  return <StudentFrame signedIn={signedIn} site={site} locale={locale} checkout={requestHeaders.get("x-barhoum-checkout") === "1"} fontClassName={`${inter.variable} ${noto.variable} ${playfair.variable}`}>{children}</StudentFrame>;
}
