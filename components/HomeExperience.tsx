"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, HomeData, Locale, Testimonial as TestimonialType, UIStrings } from "@/lib/content";
import { event } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import {
  HomeAbout,
  HomeCategories,
  HomeHero,
  HomeLeadForm,
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
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<Category["id"] | undefined>();
  const [selectedPack, setSelectedPack] = useState<
    | {
        category: Category["id"];
        sessions: number;
        priceTotal: number;
        title: string;
        sessionsLabel: string;
      }
    | null
  >(null);
  const [leadFormVisible, setLeadFormVisible] = useState(false);

  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(amount),
    [locale]
  );

  const activeCategoryLabel = useMemo(() => {
    if (!activeCategory) return undefined;
    return localizedCategories.find((category) => category.id === activeCategory)?.label;
  }, [activeCategory, localizedCategories]);

  const selectedPackageLabel = useMemo(() => {
    if (!selectedPack) return undefined;
    return selectedPack.title;
  }, [selectedPack]);

  const selectedPackSummary = useMemo(() => {
    if (!selectedPack) return undefined;
    return {
      categoryLabel: strings.form.category,
      categoryValue: activeCategoryLabel ?? "-",
      packageLabel: strings.form.package,
      packageValue: selectedPack.title,
      sessionsLabel: selectedPack.sessionsLabel,
      priceLabel: formatCurrency(selectedPack.priceTotal),
    };
  }, [activeCategoryLabel, formatCurrency, selectedPack, strings.form.category, strings.form.package]);

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
    setSelectedPack(null);
    setLeadFormVisible(false);
  };

  const handleMobileCategoryToggle = (id: Category["id"]) => {
    if (expandedMobileCategory === id) {
      setExpandedMobileCategory(undefined);
    } else {
      setExpandedMobileCategory(id);
      setActiveCategory(id);
      setSelectedPack(null);
      setLeadFormVisible(false);
    }
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
        expandedMobileCategory={expandedMobileCategory}
        onMobileToggle={handleMobileCategoryToggle}
        locale={locale}
        ui={strings}
      />

      {activeCategory && (
        <div className="hidden md:block">
          <PacksSection
            locale={locale}
            direction={locale === "ar" ? "rtl" : "ltr"}
            category={activeCategory}
            onSelect={(pack) => {
              event("package_click", {
                action: "select",
                category: pack.category,
                sessions: pack.sessions,
              });
              setSelectedPack(pack);
            }}
            onContinue={(pack) => {
              event("package_click", {
                action: "continue",
                category: pack.category,
                sessions: pack.sessions,
              });
              setSelectedPack(pack);
              setLeadFormVisible(true);
              setTimeout(() => {
                if (typeof window !== "undefined") {
                  document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }, 0);
            }}
          />
        </div>
      )}

      {leadFormVisible && selectedPack && (
        <HomeLeadForm
          selectedCategory={activeCategoryLabel}
          selectedPackage={selectedPackageLabel}
          packSummary={selectedPackSummary}
          ui={strings}
        />
      )}

    </>
  );
}
