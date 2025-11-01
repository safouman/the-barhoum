import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { getPackages, getProgramCopy, type Locale } from "@/lib/content";
import {
    getIndividualProgramKeyBySessions,
    type CategoryKey,
    type IndividualProgramKey,
} from "@/lib/commerce/packages";
import {
    getStripeProgramCatalog,
    type StripeProgramRecord,
} from "@/lib/stripe/catalog";
import { isStripeEnabled } from "@/config/features";
import type { Package } from "@/lib/content";

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
    categoryId?: CategoryKey;
}

export interface ProgramCatalogResult {
    status: "ok" | "stale" | "empty" | "unavailable";
    programs: NormalizedProgram[];
    warnings: string[];
}

interface CatalogSnapshot {
    updatedAt: string;
    hash: string;
    programs: NormalizedProgram[];
    warnings: string[];
}

const SNAPSHOT_PATH = path.join(
    process.cwd(),
    "data",
    "catalog.snapshot.json"
);

let snapshotCache: CatalogSnapshot | null = null;
let snapshotLoaded = false;
let lastKnownPrograms: NormalizedProgram[] | null = null;

async function buildStaticProgramCatalog(): Promise<ProgramCatalogResult> {
    const [packages, copy] = await Promise.all([getPackages(), getProgramCopy()]);

    const staticPrograms: NormalizedProgram[] = packages
        .filter((pkg: Package) => pkg.visible)
        .map((pkg) => {
            const programId = pkg.id;
            const arCopy = copy.ar[programId] ?? {
                title: pkg.title.ar,
                subtitle: pkg.features.ar[0] ?? "",
                bullets: pkg.features.ar,
            };

            const enCopy = copy.en[programId] ?? {
                title: pkg.title.en,
                subtitle: pkg.features.en[0] ?? "",
                bullets: pkg.features.en,
            };

            return {
                programId,
                stripeProductId: `static-${pkg.categoryId}-${programId}`,
                stripePriceId: `static-price-${pkg.categoryId}-${programId}`,
                priceAmountMinor: Math.round(pkg.price.amount * 100),
                currency: pkg.price.currency,
                sessions: undefined,
                durationLabel: enCopy.subtitle || undefined,
                copy: {
                    ar: arCopy,
                    en: enCopy,
                },
                categoryId: pkg.categoryId,
            } satisfies NormalizedProgram;
        });

    const warnings: string[] = [];
    if (!staticPrograms.length) {
        warnings.push("[Programs] ⚠️ No static programs available for any category.");
    }

    return {
        status: staticPrograms.length ? "ok" : "empty",
        programs: staticPrograms,
        warnings,
    };
}

async function loadSnapshot(): Promise<CatalogSnapshot | null> {
    if (snapshotLoaded) {
        return snapshotCache;
    }

    snapshotLoaded = true;

    try {
        const contents = await fs.readFile(SNAPSHOT_PATH, "utf8");
        snapshotCache = JSON.parse(contents) as CatalogSnapshot;
        lastKnownPrograms = snapshotCache.programs;
        return snapshotCache;
    } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
            console.warn(
                "[Programs] ⚠️ Failed to load catalog snapshot",
                error
            );
        }
        snapshotCache = null;
        return null;
    }
}

function sortPrograms(programs: NormalizedProgram[]): NormalizedProgram[] {
    return [...programs].sort((a, b) => a.programId.localeCompare(b.programId));
}

function computeProgramsHash(programs: NormalizedProgram[]): string {
    const sorted = sortPrograms(programs);
    return createHash("sha256")
        .update(JSON.stringify(sorted))
        .digest("hex");
}

async function persistSnapshot(
    programs: NormalizedProgram[],
    warnings: string[]
) {
    const snapshot: CatalogSnapshot = {
        updatedAt: new Date().toISOString(),
        hash: computeProgramsHash(programs),
        programs: sortPrograms(programs),
        warnings,
    };

    try {
        await fs.writeFile(
            SNAPSHOT_PATH,
            JSON.stringify(snapshot, null, 2) + "\n",
            "utf8"
        );
        snapshotCache = snapshot;
        lastKnownPrograms = snapshot.programs;
    } catch (error) {
        console.error("[Programs] ❌ Failed to write catalog snapshot", error);
    }
}

export async function getPrograms(): Promise<ProgramCatalogResult> {
    if (!isStripeEnabled) {
        console.log(
            "[Programs] ⚙️ Stripe disabled via feature flag; serving static catalog data"
        );
        return buildStaticProgramCatalog();
    }

    await loadSnapshot();

    try {
        const { programs: stripePrograms, warnings } =
            await getStripeProgramCatalog();
        const copy = await getProgramCopy();

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

            const rawCategory = (program.metadata?.category_id ??
                program.metadata?.category ??
                program.metadata?.category_key) as string | undefined;
            const normalizedCategory = (() => {
                if (!rawCategory) return undefined;
                const candidate = rawCategory.trim() as CategoryKey;
                if (
                    candidate === "me_and_me" ||
                    candidate === "me_and_the_other" ||
                    candidate === "me_and_work"
                ) {
                    return candidate;
                }
                return undefined;
            })();

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
                categoryId: normalizedCategory,
            });
        }

        if (!normalized.length) {
            const fallbackPrograms =
                lastKnownPrograms ?? snapshotCache?.programs ?? [];

            if (fallbackPrograms.length) {
                const warning = "no-live-programs";
                if (!warnings.includes(warning)) warnings.push(warning);

                console.warn("[Programs] ⚠️ Serving stale catalog data (no live programs)");

                return {
                    status: "stale",
                    programs: fallbackPrograms,
                    warnings,
                };
            }

            return {
                status: "empty",
                programs: [],
                warnings,
            };
        }

        if (normalized.length) {
            const sortedNormalized = sortPrograms(normalized);
            const hash = computeProgramsHash(sortedNormalized);
            const snapshotHash = snapshotCache?.hash;

            if (hash !== snapshotHash) {
                await persistSnapshot(sortedNormalized, warnings);
            } else {
                if (snapshotCache) {
                    snapshotCache = {
                        ...snapshotCache,
                        warnings,
                    };
                }
                lastKnownPrograms = snapshotCache?.programs ?? sortedNormalized;
            }

            return {
                status: "ok",
                programs: sortedNormalized,
                warnings,
            };
        }

        return {
            status: "empty",
            programs: [],
            warnings,
        };
    } catch (error) {
        console.error("[Programs] ❌ Failed to build program catalog", error);
        const fallbackPrograms =
            lastKnownPrograms ?? snapshotCache?.programs ?? [];
        const fallbackWarnings = [
            ...(snapshotCache?.warnings ?? []),
            "catalog-fetch-error",
        ];

        if (fallbackPrograms.length) {
            console.warn("[Programs] ⚠️ Serving stale catalog data");
        }

        return {
            status: fallbackPrograms.length ? "stale" : "unavailable",
            programs: fallbackPrograms,
            warnings: fallbackWarnings,
        };
    }
}
