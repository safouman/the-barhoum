import { headers } from "next/headers";
import { resolveLocale } from "@/lib/i18n.server";
import type { Metadata } from "next";
import { siteFontClassName } from "@/lib/fonts";
import { StudentFrame } from "@/components/learning/StudentFrame";
import { readHeaderSignedIn } from "@/components/SiteHeaderSession";
import { getSiteConfig } from "@/lib/content";
import "../../styles/globals.css";
import "../../styles/brand/tokens.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const [site, signedIn, locale, requestHeaders] = await Promise.all([getSiteConfig(), readHeaderSignedIn(), resolveLocale(), headers()]);
  return <StudentFrame signedIn={signedIn} site={site} locale={locale} checkout={requestHeaders.get("x-barhoum-checkout") === "1"} fontClassName={siteFontClassName}>{children}</StudentFrame>;
}
