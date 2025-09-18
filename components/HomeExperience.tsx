"use client";

import clsx from "classnames";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, HomeData, Locale, Package, Testimonial as TestimonialType, UIStrings } from "@/lib/content";
import { event } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import { useTheme } from "@/providers/theme-provider";
import type { ThemeName } from "@/design/tokens";
import { Container } from "./Container";
import { Section } from "./Section";
import { VideoEmbed } from "./VideoEmbed";
import { PdfCard } from "./PdfCard";
import { themeA } from "./home/theme-a";
import { themeB } from "./home/theme-b";
import { themeC } from "./home/theme-c";
import type {
  HomeThemeDefinition,
  LocalizedCategory,
  LocalizedPackage,
  LocalizedTestimonial,
} from "./home/types";

const HOME_THEMES: Record<ThemeName, HomeThemeDefinition> = {
  a: themeA,
  b: themeB,
  c: themeC,
};

const MEDIA_LAYOUT: Record<ThemeName, { sectionClass: string; videoGrid: string; pdfGrid: string; container: string }> = {
  a: {
    sectionClass: "bg-gradient-to-b from-black/10 via-transparent to-black/40",
    videoGrid: "grid gap-6 lg:grid-cols-[1.4fr,0.6fr]",
    pdfGrid: "flex flex-wrap gap-3",
    container: "space-y-[clamp(var(--space-sm),4vw,var(--space-md))]",
  },
  b: {
    sectionClass: "bg-background",
    videoGrid: "grid gap-4 md:grid-cols-2",
    pdfGrid: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
    container: "space-y-[clamp(var(--space-sm),3vw,var(--space-md))]",
  },
  c: {
    sectionClass: "bg-gradient-to-br from-[#fff3e4] via-white to-[#ffe9d6]",
    videoGrid: "grid gap-6 lg:grid-cols-[1fr,1fr]",
    pdfGrid: "flex flex-wrap gap-3",
    container: "space-y-[clamp(var(--space-sm),4vw,var(--space-lg))]",
  },
};

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
  const { theme } = useTheme();
  const strings = ui[locale];
  const Theme = HOME_THEMES[theme];

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
    () =>
      testimonials.map((testimonial) => ({
        id: testimonial.id,
        categoryId: testimonial.categoryId,
        quote: testimonial.quote[locale],
        name: testimonial.name,
        role: testimonial.role[locale],
      })),
    [testimonials, locale]
  );

  const initialCategory = localizedCategories[0]?.id;
  const [activeCategory, setActiveCategory] = useState<Category["id"] | undefined>(initialCategory);
  const [activePackageId, setActivePackageId] = useState<Package["id"] | undefined>();

  useEffect(() => {
    if (!activeCategory && initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [activeCategory, initialCategory]);

  const packagesForCategory = useMemo(
    () => localizedPackages.filter((pkg) => !activeCategory || pkg.categoryId === activeCategory),
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

  const testimonialsForCategory = useMemo(
    () => localizedTestimonials.filter((item) => !activeCategory || item.categoryId === activeCategory),
    [localizedTestimonials, activeCategory]
  );

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

  const mediaLayout = MEDIA_LAYOUT[theme];

  return (
    <>
      <Theme.Hero hero={home.hero} locale={locale} media={home.media} />

      <Section id="media" className={mediaLayout.sectionClass}>
        <Container className={mediaLayout.container}>
          <div className="space-y-4">
            <h2 className="font-heading text-[clamp(1.8rem,4vw,2.6rem)]">
              {strings.media.videos}
            </h2>
            <div className={mediaLayout.videoGrid}>
              {home.media.videos.map((video) => (
                <VideoEmbed key={video.id} videoId={video.id} title={video.title[locale]} />
              ))}
              {home.media.videos.length === 0 && (
                <div className="rounded-lg border border-border/60 p-6 text-sm text-subtle">
                  {strings.media.videos}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-heading text-[clamp(1.4rem,3vw,2rem)]">{strings.media.pdfs}</h3>
            <div className={clsx(mediaLayout.pdfGrid, "min-h-[3rem]")}> 
              {home.media.pdfs.map((pdf) => (
                <PdfCard key={pdf.url} href={pdf.url} label={pdf.label[locale]} localeLabel={strings.media.pdfs} />
              ))}
              {home.media.pdfs.length === 0 && (
                <span className="text-sm text-subtle">{strings.media.pdfs}</span>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <Theme.Categories
        categories={localizedCategories}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
        ui={strings}
      />

      <Theme.Packages
        packages={packagesForCategory}
        activePackageId={activePackageId}
        onSelect={handlePackageSelect}
        ui={strings}
      />

      <Theme.Testimonials testimonials={testimonialsForCategory} ui={strings} />

      <Theme.LeadForm
        selectedCategory={leadCategoryLabel}
        selectedPackage={leadPackageLabel}
        ui={strings}
      />
    </>
  );
}
