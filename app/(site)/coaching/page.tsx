import type { Metadata } from "next";
import CoachingPage from "@/components/legacy/CoachingPage";

export const metadata: Metadata = {
  title: "Coaching | Ibrahim Ben Abdallah",
  robots: { index: false, follow: false },
  alternates: { canonical: "/coaching" },
};

export default CoachingPage;
