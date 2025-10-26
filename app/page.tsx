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

  const result: PacksByCategory = {
    individuals: { ar: [], en: [] },
    couples: { ar: [], en: [] },
    organizations: { ar: [], en: [] },
  };

  programs.forEach((program) => {
    const sessions = program.sessions && program.sessions > 0 ? program.sessions : 1;
    const currency = program.currency || "EUR";
    const priceTotal = program.priceAmountMinor / 100;
    const pricePerSession = priceTotal / Math.max(sessions, 1);

    locales.forEach((locale) => {
      const copy = program.copy[locale];
      if (!copy) return;

      const title = copy.title || program.programId;
      const subtitle = copy.subtitle || "—";
      const bullets = copy.bullets.length ? copy.bullets : ["—"];
      const duration = program.durationLabel || "—";

      const pack: Pack = {
        programKey: program.programId as PackageId,
        sessions,
        title,
        subtitle,
        bullets,
        priceTotal,
        priceAmountMinor: program.priceAmountMinor,
        pricePerSession,
        currency,
        duration,
      };

      result.individuals[locale].push(pack);
    });
  });

  locales.forEach((locale) => {
    result.individuals[locale].sort((a, b) => a.sessions - b.sessions);
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

  const packsAvailable = packs.individuals.ar.length > 0;
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
