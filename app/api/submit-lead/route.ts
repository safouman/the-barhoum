import { NextRequest, NextResponse } from "next/server";
import { leadFormSchema } from "@/lib/validation/lead-form";
import { z } from "zod";
import { createPaymentLink } from "@/lib/stripe/payment-links";
import { requiresPayment } from "@/lib/utils/geo";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

function getRateLimitKey(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
        ? forwarded.split(",")[0]
        : req.headers.get("x-real-ip") || "unknown";
    return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
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

async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number = MAX_RETRIES,
    requestId: string = 'unknown'
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[${requestId}] 📡 Attempt ${attempt + 1}/${maxRetries + 1} - Sending request to Google Sheets`);
            const response = await fetch(url, options);

            // If we get ANY response (even errors), it means the request reached the server
            // We should NOT retry in this case to avoid duplicate entries
            console.log(`[${requestId}] ✅ Received response with status: ${response.status}`);

            return response;
        } catch (error) {
            lastError = error as Error;

            const isNetworkError =
                error instanceof Error &&
                (error.message.includes("fetch failed") ||
                 error.message.includes("ECONNRESET") ||
                 error.message.includes("UND_ERR_SOCKET") ||
                 error.message.includes("other side closed"));

            if (isNetworkError && attempt < maxRetries) {
                const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
                console.log(
                    `[${requestId}] ⚠️ Network error on attempt ${attempt + 1}: ${error.message}`
                );
                console.log(
                    `[${requestId}] 🔄 Retrying in ${delayMs}ms (attempt ${attempt + 2}/${maxRetries + 1})`
                );
                await delay(delayMs);
                continue;
            }

            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`[${requestId}] ❌ Non-retryable error: ${errorMessage}`);
            throw error;
        }
    }

    throw lastError || new Error("Failed after maximum retries");
}

export async function POST(req: NextRequest) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    console.log(`[${requestId}] 🚀 Form submission started at ${new Date().toISOString()}`);

    try {
        const rateLimitKey = getRateLimitKey(req);
        const rateLimit = checkRateLimit(rateLimitKey);

        console.log(`[${requestId}] Rate limit check: allowed=${rateLimit.allowed}, remaining=${rateLimit.remaining}`);

        if (!rateLimit.allowed) {
            console.warn(`[${requestId}] ⚠️ Rate limit exceeded for key: ${rateLimitKey}`);
            return NextResponse.json(
                {
                    success: false,
                    error: "Too many submissions. Please try again later.",
                },
                { status: 429 }
            );
        }

        const body = await req.json();
        console.log(`[${requestId}] 📝 Received form data - category: ${body.category}, package: ${body.package}, email: ${body.email}`);

        const validationResult = leadFormSchema.safeParse(body);
        console.log(`[${requestId}] Validation result: ${validationResult.success ? '✅ passed' : '❌ failed'}`);

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

        let paymentLink = "";

        console.log(`[${requestId}] 💰 Payment eligibility check - category: ${formData.category}, country: ${formData.country}`);
        const needsPayment = formData.category === "individuals" && requiresPayment(formData.country, requestId);
        console.log(`[${requestId}] Payment required: ${needsPayment ? '✅ YES' : '❌ NO'}`);
        console.log(`[${requestId}] Category match check: "${formData.category}" === "individuals" = ${formData.category === "individuals"}`);

        if (needsPayment) {
            console.log(`[${requestId}] 🔗 Starting payment link generation for package: ${formData.package}`);
            try {
                const linkParams = {
                    email: formData.email,
                    fullName: formData.fullName,
                    country: formData.country,
                    phone: formData.phone,
                    packageId: formData.package,
                };
                console.log(`[${requestId}] Payment link params:`, linkParams);

                const link = await createPaymentLink(linkParams);

                if (link) {
                    paymentLink = link;
                    console.log(`[${requestId}] ✅ Payment link generated successfully:`, link);
                } else {
                    console.warn(`[${requestId}] ⚠️ Payment link generation returned null for package: ${formData.package}`);
                }
            } catch (error) {
                console.error(`[${requestId}] ❌ Error generating payment link:`, {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    package: formData.package,
                });
            }
        } else {
            console.log(`[${requestId}] ⏭️ Skipping payment link generation`);
        }

        const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
        const googleScriptSecret = process.env.GOOGLE_SCRIPT_SECRET;

        console.log(`[${requestId}] Google Script config: URL=${googleScriptUrl ? '✅ present' : '❌ missing'}, Secret=${googleScriptSecret ? '✅ present' : '❌ missing'}`);

        if (!googleScriptUrl || !googleScriptSecret) {
            console.error(`[${requestId}] ❌ Missing Google Script configuration`);
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
            ...formData,
            payment_link: paymentLink,
        };

        console.log(`[${requestId}] 📦 Payload prepared for Google Sheets:`, {
            hasPaymentLink: !!paymentLink,
            paymentLinkValue: paymentLink || '(empty)',
            paymentLinkLength: paymentLink.length,
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
                MAX_RETRIES,
                requestId
            );

            clearTimeout(timeoutId);

            console.log(`[${requestId}] 📥 Google Sheets response received - status: ${response.status}`);

            if (!response.ok) {
                const responseText = await response.text().catch(() => "Unable to read response");
                console.error(`[${requestId}] ❌ Google Script error - status: ${response.status}, response:`, responseText);
                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to submit form. Please try again.",
                    },
                    { status: 500 }
                );
            }

            const responseText = await response.text();
            console.log(`[${requestId}] Google Sheets raw response:`, responseText.substring(0, 500));

            let result;
            try {
                result = JSON.parse(responseText);
                console.log(`[${requestId}] Parsed response:`, result);
            } catch (parseError) {
                console.error(`[${requestId}] ❌ Failed to parse Google Script response:`, responseText);
                return NextResponse.json(
                    {
                        success: false,
                        error: "Invalid response from server. Please try again.",
                    },
                    { status: 500 }
                );
            }

            if (result.success) {
                const duration = Date.now() - startTime;
                console.log(`[${requestId}] ✅ Form submitted successfully to Google Sheets in ${duration}ms`);
                console.log(`[${requestId}] 🏁 Request completed successfully`);

                return NextResponse.json({
                    success: true,
                    message: "Form submitted successfully",
                });
            } else {
                console.error(`[${requestId}] ❌ Google Script returned error:`, result);
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
                console.error(`[${requestId}] ⏱️ Request to Google Script timed out after 30 seconds`);
                return NextResponse.json(
                    {
                        success: false,
                        error: "Request timed out. Please try again.",
                    },
                    { status: 504 }
                );
            }

            console.error(`[${requestId}] ❌ Error calling Google Script after retries:`, {
                message: fetchError instanceof Error ? fetchError.message : String(fetchError),
                name: fetchError instanceof Error ? fetchError.name : "Unknown",
                stack: fetchError instanceof Error ? fetchError.stack : undefined,
            });

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
        console.error(`[${requestId}] ❌ Unexpected error in submit-lead API after ${duration}ms:`, error);
        return NextResponse.json(
            {
                success: false,
                error: "An unexpected error occurred. Please try again.",
            },
            { status: 500 }
        );
    }
}
