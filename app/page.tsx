import { HomeExperience } from "@/components/HomeExperience";
import { getCategories, getHomeData, getPackages, getTestimonials, getUiStrings } from "@/lib/content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("home");

export default async function Page() {
  const [home, categories, packages, testimonials, uiAr, uiEn] = await Promise.all([
    getHomeData(),
    getCategories(),
    getPackages(),
    getTestimonials(),
    getUiStrings("ar"),
    getUiStrings("en"),
  ]);

  return <HomeExperience home={home} categories={categories} packages={packages} testimonials={testimonials} ui={{ ar: uiAr, en: uiEn }} />;
}
