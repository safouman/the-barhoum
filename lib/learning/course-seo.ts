import "server-only";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";
import type { CourseSummary } from "./contracts";

// Opt in individual live courses at launch so published fixtures stay excluded.
const publicSlugs = new Set(process.env.VERCEL_ENV === "production"
    ? (process.env.PUBLIC_COURSE_INDEX_SLUGS ?? "").split(",")
        .map((slug) => slug.trim())
        .filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    : []);

export function courseCanonical(slug?: string) {
    return new URL(slug ? `/courses/${encodeURIComponent(slug)}` : "/courses", siteUrl).href;
}

export async function listDiscoverableCourses(slug?: string) {
    const slugs = slug ? (publicSlugs.has(slug) ? [slug] : []) : [...publicSlugs];
    if (!slugs.length) return [];
    const { listPublishedCourseMetadata } = await import("./payload-reader");
    return listPublishedCourseMetadata(slugs);
}

export function courseMetadata({ index = false, course, slug }: {
    index?: boolean;
    course?: CourseSummary;
    slug?: string;
}): Metadata {
    const catalog = !slug;
    const title = course?.title ?? (catalog ? "الدورات" : "تفاصيل الدورة");
    const description = course?.description ?? "تصفّح دورات إبراهيم بن عبد الله، تعرّف على محاورها وابدأ بدرس مجاني.";
    const url = courseCanonical(slug);
    const cover = course?.cover;
    const images = cover ? [{ url: new URL(cover.url, siteUrl).href, alt: cover.alt }] : undefined;

    return {
        title,
        description,
        robots: { index, follow: index },
        alternates: { canonical: url },
        openGraph: { type: "website", url, title, description, images },
        twitter: { card: "summary_large_image", title, description, images },
    };
}
