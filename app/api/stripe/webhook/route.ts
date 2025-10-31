import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { trackAutomationEvent } from "@/lib/analytics/server";
import { sendPaymentWhatsAppNotification } from "@/lib/whatsapp/notifications";
import { isStripeEnabled } from "@/config/features";

function buildContextFromMetadata(metadata: Stripe.Metadata | null | undefined) {
  return {
    locale: (metadata?.locale as string | undefined) ?? "unknown",
    form_country:
      (metadata?.customer_country as string | undefined) ??
      (metadata?.country as string | undefined) ??
      undefined,
    device_type: "server",
    utm_source: (metadata?.utm_source as string | undefined) ?? "direct",
    utm_medium: (metadata?.utm_medium as string | undefined) ?? "direct",
    utm_campaign: (metadata?.utm_campaign as string | undefined) ?? "none",
    category: (metadata?.category as string | undefined) ?? "none",
    program_name:
      (metadata?.package_id as string | undefined) ??
      (metadata?.program_name as string | undefined) ??
      "none",
    referrer: "stripe",
  };
}

async function markLeadAsPaidInSheet({
  requestId,
  leadId,
  amountMinor,
  currency,
  programName,
}: {
  requestId: string;
  leadId: string | null;
  amountMinor: number | null | undefined;
  currency: string | null | undefined;
  programName: string | null | undefined;
}): Promise<void> {
  if (!leadId) {
    console.warn(
      `[Stripe Webhook] Skipping markPaid update for ${requestId} because leadId is missing`
    );
    return;
  }

  const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
  const googleScriptSecret = process.env.GOOGLE_SCRIPT_SECRET;

  if (!googleScriptUrl || !googleScriptSecret) {
    console.warn(
      `[Stripe Webhook] Google Script credentials missing; cannot mark lead ${leadId} as paid`
    );
    return;
  }

  const payload = {
    secret: googleScriptSecret,
    operation: "markPaid",
    leadId,
    payment_status: "Paid",
    paid_at: new Date().toISOString(),
    amount_minor: amountMinor ?? null,
    currency: currency ?? null,
    program_name: programName ?? null,
  };

  try {
    const response = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Barhoum-Coaching-Webhook/1.0",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const responseText = await response
        .text()
        .catch(() => "Unable to read response");
      console.error(
        `[Stripe Webhook] Failed to mark lead ${leadId} as paid`,
        {
          status: response.status,
          body: responseText,
        }
      );
    } else {
      console.log(
        `[Stripe Webhook] ✅ Lead ${leadId} marked as paid in Google Sheet`
      );
    }
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error while marking lead ${leadId} as paid`,
      error
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isStripeEnabled) {
    console.log("[Stripe Webhook] 🔕 Stripe disabled; ignoring incoming webhook");
    return NextResponse.json({ success: true, disabled: true }, { status: 200 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ success: false }, { status: 200 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.warn("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    console.error("[Stripe Webhook] Stripe client unavailable");
    return NextResponse.json({ success: false }, { status: 500 });
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed", error);
    return NextResponse.json({ success: false }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? null;
      const context = buildContextFromMetadata(metadata);
      await trackAutomationEvent(
        "payment_completed",
        {
          amount: session.amount_total ? session.amount_total / 100 : undefined,
          currency: session.currency ?? undefined,
          payment_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
        },
        context,
        { clientId: session.id }
      );

      const readMetadataValue = (key: string): string | null => {
        if (!metadata) return null;
        const value = metadata[key];
        if (typeof value !== "string") {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const customerName =
        session.customer_details?.name ??
        readMetadataValue("customer_name") ??
        readMetadataValue("customerName");

      const customerCountry =
        readMetadataValue("customer_country") ??
        readMetadataValue("country") ??
        session.customer_details?.address?.country ??
        null;

      const programName =
        readMetadataValue("program_label") ??
        readMetadataValue("program_name") ??
        readMetadataValue("package_id") ??
        readMetadataValue("packageId");
      const leadId =
        readMetadataValue("lead_id") ?? readMetadataValue("leadId");

      try {
        await sendPaymentWhatsAppNotification({
          requestId: session.id,
          analyticsContext: context,
          customerName,
          customerCountry,
          programName,
          amountMinor: session.amount_total ?? null,
          currency: session.currency ?? null,
        });
      } catch (notificationError) {
        console.error(
          `[Stripe Webhook] ❌ Failed to send WhatsApp payment notification for checkout session ${session.id}`,
          notificationError
        );
      }

      await markLeadAsPaidInSheet({
        requestId: session.id,
        leadId,
        amountMinor: session.amount_total ?? null,
        currency: session.currency ?? null,
        programName,
      });
    } else if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const metadata = intent.metadata ?? null;
      const context = buildContextFromMetadata(metadata);
      await trackAutomationEvent(
        "payment_completed",
        {
          amount: intent.amount_received ? intent.amount_received / 100 : undefined,
          currency: intent.currency ?? undefined,
          payment_intent: intent.id,
        },
        context,
        { clientId: intent.id }
      );
    }
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event", {
      type: event.type,
      error,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
