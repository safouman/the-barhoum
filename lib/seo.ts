import type { Metadata } from "next";
import { seoConfig, type SeoPageKey } from "@/config/seo";
import type { Locale } from "@/lib/content";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n";

export type PageKey = SeoPageKey;

export const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    "https://barhoum.coach";

const baseMetadata: Metadata = {
    metadataBase: new URL(siteUrl),
    icons: {
        icon: "/images/favicon.ico",
        shortcut: "/images/favicon.ico",
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
    return locale && SUPPORTED_LOCALES.includes(locale)
        ? locale
        : DEFAULT_LOCALE;
}

function getLocalizedValue<T>(
    map: Record<Locale, T>,
    locale: Locale
): T {
    return map[locale] ?? map[DEFAULT_LOCALE];
}

function toAbsoluteUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }
    if (path.startsWith("/")) {
        return `${siteUrl}${path}`;
    }
    return `${siteUrl}/${path}`;
}

function getPageConfig(key: PageKey) {
    return seoConfig.pages[key];
}

function getPageLocaleConfig(
    key: PageKey,
    locale: Locale
) {
    const page = getPageConfig(key);
    return page.locales[locale] ?? page.locales[DEFAULT_LOCALE];
}

export function getPageCanonicalPath(
    key: PageKey,
    locale: Locale
): string {
    const page = getPageConfig(key);
    const localeConfig = getPageLocaleConfig(key, locale);
    return localeConfig.canonical ?? page.path;
}

export function getPageCanonicalUrl(
    key: PageKey,
    locale: Locale
): string {
    return toAbsoluteUrl(getPageCanonicalPath(key, locale));
}

function buildLanguageAlternates(key: PageKey): Record<string, string> {
    const alternates: Record<string, string> = {};
    const defaultUrl = getPageCanonicalUrl(key, DEFAULT_LOCALE);

    for (const locale of SUPPORTED_LOCALES) {
        alternates[locale] = getPageCanonicalUrl(key, locale);
    }

    alternates["x-default"] = defaultUrl;
    return alternates;
}

export function getPageAlternateUrls(key: PageKey): Record<string, string> {
    return buildLanguageAlternates(key);
}

export function getDefaultMetadata(locale?: Locale): Metadata {
    const resolvedLocale = ensureLocale(locale);
    const openGraphLocale = getLocalizedValue(
        seoConfig.openGraphLocale,
        resolvedLocale
    );
    const alternateOgLocales = SUPPORTED_LOCALES.filter(
        (value) => value !== resolvedLocale
    ).map((value) =>
        getLocalizedValue(seoConfig.openGraphLocale, value)
    );
    const canonicalPath = getPageCanonicalPath("home", resolvedLocale);
    const languageAlternates = buildLanguageAlternates("home");

    const metadata: Metadata = {
        title: {
            default: getLocalizedValue(
                seoConfig.defaultTitle,
                resolvedLocale
            ),
            template: getLocalizedValue(
                seoConfig.titleTemplate,
                resolvedLocale
            ),
        },
        description: getLocalizedValue(
            seoConfig.description,
            resolvedLocale
        ),
        openGraph: {
            type: "website",
            url: toAbsoluteUrl(canonicalPath),
            siteName: getLocalizedValue(
                seoConfig.siteName,
                resolvedLocale
            ),
            locale: openGraphLocale,
            alternateLocale: alternateOgLocales,
            title: getLocalizedValue(
                seoConfig.siteName,
                resolvedLocale
            ),
            description: getLocalizedValue(
                seoConfig.openGraphDescription,
                resolvedLocale
            ),
            images: [
                {
                    url: seoConfig.openGraphImage.url,
                    width: seoConfig.openGraphImage.width,
                    height: seoConfig.openGraphImage.height,
                    alt: getLocalizedValue(
                        seoConfig.openGraphImage.alt,
                        resolvedLocale
                    ),
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            creator: seoConfig.twitter.creator,
            title: getLocalizedValue(
                seoConfig.twitter.title,
                resolvedLocale
            ),
            description: getLocalizedValue(
                seoConfig.twitter.description,
                resolvedLocale
            ),
            images: [seoConfig.openGraphImage.url],
        },
        alternates: {
            canonical: toAbsoluteUrl(canonicalPath),
            languages: languageAlternates,
        },
    };

    return mergeMetadata(baseMetadata, metadata);
}

export function getPageMetadata(
    key: PageKey,
    locale?: Locale,
    overrides?: Metadata
): Metadata {
    const resolvedLocale = ensureLocale(locale);
    const pageLocale = getPageLocaleConfig(key, resolvedLocale);
    const canonicalPath = getPageCanonicalPath(key, resolvedLocale);
    const canonicalUrl = toAbsoluteUrl(canonicalPath);
    const languageAlternates = buildLanguageAlternates(key);

    const pageMetadata: Metadata = {
        title: pageLocale.title,
        description: pageLocale.description,
        openGraph: {
            url: canonicalUrl,
            title: pageLocale.ogTitle ?? pageLocale.title,
            description:
                pageLocale.ogDescription ?? pageLocale.description,
        },
        alternates: {
            canonical: canonicalUrl,
            languages: languageAlternates,
        },
    };

    const defaultMetadata = getDefaultMetadata(resolvedLocale);
    return mergeMetadata(defaultMetadata, pageMetadata, overrides);
}
