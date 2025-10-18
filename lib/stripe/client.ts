import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (stripeInstance) {
    console.log('[Stripe Client] 🔄 Using existing Stripe instance');
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  console.log('[Stripe Client] 🔑 Checking STRIPE_SECRET_KEY:', secretKey ? `present (${secretKey.substring(0, 7)}...)` : 'missing');

  if (!secretKey) {
    console.error('[Stripe Client] ❌ STRIPE_SECRET_KEY is not configured in environment variables');
    return null;
  }

  try {
    console.log('[Stripe Client] 🔧 Initializing new Stripe instance...');
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
    console.log('[Stripe Client] ✅ Stripe instance created successfully');
    return stripeInstance;
  } catch (error) {
    console.error('[Stripe Client] ❌ Failed to initialize Stripe client:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}
