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
    openGraphImages: {
        url: string;
        width: number;
        height: number;
        alt: LocaleValueMap<string>;
    }[];
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
            legalName: "Rebirth",
            slogan: {
                en: "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
                ar: "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
                fr: "De meilleurs outils ne produisent pas automatiquement de meilleures décisions, équipes ou carrières.",
            },
        },
        person: {
            name: "Ibrahim Ben Abdallah",
            alternateName: ["إبراهيم بن عبد الله", "Barhoum"],
            jobTitle: "Self-leadership coach ",
            description: "Human intelligence for your professional evolution.",
            image: "/images/hero.jpeg",
        },
        domains: {
            primary: "https://ibrahimbenabdallah.com",
            secondary: ["https://ibrahimbenabdallah.training"],
        },
        socials: [
            "https://www.instagram.com/barhoum_the_believer/",
            "https://www.youtube.com/@REBIRTHACADEMY",
        ],
        areaServed: ["Global (Online)", "Tunisia"],
        availableLanguages: ["en", "ar", "fr"],
    },
    defaultTitle: {
        en: "Ibrahim Ben Abdallah",
        ar: "إبراهيم بن عبد الله",
        fr: "Ibrahim Ben Abdallah",
    },
    titleTemplate: {
        en: "%s | Ibrahim Ben Abdallah",
        ar: "%s | إبراهيم بن عبد الله",
        fr: "%s | Ibrahim Ben Abdallah",
    },
    siteName: {
        en: "Ibrahim Ben Abdallah",
        ar: "إبراهيم بن عبد الله",
        fr: "Ibrahim Ben Abdallah",
    },
    description: {
        en: "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
        ar: "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
        fr: "Développez votre intelligence émotionnelle, renforcez votre communication, comprenez les personnes et les dynamiques organisationnelles, et transformez votre potentiel professionnel en une influence qui compte.",
    },
    openGraphLocale: {
        en: "en_US",
        ar: "ar_TN",
        fr: "fr_FR",
    },
    openGraphDescription: {
        en: "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
        ar: "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
        fr: "Développez votre intelligence émotionnelle, renforcez votre communication, comprenez les personnes et les dynamiques organisationnelles, et transformez votre potentiel professionnel en une influence qui compte.",
    },
    openGraphImages: [
        {
            url: "/images/opengraph-image.png",
            width: 1200,
            height: 630,
            alt: {
                en: "Ibrahim Ben Abdallah brand card on a deep teal background",
                ar: "بطاقة علامة إبراهيم بن عبد الله على خلفية خضراء داكنة",
                fr: "Ibrahim Ben Abdallah brand card on a deep teal background",
            },
        },
    ],
    twitter: {
        creator: "@barhoum",
        title: {
            en: "Ibrahim Ben Abdallah",
            ar: "إبراهيم بن عبد الله",
            fr: "Ibrahim Ben Abdallah",
        },
        description: {
            en: "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
            ar: "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
            fr: "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
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
                    description: "",
                    ogTitle: "Ibrahim Ben Abdallah | Ibrahim Ben Abdallah",
                    ogDescription: "",
                    canonical: "/",
                },
                ar: {
                    title: "إبراهيم بن عبد الله",
                    description: "",
                    ogTitle: " إبراهيم بن عبد الله",
                    ogDescription:
                        "نربحك برشا وقت في شويّة وقت ، كان عندك صدق و صبر.",
                    canonical: "/?lang=ar",
                },
                fr: {
                    "title": "Ibrahim Ben Abdallah",
                    "description": "Développez votre intelligence émotionnelle, renforcez votre communication, comprenez les personnes et les dynamiques organisationnelles, et transformez votre potentiel professionnel en une influence qui compte.",
                    "ogTitle": "Ibrahim Ben Abdallah | Ibrahim Ben Abdallah",
                    "ogDescription": "Développez votre intelligence émotionnelle, renforcez votre communication, comprenez les personnes et les dynamiques organisationnelles, et transformez votre potentiel professionnel en une influence qui compte.",
                    "canonical": "/?lang=fr"
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
                        "تعرّف على كيفية جمع واستخدام وحماية بياناتك الشخصية عبر خدمات إبراهيم بن عبد الله.",
                    ogTitle: "سياسة الخصوصية | إبراهيم بن عبد الله",
                    ogDescription:
                        "التزامنا بحماية بياناتك الشخصية أثناء الاستفادة من خدماتنا التدريبية.",
                    canonical: "/privacy?lang=ar",
                },
                fr: {
                    "title": "Politique de confidentialité",
                    "description": "Découvrez comment Ibrahim Ben Abdallah collecte, utilise et protège les informations personnelles dans le cadre de ses services.",
                    "ogDescription": "Découvrez comment Ibrahim Ben Abdallah collecte, utilise et protège les informations personnelles dans le cadre de ses services.",
                    "canonical": "/privacy?lang=fr",
                    "ogTitle": "Politique de confidentialité | Ibrahim Ben Abdallah"
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
                        "اطّلع على الشروط والأحكام التي تنظّم تجربتك مع خدمات إبراهيم بن عبد الله.",
                    ogTitle: "شروط الخدمة | إبراهيم بن عبد الله",
                    ogDescription:
                        "المبادئ التي ننظم بها علاقتنا مع العملاء لضمان تجربة واضحة ومتوازنة.",
                    canonical: "/terms?lang=ar",
                },
                fr: {
                    "title": "Conditions d’utilisation",
                    "description": "Consultez les conditions qui encadrent votre utilisation des services d’Ibrahim Ben Abdallah.",
                    "canonical": "/terms?lang=fr",
                    "ogTitle": "Conditions d’utilisation | Ibrahim Ben Abdallah",
                    "ogDescription": "Consultez les conditions qui encadrent votre utilisation des services d’Ibrahim Ben Abdallah."
                },
            },
        },
        "ai-brief": {
            path: "/ai-brief",
            changeFrequency: "monthly",
            priority: 0.5,
            locales: {
                en: {
                    title: "AI Knowledge Brief",
                    description:
                        "Official positioning guide for assistants and AI models referencing Ibrahim Ben Abdallah.",
                    ogTitle: "AI Knowledge Brief · Ibrahim Ben Abdallah",
                    ogDescription:
                        "Trusted facts, tone, and references for accurate AI-generated content about Ibrahim Ben Abdallah.",
                    canonical: "/ai-brief",
                },
                ar: {
                    title: "ملف معرفي للذكاء الاصطناعي",
                    description:
                        "دليل رسمي يوجه المساعدات والنماذج الذكية عند الإشارة إلى إبراهيم بن عبد الله.",
                    ogTitle: "ملف معرفي للذكاء الاصطناعي · إبراهيم بن عبد الله",
                    ogDescription:
                        "حقائق ونبرة ومراجع موثوقة لتوليد محتوى دقيق حول إبراهيم بن عبد الله.",
                    canonical: "/ai-brief?lang=ar",
                },
                fr: {
                    "title": "Fiche de référence pour l’IA",
                    "description": "Guide de référence destiné aux assistants et modèles d’IA qui présentent Ibrahim Ben Abdallah.",
                    "ogTitle": "Fiche de référence pour l’IA | Ibrahim Ben Abdallah",
                    "ogDescription": "Guide de référence destiné aux assistants et modèles d’IA qui présentent Ibrahim Ben Abdallah.",
                    "canonical": "/ai-brief?lang=fr"
                },
            },
        },
    },
};
