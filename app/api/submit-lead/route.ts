import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { leadFormSchema, type LeadFormData } from "@/lib/validation/lead-form";
import { createPaymentLink } from "@/lib/stripe/payment-links";
import { requiresPayment } from "@/lib/utils/geo";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000;

function getRateLimitKey(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
        ? forwarded.split(",")[0]
        : req.headers.get("x-real-ip") || "unknown";
    return ip;
}

function cleanupRateLimitEntries(currentTime: number): void {
    for (const [ip, record] of rateLimitMap.entries()) {
        if (currentTime > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    cleanupRateLimitEntries(now);

    const record = rateLimitMap.get(key);

    if (!record) {
        rateLimitMap.set(key, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
        });
        return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWhatsAppNotifications({
    formData,
    requestId,
}: {
    formData: LeadFormData;
    requestId: string;
}): Promise<void> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
    const managerPhone = process.env.WHATSAPP_MANAGER_PHONE;

    if (!accessToken || !phoneNumberId) {
        console.warn(
            `[${requestId}] ⚠️ WhatsApp configuration missing (token or phone number ID); skipping notifications`
        );
        return;
    }

    const recipients = [adminPhone, managerPhone]
        .map((recipient) =>
            typeof recipient === "string" ? recipient.trim().replace(/^\+/, "") : ""
        )
        .filter((recipient) => recipient.length > 0);

    if (recipients.length === 0) {
        console.warn(
            `[${requestId}] ⚠️ No WhatsApp recipients configured; skipping notifications`
        );
        return;
    }

    const endpoint = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
    const templateLanguage =
        process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US";
    const messageBody = `📩 New form submitted by ${formData.fullName} from ${formData.country}. Please check the Google Sheet for details.`;

    await Promise.all(
        recipients.map(async (recipient) => {
            try {
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
                              components: [
                                  {
                                      type: "body",
                                      parameters: [
                                          {
                                              type: "text",
                                              text: formData.fullName,
                                          },
                                          {
                                              type: "text",
                                              text: formData.country,
                                          },
                                          {
                                              type: "text",
                                              text: messageBody,
                                          },
                                      ],
                                  },
                              ],
                          },
                      }
                    : {
                          messaging_product: "whatsapp",
                          to: recipient,
                          type: "text",
                          text: {
                              body: messageBody,
                          },
                      };

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
                        `[${requestId}] ❌ WhatsApp notification failed for ${recipient}`,
                        {
                            status: response.status,
                            body: errorText,
                        }
                    );
                    return;
                }

                console.log(
                    `[${requestId}] ✅ WhatsApp notification sent to ${recipient} using ${
                        templateName ? "template" : "text"
                    } message`
                );
            } catch (error) {
                console.error(
                    `[${requestId}] ❌ Error sending WhatsApp notification to ${recipient}`,
                    error
                );
            }
        })
    );
}

async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxAttempts: number = MAX_ATTEMPTS,
    requestId: string = "unknown"
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            console.log(
                `[${requestId}] 📡 Attempt ${attempt + 1}/${maxAttempts} - Sending request to Google Sheets`
            );
            const response = await fetch(url, options);

            // If we get ANY response (even errors), it means the request reached the server
            // We should NOT retry in this case to avoid duplicate entries
            console.log(
                `[${requestId}] ✅ Received response with status: ${response.status}`
            );

            return response;
        } catch (error) {
            lastError = error as Error;

            const isNetworkError =
                error instanceof Error &&
                (error.message.includes("fetch failed") ||
                    error.message.includes("ECONNRESET") ||
                    error.message.includes("UND_ERR_SOCKET") ||
                    error.message.includes("other side closed"));

            const isLastAttempt = attempt >= maxAttempts - 1;

            if (isNetworkError && !isLastAttempt) {
                const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
                console.log(
                    `[${requestId}] ⚠️ Network error on attempt ${
                        attempt + 1
                    }: ${error.message}`
                );
                console.log(
                    `[${requestId}] 🔄 Retrying in ${delayMs}ms (attempt ${
                        attempt + 2
                    }/${maxAttempts})`
                );
                await delay(delayMs);
                continue;
            }

            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.log(
                `[${requestId}] ❌ Non-retryable error: ${errorMessage}`
            );

            throw lastError;
        }
    }

    throw lastError || new Error("Failed after maximum attempts");
}

function enqueueStripePaymentLink({
    requestId,
    formData,
    googleScriptUrl,
    googleScriptSecret,
}: {
    requestId: string;
    formData: LeadFormData;
    googleScriptUrl: string;
    googleScriptSecret: string;
}): void {
    const jobId = `${requestId}:stripe`;

    Promise.resolve()
        .then(async () => {
            console.log(`[${jobId}] 🧵 Starting background Stripe payment link job`);

            const paymentLink = await createPaymentLink({
                email: formData.email,
                fullName: formData.fullName,
                country: formData.country,
                phone: formData.phone,
                packageId: formData.package,
            });

            if (!paymentLink) {
                console.warn(
                    `[${jobId}] ⚠️ Stripe payment link could not be created, skipping Google Sheet update`
                );
                return;
            }

            const updatePayload = {
                secret: googleScriptSecret,
                operation: "attachPaymentLink",
                leadId: formData.leadId,
                payment_link: paymentLink,
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            try {
                const response = await fetchWithRetry(
                    googleScriptUrl,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "User-Agent": "Barhoum-Coaching-Site/1.0",
                        },
                        body: JSON.stringify(updatePayload),
                        signal: controller.signal,
                        keepalive: false,
                        cache: "no-store",
                    },
                    MAX_ATTEMPTS,
                    `${jobId}:update`
                );

                if (!response.ok) {
                    const responseText = await response
                        .text()
                        .catch(() => "Unable to read response");
                    console.error(
                        `[${jobId}] ❌ Failed to update Google Sheet with payment link`,
                        {
                            status: response.status,
                            body: responseText,
                        }
                    );
                    return;
                }

                const responseText = await response
                    .text()
                    .catch(() => "Unable to read response");
                console.log(
                    `[${jobId}] ✅ Payment link applied in Google Sheet`,
                    responseText.substring(0, 500)
                );
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    console.error(
                        `[${jobId}] ⏱️ Timed out while updating Google Sheet with payment link`
                    );
                } else {
                    console.error(
                        `[${jobId}] ❌ Unexpected error while updating payment link`,
                        error
                    );
                }
            } finally {
                clearTimeout(timeoutId);
            }
        })
        .catch((error) => {
            console.error(
                `[${jobId}] ❌ Stripe background worker encountered an error`,
                error
            );
        });
}

export async function POST(req: NextRequest) {
    const requestId = `req_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    const startTime = Date.now();

    console.log(
        `[${requestId}] 🚀 Form submission started at ${new Date().toISOString()}`
    );

    try {
        const rateLimitKey = getRateLimitKey(req);
        const rateLimit = checkRateLimit(rateLimitKey);

        console.log(
            `[${requestId}] Rate limit check: allowed=${rateLimit.allowed}, remaining=${rateLimit.remaining}`
        );

        if (!rateLimit.allowed) {
            console.warn(
                `[${requestId}] ⚠️ Rate limit exceeded for key: ${rateLimitKey}`
            );
            return NextResponse.json(
                {
                    success: false,
                    error: "Too many submissions. Please try again later.",
                },
                { status: 429 }
            );
        }

        let body: unknown;

        try {
            body = await req.json();
            const bodyKeys =
                body && typeof body === "object"
                    ? Object.keys(body as Record<string, unknown>)
                    : [];
            console.log(
                `[${requestId}] 📝 Received form data payload with keys: ${
                    bodyKeys.length ? bodyKeys.join(", ") : "(none)"
                }`
            );
        } catch (parseError) {
            console.warn(
                `[${requestId}] ⚠️ Invalid JSON payload received for submit-lead API`
            );
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid JSON body.",
                },
                { status: 400 }
            );
        }

        if (body && typeof body === "object") {
            const record = body as Record<string, unknown>;
            const rawLeadId = record.leadId;
            if (!rawLeadId || typeof rawLeadId !== "string" || !rawLeadId.trim()) {
                const generatedLeadId = `srv-${Date.now()}-${randomUUID().slice(0, 8)}`;
                record.leadId = generatedLeadId;
                console.warn(
                    `[${requestId}] ⚠️ leadId missing from payload; generated ${generatedLeadId}`
                );
            } else if (rawLeadId !== rawLeadId.trim()) {
                record.leadId = rawLeadId.trim();
            }
        }

        const validationResult = leadFormSchema.safeParse(body);
        console.log(
            `[${requestId}] Validation result: ${
                validationResult.success ? "✅ passed" : "❌ failed"
            }`
        );

        if (!validationResult.success) {
            const zodError = validationResult.error;
            const errors = zodError.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            console.error(`[${requestId}] ❌ Validation errors:`, errors);

            return NextResponse.json(
                {
                    success: false,
                    error: "Validation failed",
                    errors,
                },
                { status: 400 }
            );
        }

        const formData = validationResult.data;

        console.log(
            `[${requestId}] 💰 Payment eligibility check - category: ${formData.category}, country: ${formData.country}`
        );
        const needsPayment =
            formData.category === "individuals" &&
            requiresPayment(formData.country, requestId);
        const packagePresent = Boolean(formData.package?.trim().length);
        const shouldAttemptStripe = needsPayment && packagePresent;

        console.log(
            `[${requestId}] Payment required: ${
                needsPayment ? "✅ YES" : "❌ NO"
            }`
        );
        console.log(
            `[${requestId}] Category match check: "${
                formData.category
            }" === "individuals" = ${formData.category === "individuals"}`
        );

        if (needsPayment && !packagePresent) {
            console.warn(
                `[${requestId}] ⚠️ Payment required but no package selected. Stripe link will not be generated.`
            );
        } else if (!needsPayment) {
            console.log(`[${requestId}] ⏭️ Skipping payment link generation`);
        }

        const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
        const googleScriptSecret = process.env.GOOGLE_SCRIPT_SECRET;

        console.log(
            `[${requestId}] Google Script config: URL=${
                googleScriptUrl ? "✅ present" : "❌ missing"
            }, Secret=${googleScriptSecret ? "✅ present" : "❌ missing"}`
        );

        if (!googleScriptUrl || !googleScriptSecret) {
            console.error(
                `[${requestId}] ❌ Missing Google Script configuration`
            );
            return NextResponse.json(
                {
                    success: false,
                    error: "Server configuration error. Please contact support.",
                },
                { status: 500 }
            );
        }

        const payload = {
            secret: googleScriptSecret,
            operation: "createLead",
            ...formData,
            payment_link: "",
        };

        console.log(`[${requestId}] 📦 Payload prepared for Google Sheets:`, {
            email: formData.email,
            category: formData.category,
            package: formData.package,
            fieldCount: Object.keys(payload).length,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        console.log(`[${requestId}] 📤 Sending to Google Sheets...`);

        try {
            const response = await fetchWithRetry(
                googleScriptUrl,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent": "Barhoum-Coaching-Site/1.0",
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                    keepalive: true,
                    cache: "no-store",
                },
                MAX_ATTEMPTS,
                requestId
            );

            clearTimeout(timeoutId);

            console.log(
                `[${requestId}] 📥 Google Sheets response received - status: ${response.status}`
            );

            if (!response.ok) {
                const responseText = await response
                    .text()
                    .catch(() => "Unable to read response");
                console.error(
                    `[${requestId}] ❌ Google Script error - status: ${response.status}, response:`,
                    responseText
                );
                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to submit form. Please try again.",
                    },
                    { status: 500 }
                );
            }

            const responseText = await response.text();
            console.log(
                `[${requestId}] Google Sheets raw response:`,
                responseText.substring(0, 500)
            );

            let result;
            try {
                result = JSON.parse(responseText);
                console.log(`[${requestId}] Parsed response:`, result);
            } catch (parseError) {
                console.error(
                    `[${requestId}] ❌ Failed to parse Google Script response:`,
                    responseText
                );
                return NextResponse.json(
                    {
                        success: false,
                        error: "Invalid response from server. Please try again.",
                    },
                    { status: 500 }
                );
            }

            if (result.success) {
                const isDuplicate =
                    result &&
                    typeof result === "object" &&
                    "duplicate" in result &&
                    Boolean((result as { duplicate?: unknown }).duplicate);

                const duration = Date.now() - startTime;
                console.log(
                    `[${requestId}] ✅ Form submitted successfully to Google Sheets in ${duration}ms`
                );
                console.log(`[${requestId}] 🏁 Request completed successfully`);

                if (!isDuplicate) {
                    try {
                        await sendWhatsAppNotifications({
                            formData,
                            requestId,
                        });
                    } catch (error) {
                        console.error(
                            `[${requestId}] ❌ Unexpected error while handling WhatsApp notifications`,
                            error
                        );
                    }
                } else {
                    console.log(
                        `[${requestId}] 🔁 Duplicate lead detected; skipping WhatsApp notification`
                    );
                }

                if (!isDuplicate && shouldAttemptStripe) {
                    console.log(
                        `[${requestId}] 🧾 Queueing Stripe payment link generation for leadId=${formData.leadId}`
                    );
                    enqueueStripePaymentLink({
                        requestId,
                        formData,
                        googleScriptUrl,
                        googleScriptSecret,
                    });
                } else if (isDuplicate) {
                    console.log(
                        `[${requestId}] 🔁 Duplicate lead detected for leadId=${formData.leadId}; skipping Stripe background job`
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: isDuplicate
                        ? "Form already submitted. We will be in touch soon."
                        : "Form submitted successfully",
                    paymentLinkPending: !isDuplicate && shouldAttemptStripe,
                    duplicate: isDuplicate,
                });
            } else {
                const reportedError =
                    result && typeof result === "object" && "error" in result
                        ? (result as { error?: unknown }).error
                        : undefined;

                console.error(
                    `[${requestId}] ❌ Google Script indicated failure`,
                    {
                        status: response.status,
                        error: reportedError,
                    }
                );
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            result.error ||
                            "Failed to submit form. Please try again.",
                    },
                    { status: 500 }
                );
            }
        } catch (fetchError) {
            clearTimeout(timeoutId);

            if (
                fetchError instanceof Error &&
                fetchError.name === "AbortError"
            ) {
                console.error(
                    `[${requestId}] ⏱️ Request to Google Script timed out after 30 seconds`
                );
                return NextResponse.json(
                    {
                        success: false,
                        error: "Request timed out. Please try again.",
                    },
                    { status: 504 }
                );
            }

            console.error(
                `[${requestId}] ❌ Error calling Google Script after retries:`,
                {
                    message:
                        fetchError instanceof Error
                            ? fetchError.message
                            : String(fetchError),
                    name:
                        fetchError instanceof Error
                            ? fetchError.name
                            : "Unknown",
                    stack:
                        fetchError instanceof Error
                            ? fetchError.stack
                            : undefined,
                }
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Network error. Please check your connection and try again.",
                },
                { status: 500 }
            );
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(
            `[${requestId}] ❌ Unexpected error in submit-lead API after ${duration}ms:`,
            error
        );
        return NextResponse.json(
            {
                success: false,
                error: "An unexpected error occurred. Please try again.",
            },
            { status: 500 }
        );
    }
}
