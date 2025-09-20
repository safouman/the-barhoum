import type { ReactElement } from "react";
import type { Category, HomeData, Locale, Package, Testimonial, UIStrings } from "@/lib/content";

export interface LocalizedCategory {
  id: Category["id"];
  label: string;
  description: string;
}

export interface LocalizedPackage {
  id: Package["id"];
  categoryId: Category["id"];
  title: string;
  priceLabel: string;
  features: string[];
  visible: boolean;
}

export interface LocalizedTestimonial {
  id: Testimonial["id"];
  categoryId: Category["id"];
  quote: string;
  name: string;
  role: string;
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

export interface PackagesProps {
  packages: LocalizedPackage[];
  activePackageId?: Package["id"];
  onSelect: (id: Package["id"]) => void;
  ui: UIStrings;
}

export interface TestimonialsProps {
  testimonials: LocalizedTestimonial[];
  ui: UIStrings;
}

export interface LeadFormProps {
  selectedCategory?: string;
  selectedPackage?: string;
  ui: UIStrings;
}

export interface HomeThemeDefinition {
  Hero: (props: HeroProps) => ReactElement;
  About: (props: AboutProps) => ReactElement;
  Categories: (props: CategoriesProps) => ReactElement;
  Packages: (props: PackagesProps) => ReactElement;
  Testimonials: (props: TestimonialsProps) => ReactElement;
  LeadForm: (props: LeadFormProps) => ReactElement;
}
