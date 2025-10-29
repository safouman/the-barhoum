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
    comingSoon: z.boolean().optional(),
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
    role: z.string(),
    quote: z.string(),
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

const languageOptionSchema = z.object({
    value: z.enum(["ar", "en"]),
    label: z.string(),
});

const siteNavItemSchema = z.object({
    href: z.string(),
    label: localizedSchema,
});

const siteSocialSchema = z.object({
    id: z.string(),
    href: z.string(),
    label: z.string(),
});

const leadFormFieldSchema = z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["text", "email", "tel", "textarea", "number"]).optional(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
    placeholder: z.string().optional(),
});

const leadFormStepSchema = z.object({
    id: z.string(),
    title: z.string(),
    helper: z.string(),
    fields: z.array(leadFormFieldSchema),
});

export const leadFormSchema = z.object({
    guidance: z.object({
        title: z.string(),
        paragraph: z.string(),
    }),
    chipLabelTemplate: z.string(),
    progressLabelTemplate: z.string(),
    summaryTitle: z.string(),
    privacy: z.string(),
    validation: z.object({
        required: z.string(),
        select: z.string(),
        phone: z.string(),
    }),
    thankYou: z.object({
        title: z.string(),
        body: z.string(),
        returnHome: z.string(),
    }),
    actionLabels: z.object({
        next: z.string(),
        back: z.string(),
    }),
    steps: z.array(leadFormStepSchema),
});

export type LeadFormCopy = z.infer<typeof leadFormSchema>;

export const homeSchema = z.object({
    hero: z.object({
        title: localizedSchema,
        signature: localizedSchema,
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
    about: z.object({
        headline: localizedSchema,
    }),
  testimonials: z.object({
    eyebrow: localizedSchema,
    cta: localizedSchema,
  }),
  method: z.object({
    title: localizedSchema,
  }),
});

export type HomeData = z.infer<typeof homeSchema>;

export const siteConfigSchema = z.object({
    brand: z.object({
        header: localizedSchema,
        footer: localizedSchema,
        tagline: localizedSchema,
    }),
    languageSwitch: z.object({
        options: z.array(languageOptionSchema),
    }),
    footerNav: z.array(siteNavItemSchema),
    socials: z.array(siteSocialSchema),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

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
    home: z.object({
        categories: z.object({
            eyebrow: z.string(),
        }),
        packs: z.object({
            eyebrow: z.string(),
            selectAriaLabel: z.string(),
            ready: z.string(),
            button: z.string(),
            overview: z.string(),
            comingSoon: z.string(),
        }),
    }),
});

export type UIStrings = z.infer<typeof uiSchema>;

const loadJson = cache(
    async <Schema extends z.ZodTypeAny>(fileName: string, schema: Schema) => {
        const filePath = path.join(process.cwd(), "data", fileName);
        const file = await fs.readFile(filePath, "utf8");
        const parsed = JSON.parse(file);
        return schema.parse(parsed) as z.infer<Schema>;
    }
);

export const getCategories = () =>
    loadJson("categories.json", z.array(categorySchema));
export const getPackages = () =>
    loadJson("packages.json", z.array(packageSchema));
export const getTestimonials = () =>
    loadJson("testimonials.json", z.array(testimonialSchema));
export const getHomeData = () => loadJson("home.json", homeSchema);
export const getUiStrings = (locale: Locale) =>
    loadJson(`ui.${locale}.json`, uiSchema);
export const getCvData = () => loadJson("cv.json", cvSchema);
export const getLinksData = () => loadJson("links.json", linksSchema);
export const getPayments = () => loadJson("payments.json", paymentsSchema);
export const getSiteConfig = () => loadJson("site.json", siteConfigSchema);
export const getLeadFormCopy = (locale: Locale) =>
    loadJson(`forms/lead.${locale}.json`, leadFormSchema);
export const getProgramCopy = () => loadJson("programs.json", programCopySchema);

const loadMarkdown = cache(async (filePath: string) => {
    const file = await fs.readFile(filePath, "utf8");
    return file.trim();
});

export const getHomeMarkdown = (
    section: "hero" | "about" | "method",
    locale: Locale
) => {
    const filePath = path.join(
        process.cwd(),
        "content",
        "home",
        `${section}.${locale}.md`
    );
    return loadMarkdown(filePath);
};

export type Locale = "ar" | "en";

export type LocalizedField = Localized;

export function resolveLocalized<T extends LocalizedField>(
    field: T,
    locale: Locale
) {
    return field[locale];
}
const programCopyItemSchema = z.object({
    title: z.string(),
    subtitle: z.string(),
    bullets: z.array(z.string()),
});

const programCopySchema = z.object({
    ar: z.record(z.string(), programCopyItemSchema),
    en: z.record(z.string(), programCopyItemSchema),
});
