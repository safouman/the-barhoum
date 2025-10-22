import type { Metadata } from "next";

type PageKey = "home" | "cv" | "links" | "pay";

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
    cv: {
        title: "Résumé",
        description:
            "Explore Ibrahim ben Abdallah's professional journey, projects, and collaborative impact.",
        openGraph: {
            url: `${siteUrl}/cv`,
        },
    },
    links: {
        title: "Curated Links",
        description:
            "Follow the articles, talks, and spaces where Ibrahim ben Abdallah is present.",
        openGraph: {
            url: `${siteUrl}/links`,
        },
    },
    pay: {
        title: "Secure Payment",
        description:
            "Complete your private coaching or workshop payment with Ibrahim ben Abdallah.",
        openGraph: {
            url: `${siteUrl}/pay`,
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

export function getPageMetadata(
    key: Exclude<PageKey, "pay">,
    overrides?: Metadata
): Metadata {
    return mergeMetadata(baseMetadata, pageMetadata[key], overrides);
}

interface PaySeoInput {
    slug: string;
    clientName: string;
    packageTitle: string;
    amountLabel: string;
}

export function getPayMetadata(
    payload?: PaySeoInput,
    overrides?: Metadata
): Metadata {
    const paymentMeta: Metadata | undefined = payload
        ? {
              title: `${payload.packageTitle} Payment`,
              description:
                  `Complete payment for ${payload.clientName} · ${payload.amountLabel}. Secure checkout with Ibrahim ben Abdallah.`.trim(),
              openGraph: {
                  title: `${payload.packageTitle} Payment`,
                  description: `Secure payment link for ${payload.clientName} (${payload.amountLabel}).`,
                  url: `${siteUrl}/pay/${payload.slug}`,
              },
              twitter: {
                  title: `${payload.packageTitle} Payment`,
                  description: `Secure payment link for ${payload.clientName} (${payload.amountLabel}).`,
              },
          }
        : undefined;

    return mergeMetadata(
        baseMetadata,
        pageMetadata.pay,
        paymentMeta,
        overrides
    );
}
