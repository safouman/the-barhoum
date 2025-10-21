import { Suspense } from "react";
import dynamic from "next/dynamic";
import type { Category, HomeData, LeadFormCopy, Locale, Testimonial, UIStrings } from "@/lib/content";
import { HomeHero } from "@/components/home/sections/Hero";
import { HomeMethod } from "@/components/home/sections/Method";
import { HomeInteractiveExperience } from "@/components/HomeInteractiveExperience";
import type { LocalizedTestimonial } from "@/components/home/types";

const HomeAbout = dynamic(() =>
  import("@/components/home/sections/About").then((mod) => ({
    default: mod.HomeAbout,
  })),
  { ssr: true, loading: () => <div className="py-20" aria-busy="true" /> }
);

const HomeTestimonials = dynamic(
  () =>
    import("@/components/home/sections/Testimonials").then((mod) => ({
      default: mod.HomeTestimonials,
    })),
  { ssr: true, loading: () => <div className="py-20" aria-busy="true" /> }
);

const HomeExperienceSection = dynamic(
  () =>
    import("@/components/home/sections/ExperienceSection").then((mod) => ({
      default: mod.HomeExperienceSection,
    })),
  { ssr: false, loading: () => null }
);

interface HomeExperienceProps {
  locale: Locale;
  home: HomeData;
  categories: Category[];
  testimonials: Testimonial[];
  ui: Record<Locale, UIStrings>;
  leadFormCopy: Record<Locale, LeadFormCopy>;
  heroCopy: Record<Locale, string>;
  aboutCopy: Record<Locale, string>;
  methodCopy: Record<Locale, string>;
}

export function HomeExperience({
  locale,
  home,
  categories,
  testimonials,
  ui,
  leadFormCopy,
  heroCopy,
  aboutCopy,
  methodCopy,
}: HomeExperienceProps) {
  const localizedTestimonials: LocalizedTestimonial[] = testimonials.map((testimonial) => ({
    id: testimonial.id,
    categoryId: testimonial.categoryId,
    quote: testimonial.quote,
    name: testimonial.name,
    role: testimonial.role,
  }));

  return (
    <>
      <HomeHero hero={home.hero} locale={locale} copy={heroCopy[locale]} />

      <Suspense fallback={<div className="py-24" aria-busy="true" />}>
        <HomeAbout locale={locale} media={home.media} about={home.about} markdown={aboutCopy[locale]} />
      </Suspense>

      <Suspense fallback={<div className="py-24" aria-busy="true" />}>
        <HomeTestimonials testimonials={localizedTestimonials} ui={ui[locale]} locale={locale} meta={home.testimonials} />
      </Suspense>

      <HomeMethod locale={locale} method={home.method} markdown={methodCopy[locale]} />

      <Suspense fallback={null}>
        <HomeExperienceSection />
      </Suspense>

      <HomeInteractiveExperience
        categories={categories}
        packs={home.packs}
        ui={ui}
        leadFormCopy={leadFormCopy}
      />
    </>
  );
}
