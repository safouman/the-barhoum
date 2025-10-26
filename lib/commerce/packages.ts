import type { Locale } from "@/lib/content";

export type CategoryKey = "individuals" | "couples" | "organizations";
export type PackSessions = number;

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

const INDIVIDUAL_PACKAGE_LOOKUP: Record<number, IndividualProgramKey> = {
    1: "program_basic",
    3: "program_growth",
    5: "program_transform",
};

const COUPLES_PACKAGE_LOOKUP: Record<number, CouplesPackageId> = {
    2: "cpl-1-session",
    3: "cpl-3-sessions",
    5: "cpl-5-sessions",
};

const ORGANIZATION_PACKAGE_LOOKUP: Record<number, OrganizationPackageId> = {
    2: "org-1-session",
    3: "org-3-sessions",
    5: "org-5-sessions",
};

const PACKAGE_ID_LOOKUP: Record<CategoryKey, Record<number, PackageId>> = {
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

export function getIndividualProgramKeyBySessions(
    sessions: number
): IndividualProgramKey | null {
    const key = INDIVIDUAL_PACKAGE_LOOKUP[Math.round(sessions)];
    return key ?? null;
}

export function getPackageId(
    category: CategoryKey,
    sessions: PackSessions
): PackageId {
    const lookup = PACKAGE_ID_LOOKUP[category];
    const key = lookup[Math.round(sessions)];

    if (!key) {
        throw new Error(
            `[commerce] Unknown session count "${sessions}" for category "${category}". Provide a programId in the source data.`
        );
    }

    return key;
}

export function isPackageId(value: unknown): value is PackageId {
    return (
        typeof value === "string" && PACKAGE_IDS.includes(value as PackageId)
    );
}

export function formatPackCurrency(
    amount: number,
    locale: Locale,
    currency: string = "EUR"
): string {
    const formatter = new Intl.NumberFormat(
        locale === "ar" ? "ar-EG" : "en-US",
        {
            style: "currency",
            currency: currency.toUpperCase(),
            maximumFractionDigits: 0,
        }
    );
    return formatter.format(amount);
}

export function formatSessionsLabel(
    sessions: PackSessions,
    locale: Locale
): string {
    const rounded = Math.max(1, Math.round(sessions));

    if (locale === "ar") {
        switch (rounded) {
            case 1:
                return "جلسة واحدة";
            case 2:
                return "جلستان";
            case 3:
                return "ثلاث جلسات";
            case 4:
                return "أربع جلسات";
            case 5:
                return "خمس جلسات";
            default:
                return `${rounded} جلسة`;
        }
    }

    return `${rounded} Session${rounded > 1 ? "s" : ""}`;
}
