"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, LeadFormCopy, Locale, UIStrings, HomeData } from "@/lib/content";
import { event, updateAnalyticsContext } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import {
  HomeCategories,
  HomeLeadForm,
  PacksSection,
} from "@/components/home/sections";
import type { LocalizedCategory } from "@/components/home/types";
import { formatPackCurrency } from "@/lib/commerce/packages";
import type { PackSelection } from "@/lib/commerce/pack-selections";

interface HomeInteractiveExperienceProps {
  categories: Category[];
  packs: HomeData["packs"];
  ui: Record<Locale, UIStrings>;
  leadFormCopy: Record<Locale, LeadFormCopy>;
}

export function HomeInteractiveExperience({ categories, packs, ui, leadFormCopy }: HomeInteractiveExperienceProps) {
  const { locale } = useLocale();
  const strings = ui[locale];

  const localizedCategories = useMemo<LocalizedCategory[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        label: category.label[locale],
        description: category.description[locale],
        comingSoon: category.comingSoon ?? false,
      })),
    [categories, locale]
  );

  const [activeCategory, setActiveCategory] = useState<Category["id"] | undefined>();
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<Category["id"] | undefined>();
  const [selectedPack, setSelectedPack] = useState<PackSelection | null>(null);
  const [leadFormVisible, setLeadFormVisible] = useState(false);
  const lastFormOpenKeyRef = useRef<string | null>(null);

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

  const selectedPackageLabel = useMemo(() => selectedPack?.title, [selectedPack]);
  const selectedPackageId = useMemo(() => selectedPack?.packageId, [selectedPack]);

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

  const activeCategoryIsComingSoon = useMemo(() => {
    if (!activeCategory) return false;
    return categories.find((category) => category.id === activeCategory)?.comingSoon ?? false;
  }, [activeCategory, categories]);

  const seenCategoriesRef = useRef(new Set<string>());
  useEffect(() => {
    if (activeCategory && !seenCategoriesRef.current.has(activeCategory)) {
      seenCategoriesRef.current.add(activeCategory);
      event("category_view", { category: activeCategory });
    }
  }, [activeCategory]);

  useEffect(() => {
    updateAnalyticsContext({
      category: activeCategoryLabel ?? "none",
    });
  }, [activeCategoryLabel]);

  useEffect(() => {
    updateAnalyticsContext({
      program_name: selectedPack?.title ?? "none",
    });
  }, [selectedPack]);

  useEffect(() => {
    if (!leadFormVisible || !selectedPack) {
      return;
    }
    const openKey = `${selectedPack.packageId ?? "unknown"}|${activeCategory ?? "none"}`;
    if (lastFormOpenKeyRef.current === openKey) {
      return;
    }
    lastFormOpenKeyRef.current = openKey;
    event("form_opened", {
      category: activeCategoryLabel ?? activeCategory ?? "none",
      program_name: selectedPack.title,
      package_id: selectedPack.packageId,
    });
  }, [leadFormVisible, selectedPack, activeCategory, activeCategoryLabel]);

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
      <HomeCategories
        categories={localizedCategories}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
        expandedMobileCategory={expandedMobileCategory}
        onMobileToggle={handleMobileCategoryToggle}
        packs={packs}
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
      updateAnalyticsContext({ program_name: pack.title });
    }}
    onPackContinue={(pack) => {
      event("package_click", {
        action: "continue",
        category: pack.category,
        sessions: pack.sessions,
      });
      setSelectedPack(pack);
      updateAnalyticsContext({ program_name: pack.title });
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
            packs={packs}
            sectionId="desktop-packs"
            comingSoon={activeCategoryIsComingSoon}
            copy={strings.home.packs}
            onSelect={(pack) => {
              event("package_click", {
                action: "select",
                category: pack.category,
                sessions: pack.sessions,
              });
              setSelectedPack(pack);
              updateAnalyticsContext({ program_name: pack.title });
            }}
            onContinue={(pack) => {
              event("package_click", {
                action: "continue",
                category: pack.category,
                sessions: pack.sessions,
              });
              setSelectedPack(pack);
              updateAnalyticsContext({ program_name: pack.title });
              setLeadFormVisible(true);
            }}
          />
        </div>
      )}

      {leadFormVisible && selectedPack && !activeCategoryIsComingSoon && (
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
