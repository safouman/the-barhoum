"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, HomeData, Locale, Testimonial as TestimonialType, UIStrings } from "@/lib/content";
import { event } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import {
  HomeAbout,
  HomeCategories,
  HomeHero,
  PacksSection,
  HomeTestimonials,
} from "./home/sections";
import type { LocalizedCategory, LocalizedTestimonial } from "./home/types";

interface HomeExperienceProps {
  home: HomeData;
  categories: Category[];
  testimonials: TestimonialType[];
  ui: Record<Locale, UIStrings>;
}

export function HomeExperience({ home, categories, testimonials, ui }: HomeExperienceProps) {
  const { locale } = useLocale();
  const strings = ui[locale];

  const localizedCategories = useMemo<LocalizedCategory[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        label: category.label[locale],
        description: category.description[locale],
      })),
    [categories, locale]
  );

  const localizedTestimonials = useMemo<LocalizedTestimonial[]>(
    () => {
      const result = testimonials.map((testimonial) => {
        const localized = {
          id: testimonial.id,
          categoryId: testimonial.categoryId,
          quote: testimonial.quote,
          name: testimonial.name,
          role: testimonial.role,
        };
        return localized;
      });
      return result;
    },
    [testimonials]
  );

  const [activeCategory, setActiveCategory] = useState<Category["id"] | undefined>();

  // Show all testimonials, not filtered by category
  const testimonialsToShow = localizedTestimonials;

  const seenCategoriesRef = useRef(new Set<string>());
  useEffect(() => {
    if (activeCategory && !seenCategoriesRef.current.has(activeCategory)) {
      seenCategoriesRef.current.add(activeCategory);
      event("category_view", { category: activeCategory });
    }
  }, [activeCategory]);

  const handleCategorySelect = (id: Category["id"]) => {
    setActiveCategory(id);
  };

  return (
    <>
      <HomeHero hero={home.hero} locale={locale} media={home.media} />

      <HomeAbout locale={locale} media={home.media} />

      <HomeTestimonials testimonials={testimonialsToShow} ui={strings} locale={locale} />

      <HomeCategories
        categories={localizedCategories}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
        ui={strings}
      />

      {activeCategory && (
        <PacksSection
          locale={locale}
          direction={locale === "ar" ? "rtl" : "ltr"}
          category={activeCategory}
          onSelect={(pack) => {
            event("pack_select", { category: pack.category, sessions: pack.sessions });
          }}
          onContinue={(pack) => {
            event("pack_continue", { category: pack.category, sessions: pack.sessions });
          }}
        />
      )}

    </>
  );
}
