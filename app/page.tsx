import type { Metadata } from "next";
import { HomeExperience } from "@/components/HomeExperience";
import {
  getCategories,
  getHomeData,
  getHomeMarkdown,
  getLeadFormCopy,
  getTestimonials,
  getUiStrings,
} from "@/lib/content";
import type { Locale } from "@/lib/content";
import type { CategoryKey, PackageId } from "@/lib/commerce/packages";
import { getPrograms } from "@/lib/programs";
import type { NormalizedProgram } from "@/lib/programs";
import { getPageMetadata } from "@/lib/seo";
import { resolveLocale } from "@/lib/i18n.server";
import type { Pack, PacksByCategory } from "@/components/home/sections/Packages";

const CATEGORY_ORDER: CategoryKey[] = [
  "me_and_me",
  "me_and_the_other",
  "me_and_work",
];

function buildPacksByCategory(
  programs: NormalizedProgram[]
): PacksByCategory {
  const locales: Locale[] = ["ar", "en"];

  const result = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = { ar: [], en: [] };
    return acc;
  }, {} as PacksByCategory);

  programs.forEach((program) => {
    const category =
      program.categoryId && CATEGORY_ORDER.includes(program.categoryId)
        ? program.categoryId
        : "me_and_me";
    const categoryBuckets = result[category];
    const sessions =
      program.sessions && program.sessions > 0 ? program.sessions : undefined;
    const priceAmountMinor = program.priceAmountMinor;
    const priceTotal = priceAmountMinor / 100;
    const currency = "TND";

    locales.forEach((locale) => {
      const localeCopy = program.copy[locale];
      if (!localeCopy) return;
      const fallbackCopy = program.copy.en ?? localeCopy;

      const title =
        fallbackCopy.title?.trim() || program.programId;
      const subtitle = localeCopy.subtitle || "—";
      const bullets = localeCopy.bullets.length ? localeCopy.bullets : ["—"];
      const duration = localeCopy.subtitle || program.durationLabel || "—";

      categoryBuckets[locale].push({
        programKey: program.programId as PackageId,
        sessions,
        title,
        subtitle,
        bullets,
        priceTotal,
        priceAmountMinor,
        currency,
        duration,
      });
    });
  });

  CATEGORY_ORDER.forEach((category) => {
    locales.forEach((locale) => {
      result[category][locale].sort((a, b) => {
        if (a.sessions != null && b.sessions != null) {
          return a.sessions - b.sessions;
        }
        if (a.sessions != null) return -1;
        if (b.sessions != null) return 1;
        return a.priceTotal - b.priceTotal;
      });
    });
  });

  return result;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveLocale();
  return getPageMetadata("home", locale);
}

export default async function Page() {
  const locale = resolveLocale();
  const [
    home,
    categories,
    testimonials,
    uiAr,
    uiEn,
    leadFormAr,
    leadFormEn,
    heroAr,
    heroEn,
    aboutAr,
    aboutEn,
    methodAr,
    methodEn,
  ] = await Promise.all([
    getHomeData(),
    getCategories(),
    getTestimonials(),
    getUiStrings("ar"),
    getUiStrings("en"),
    getLeadFormCopy("ar"),
    getLeadFormCopy("en"),
    getHomeMarkdown("hero", "ar"),
    getHomeMarkdown("hero", "en"),
    getHomeMarkdown("about", "ar"),
    getHomeMarkdown("about", "en"),
    getHomeMarkdown("method", "ar"),
    getHomeMarkdown("method", "en"),
  ]);

  const programResult = await getPrograms();
  if (programResult.warnings.length) {
    console.warn("[Catalog] Stripe catalog warnings", programResult.warnings);
  }
  const packs = buildPacksByCategory(programResult.programs);
  const catalogStatus = programResult.status;

  const packsAvailable = packs.me_and_me.ar.length > 0;
  if (!packsAvailable) {
    console.warn("[Catalog] No Stripe programs resolved", {
      status: catalogStatus,
      warnings: programResult.warnings,
    });
  }

  return (
    <HomeExperience
      home={home}
      categories={categories}
      testimonials={testimonials}
      ui={{ ar: uiAr, en: uiEn }}
      leadFormCopy={{ ar: leadFormAr, en: leadFormEn }}
      heroCopy={{ ar: heroAr, en: heroEn }}
      aboutCopy={{ ar: aboutAr, en: aboutEn }}
      methodCopy={{ ar: methodAr, en: methodEn }}
      locale={locale}
      packs={packs}
      catalogStatus={catalogStatus}
    />
  );
}
