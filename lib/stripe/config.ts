export const STRIPE_PRODUCT_ID = 'prod_TG5tOBx6jkBpsG';

export const STRIPE_PRICE_MAP = {
  'ind-1-session': 'price_1SJZhwAWdXsiScrur9Ue74CR',
  'ind-3-sessions': 'price_1SJZhwAWdXsiScruB61LUlN6',
  'ind-5-sessions': 'price_1SJZhwAWdXsiScruWpA8eon2',
} as const;

export type PackageId = keyof typeof STRIPE_PRICE_MAP;

export function getPriceId(packageId: string): string | null {
  console.log(`[Stripe Config] 📋 Looking up price for package: "${packageId}"`);
  console.log(`[Stripe Config] Available packages:`, Object.keys(STRIPE_PRICE_MAP));

  if (packageId in STRIPE_PRICE_MAP) {
    const priceId = STRIPE_PRICE_MAP[packageId as PackageId];
    console.log(`[Stripe Config] ✅ Found price ID: ${priceId}`);
    return priceId;
  }

  console.log(`[Stripe Config] ❌ Package "${packageId}" not found in price map`);
  return null;
}

export function hasStripePrice(packageId: string): boolean {
  return packageId in STRIPE_PRICE_MAP;
}
