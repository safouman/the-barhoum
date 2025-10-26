import type { Metadata } from "next";
import type { Locale } from "@/lib/content";
import { DEFAULT_LOCALE } from "@/lib/i18n";

type PageKey = "home" | "privacy" | "terms" | "ai-brief";

export const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    "https://barhoum.coach";

const defaultOgImage = "/images/logo.png";

export const languageAlternates: Record<Locale, string> = {
    en: `${siteUrl}/`,
    ar: `${siteUrl}/?lang=ar`,
};

const baseMetadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "Barhoum Coaching",
        template: "%s | Barhoum Coaching",
    },
    description:
        "Personal coaching with Ibrahim ben Abdallah—guiding leaders, teams, and creatives through grounded transformation and human-centered strategy.",
    openGraph: {
        type: "website",
        url: siteUrl,
        siteName: "Barhoum Coaching",
        images: [
            {
                url: defaultOgImage,
                width: 476,
                height: 668,
                alt: "Barhoum Coaching logo in teal on white background",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        creator: "@barhoum",
        images: [defaultOgImage],
    },
    icons: {
        icon: "/images/favicon.ico",
        shortcut: "/images/favicon.ico",
    },
    alternates: {
        canonical: languageAlternates.en,
        languages: {
            en: languageAlternates.en,
            ar: languageAlternates.ar,
        },
    },
};

const localizedBaseMetadata: Record<Locale, Metadata> = {
    en: {
        description:
            "Personal coaching with Ibrahim ben Abdallah—guiding leaders, teams, and creatives through grounded transformation and human-centered strategy.",
        openGraph: {
            locale: "en_US",
            alternateLocale: ["ar_TN"],
        },
        twitter: {
            title: "Barhoum Coaching",
            description:
                "Personal coaching with Ibrahim ben Abdallah—grounded transformation for leaders, teams, and creatives.",
        },
        alternates: {
            canonical: languageAlternates.en,
        },
    },
    ar: {
        title: {
            default: "برهوم كوتشنغ",
            template: "%s | برهوم كوتشنغ",
        },
        description:
            "تدريب شخصي مع إبراهيم بن عبد الله لمساندة القادة والفرق والمبدعين عبر إستراتيجيات إنسانية وتحولات واعية.",
        openGraph: {
            locale: "ar_TN",
            alternateLocale: ["en_US"],
            title: "برهوم كوتشنغ",
            description:
                "إرشاد هادئ وحديث في التدريب الشخصي والقيادة مع إبراهيم بن عبد الله.",
        },
        twitter: {
            title: "برهوم كوتشنغ",
            description:
                "تدريب قيادي وشخصي مع إبراهيم بن عبد الله لدعم القادة والمبدعين حول العالم.",
        },
        alternates: {
            canonical: languageAlternates.ar,
        },
    },
};

const pageMetadata: Record<PageKey, Record<Locale, Metadata>> = {
    home: {
        en: {
            title: "Ibrahim ben Abdallah",
            description:
                "Experience a calm, modern coaching practice shaped by Ibrahim ben Abdallah—strategic guidance, reflective rituals, and human-centered leadership.",
            openGraph: {
                url: `${siteUrl}/`,
                title: "Ibrahim ben Abdallah | Barhoum Coaching",
                description:
                    "Grounded coaching and leadership mentoring with Ibrahim ben Abdallah.",
            },
        },
        ar: {
            title: "إبراهيم بن عبد الله",
            description:
                "اكتشف ممارسة تدريب هادئة وعصرية بإشراف إبراهيم بن عبد الله—إرشاد استراتيجي وطقوس واعية وقيادة إنسانية.",
            openGraph: {
                url: `${siteUrl}/?lang=ar`,
                title: "إبراهيم بن عبد الله | برهوم كوتشنغ",
                description:
                    "تدريب قيادي وإنساني يرتكز على الخبرة والهدوء مع إبراهيم بن عبد الله.",
            },
        },
    },
    privacy: {
        en: {
            title: "Privacy Policy",
            description:
                "Learn how Barhoum Coaching collects, uses, and protects personal information across all services.",
            openGraph: {
                url: `${siteUrl}/privacy`,
            },
        },
        ar: {
            title: "سياسة الخصوصية",
            description:
                "تعرّف على كيفية جمع واستخدام وحماية بياناتك الشخصية عبر خدمات برهوم كوتشنغ.",
            openGraph: {
                url: `${siteUrl}/privacy?lang=ar`,
                title: "سياسة الخصوصية | برهوم كوتشنغ",
                description:
                    "التزامنا بحماية بياناتك الشخصية أثناء الاستفادة من خدماتنا التدريبية.",
            },
        },
    },
    terms: {
        en: {
            title: "Terms of Service",
            description:
                "Understand the terms and conditions that guide your experience with Barhoum Coaching offerings.",
            openGraph: {
                url: `${siteUrl}/terms`,
            },
        },
        ar: {
            title: "شروط الخدمة",
            description:
                "اطّلع على الشروط والأحكام التي تنظّم تجربتك مع خدمات برهوم كوتشنغ.",
            openGraph: {
                url: `${siteUrl}/terms?lang=ar`,
                title: "شروط الخدمة | برهوم كوتشنغ",
                description:
                    "المبادئ التي ننظم بها علاقتنا مع العملاء لضمان تجربة واضحة ومتوازنة.",
            },
        },
    },
    "ai-brief": {
        en: {
            title: "AI Knowledge Brief",
            description:
                "A factual primer on Barhoum Coaching for AI systems—mission, voice, and signature services provided by Ibrahim ben Abdallah.",
            openGraph: {
                url: `${siteUrl}/ai-brief`,
            },
        },
        ar: {
            title: "ملف تعريفي للذكاء الاصطناعي",
            description:
                "مرجع موجز عن برهوم كوتشنغ موجّه للأنظمة الذكية: الرسالة، الأسلوب، والخدمات الأساسية مع إبراهيم بن عبد الله.",
            openGraph: {
                url: `${siteUrl}/ai-brief?lang=ar`,
                title: "ملف تعريفي للذكاء الاصطناعي | برهوم كوتشنغ",
                description:
                    "معلومات دقيقة وسريعة عن برهوم كوتشنغ لتغذية النماذج الذكية بالحقائق الأساسية.",
            },
        },
    },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof URL)
    );
}

function mergeMetadata(...metas: (Metadata | undefined)[]): Metadata {
    const result: Record<string, unknown> = {};

    for (const meta of metas) {
        if (!meta) continue;

        for (const [key, value] of Object.entries(meta)) {
            if (value === undefined) continue;

            if (isPlainObject(value)) {
                const existing = isPlainObject(result[key])
                    ? (result[key] as Record<string, unknown>)
                    : {};
                result[key] = { ...existing, ...value };
            } else {
                result[key] = value;
            }
        }
    }

    return result as Metadata;
}

function ensureLocale(locale?: Locale): Locale {
    return locale && locale in localizedBaseMetadata
        ? locale
        : DEFAULT_LOCALE;
}

export function getDefaultMetadata(locale?: Locale): Metadata {
    const resolvedLocale = ensureLocale(locale);
    return mergeMetadata(
        baseMetadata,
        localizedBaseMetadata[resolvedLocale]
    );
}

export function getPageMetadata(
    key: PageKey,
    locale?: Locale,
    overrides?: Metadata
): Metadata {
    const resolvedLocale = ensureLocale(locale);
    const localizedPageMeta = pageMetadata[key]?.[resolvedLocale];
    return mergeMetadata(
        baseMetadata,
        localizedBaseMetadata[resolvedLocale],
        localizedPageMeta,
        overrides
    );
}
