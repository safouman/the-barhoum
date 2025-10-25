import type { Locale } from "@/lib/content";

export type CategoryKey = "individuals" | "couples" | "organizations";
export type PackSessions = 1 | 3 | 5;

export type IndividualProgramKey =
    | "program_basic"
    | "program_growth"
    | "program_transform";

export type CouplesPackageId =
    | "cpl-1-session"
    | "cpl-3-sessions"
    | "cpl-5-sessions";

export type OrganizationPackageId =
    | "org-1-session"
    | "org-3-sessions"
    | "org-5-sessions";

export type PackageId =
    | IndividualProgramKey
    | CouplesPackageId
    | OrganizationPackageId;

const INDIVIDUAL_PACKAGE_LOOKUP: Record<PackSessions, IndividualProgramKey> = {
    1: "program_basic",
    3: "program_growth",
    5: "program_transform",
};

const COUPLES_PACKAGE_LOOKUP: Record<PackSessions, CouplesPackageId> = {
    1: "cpl-1-session",
    3: "cpl-3-sessions",
    5: "cpl-5-sessions",
};

const ORGANIZATION_PACKAGE_LOOKUP: Record<PackSessions, OrganizationPackageId> =
    {
        1: "org-1-session",
        3: "org-3-sessions",
        5: "org-5-sessions",
    };

const PACKAGE_ID_LOOKUP: Record<CategoryKey, Record<PackSessions, PackageId>> =
    {
        individuals: INDIVIDUAL_PACKAGE_LOOKUP,
        couples: COUPLES_PACKAGE_LOOKUP,
        organizations: ORGANIZATION_PACKAGE_LOOKUP,
    };

const PACKAGE_IDS = Object.freeze(
    Object.values(PACKAGE_ID_LOOKUP).flatMap((categoryMap) =>
        Object.values(categoryMap)
    ) as PackageId[]
);

export const ALL_PACKAGE_IDS = PACKAGE_IDS;

export function getPackageId(
    category: CategoryKey,
    sessions: PackSessions
): PackageId {
    return PACKAGE_ID_LOOKUP[category][sessions];
}

export function isPackageId(value: unknown): value is PackageId {
    return typeof value === "string" && PACKAGE_IDS.includes(value as PackageId);
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
