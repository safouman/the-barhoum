import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (stripeInstance) {
    console.log('[Stripe Client] 🔄 Using existing Stripe instance');
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;


  if (!secretKey) {
    console.error('[Stripe Client] ❌ STRIPE_SECRET_KEY is not configured in environment variables');
    return null;
  }

  try {
  console.log('[Stripe Client] 🔧 Initializing new Stripe instance...');
  stripeInstance = new Stripe(secretKey, {
    typescript: true,
  });
    console.log('[Stripe Client] ✅ Stripe instance created successfully');
    return stripeInstance;
  } catch {
    console.error('[Stripe Client] ❌ Failed to initialize Stripe client');
    return null;
  }
}
