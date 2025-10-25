import {
  isPackageId,
  type IndividualProgramKey,
  type PackageId,
} from '@/lib/commerce/packages';

export interface IndividualProgramConfig {
  key: IndividualProgramKey;
  category: 'individuals';
  displayName: string;
  productId: string;
  priceId: string;
  description: string;
  metadata: {
    sessions: number;
    duration: string;
  };
}

const INDIVIDUAL_PROGRAM_MAP: Record<IndividualProgramKey, IndividualProgramConfig> = {
  program_basic: {
    key: 'program_basic',
    category: 'individuals',
    displayName: 'Program Basic',
    productId: 'prod_TIg9kUx8vyVaap',
    priceId: 'price_1SM4nGAWdXsiScrunybZOJ7v',
    description: 'Single-session reset designed for quick clarity and next steps.',
    metadata: {
      sessions: 1,
      duration: 'single-session intensive',
    },
  },
  program_growth: {
    key: 'program_growth',
    category: 'individuals',
    displayName: 'Program Growth',
    productId: 'prod_TIg7yIK3BAFPEG',
    priceId: 'price_1SM4lXAWdXsiScrulprVEcrE',
    description: 'Three-session coaching arc focused on momentum and accountability.',
    metadata: {
      sessions: 3,
      duration: 'three-session series',
    },
  },
  program_transform: {
    key: 'program_transform',
    category: 'individuals',
    displayName: 'Program Transform',
    productId: 'prod_TIg75pVk6uOveb',
    priceId: 'price_1SM4lKAWdXsiScrulTbgMDsm',
    description: 'Five-session deep dive for sustained change and tailored practices.',
    metadata: {
      sessions: 5,
      duration: 'five-session immersion',
    },
  },
};

const OTHER_CATEGORY_PRICE_MAP: Partial<Record<PackageId, string>> = {
  'cpl-1-session': 'price_REPLACE_ME_CPL_1',
  'cpl-3-sessions': 'price_REPLACE_ME_CPL_3',
  'cpl-5-sessions': 'price_REPLACE_ME_CPL_5',
  'org-1-session': 'price_REPLACE_ME_ORG_1',
  'org-3-sessions': 'price_REPLACE_ME_ORG_3',
  'org-5-sessions': 'price_REPLACE_ME_ORG_5',
};

export type StripeSelection =
  | {
      type: 'individual-program';
      program: IndividualProgramConfig;
    }
  | {
      type: 'legacy-price';
      priceId: string;
      packageId: PackageId;
    };

export function isIndividualProgramKey(value: unknown): value is IndividualProgramKey {
  return (
    typeof value === 'string' &&
    (value === 'program_basic' || value === 'program_growth' || value === 'program_transform')
  );
}

export function getIndividualProgramByKey(programKey: string): IndividualProgramConfig | null {
  if (!isIndividualProgramKey(programKey)) {
    return null;
  }
  return INDIVIDUAL_PROGRAM_MAP[programKey] ?? null;
}

export function resolveStripeSelection(identifier: string): StripeSelection | null {
  const normalized = identifier?.trim();
  if (!normalized) return null;

  if (isIndividualProgramKey(normalized)) {
    const program = INDIVIDUAL_PROGRAM_MAP[normalized];
    return { type: 'individual-program', program };
  }

  if (isPackageId(normalized)) {
    const priceId = OTHER_CATEGORY_PRICE_MAP[normalized];
    if (priceId) {
      return {
        type: 'legacy-price',
        priceId,
        packageId: normalized,
      };
    }
  }

  return null;
}

export function hasStripePrice(identifier: string): boolean {
  const resolved = resolveStripeSelection(identifier);
  if (!resolved) return false;
  if (resolved.type === 'individual-program') {
    return Boolean(resolved.program.priceId);
  }
  return resolved.priceId !== '';
}

export function getAllStripeIdentifiers(): string[] {
  const legacyIds = Object.keys(OTHER_CATEGORY_PRICE_MAP) as PackageId[];
  return [...Object.keys(INDIVIDUAL_PROGRAM_MAP), ...legacyIds];
}
