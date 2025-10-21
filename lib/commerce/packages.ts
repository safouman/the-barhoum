import type { Locale } from "@/lib/content";

export type CategoryKey = "individuals" | "couples" | "organizations";
export type PackSessions = 1 | 3 | 5;

export type PackageId =
    | "ind-1-session"
    | "ind-3-sessions"
    | "ind-5-sessions"
    | "cpl-1-session"
    | "cpl-3-sessions"
    | "cpl-5-sessions"
    | "org-1-session"
    | "org-3-sessions"
    | "org-5-sessions";

const PACKAGE_ID_LOOKUP: Record<CategoryKey, Record<PackSessions, PackageId>> =
    {
        individuals: {
            1: "ind-1-session",
            3: "ind-3-sessions",
            5: "ind-5-sessions",
        },
        couples: {
            1: "cpl-1-session",
            3: "cpl-3-sessions",
            5: "cpl-5-sessions",
        },
        organizations: {
            1: "org-1-session",
            3: "org-3-sessions",
            5: "org-5-sessions",
        },
    };

export function getPackageId(
    category: CategoryKey,
    sessions: PackSessions
): PackageId {
    return PACKAGE_ID_LOOKUP[category][sessions];
}

export function formatPackCurrency(
    amount: number,
    locale: Locale,
    currency: "EUR" | "USD" = "EUR"
): string {
    const formatter = new Intl.NumberFormat(
        locale === "ar" ? "ar-EG" : "en-US",
        {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }
    );
    return formatter.format(amount);
}

export function formatSessionsLabel(
    sessions: PackSessions,
    locale: Locale
): string {
    if (locale === "ar") {
        if (sessions === 1) return "جلسة واحدة";
        if (sessions === 3) return "ثلاث جلسات";
        return "خمس جلسات";
    }

    return `${sessions} Session${sessions > 1 ? "s" : ""}`;
}
