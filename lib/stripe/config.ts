import { ALL_PACKAGE_IDS, isPackageId, type PackageId } from '@/lib/commerce/packages';

export const STRIPE_PRODUCT_ID = 'prod_TG5tOBx6jkBpsG';

// TODO: replace placeholder values with the live Stripe Price IDs for each pack.
export const STRIPE_PRICE_MAP: Record<PackageId, string> = {
  'ind-1-session': 'price_1SJZhwAWdXsiScrur9Ue74CR',
  'ind-3-sessions': 'price_1SJZhwAWdXsiScruB61LUlN6',
  'ind-5-sessions': 'price_1SJZhwAWdXsiScruWpA8eon2',
  'cpl-1-session': 'price_REPLACE_ME_CPL_1',
  'cpl-3-sessions': 'price_REPLACE_ME_CPL_3',
  'cpl-5-sessions': 'price_REPLACE_ME_CPL_5',
  'org-1-session': 'price_REPLACE_ME_ORG_1',
  'org-3-sessions': 'price_REPLACE_ME_ORG_3',
  'org-5-sessions': 'price_REPLACE_ME_ORG_5',
};

export function getPriceId(packageId: string): string | null {
  console.log(`[Stripe Config] 📋 Looking up price for package: "${packageId}"`);
  console.log(`[Stripe Config] Available packages:`, ALL_PACKAGE_IDS);

  if (isPackageId(packageId)) {
    const priceId = STRIPE_PRICE_MAP[packageId];

    if (!priceId || priceId === '') {
      console.log(`[Stripe Config] ⚠️ Price ID is empty for package: ${packageId}`);
      return null;
    }

    console.log(`[Stripe Config] ✅ Found price ID: ${priceId}`);
    return priceId;
  }

  console.log(`[Stripe Config] ❌ Package "${packageId}" not found in price map`);
  return null;
}

export function hasStripePrice(packageId: string): boolean {
  if (!isPackageId(packageId)) return false;
  const priceId = STRIPE_PRICE_MAP[packageId];
  return !!priceId && priceId !== '';
}
