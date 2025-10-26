import type { MetadataRoute } from "next";
import { seoConfig, type SeoPageKey } from "@/config/seo";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import {
    getPageAlternateUrls,
    getPageCanonicalUrl,
} from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    return (Object.entries(seoConfig.pages) as Array<
        [SeoPageKey, (typeof seoConfig.pages)[SeoPageKey]]
    >).map(([key, page]) => ({
        url: getPageCanonicalUrl(key, DEFAULT_LOCALE),
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
            languages: getPageAlternateUrls(key),
        },
    }));
}
