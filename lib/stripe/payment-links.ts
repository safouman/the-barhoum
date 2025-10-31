import { isStripeEnabled } from "@/config/features";
import { getStripeClient } from "./client";
import { resolveStripeSelection } from "./config";

export interface CreatePaymentLinkParams {
    fullName: string;
    country: string;
    phone: string;
    packageId: string;
    category: string;
    leadId?: string;
    email?: string | null;
}

export async function createPaymentLink(
    params: CreatePaymentLinkParams
): Promise<string | null> {
    if (!isStripeEnabled) {
        console.log(
            "[Stripe] 🔕 Stripe disabled via feature flag; skipping payment link creation"
        );
        return null;
    }

    const {
        email,
        fullName,
        country,
        phone,
        packageId,
        category,
        leadId,
    } = params;
    const sanitizedEmail = typeof email === "string" ? email.trim() : "";
    const hasEmail = sanitizedEmail.length > 0;

    console.log(
        `[Stripe] 🔍 Resolving Stripe selection for package: ${packageId}`
    );
    const selection = await resolveStripeSelection(packageId);

    if (!selection) {
        console.warn(
            `[Stripe] ⚠️ No Stripe product or price mapping found for identifier: ${packageId}`
        );
        return null;
    }

    const isProgram = selection.type === "individual-program";
    const priceId = isProgram ? selection.program.priceId : selection.priceId;
    const productId = isProgram ? selection.program.productId : null;

    if (!priceId) {
        console.warn(
            `[Stripe] ⚠️ Stripe mapping resolved but price ID is missing for identifier: ${packageId}`
        );
        return null;
    }

    if (isProgram) {
        console.log(`[Stripe] ✅ Resolved individual program`, {
            identifier: packageId,
            programId: selection.program.programId,
            productId: selection.program.productId,
            priceId: selection.program.priceId,
            currency: selection.program.currency,
        });
    } else {
        console.log(`[Stripe] ✅ Resolved legacy package`, {
            identifier: packageId,
            priceId,
        });
    }

    console.log(`[Stripe] 🔧 Initializing Stripe client...`);
    const stripe = getStripeClient();
    if (!stripe) {
        console.error(
            "[Stripe] ❌ Stripe client not available - skipping payment link creation"
        );
        console.error(
            "[Stripe] Check STRIPE_SECRET_KEY environment variable"
        );
        return null;
    }
    console.log(`[Stripe] ✅ Stripe client initialized successfully`);

    try {
        console.log(`[Stripe] 📡 Creating payment link with Stripe API...`);
        console.log(`[Stripe] Parameters:`, {
            priceId,
            productId: productId ?? undefined,
            customerEmail: hasEmail ? sanitizedEmail : undefined,
            customerName: fullName,
            country,
            packageId,
            category,
        });

        const programMetadata: Record<string, string> = isProgram
            ? {
                  program_id: selection.program.programId,
                  stripe_product_id: selection.program.productId,
                  stripe_price_id: selection.program.priceId,
                  program_currency: selection.program.currency,
                  program_amount_minor: String(
                      selection.program.priceAmount
                  ),
                  program_label:
                      selection.program.metadata?.program_label ??
                      selection.program.metadata?.title_en ??
                      selection.program.programId,
                  program_sessions:
                      selection.program.sessions !== undefined
                          ? String(selection.program.sessions)
                          : selection.program.metadata?.sessions ?? "",
                  program_duration:
                      selection.program.durationLabel ??
                      selection.program.metadata?.duration_label ??
                      selection.program.metadata?.duration ??
                      "",
                  program_source:
                      selection.program.metadata?.source ?? "",
              }
            : {
                  stripe_price_id: priceId,
                  program_label: packageId,
              };
        const sharedMetadata: Record<string, string> = {
            ...programMetadata,
            ...(leadId ? { lead_id: leadId } : {}),
        };

        const customerMetadata = {
            customer_name: fullName,
            customer_country: country,
            customer_phone: phone,
            category,
            package_id: packageId,
            ...sharedMetadata,
            ...(hasEmail ? { customer_email: sanitizedEmail } : {}),
        };

        const paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            after_completion: {
                type: "hosted_confirmation",
                hosted_confirmation: {
                    custom_message:
                        "Thank you for your payment! We will contact you shortly to schedule your sessions.",
                },
            },
            metadata: customerMetadata,
            customer_creation: "always",
            payment_intent_data: {
                metadata: customerMetadata,
            },
            invoice_creation: {
                enabled: true,
                invoice_data: {
                    metadata: customerMetadata,
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
        console.error("[Stripe] ❌ Failed to create Stripe payment link");
        console.error("[Stripe] Error details:", {
            error: error instanceof Error ? error.message : String(error),
            errorType:
                error instanceof Error ? error.constructor.name : typeof error,
            stack: error instanceof Error ? error.stack : undefined,
            packageId,
            priceId,
            email: hasEmail ? sanitizedEmail : undefined,
        });
        return null;
    }
}
