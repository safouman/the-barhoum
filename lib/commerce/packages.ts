import type { Locale } from "@/lib/content";

export type CategoryKey = "me_and_me" | "me_and_the_other" | "me_and_work";
export type PackSessions = number;

export type IndividualProgramKey =
    | "program_exploration"
    | "program_breakthrough"
    | "program_mastery";

export type PackageId = IndividualProgramKey;

const INDIVIDUAL_PACKAGE_LOOKUP: Record<number, IndividualProgramKey> = {
    2: "program_exploration",
    4: "program_breakthrough",
    6: "program_mastery",
};

const PACKAGE_IDS = Object.freeze(
    Object.values(INDIVIDUAL_PACKAGE_LOOKUP) as PackageId[]
);

export const ALL_PACKAGE_IDS = PACKAGE_IDS;

export function getIndividualProgramKeyBySessions(
    sessions: number
): IndividualProgramKey | null {
    const key = INDIVIDUAL_PACKAGE_LOOKUP[Math.round(sessions)];
    return key ?? null;
}

export function isPackageId(value: unknown): value is PackageId {
    return (
        typeof value === "string" && PACKAGE_IDS.includes(value as PackageId)
    );
}

export function formatPackCurrency(
    amount: number,
    locale: Locale,
    currency: string = "TND"
): string {
    const resolvedLocale = locale === "ar" ? "ar-TN-u-nu-latn" : "en-US";
    const formatter = new Intl.NumberFormat(resolvedLocale, {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0,
        numberingSystem: "latn",
    });
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
