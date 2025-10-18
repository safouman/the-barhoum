import { getStripeClient } from './client';
import { getPriceId } from './config';

export interface CreatePaymentLinkParams {
  email: string;
  fullName: string;
  country: string;
  phone: string;
  packageId: string;
}

export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<string | null> {
  const { email, fullName, country, phone, packageId } = params;

  const priceId = getPriceId(packageId);
  if (!priceId) {
    console.warn(`No Stripe Price ID found for package: ${packageId}`);
    return null;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    console.error('Stripe client not available - skipping payment link creation');
    return null;
  }

  try {
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
      },
      customer_creation: 'always',
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata: {
            customer_name: fullName,
            customer_country: country,
            customer_phone: phone,
          },
        },
      },
    });

    console.log(`Payment link created successfully for package ${packageId}: ${paymentLink.url}`);
    return paymentLink.url;
  } catch (error) {
    console.error('Failed to create Stripe payment link:', {
      error: error instanceof Error ? error.message : String(error),
      packageId,
      email,
    });
    return null;
  }
}
