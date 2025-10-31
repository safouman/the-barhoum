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

function buildPacksByCategory(
  programs: NormalizedProgram[]
): PacksByCategory {
  const locales: Locale[] = ["ar", "en"];
  const duplicateTargets: CategoryKey[] = ["me_and_the_other", "me_and_work"];

  const result: PacksByCategory = {
    me_and_me: { ar: [], en: [] },
    me_and_the_other: { ar: [], en: [] },
    me_and_work: { ar: [], en: [] },
  };

  programs.forEach((program) => {
    const sessions =
      program.sessions && program.sessions > 0 ? program.sessions : undefined;
    const priceTotal = program.priceAmountMinor / 100;
    const currency =
      program.programId.startsWith("program_") ? "TND" : (program.currency || "TND");

    locales.forEach((locale) => {
      const copy = program.copy[locale];
      if (!copy) return;

      const englishCopy = program.copy.en ?? copy;
      const title =
        englishCopy.title?.trim() || program.programId;
      const subtitle = copy.subtitle || "—";
      const bullets = copy.bullets.length ? copy.bullets : ["—"];
      const duration = copy.subtitle || program.durationLabel || "—";

      const pack: Pack = {
        programKey: program.programId as PackageId,
        sessions,
        title,
        subtitle,
        bullets,
        priceTotal,
        priceAmountMinor: Math.round(priceTotal * 100),
        currency,
        duration,
      };

      result.me_and_me[locale].push(pack);
    });
  });

  locales.forEach((locale) => {
    result.me_and_me[locale].sort((a, b) => {
      if (a.sessions != null && b.sessions != null) {
        return a.sessions - b.sessions;
      }
      if (a.sessions != null) return -1;
      if (b.sessions != null) return 1;
      return a.priceTotal - b.priceTotal;
    });

    duplicateTargets.forEach((category) => {
      if (result[category][locale].length > 0) {
        return;
      }
      result[category][locale] = result.me_and_me[locale].map((pack) => ({
        ...pack,
        bullets: [...pack.bullets],
      }));
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
