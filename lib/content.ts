import { cache } from "react";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

export const localizedSchema = z.object({
  ar: z.string(),
  en: z.string(),
});

type Localized = z.infer<typeof localizedSchema>;

const categoryIdSchema = z.union([
  z.literal("individuals"),
  z.literal("couples"),
  z.literal("organizations"),
]);

export const categorySchema = z.object({
  id: categoryIdSchema,
  label: localizedSchema,
  description: localizedSchema,
});

export type Category = z.infer<typeof categorySchema>;

const priceSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.union([z.literal("EUR"), z.literal("USD")]),
});

export const packageSchema = z.object({
  id: z.string(),
  categoryId: categoryIdSchema,
  title: localizedSchema,
  price: priceSchema,
  features: z.object({
    ar: z.array(z.string()),
    en: z.array(z.string()),
  }),
  visible: z.boolean(),
});

export type Package = z.infer<typeof packageSchema>;

export const testimonialSchema = z.object({
  id: z.string(),
  categoryId: categoryIdSchema,
  name: z.string(),
  role: localizedSchema,
  quote: localizedSchema,
});

export type Testimonial = z.infer<typeof testimonialSchema>;

const cvEntrySchema = z.object({
  id: z.string(),
  title: localizedSchema,
  subtitle: localizedSchema.optional(),
  period: localizedSchema.optional(),
  bullets: z.object({
    ar: z.array(z.string()),
    en: z.array(z.string()),
  }),
});

const cvSectionSchema = z.object({
  id: z.string(),
  title: localizedSchema,
  items: z.array(cvEntrySchema),
});

export const cvSchema = z.object({
  summary: z.array(localizedSchema),
  sections: z.array(cvSectionSchema),
  pdf: z.string(),
});

export type CvData = z.infer<typeof cvSchema>;

export const linkItemSchema = z.object({
  id: z.string(),
  title: localizedSchema,
  description: localizedSchema,
  url: z.string(),
});

export type LinkItem = z.infer<typeof linkItemSchema>;

export const linksSchema = z.array(linkItemSchema);

export const paymentSchema = z.object({
  slug: z.string(),
  client: localizedSchema,
  packageTitle: localizedSchema,
  amount: priceSchema,
  discount: z.number().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;

export const paymentsSchema = z.array(paymentSchema);

export const homeSchema = z.object({
  hero: z.object({
    title: localizedSchema,
    subtitle: localizedSchema,
    cta: localizedSchema,
  }),
  media: z.object({
    videos: z
      .array(
        z.object({
          id: z.string(),
          title: localizedSchema,
        })
      )
      .default([]),
    pdfs: z
      .array(
        z.object({
          url: z.string(),
          label: localizedSchema,
        })
      )
      .default([]),
  }),
});

export type HomeData = z.infer<typeof homeSchema>;

export const uiSchema = z.object({
  nav: z.object({
    home: z.string(),
    cv: z.string(),
    links: z.string(),
    pay: z.string(),
  }),
  form: z.object({
    title: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    notes: z.string(),
    submit: z.string(),
    category: z.string(),
    package: z.string(),
  }),
  testimonials: z.string(),
  packages: z.string(),
  categories: z.string(),
  media: z.object({
    videos: z.string(),
    pdfs: z.string(),
  }),
  links: z.object({
    title: z.string(),
    description: z.string(),
  }),
  cv: z.object({
    title: z.string(),
    download: z.string(),
  }),
  payment: z.object({
    title: z.string(),
    client: z.string(),
    amount: z.string(),
    discount: z.string(),
    price: z.string(),
  }),
  language: z.object({
    label: z.string(),
    ar: z.string(),
    en: z.string(),
  }),
});

export type UIStrings = z.infer<typeof uiSchema>;

const loadJson = cache(async <Schema extends z.ZodTypeAny>(fileName: string, schema: Schema) => {
  const filePath = path.join(process.cwd(), "data", fileName);
  const file = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(file);
  return schema.parse(parsed) as z.infer<Schema>;
});

export const getCategories = () => loadJson("categories.json", z.array(categorySchema));
export const getPackages = () => loadJson("packages.json", z.array(packageSchema));
export const getTestimonials = () => loadJson("testimonials.json", z.array(testimonialSchema));
export const getHomeData = () => loadJson("home.json", homeSchema);
export const getUiStrings = (locale: Locale) => loadJson(`ui.${locale}.json`, uiSchema);
export const getCvData = () => loadJson("cv.json", cvSchema);
export const getLinksData = () => loadJson("links.json", linksSchema);
export const getPayments = () => loadJson("payments.json", paymentsSchema);

export type Locale = "ar" | "en";

export type LocalizedField = Localized;

export function resolveLocalized<T extends LocalizedField>(field: T, locale: Locale) {
  return field[locale];
}
