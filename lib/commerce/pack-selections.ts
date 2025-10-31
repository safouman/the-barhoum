import {
    getIndividualProgramKeyBySessions,
    getPackageId,
    type CategoryKey,
    type IndividualProgramKey,
    type PackageId,
    type PackSessions,
} from "@/lib/commerce/packages";

export interface PackSelection {
    category: CategoryKey;
    sessions?: PackSessions;
    priceTotal: number;
    priceAmountMinor: number;
    currency: string;
    title: string;
    durationLabel: string;
    programKey?: IndividualProgramKey | PackageId;
    packageId: PackageId;
}

type PackSelectionSource = {
    sessions?: PackSelection["sessions"];
    priceTotal: PackSelection["priceTotal"];
    priceAmountMinor: PackSelection["priceAmountMinor"];
    currency: PackSelection["currency"];
    title: PackSelection["title"];
    duration: string;
    programKey?: IndividualProgramKey | PackageId;
};

export function createPackSelection({
    category,
    pack,
}: {
    category: CategoryKey;
    pack: PackSelectionSource;
}): PackSelection {
    const inferredPackageId = (() => {
        if (pack.programKey) {
            return pack.programKey as PackageId;
        }

        if (category === "me_and_me") {
            const programKey = pack.sessions
                ? getIndividualProgramKeyBySessions(pack.sessions)
                : null;
            if (programKey) {
                return programKey;
            }
        }

        if (pack.sessions != null) {
            return getPackageId(category, pack.sessions);
        }

        throw new Error(
            `[pack-selection] Unable to resolve package id for category "${category}". Provide a programKey or sessions value.`
        );
    })();

    return {
        category,
        sessions: pack.sessions,
        priceTotal: pack.priceTotal,
        priceAmountMinor: pack.priceAmountMinor,
        currency: pack.currency,
        title: pack.title,
        durationLabel: pack.duration,
        programKey: (pack.programKey as IndividualProgramKey | PackageId | undefined) ?? inferredPackageId,
        packageId: inferredPackageId,
    };
}
