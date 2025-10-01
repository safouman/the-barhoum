import type { ReactElement } from "react";
import type { Category, HomeData, Locale, Testimonial, UIStrings } from "@/lib/content";

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
  media: HomeData["media"];
}

export interface AboutProps {
  locale: Locale;
  media: HomeData["media"];
}

export interface CategoriesProps {
  categories: LocalizedCategory[];
  activeCategory?: Category["id"];
  onSelect: (id: Category["id"]) => void;
  ui: UIStrings;
}

export interface TestimonialsProps {
  testimonials: LocalizedTestimonial[];
  ui: UIStrings;
  locale: Locale;
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
}

export interface HomeThemeDefinition {
  Hero: (props: HeroProps) => ReactElement;
  About: (props: AboutProps) => ReactElement;
  Categories: (props: CategoriesProps) => ReactElement;
  Testimonials: (props: TestimonialsProps) => ReactElement | null;
  LeadForm: (props: LeadFormProps) => ReactElement;
}
