import type { SharedAnalyticsContext } from "@/lib/analytics/shared";
import { trackAutomationEvent } from "@/lib/analytics/server";
import type { LeadFormData } from "@/lib/validation/lead-form";

interface SendTelegramMessageOptions {
    requestId: string;
    analyticsContext: Partial<SharedAnalyticsContext>;
    contextLabel: "lead" | "payment";
    message: string;
    button?: {
        label: string;
        url: string;
    };
}

function resolveChatIds(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

async function sendTelegramMessage({
    requestId,
    analyticsContext,
    contextLabel,
    message,
    button,
}: SendTelegramMessageOptions): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatIds = resolveChatIds(process.env.TELEGRAM_CHAT_ID);

    if (!botToken) {
        console.warn(
            `[${requestId}] ⚠️ Telegram bot token missing; skipping ${contextLabel} notification`
        );
        await trackAutomationEvent(
            "telegram_failed",
            { reason: "missing-token", context: contextLabel },
            analyticsContext,
            { clientId: requestId }
        );
        return;
    }

    if (chatIds.length === 0) {
        console.warn(
            `[${requestId}] ⚠️ Telegram chat ID missing; skipping ${contextLabel} notification`
        );
        await trackAutomationEvent(
            "telegram_failed",
            { reason: "missing-chat-id", context: contextLabel },
            analyticsContext,
            { clientId: requestId }
        );
        return;
    }

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const replyMarkup = button
        ? {
              inline_keyboard: [
                  [
                      {
                          text: button.label,
                          url: button.url,
                      },
                  ],
              ],
          }
        : undefined;

    await Promise.all(
        chatIds.map(async (chatId) => {
            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        reply_markup: replyMarkup,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response
                        .text()
                        .catch(() => "Unable to read response");
                    console.error(
                        `[${requestId}] ❌ Telegram ${contextLabel} notification failed for ${chatId}`,
                        { status: response.status, body: errorText }
                    );
                    await trackAutomationEvent(
                        "telegram_failed",
                        {
                            chat_id: chatId,
                            status: response.status,
                            context: contextLabel,
                        },
                        analyticsContext,
                        { clientId: requestId }
                    );
                    return;
                }

                console.log(
                    `[${requestId}] ✅ Telegram ${contextLabel} notification sent to ${chatId}`
                );
                await trackAutomationEvent(
                    "telegram_sent",
                    { chat_id: chatId, context: contextLabel },
                    analyticsContext,
                    { clientId: requestId }
                );
            } catch (error) {
                console.error(
                    `[${requestId}] ❌ Error sending Telegram ${contextLabel} notification to ${chatId}`,
                    error
                );
                await trackAutomationEvent(
                    "telegram_failed",
                    {
                        chat_id: chatId,
                        reason:
                            error instanceof Error
                                ? error.message
                                : "unknown-error",
                        context: contextLabel,
                    },
                    analyticsContext,
                    { clientId: requestId }
                );
            }
        })
    );
}

export async function sendLeadTelegramNotification({
    formData,
    requestId,
    analyticsContext,
    programName,
}: {
    formData: LeadFormData;
    requestId: string;
    analyticsContext: Partial<SharedAnalyticsContext>;
    programName?: string | null;
}): Promise<void> {
    const resolvedFullName = formData.fullName?.trim() ?? "";
    const resolvedCountry = formData.country?.trim() ?? "";
    const resolvedProgram =
        programName?.trim() || formData.package?.trim() || "";
    const sheetUrl = process.env.TELEGRAM_LEADS_SHEET_URL?.trim() ?? "";

    const message = [
        "📩 New form submitted",
        `Name: ${resolvedFullName || "N/A"}`,
        `Country: ${resolvedCountry || "N/A"}`,
        `Program: ${resolvedProgram || "N/A"}`,
    ].join("\n");

    await sendTelegramMessage({
        requestId,
        analyticsContext,
        contextLabel: "lead",
        message,
        button: sheetUrl
            ? {
                  label: "Open Google Sheet",
                  url: sheetUrl,
              }
            : undefined,
    });
}

export async function sendPaymentTelegramNotification({
    requestId,
    analyticsContext,
    customerName,
    customerCountry,
    programName,
    amountMinor,
    currency,
}: {
    requestId: string;
    analyticsContext: Partial<SharedAnalyticsContext>;
    customerName?: string | null;
    customerCountry?: string | null;
    programName?: string | null;
    amountMinor?: number | null;
    currency?: string | null;
}): Promise<void> {
    const resolvedName = customerName?.trim() ?? "";
    const resolvedCountry = customerCountry?.trim() ?? "";
    const resolvedProgram = programName?.trim() ?? "";

    const amountDetails =
        amountMinor && currency
            ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: currency.toUpperCase(),
              }).format(amountMinor / 100)
            : "";

    const message = [
        "💰 Payment received",
        resolvedName ? `from ${resolvedName}` : "",
        resolvedCountry ? `(${resolvedCountry})` : "",
        resolvedProgram ? `for ${resolvedProgram}` : "",
        amountDetails ? `Amount: ${amountDetails}` : "",
    ]
        .filter(Boolean)
        .join(" ");

    await sendTelegramMessage({
        requestId,
        analyticsContext,
        contextLabel: "payment",
        message,
    });
}
