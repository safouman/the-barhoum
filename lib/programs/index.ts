import { getProgramCopy, type Locale } from "@/lib/content";
import {
    getIndividualProgramKeyBySessions,
    type IndividualProgramKey,
} from "@/lib/commerce/packages";
import {
    getStripeProgramCatalog,
    type StripeProgramRecord,
} from "@/lib/stripe/catalog";

export interface NormalizedProgramCopy {
    title: string;
    subtitle: string;
    bullets: string[];
}

export interface NormalizedProgram {
    programId: string;
    stripeProductId: string;
    stripePriceId: string;
    priceAmountMinor: number;
    currency: string;
    sessions?: number;
    durationLabel?: string;
    copy: Record<Locale, NormalizedProgramCopy>;
}

export interface ProgramCatalogResult {
    status: "ok" | "unavailable" | "empty";
    programs: NormalizedProgram[];
    warnings: string[];
}

export async function getPrograms(): Promise<ProgramCatalogResult> {
    try {
        const { programs: stripePrograms, warnings } =
            await getStripeProgramCatalog();
        const copy = await getProgramCopy();

        if (!stripePrograms.length) {
            return {
                status: "empty",
                programs: [],
                warnings,
            };
        }

        const normalized: NormalizedProgram[] = [];

        for (const program of stripePrograms) {
            const sessions = program.sessions;
            const inferredProgramKey: IndividualProgramKey | null =
                getIndividualProgramKeyBySessions(sessions ?? NaN);

            const resolvedProgramId =
                program.programId || inferredProgramKey || null;

            if (!resolvedProgramId) {
                const warning = `[Programs] ⚠️ Skipping product "${program.productId}" - unable to resolve programId.`;
                console.warn(warning);
                warnings.push(warning);
                continue;
            }

            const arCopy = copy.ar[resolvedProgramId] ?? {
                title: program.metadata?.title_ar ?? resolvedProgramId,
                subtitle: program.metadata?.subtitle_ar ?? "",
                bullets: (program.metadata?.bullets_ar ?? "")
                    .split("|")
                    .filter(Boolean),
            };

            const enCopy = copy.en[resolvedProgramId] ?? {
                title: program.metadata?.title_en ?? resolvedProgramId,
                subtitle: program.metadata?.subtitle_en ?? "",
                bullets: (program.metadata?.bullets_en ?? "")
                    .split("|")
                    .filter(Boolean),
            };

            if (!copy.ar[resolvedProgramId] || !copy.en[resolvedProgramId]) {
                const warning = `[Programs] ⚠️ Missing local copy for program "${resolvedProgramId}".`;
                if (!warnings.includes(warning)) {
                    warnings.push(warning);
                }
            }

            normalized.push({
                programId: resolvedProgramId,
                stripeProductId: program.productId,
                stripePriceId: program.priceId,
                priceAmountMinor: program.priceAmount,
                currency: program.currency,
                sessions: program.sessions,
                durationLabel: program.durationLabel,
                copy: {
                    ar: arCopy,
                    en: enCopy,
                },
            });
        }

        return {
            status: normalized.length ? "ok" : "empty",
            programs: normalized,
            warnings,
        };
    } catch (error) {
        console.error("[Programs] ❌ Failed to build program catalog", error);
        return {
            status: "unavailable",
            programs: [],
            warnings: ["catalog-fetch-error"],
        };
    }
}
