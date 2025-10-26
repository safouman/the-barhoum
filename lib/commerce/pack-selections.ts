import type { Locale } from "@/lib/content";
import {
    formatSessionsLabel,
    getIndividualProgramKeyBySessions,
    getPackageId,
    type CategoryKey,
    type IndividualProgramKey,
    type PackageId,
    type PackSessions,
} from "@/lib/commerce/packages";

export interface PackSelection {
    category: CategoryKey;
    sessions: PackSessions;
    priceTotal: number;
    priceAmountMinor: number;
    currency: string;
    title: string;
    sessionsLabel: string;
    programKey?: IndividualProgramKey | PackageId;
    packageId: PackageId;
}

type PackSelectionSource = {
    sessions: PackSelection["sessions"];
    priceTotal: PackSelection["priceTotal"];
    priceAmountMinor: PackSelection["priceAmountMinor"];
    currency: PackSelection["currency"];
    title: PackSelection["title"];
    programKey?: IndividualProgramKey | PackageId;
};

export function createPackSelection({
    category,
    pack,
    locale,
}: {
    category: CategoryKey;
    pack: PackSelectionSource;
    locale: Locale;
}): PackSelection {
    const inferredPackageId = (() => {
        if (pack.programKey) {
            return pack.programKey as PackageId;
        }

        if (category === "individuals") {
            const programKey = getIndividualProgramKeyBySessions(pack.sessions);
            if (programKey) {
                return programKey;
            }
        }

        return getPackageId(category, pack.sessions);
    })();

    return {
        category,
        sessions: pack.sessions,
        priceTotal: pack.priceTotal,
        priceAmountMinor: pack.priceAmountMinor,
        currency: pack.currency,
        title: pack.title,
        sessionsLabel: formatSessionsLabel(pack.sessions, locale),
        programKey: (pack.programKey as IndividualProgramKey | PackageId | undefined) ?? inferredPackageId,
        packageId: inferredPackageId,
    };
}
