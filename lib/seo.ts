import type { Metadata } from "next";

type PageKey = "home" | "privacy" | "terms";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barhoum.coach";
const defaultOgImage = "/images/logo.png";

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
                width: 1200,
                height: 630,
                alt: "Barhoum Coaching",
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
};

const pageMetadata: Record<PageKey, Metadata> = {
    home: {
        title: "Ibrahim ben Abdallah",
        description:
            "Experience a calm, modern coaching practice shaped by Ibrahim ben Abdallah—strategic guidance, reflective rituals, and human-centered leadership.",
        openGraph: {
            url: `${siteUrl}/`,
        },
    },
    privacy: {
        title: "Privacy Policy",
        description:
            "Learn how Barhoum Coaching collects, uses, and protects personal information across all services.",
        openGraph: {
            url: `${siteUrl}/privacy`,
        },
    },
    terms: {
        title: "Terms of Service",
        description:
            "Understand the terms and conditions that guide your experience with Barhoum Coaching offerings.",
        openGraph: {
            url: `${siteUrl}/terms`,
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

export function getDefaultMetadata(): Metadata {
    return mergeMetadata(baseMetadata);
}

export function getPageMetadata(key: PageKey, overrides?: Metadata): Metadata {
    return mergeMetadata(baseMetadata, pageMetadata[key], overrides);
}
