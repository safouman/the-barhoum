import { HomeExperience } from "@/components/HomeExperience";
import { getCategories, getHomeData, getLeadFormCopy, getTestimonials, getUiStrings } from "@/lib/content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("home");

export default async function Page() {
  const [home, categories, testimonials, uiAr, uiEn, leadFormAr, leadFormEn] = await Promise.all([
    getHomeData(),
    getCategories(),
    getTestimonials(),
    getUiStrings("ar"),
    getUiStrings("en"),
    getLeadFormCopy("ar"),
    getLeadFormCopy("en"),
  ]);

  return (
    <HomeExperience
      home={home}
      categories={categories}
      testimonials={testimonials}
      ui={{ ar: uiAr, en: uiEn }}
      leadFormCopy={{ ar: leadFormAr, en: leadFormEn }}
    />
  );
}
