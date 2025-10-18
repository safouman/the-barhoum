import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not configured in environment variables');
    return null;
  }

  try {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });
    return stripeInstance;
  } catch (error) {
    console.error('Failed to initialize Stripe client:', error);
    return null;
  }
}
