import type { MetadataRoute } from "next";
import { seoConfig, type SeoPageKey } from "@/config/seo";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { getPageAlternateUrls, getPageCanonicalUrl } from "@/lib/seo";
import { isAieoEnabled } from "@/config/features";
import { courseCanonical, listDiscoverableCourses } from "@/lib/learning/course-seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const pages: MetadataRoute.Sitemap = (
        Object.entries(seoConfig.pages) as Array<
            [SeoPageKey, (typeof seoConfig.pages)[SeoPageKey]]
        >
    )
        .filter(([key]) => isAieoEnabled || key !== ("ai-brief" as SeoPageKey))
        .map(([key, page]) => ({
            url: getPageCanonicalUrl(key, DEFAULT_LOCALE),
            changeFrequency: page.changeFrequency,
            priority: page.priority,
            alternates: {
                languages: getPageAlternateUrls(key),
            },
        }));

    const courses = await listDiscoverableCourses();
    if (courses.length) pages.push({ url: courseCanonical() });
    return pages.concat(courses.map(({ slug, updatedAt }) => ({
        url: courseCanonical(slug),
        lastModified: updatedAt,
    })));
}
