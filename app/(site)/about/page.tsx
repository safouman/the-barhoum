import type { Metadata } from "next";
import { InformationAction, InformationPage } from "@/components/brand/InformationPage";
import { brandCopy } from "@/lib/brand-copy";
import { publicPageCopy } from "@/lib/public-page-copy";
import { resolveLocale } from "@/lib/i18n.server";

export async function generateMetadata(): Promise<Metadata> {
  const copy = brandCopy[await resolveLocale()].pages.about;
  return { title: copy.title, description: copy.intro, alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const locale = await resolveLocale();
  const copy = publicPageCopy[locale].about;
  return (
    <InformationPage locale={locale} eyebrow={copy.eyebrow} {...brandCopy[locale].pages.about} sections={copy.sections}>
      <InformationAction href={"/program?" + new URLSearchParams({ lang: locale })}>{copy.action}</InformationAction>
    </InformationPage>
  );
}
