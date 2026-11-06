import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import "../../styles/globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <body className="min-h-screen bg-[#f2f8f6]">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex min-h-16 max-w-screen-xl flex-wrap items-center justify-between gap-x-4 px-4 py-2 sm:px-6">
            <Link href="/" aria-label="Barhoum home" className="inline-flex min-h-11 items-center">
              <Image src="/images/logo.png" alt="Barhoum" width={96} height={96} className="h-10 w-auto object-contain" />
            </Link>
            <Link href="/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#12685f] hover:underline">
              Browse Courses
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
