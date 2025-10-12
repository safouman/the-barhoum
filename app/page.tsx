import { HomeExperience } from "@/components/HomeExperience";
import { getCategories, getHomeData, getHomeMarkdown, getLeadFormCopy, getTestimonials, getUiStrings } from "@/lib/content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("home");

export default async function Page() {
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
    />
  );
}
