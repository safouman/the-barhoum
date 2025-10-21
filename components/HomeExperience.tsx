"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, HomeData, LeadFormCopy, Locale, Testimonial as TestimonialType, UIStrings } from "@/lib/content";
import { event } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import {
  HomeAbout,
  HomeCategories,
  HomeExperienceSection,
  HomeHero,
  HomeLeadForm,
  HomeMethod,
  PacksSection,
  HomeTestimonials,
} from "./home/sections";
import type { LocalizedCategory, LocalizedTestimonial } from "./home/types";
import { formatPackCurrency } from "@/lib/commerce/packages";
import type { PackageId, PackSessions } from "@/lib/commerce/packages";

interface HomeExperienceProps {
  home: HomeData;
  categories: Category[];
  testimonials: TestimonialType[];
  ui: Record<Locale, UIStrings>;
  leadFormCopy: Record<Locale, LeadFormCopy>;
  heroCopy: Record<Locale, string>;
  aboutCopy: Record<Locale, string>;
  methodCopy: Record<Locale, string>;
}

export function HomeExperience({ home, categories, testimonials, ui, leadFormCopy, heroCopy, aboutCopy, methodCopy }: HomeExperienceProps) {
  const { locale } = useLocale();
  const strings = ui[locale];
  const heroMarkdown = heroCopy[locale];
  const aboutMarkdown = aboutCopy[locale];
  const methodMarkdown = methodCopy[locale];

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
        sessions: PackSessions;
        priceTotal: number;
        title: string;
        sessionsLabel: string;
        packageId: PackageId;
      }
    | null
  >(null);
  const [leadFormVisible, setLeadFormVisible] = useState(false);

  const scrollToId = useCallback((targetId: string) => {
    if (typeof window === "undefined") return;
    const element = document.getElementById(targetId);
    if (!element) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";
    element.scrollIntoView({ behavior, block: "start" });
  }, []);

  const formatCurrency = useCallback(
    (amount: number) => formatPackCurrency(amount, locale),
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

  const selectedPackageId = useMemo(() => {
    if (!selectedPack) return undefined;
    return selectedPack.packageId;
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

  useEffect(() => {
    if (!activeCategory) return;
    if (typeof window === "undefined") return;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const targetId = isDesktop ? "desktop-packs" : "mobile-packs";
    const frame = window.requestAnimationFrame(() => {
      scrollToId(targetId);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeCategory, scrollToId]);

  useEffect(() => {
    if (!expandedMobileCategory) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
    const frame = window.requestAnimationFrame(() => {
      scrollToId("mobile-packs");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expandedMobileCategory, scrollToId]);

  useEffect(() => {
    if (!leadFormVisible || !selectedPack) return;
    if (typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      scrollToId("lead-form");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [leadFormVisible, scrollToId, selectedPack]);

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
      <HomeHero hero={home.hero} locale={locale} copy={heroMarkdown} />

      <HomeAbout locale={locale} media={home.media} about={home.about} markdown={aboutMarkdown} />

      <HomeTestimonials testimonials={testimonialsToShow} ui={strings} locale={locale} meta={home.testimonials} />

      <HomeMethod locale={locale} method={home.method} markdown={methodMarkdown} />

      <HomeExperienceSection />

      <HomeCategories
        categories={localizedCategories}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
        expandedMobileCategory={expandedMobileCategory}
        onMobileToggle={handleMobileCategoryToggle}
        packs={home.packs}
        formCopy={leadFormCopy}
        selectedPack={selectedPack}
        leadFormVisible={leadFormVisible}
        activeCategoryLabel={activeCategoryLabel}
        selectedPackageLabel={selectedPackageLabel}
        selectedPackSummary={selectedPackSummary}
        activeCategoryId={activeCategory}
        selectedPackageId={selectedPackageId}
        onPackSelect={(pack) => {
          event("package_click", {
            action: "select",
            category: pack.category,
            sessions: pack.sessions,
          });
          setSelectedPack(pack);
        }}
        onPackContinue={(pack) => {
          event("package_click", {
            action: "continue",
            category: pack.category,
            sessions: pack.sessions,
          });
          setSelectedPack(pack);
          setLeadFormVisible(true);
        }}
        locale={locale}
        ui={strings}
      />

      {activeCategory && (
        <div className="hidden md:block">
          <PacksSection
            locale={locale}
            direction={locale === "ar" ? "rtl" : "ltr"}
            category={activeCategory}
            packs={home.packs}
            sectionId="desktop-packs"
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
            }}
          />
        </div>
      )}

      {leadFormVisible && selectedPack && (
        <div className="hidden md:block">
          <HomeLeadForm
            selectedCategory={activeCategory}
            selectedPackage={selectedPackageId}
            packSummary={selectedPackSummary}
            ui={strings}
            copy={leadFormCopy}
          />
        </div>
      )}

    </>
  );
}
