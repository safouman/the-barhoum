import {
  isPackageId,
  type IndividualProgramKey,
  type PackageId,
} from "@/lib/commerce/packages";
import {
  getStripeProgramCatalog,
  type StripeProgramRecord,
} from "./catalog";

export type IndividualProgramConfig = StripeProgramRecord;

const OTHER_CATEGORY_PRICE_MAP: Partial<Record<PackageId, string>> = {
  "cpl-1-session": "price_REPLACE_ME_CPL_1",
  "cpl-3-sessions": "price_REPLACE_ME_CPL_3",
  "cpl-5-sessions": "price_REPLACE_ME_CPL_5",
  "org-1-session": "price_REPLACE_ME_ORG_1",
  "org-3-sessions": "price_REPLACE_ME_ORG_3",
  "org-5-sessions": "price_REPLACE_ME_ORG_5",
};

export type StripeSelection =
  | {
      type: "individual-program";
      program: IndividualProgramConfig;
    }
  | {
      type: "legacy-price";
      priceId: string;
      packageId: PackageId;
    };

export function isIndividualProgramKey(value: unknown): value is IndividualProgramKey {
  return (
    typeof value === "string" &&
    (value === "program_exploration" ||
      value === "program_breakthrough" ||
      value === "program_mastery")
  );
}

export async function getIndividualProgramByKey(
  programKey: string
): Promise<IndividualProgramConfig | null> {
  if (!isIndividualProgramKey(programKey)) {
    return null;
  }
  const { programs } = await getStripeProgramCatalog();
  return programs.find((program) => program.programId === programKey) ?? null;
}

export async function resolveStripeSelection(
  identifier: string
): Promise<StripeSelection | null> {
  const normalized = identifier?.trim();
  if (!normalized) return null;

  if (isIndividualProgramKey(normalized)) {
    const { programs } = await getStripeProgramCatalog();
    const program = programs.find((item) => item.programId === normalized);
    if (!program) {
      console.warn(
        `[Stripe Config] ⚠️ Unable to find Stripe program pricing for key "${normalized}".`
      );
      return null;
    }
    return { type: "individual-program", program };
  }

  if (isPackageId(normalized)) {
    const priceId = OTHER_CATEGORY_PRICE_MAP[normalized];
    if (priceId) {
      return {
        type: "legacy-price",
        priceId,
        packageId: normalized,
      };
    }
  }

  return null;
}

export async function hasStripePrice(identifier: string): Promise<boolean> {
  const resolved = await resolveStripeSelection(identifier);
  if (!resolved) return false;
  if (resolved.type === "individual-program") {
    return Boolean(resolved.program.priceId);
  }
  return resolved.priceId !== "";
}

export async function getAllStripeIdentifiers(): Promise<string[]> {
  const legacyIds = Object.keys(OTHER_CATEGORY_PRICE_MAP) as PackageId[];
  const { programs } = await getStripeProgramCatalog();
  const programIds = programs.map((program) => program.programId);
  return Array.from(new Set<string>([...programIds, ...legacyIds]));
}
