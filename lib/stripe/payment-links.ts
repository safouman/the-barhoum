import { getStripeClient } from './client';
import { getPriceId } from './config';

export interface CreatePaymentLinkParams {
  email: string;
  fullName: string;
  country: string;
  phone: string;
  packageId: string;
  category: string;
}

export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<string | null> {
  const { email, fullName, country, phone, packageId, category } = params;

  console.log(`[Stripe] 🔍 Looking up price ID for package: ${packageId}`);
  const priceId = getPriceId(packageId);

  if (!priceId) {
    console.warn(`[Stripe] ⚠️ No Stripe Price ID found for package: ${packageId}`);
    console.warn(`[Stripe] Available packages:`, Object.keys(require('./config').STRIPE_PRICE_MAP));
    return null;
  }

  console.log(`[Stripe] ✅ Price ID found: ${priceId}`);

  console.log(`[Stripe] 🔧 Initializing Stripe client...`);
  const stripe = getStripeClient();
  if (!stripe) {
    console.error('[Stripe] ❌ Stripe client not available - skipping payment link creation');
    console.error('[Stripe] Check STRIPE_SECRET_KEY environment variable');
    return null;
  }
  console.log(`[Stripe] ✅ Stripe client initialized successfully`);

  try {
  console.log(`[Stripe] 📡 Creating payment link with Stripe API...`);
  console.log(`[Stripe] Parameters:`, {
    priceId,
    customerEmail: email,
    customerName: fullName,
    country,
    packageId,
    category,
  });

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
          price: priceId,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: 'Thank you for your payment! We will contact you shortly to schedule your sessions.',
        },
      },
      metadata: {
        customer_name: fullName,
        customer_email: email,
        customer_country: country,
        customer_phone: phone,
        package_id: packageId,
        category,
      },
      customer_creation: 'always',
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata: {
            customer_name: fullName,
            customer_country: country,
            customer_phone: phone,
            category,
            package_id: packageId,
          },
        },
      },
    });

    console.log(`[Stripe] ✅ Payment link created successfully!`);
    console.log(`[Stripe] Payment Link URL: ${paymentLink.url}`);
    console.log(`[Stripe] Payment Link ID: ${paymentLink.id}`);
    console.log(`[Stripe] Payment Link Details:`, {
      id: paymentLink.id,
      url: paymentLink.url,
      active: paymentLink.active,
      metadata: paymentLink.metadata,
    });

    return paymentLink.url;
  } catch (error) {
    console.error('[Stripe] ❌ Failed to create Stripe payment link');
    console.error('[Stripe] Error details:', {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      packageId,
      priceId,
      email,
    });
    return null;
  }
}
