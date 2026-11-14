import type { Locale } from "@/lib/content";

// English is the approved Brand & Course Team Brief heading.
// Arabic and French are owner-review translation drafts.
export const homeRefinementCopy: Record<Locale, { heading: string }> = {
  en: { heading: "From awareness to impact" },
  ar: { heading: "من الوعي إلى الأثر" },
  fr: { heading: "De la prise de conscience à l’impact" },
};
