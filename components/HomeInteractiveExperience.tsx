"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, LeadFormCopy, Locale, UIStrings } from "@/lib/content";
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
import type { PacksByCategory } from "@/components/home/sections/Packages";

interface HomeInteractiveExperienceProps {
  categories: Category[];
  packs: PacksByCategory;
  ui: Record<Locale, UIStrings>;
  leadFormCopy: Record<Locale, LeadFormCopy>;
  catalogStatus: "ok" | "stale" | "empty" | "unavailable";
}

export function HomeInteractiveExperience({ categories, packs, ui, leadFormCopy, catalogStatus }: HomeInteractiveExperienceProps) {
  const { locale } = useLocale();
  const strings = ui[locale];
  const individualsUnavailable = (packs.individuals?.[locale] ?? []).length === 0;

  const localizedCategories = useMemo<LocalizedCategory[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        label: category.label[locale],
        description: category.description[locale],
        comingSoon:
          category.id === "individuals"
            ? individualsUnavailable
            : category.comingSoon ?? false,
      })),
    [categories, locale, individualsUnavailable]
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
    (amount: number, currency: string) =>
      formatPackCurrency(amount, locale, currency),
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
      priceLabel: formatCurrency(selectedPack.priceTotal, selectedPack.currency),
    };
  }, [activeCategoryLabel, formatCurrency, selectedPack, strings.form.category, strings.form.package]);

  const activeCategoryIsComingSoon = useMemo(() => {
    if (!activeCategory) return false;
    return localizedCategories.find((category) => category.id === activeCategory)?.comingSoon ?? false;
  }, [activeCategory, localizedCategories]);

  const seenCategoriesRef = useRef(new Set<string>());
  useEffect(() => {
    if (activeCategory && !seenCategoriesRef.current.has(activeCategory)) {
      seenCategoriesRef.current.add(activeCategory);
      event("category_view", { category: activeCategory });
    }
  }, [activeCategory]);

  useEffect(() => {
    updateAnalyticsContext({
      category: activeCategory ?? "none",
    });
  }, [activeCategory]);

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
      category: activeCategory ?? "none",
      program_name: selectedPack.title,
      package_id: selectedPack.packageId,
    });
  }, [leadFormVisible, selectedPack, activeCategory]);

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

  const packsCopy = useMemo(() => {
    if (catalogStatus === "unavailable") {
      const message = locale === "ar" ? "الكاتالوج غير متوفر مؤقتًا." : "Catalog temporarily unavailable.";
      return { ...strings.home.packs, comingSoon: message };
    }
    if (catalogStatus === "empty") {
      const message = locale === "ar" ? "قريبًا." : "Coming soon.";
      return { ...strings.home.packs, comingSoon: message };
    }
    return strings.home.packs;
  }, [catalogStatus, locale, strings.home.packs]);

  return (
    <>
      {catalogStatus === "stale" && (
        <div className="mb-6 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {locale === "ar"
            ? "نعرض بيانات الكاتالوج من نسخة احتياطية مؤقتة حتى نستعيد الاتصال بسترايب."
            : "Showing cached catalog data while Stripe is unreachable."}
        </div>
      )}
      {catalogStatus === "unavailable" && (
        <div className="mb-6 rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-sm text-red-900">
          {locale === "ar"
            ? "الكاتالوج غير متوفر الآن. جرّب زيارة هذه الصفحة لاحقًا أو تواصل معنا."
            : "The catalog is currently unavailable. Please check back soon or contact us."}
        </div>
      )}
      <HomeCategories
        categories={localizedCategories}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
        expandedMobileCategory={expandedMobileCategory}
        onMobileToggle={handleMobileCategoryToggle}
        packs={packs}
        packsCopy={packsCopy}
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
            copy={packsCopy}
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
