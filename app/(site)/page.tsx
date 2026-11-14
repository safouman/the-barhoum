import { HomeIntroduction } from "@/components/brand/HomeIntroduction";
import { BrandHero } from "@/components/brand/BrandHero";
import { resolveLocale } from "@/lib/i18n.server";

export default async function Page() {
  const locale = await resolveLocale();
  return <>
    <BrandHero locale={locale} />
    <HomeIntroduction locale={locale} />
  </>;
}
