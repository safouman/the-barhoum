import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StudentFrame } from "@/components/learning/StudentFrame";
import { readStudentSession } from "@/lib/student-auth/session";
import "../../styles/globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = await readStudentSession();
  return <StudentFrame signedIn={Boolean(student)} fontClassName={inter.variable}>{children}</StudentFrame>;
}
