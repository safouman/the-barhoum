import type { ReactElement } from "react";
import type { Category, HomeData, LeadFormCopy, Locale, Testimonial, UIStrings } from "@/lib/content";

export interface LocalizedCategory {
  id: Category["id"];
  label: string;
  description: string;
}

export interface LocalizedTestimonial {
  id: Testimonial["id"];
  categoryId: Category["id"];
  quote: string;
  name: string;
  role: string;
  initials?: string;
}

export interface HeroProps {
  hero: HomeData["hero"];
  locale: Locale;
  copy: string;
}

export interface AboutProps {
  locale: Locale;
  media: HomeData["media"];
  about: HomeData["about"];
  markdown: string;
}

export interface MethodProps {
  locale: Locale;
  method: HomeData["method"];
  markdown: string;
}

export interface CategoriesProps {
  categories: LocalizedCategory[];
  activeCategory?: Category["id"];
  onSelect: (id: Category["id"]) => void;
  expandedMobileCategory?: Category["id"];
  onMobileToggle: (id: Category["id"]) => void;
  packs: HomeData["packs"];
  formCopy: Record<Locale, LeadFormCopy>;
  selectedPack: {
    category: Category["id"];
    sessions: number;
    priceTotal: number;
    title: string;
    sessionsLabel: string;
  } | null;
  leadFormVisible: boolean;
  activeCategoryLabel?: string;
  selectedPackageLabel?: string;
  selectedPackSummary?: {
    categoryLabel: string;
    categoryValue: string;
    packageLabel: string;
    packageValue: string;
    sessionsLabel: string;
    priceLabel: string;
  };
  onPackSelect: (pack: { category: Category["id"]; sessions: number; priceTotal: number; title: string; sessionsLabel: string }) => void;
  onPackContinue: (pack: { category: Category["id"]; sessions: number; priceTotal: number; title: string; sessionsLabel: string }) => void;
  locale: Locale;
  ui: UIStrings;
}

export interface TestimonialsProps {
  testimonials: LocalizedTestimonial[];
  locale: Locale;
  meta: HomeData["testimonials"];
  ui: UIStrings;
}

export interface LeadFormProps {
  selectedCategory?: string;
  selectedPackage?: string;
  packSummary?: {
    categoryLabel: string;
    categoryValue: string;
    packageLabel: string;
    packageValue: string;
    sessionsLabel: string;
    priceLabel: string;
  };
  ui: UIStrings;
  copy: Record<Locale, LeadFormCopy>;
}

export interface HomeThemeDefinition {
  Hero: (props: HeroProps) => ReactElement;
  About: (props: AboutProps) => ReactElement;
  Method: (props: MethodProps) => ReactElement;
  Categories: (props: CategoriesProps) => ReactElement;
  Testimonials: (props: TestimonialsProps) => ReactElement | null;
  LeadForm: (props: LeadFormProps) => ReactElement;
}
