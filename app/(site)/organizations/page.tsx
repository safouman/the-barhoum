import type { Metadata } from "next";
import { InformationAction, InformationPage } from "@/components/brand/InformationPage";
import { brandCopy } from "@/lib/brand-copy";
import { publicPageCopy } from "@/lib/public-page-copy";
import { resolveLocale } from "@/lib/i18n.server";

export async function generateMetadata(): Promise<Metadata> {
  const copy = brandCopy[await resolveLocale()].pages.organizations;
  return { title: copy.title, description: copy.intro, alternates: { canonical: "/organizations" } };
}

export default async function OrganizationsPage() {
  const locale = await resolveLocale();
  const copy = publicPageCopy[locale].organizations;
  return (
    <InformationPage locale={locale} eyebrow={copy.eyebrow} {...brandCopy[locale].pages.organizations} sections={copy.sections}>
      <InformationAction href={"/coaching?" + new URLSearchParams({ lang: locale }) + "#lead-form"}>{copy.action}</InformationAction>
    </InformationPage>
  );
}
