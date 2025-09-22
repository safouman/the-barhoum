"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, HomeData, Locale, Package, Testimonial as TestimonialType, UIStrings } from "@/lib/content";
import { event } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import {
  HomeAbout,
  HomeCategories,
  HomeHero,
  HomeLeadForm,
  HomePackages,
  HomeTestimonials,
} from "./home/sections";
import type { LocalizedCategory, LocalizedPackage, LocalizedTestimonial } from "./home/types";

interface HomeExperienceProps {
  home: HomeData;
  categories: Category[];
  packages: Package[];
  testimonials: TestimonialType[];
  ui: Record<Locale, UIStrings>;
}

function formatPrice(price: Package["price"], locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);
}

export function HomeExperience({ home, categories, packages, testimonials, ui }: HomeExperienceProps) {
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

  const localizedPackages = useMemo<LocalizedPackage[]>(
    () =>
      packages
        .filter((pkg) => pkg.visible)
        .map((pkg) => ({
          id: pkg.id,
          categoryId: pkg.categoryId,
          title: pkg.title[locale],
          priceLabel: formatPrice(pkg.price, locale),
          features: pkg.features[locale],
          visible: pkg.visible,
        })),
    [packages, locale]
  );

  const localizedTestimonials = useMemo<LocalizedTestimonial[]>(
    () => {
      console.log('Processing testimonials for locale:', locale);
      const result = testimonials.map((testimonial) => {
        console.log('Original testimonial:', testimonial);
        const localized = {
          id: testimonial.id,
          categoryId: testimonial.categoryId,
          quote: testimonial.quote[locale],
          name: testimonial.name,
          role: testimonial.role[locale],
        };
        console.log('Localized testimonial:', localized);
        return localized;
      });
      return result;
    },
    [testimonials, locale]
  );

  const [activeCategory, setActiveCategory] = useState<Category["id"] | undefined>();
  const [activePackageId, setActivePackageId] = useState<Package["id"] | undefined>();

  const packagesForCategory = useMemo(
    () => (activeCategory ? localizedPackages.filter((pkg) => pkg.categoryId === activeCategory) : []),
    [localizedPackages, activeCategory]
  );

  useEffect(() => {
    if (!packagesForCategory.length) {
      setActivePackageId(undefined);
      return;
    }
    if (!activePackageId || !packagesForCategory.some((pkg) => pkg.id === activePackageId)) {
      setActivePackageId(packagesForCategory[0].id);
    }
  }, [packagesForCategory, activePackageId]);

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

  const handlePackageSelect = (id: Package["id"]) => {
    setActivePackageId(id);
    event("package_click", { package: id });
  };

  const leadCategoryLabel = localizedCategories.find((item) => item.id === activeCategory)?.label;
  const leadPackageLabel = useMemo(() => {
    const match = localizedPackages.find((pkg) => pkg.id === activePackageId);
    return match?.title;
  }, [localizedPackages, activePackageId]);

  const hasPackages = packagesForCategory.length > 0;

  return (
    <>
      <HomeHero hero={home.hero} locale={locale} media={home.media} />

      <HomeAbout locale={locale} media={home.media} />

      <HomeTestimonials testimonials={testimonialsToShow} ui={strings} />

      <HomeCategories
        categories={localizedCategories}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
        ui={strings}
      />

      {hasPackages && (
        <HomePackages
          packages={packagesForCategory}
          activePackageId={activePackageId}
          onSelect={handlePackageSelect}
          ui={strings}
        />
      )}


      {activeCategory && activePackageId && leadPackageLabel && (
        <HomeLeadForm
          selectedCategory={leadCategoryLabel}
          selectedPackage={leadPackageLabel}
          ui={strings}
        />
      )}
    </>
  );
}
