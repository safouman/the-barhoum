import {
  type IndividualProgramKey,
} from "@/lib/commerce/packages";
import { isStripeEnabled } from "@/config/features";
import {
  getStripeProgramCatalog,
  type StripeProgramRecord,
} from "./catalog";

export type IndividualProgramConfig = StripeProgramRecord;

export type StripeSelection =
  | {
      type: "individual-program";
      program: IndividualProgramConfig;
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
  if (!isStripeEnabled) {
    console.log(
      `[Stripe Config] 🔕 Stripe disabled; getIndividualProgramByKey("${programKey}") returning null`
    );
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

  if (!isStripeEnabled) {
    console.log(
      `[Stripe Config] 🔕 Stripe disabled; resolveStripeSelection("${normalized}") returning null`
    );
    return null;
  }

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

  return null;
}

export async function hasStripePrice(identifier: string): Promise<boolean> {
  if (!isStripeEnabled) {
    return false;
  }
  const resolved = await resolveStripeSelection(identifier);
  if (!resolved) return false;
  return Boolean(resolved.program.priceId);
}

export async function getAllStripeIdentifiers(): Promise<string[]> {
  if (!isStripeEnabled) {
    return [];
  }
  const { programs } = await getStripeProgramCatalog();
  return Array.from(new Set<string>(programs.map((program) => program.programId)));
}
