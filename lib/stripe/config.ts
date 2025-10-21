import type { PackageId } from '@/lib/commerce/packages';

export const STRIPE_PRODUCT_ID = 'prod_TG5tOBx6jkBpsG';

export const STRIPE_PRICE_MAP: Record<PackageId, string> = {
  'ind-1-session': 'price_1SJZhwAWdXsiScrur9Ue74CR',
  'ind-3-sessions': 'price_1SJZhwAWdXsiScruB61LUlN6',
  'ind-5-sessions': 'price_1SJZhwAWdXsiScruWpA8eon2',
  'cpl-1-session': '',
  'cpl-3-sessions': '',
  'cpl-5-sessions': '',
  'org-1-session': '',
  'org-3-sessions': '',
  'org-5-sessions': '',
};

function isPackageId(value: string): value is PackageId {
  return Object.prototype.hasOwnProperty.call(STRIPE_PRICE_MAP, value);
}

export function getPriceId(packageId: string): string | null {
  console.log(`[Stripe Config] 📋 Looking up price for package: "${packageId}"`);
  console.log(`[Stripe Config] Available packages:`, Object.keys(STRIPE_PRICE_MAP));

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
