import type { Metadata } from "next";
import { InformationPage, InformationResources, type InformationResource } from "@/components/brand/InformationPage";
import { brandCopy } from "@/lib/brand-copy";
import { getHomeData, getSiteConfig } from "@/lib/content";
import { publicPageCopy } from "@/lib/public-page-copy";
import { resolveLocale } from "@/lib/i18n.server";

export async function generateMetadata(): Promise<Metadata> {
  const copy = brandCopy[await resolveLocale()].pages.resources;
  return { title: copy.title, description: copy.intro, alternates: { canonical: "/resources" } };
}

export default async function ResourcesPage() {
  const [locale, site, home] = await Promise.all([resolveLocale(), getSiteConfig(), getHomeData()]);
  const copy = publicPageCopy[locale].resources;
  const resources: InformationResource[] = [
    { href: "/courses?" + new URLSearchParams({ lang: locale }), ...copy.preview },
  ];
  const introduction = home.media.videos.find((video) => video.fallback?.startsWith("/video/"));
  if (introduction?.fallback) resources.push({ href: introduction.fallback, ...copy.introduction });
  for (const social of site.socials) {
    if ((social.id === "instagram" || social.id === "youtube") && social.href.startsWith("https://")) {
      resources.push({ href: social.href, title: social.label, description: copy.socialDescription });
    }
  }

  return (
    <InformationPage locale={locale} eyebrow={copy.eyebrow} {...brandCopy[locale].pages.resources} sections={copy.sections}>
      <InformationResources resources={resources} linkLabel={copy.linkLabel} />
    </InformationPage>
  );
}
