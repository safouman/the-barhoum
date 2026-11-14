import { BrandHero } from "@/components/brand/BrandHero";
import { resolveLocale } from "@/lib/i18n.server";

export default async function Page() {
  return <BrandHero locale={await resolveLocale()} />;
}
