import type { Locale } from "@/lib/content";
import {
    formatSessionsLabel,
    getPackageId,
    type CategoryKey,
    type PackageId,
    type PackSessions,
} from "@/lib/commerce/packages";

export interface PackSelection {
    category: CategoryKey;
    sessions: PackSessions;
    priceTotal: number;
    title: string;
    sessionsLabel: string;
    packageId: PackageId;
}

type PackSelectionSource = Pick<
    PackSelection,
    "sessions" | "priceTotal" | "title"
>;

export function createPackSelection({
    category,
    pack,
    locale,
}: {
    category: CategoryKey;
    pack: PackSelectionSource;
    locale: Locale;
}): PackSelection {
    return {
        category,
        sessions: pack.sessions,
        priceTotal: pack.priceTotal,
        title: pack.title,
        sessionsLabel: formatSessionsLabel(pack.sessions, locale),
        packageId: getPackageId(category, pack.sessions),
    };
}
