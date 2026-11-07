import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StudentFrame } from "@/components/learning/StudentFrame";
import { readHeaderSignedIn } from "@/components/SiteHeaderSession";
import { getSiteConfig } from "@/lib/content";
import "../../styles/globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const [site, signedIn] = await Promise.all([getSiteConfig(), readHeaderSignedIn()]);
  return <StudentFrame signedIn={signedIn} brandLabel={site.brand.header.en} fontClassName={inter.variable}>{children}</StudentFrame>;
}
