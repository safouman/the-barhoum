import type { SharedAnalyticsContext } from "@/lib/analytics/shared";
import { trackAutomationEvent } from "@/lib/analytics/server";
import type { LeadFormData } from "@/lib/validation/lead-form";

type ParameterResolver = (parameterName: string) => unknown;

interface SendWhatsAppMessageOptions {
    requestId: string;
    analyticsContext: Partial<SharedAnalyticsContext>;
    contextLabel: "lead" | "payment";
    fallbackMessage: string;
    templateEnvPrefix: string;
    parameterResolver?: ParameterResolver;
}

interface CurrencyFormatResult {
    formatted: string;
    majorUnits: string;
    currencyCode: string;
}

const GRAPH_API_VERSION = "v22.0";

function sanitizeParameterValue(value: unknown): string {
    if (value === undefined || value === null) {
        return "N/A";
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : "N/A";
    }

    const stringified = String(value);
    return stringified.length > 0 ? stringified : "N/A";
}

function parseTemplateParameterNames(raw: string | undefined): string[] {
    if (!raw) {
        return [];
    }

    return raw
        .split(",")
        .map((parameter) => parameter.trim())
        .filter((parameter) => parameter.length > 0);
}

function normalizePhoneNumber(raw: string | undefined): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return trimmed.replace(/^\+/, "");
}

function resolveValueFromPath(
    source: Record<string, unknown>,
    path: string
): unknown {
    const normalizedPath = path.startsWith("formData.")
        ? path.slice("formData.".length)
        : path;

    const segments = normalizedPath.split(".").map((segment) => segment.trim());
    let current: unknown = source;

    for (const segment of segments) {
        if (
            current &&
            typeof current === "object" &&
            segment in (current as Record<string, unknown>)
        ) {
            current = (current as Record<string, unknown>)[segment];
        } else {
            return undefined;
        }
    }

    return current;
}

function formatCurrency(
    amountMinor: number | null | undefined,
    currencyCode: string | null | undefined
): CurrencyFormatResult {
    if (
        amountMinor === null ||
        amountMinor === undefined ||
        currencyCode === null ||
        currencyCode === undefined
    ) {
        return { formatted: "", majorUnits: "", currencyCode: "" };
    }

    const normalizedCurrency = currencyCode.toUpperCase();
    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: normalizedCurrency,
    });

    const resolvedOptions = formatter.resolvedOptions();
    const fractionDigits =
        typeof resolvedOptions.maximumFractionDigits === "number"
            ? resolvedOptions.maximumFractionDigits
            : 2;
    const divisor = Math.pow(10, fractionDigits);
    const minorAmount = amountMinor as number;
    const majorValue = minorAmount / divisor;

    return {
        formatted: formatter.format(majorValue),
        majorUnits:
            fractionDigits > 0
                ? majorValue.toFixed(fractionDigits)
                : majorValue.toFixed(0),
        currencyCode: normalizedCurrency,
    };
}

async function sendWhatsAppMessage({
    requestId,
    analyticsContext,
    contextLabel,
    fallbackMessage,
    templateEnvPrefix,
    parameterResolver,
}: SendWhatsAppMessageOptions): Promise<void> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const adminPhone = normalizePhoneNumber(process.env.WHATSAPP_ADMIN_PHONE);
    const managerPhone = normalizePhoneNumber(process.env.WHATSAPP_MANAGER_PHONE);

    if (!accessToken || !phoneNumberId) {
        console.warn(
            `[${requestId}] ⚠️ WhatsApp configuration missing (token or phone number ID); skipping ${contextLabel} notification`
        );
        await trackAutomationEvent(
            "whatsapp_failed",
            {
                reason: "missing-configuration",
                context: contextLabel,
            },
            analyticsContext,
            { clientId: requestId }
        );
        return;
    }

    const recipients = [adminPhone, managerPhone].filter(
        (recipient): recipient is string => Boolean(recipient && recipient.length > 0)
    );

    if (recipients.length === 0) {
        console.warn(
            `[${requestId}] ⚠️ No WhatsApp recipients configured; skipping ${contextLabel} notification`
        );
        await trackAutomationEvent(
            "whatsapp_failed",
            {
                reason: "missing-recipient",
                context: contextLabel,
            },
            analyticsContext,
            { clientId: requestId }
        );
        return;
    }

    const templateName =
        process.env[`${templateEnvPrefix}TEMPLATE_NAME`]?.trim() || "";
    const templateLanguage =
        process.env[`${templateEnvPrefix}TEMPLATE_LANGUAGE`]?.trim() || "en";
    const templateParameterNames = parseTemplateParameterNames(
        process.env[`${templateEnvPrefix}TEMPLATE_PARAMETER_NAMES`]
    );

    const endpoint = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

    await Promise.all(
        recipients.map(async (recipient) => {
            const messageParameters =
                templateName && templateParameterNames.length > 0
                    ? templateParameterNames.map((name) => {
                          const resolved = parameterResolver
                              ? parameterResolver(name)
                              : undefined;
                          return {
                              name,
                              value: sanitizeParameterValue(resolved),
                          };
                      })
                    : [];

            const payload = templateName
                ? {
                      messaging_product: "whatsapp",
                      to: recipient,
                      type: "template",
                      template: {
                          name: templateName,
                          language: {
                              code: templateLanguage,
                          },
                          components:
                              messageParameters.length > 0
                                  ? [
                                        {
                                            type: "body",
                                            parameters: messageParameters.map(
                                                ({ name, value }) => ({
                                                    type: "text",
                                                    text: value,
                                                    parameter_name: name,
                                                })
                                            ),
                                        },
                                    ]
                                  : undefined,
                      },
                  }
                : {
                      messaging_product: "whatsapp",
                      to: recipient,
                      type: "text",
                      text: {
                          body: fallbackMessage,
                      },
                  };

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorText = await response
                        .text()
                        .catch(() => "Unable to read response");
                    console.error(
                        `[${requestId}] ❌ WhatsApp ${contextLabel} notification failed for ${recipient}`,
                        {
                            status: response.status,
                            body: errorText,
                        }
                    );
                    await trackAutomationEvent(
                        "whatsapp_failed",
                        {
                            recipient,
                            status: response.status,
                            context: contextLabel,
                        },
                        analyticsContext,
                        { clientId: requestId }
                    );
                    return;
                }

                console.log(
                    `[${requestId}] ✅ WhatsApp ${contextLabel} notification sent to ${recipient} using ${templateName ? "template" : "text"} message`
                );
                await trackAutomationEvent(
                    "whatsapp_sent",
                    {
                        recipient,
                        template: templateName ? "template" : "text",
                        context: contextLabel,
                    },
                    analyticsContext,
                    { clientId: requestId }
                );
            } catch (error) {
                console.error(
                    `[${requestId}] ❌ Error sending WhatsApp ${contextLabel} notification to ${recipient}`,
                    error
                );
                await trackAutomationEvent(
                    "whatsapp_failed",
                    {
                        recipient,
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

export async function sendLeadWhatsAppNotification({
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
    const resolvedEmail = formData.email?.trim() ?? "";
    const resolvedPassphrase = formData.passphrase?.trim() ?? "";

    const aliasMap = new Map<string, string>([
        ["fullname", resolvedFullName],
        ["full_name", resolvedFullName],
        ["name", resolvedFullName],
        ["country", resolvedCountry],
        ["program", resolvedProgram],
        ["package", resolvedProgram],
        ["program_name", resolvedProgram],
        ["email", resolvedEmail],
        ["passphrase", resolvedPassphrase],
        ["pass_phrase", resolvedPassphrase],
    ]);

    const fallbackMessage = [
        "📩 New form submitted",
        resolvedFullName ? `by ${resolvedFullName}` : "",
        resolvedCountry ? `from ${resolvedCountry}` : "",
        resolvedProgram ? `about ${resolvedProgram}` : "",
        "Please check the Google Sheet for details.",
    ]
        .filter(Boolean)
        .join(" ");

    await sendWhatsAppMessage({
        requestId,
        analyticsContext,
        contextLabel: "lead",
        fallbackMessage,
        templateEnvPrefix: "WHATSAPP_",
        parameterResolver: (parameterName: string) => {
            const normalized = parameterName.trim();
            if (!normalized) return undefined;

            const aliasKey = normalized.toLowerCase();
            if (aliasMap.has(aliasKey)) {
                return aliasMap.get(aliasKey);
            }

            return resolveValueFromPath(formData as Record<string, unknown>, normalized);
        },
    });
}

export async function sendPaymentWhatsAppNotification({
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

    const amountDetails = formatCurrency(amountMinor ?? null, currency ?? null);

    const aliasMap = new Map<string, string>([
        ["fullname", resolvedName],
        ["full_name", resolvedName],
        ["name", resolvedName],
        ["customer_name", resolvedName],
        ["country", resolvedCountry],
        ["customer_country", resolvedCountry],
        ["program", resolvedProgram],
        ["program_name", resolvedProgram],
        ["package", resolvedProgram],
        ["amount", amountDetails.majorUnits],
        ["paid_amount", amountDetails.majorUnits],
        ["amount_formatted", amountDetails.formatted],
        ["total", amountDetails.majorUnits],
        ["currency", amountDetails.currencyCode],
    ]);

    const fallbackParts = [
        "💰 Payment received",
        resolvedName ? `from ${resolvedName}` : "",
        resolvedProgram ? `for ${resolvedProgram}` : "",
        amountDetails.formatted
            ? `Amount: ${amountDetails.formatted}`
            : amountDetails.majorUnits
              ? `Amount: ${amountDetails.majorUnits} ${amountDetails.currencyCode}`
              : "",
    ].filter(Boolean);

    const fallbackMessage =
        fallbackParts.length > 0
            ? fallbackParts.join(" ")
            : "💰 Payment received.";

    await sendWhatsAppMessage({
        requestId,
        analyticsContext,
        contextLabel: "payment",
        fallbackMessage,
        templateEnvPrefix: "WHATSAPP_PAYMENT_",
        parameterResolver: (parameterName: string) => {
            const normalized = parameterName.trim();
            if (!normalized) return undefined;
            const aliasKey = normalized.toLowerCase();
            if (aliasMap.has(aliasKey)) {
                return aliasMap.get(aliasKey);
            }
            return undefined;
        },
    });
}
