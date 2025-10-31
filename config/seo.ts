import type { MetadataRoute } from "next";
import type { Locale } from "@/lib/content";

export type SeoPageKey = "home" | "privacy" | "terms" | "ai-brief";

type LocaleValueMap<T> = Record<Locale, T>;

type PageLocaleEntry = {
    title: string;
    description: string;
    ogTitle?: string;
    ogDescription?: string;
    canonical?: string;
};

export type SeoPageConfig = {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
    locales: LocaleValueMap<PageLocaleEntry>;
};

export type SeoBrandConfig = {
    organization: {
        name: string;
        legalName: string;
        slogan: LocaleValueMap<string>;
    };
    person: {
        name: string;
        alternateName: string[];
        jobTitle: string;
        description: string;
        image: string;
    };
    domains: {
        primary: string;
        secondary: string[];
    };
    socials: string[];
    areaServed: string[];
    availableLanguages: string[];
};

export type SeoConfig = {
    brand: SeoBrandConfig;
    defaultTitle: LocaleValueMap<string>;
    titleTemplate: LocaleValueMap<string>;
    siteName: LocaleValueMap<string>;
    description: LocaleValueMap<string>;
    openGraphLocale: LocaleValueMap<string>;
    openGraphDescription: LocaleValueMap<string>;
    openGraphImage: {
        url: string;
        width: number;
        height: number;
        alt: LocaleValueMap<string>;
    };
    twitter: {
        creator: string;
        title: LocaleValueMap<string>;
        description: LocaleValueMap<string>;
    };
    pages: Record<SeoPageKey, SeoPageConfig>;
};

export const seoConfig: SeoConfig = {
    brand: {
        organization: {
            name: "Ibrahim Ben Abdallah",
            legalName: "Whispered Life OÜ",
            slogan: {
                en: "For a Better World",
                ar: "من أجل عالم أفضل",
            },
        },
        person: {
            name: "Ibrahim Ben Abdallah",
            alternateName: ["إبراهيم بن عبد الله", "Barhoum"],
            jobTitle: "Self-leadership coach and facilitator",
            description:
                "Coach and strategic guide helping leaders, couples, and creatives transform confusion into grounded action.",
            image: "/images/hero.jpeg",
        },
        domains: {
            primary: "https://ibrahimbenabdallah.com",
            secondary: ["https://ibrahimbenabdallah.training"],
        },
        socials: [
            "https://instagram.com/barhoum",
            "https://youtube.com/@barhoum",
        ],
        areaServed: ["Global (Online)", "Tunisia"],
        availableLanguages: ["en", "ar", "fr"],
    },
    defaultTitle: {
        en: "Ibrahim Ben Abdallah",
        ar: "برهوم كوتشنغ",
    },
    titleTemplate: {
        en: "%s | Ibrahim Ben Abdallah",
        ar: "%s | برهوم كوتشنغ",
    },
    siteName: {
        en: "Ibrahim Ben Abdallah",
        ar: "برهوم كوتشنغ",
    },
    description: {
        en: "Personal coaching with Ibrahim Ben Abdallah—guiding leaders, teams, and creatives through grounded transformation and human-centered strategy.",
        ar: "تدريب شخصي مع إبراهيم بن عبد الله لمساندة القادة والفرق والمبدعين عبر إستراتيجيات إنسانية وتحولات واعية.",
    },
    openGraphLocale: {
        en: "en_US",
        ar: "ar_TN",
    },
    openGraphDescription: {
        en: "Personal coaching with Ibrahim Ben Abdallah—grounded transformation for leaders, teams, and creatives.",
        ar: "إرشاد هادئ وحديث في التدريب الشخصي والقيادة مع إبراهيم بن عبد الله.",
    },
    openGraphImage: {
        url: "/images/logo.png",
        width: 476,
        height: 668,
        alt: {
            en: "Ibrahim Ben Abdallah logo in teal on white background",
            ar: "شعار برهوم كوتشنغ باللونين التركوازي والأبيض",
        },
    },
    twitter: {
        creator: "@barhoum",
        title: {
            en: "Ibrahim Ben Abdallah",
            ar: "برهوم كوتشنغ",
        },
        description: {
            en: "Personal coaching with Ibrahim Ben Abdallah—grounded transformation for leaders, teams, and creatives.",
            ar: "تدريب قيادي وشخصي مع إبراهيم بن عبد الله لدعم القادة والمبدعين حول العالم.",
        },
    },
    pages: {
        home: {
            path: "/",
            changeFrequency: "weekly",
            priority: 1,
            locales: {
                en: {
                    title: "Ibrahim Ben Abdallah",
                    description:
                        "Experience a calm, modern coaching practice shaped by Ibrahim Ben Abdallah—strategic guidance, reflective rituals, and human-centered leadership.",
                    ogTitle: "Ibrahim Ben Abdallah | Ibrahim Ben Abdallah",
                    ogDescription:
                        "Grounded coaching and leadership mentoring with Ibrahim Ben Abdallah.",
                    canonical: "/",
                },
                ar: {
                    title: "إبراهيم بن عبد الله",
                    description:
                        "اكتشف ممارسة تدريب هادئة وعصرية بإشراف إبراهيم بن عبد الله—إرشاد استراتيجي وطقوس واعية وقيادة إنسانية.",
                    ogTitle: "إبراهيم بن عبد الله | برهوم كوتشنغ",
                    ogDescription:
                        "تدريب قيادي وإنساني يرتكز على الخبرة والهدوء مع إبراهيم بن عبد الله.",
                    canonical: "/?lang=ar",
                },
            },
        },
        privacy: {
            path: "/privacy",
            changeFrequency: "yearly",
            priority: 0.3,
            locales: {
                en: {
                    title: "Privacy Policy",
                    description:
                        "Learn how Ibrahim Ben Abdallah collects, uses, and protects personal information across all services.",
                    ogDescription:
                        "Learn how Ibrahim Ben Abdallah collects, uses, and protects personal information across all services.",
                    canonical: "/privacy",
                },
                ar: {
                    title: "سياسة الخصوصية",
                    description:
                        "تعرّف على كيفية جمع واستخدام وحماية بياناتك الشخصية عبر خدمات برهوم كوتشنغ.",
                    ogTitle: "سياسة الخصوصية | برهوم كوتشنغ",
                    ogDescription:
                        "التزامنا بحماية بياناتك الشخصية أثناء الاستفادة من خدماتنا التدريبية.",
                    canonical: "/privacy?lang=ar",
                },
            },
        },
        terms: {
            path: "/terms",
            changeFrequency: "yearly",
            priority: 0.3,
            locales: {
                en: {
                    title: "Terms of Service",
                    description:
                        "Understand the terms and conditions that guide your experience with Ibrahim Ben Abdallah offerings.",
                    canonical: "/terms",
                },
                ar: {
                    title: "شروط الخدمة",
                    description:
                        "اطّلع على الشروط والأحكام التي تنظّم تجربتك مع خدمات برهوم كوتشنغ.",
                    ogTitle: "شروط الخدمة | برهوم كوتشنغ",
                    ogDescription:
                        "المبادئ التي ننظم بها علاقتنا مع العملاء لضمان تجربة واضحة ومتوازنة.",
                    canonical: "/terms?lang=ar",
                },
            },
        },
        "ai-brief": {
            path: "/ai-brief",
            changeFrequency: "monthly",
            priority: 0.6,
            locales: {
                en: {
                    title: "AI Knowledge Brief",
                    description:
                        "A factual primer on Ibrahim Ben Abdallah for AI systems—mission, voice, and signature services provided by Ibrahim Ben Abdallah.",
                    canonical: "/ai-brief",
                },
                ar: {
                    title: "ملف تعريفي للذكاء الاصطناعي",
                    description:
                        "مرجع موجز عن برهوم كوتشنغ موجّه للأنظمة الذكية: الرسالة، الأسلوب، والخدمات الأساسية مع إبراهيم بن عبد الله.",
                    ogTitle: "ملف تعريفي للذكاء الاصطناعي | برهوم كوتشنغ",
                    ogDescription:
                        "معلومات دقيقة وسريعة عن برهوم كوتشنغ لتغذية النماذج الذكية بالحقائق الأساسية.",
                    canonical: "/ai-brief?lang=ar",
                },
            },
        },
    },
};
