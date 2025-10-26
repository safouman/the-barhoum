import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

type RouteEntry = {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
};

const routes: RouteEntry[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
    { path: "/ai-brief", changeFrequency: "monthly", priority: 0.6 },
];

const toAbsoluteUrl = (path: string) =>
    `${siteUrl}${path === "/" ? "/" : path}`;

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    return routes.map(({ path, changeFrequency, priority }) => {
        const absolute = toAbsoluteUrl(path);
        const arabicUrl = `${absolute}${absolute.includes("?") ? "&" : "?"}lang=ar`;

        return {
            url: absolute,
            lastModified: now,
            changeFrequency,
            priority,
            alternates: {
                languages: {
                    en: absolute,
                    ar: arabicUrl,
                },
            },
        };
    });
}
