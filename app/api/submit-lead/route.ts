import { NextRequest, NextResponse } from "next/server";
import { leadFormSchema } from "@/lib/validation/lead-form";
import { z } from "zod";

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
    maxRetries: number = MAX_RETRIES
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            const clonedResponse = response.clone();

            try {
                await response.text();
            } catch (consumeError) {
                console.warn("Warning: Could not consume response body:", consumeError);
            }

            return clonedResponse;
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
                    `Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms for URL: ${url}`
                );
                await delay(delayMs);
                continue;
            }

            throw error;
        }
    }

    throw lastError || new Error("Failed after maximum retries");
}

export async function POST(req: NextRequest) {
    try {
        const rateLimitKey = getRateLimitKey(req);
        const rateLimit = checkRateLimit(rateLimitKey);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Too many submissions. Please try again later.",
                },
                { status: 429 }
            );
        }

        const body = await req.json();

        const validationResult = leadFormSchema.safeParse(body);

        if (!validationResult.success) {
            const zodError = validationResult.error;
            const errors = zodError.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

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

        const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
        const googleScriptSecret = process.env.GOOGLE_SCRIPT_SECRET;

        if (!googleScriptUrl || !googleScriptSecret) {
            console.error("Missing Google Script configuration");
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
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetchWithRetry(googleScriptUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Barhoum-Coaching-Site/1.0",
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
                keepalive: true,
                cache: "no-store",
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const responseText = await response.text().catch(() => "Unable to read response");
                console.error(
                    "Google Script responded with error:",
                    response.status,
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
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Failed to parse Google Script response:", responseText);
                return NextResponse.json(
                    {
                        success: false,
                        error: "Invalid response from server. Please try again.",
                    },
                    { status: 500 }
                );
            }

            if (result.success) {
                return NextResponse.json({
                    success: true,
                    message: "Form submitted successfully",
                });
            } else {
                console.error("Google Script returned error:", result);
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
                console.error("Request to Google Script timed out after 30 seconds");
                return NextResponse.json(
                    {
                        success: false,
                        error: "Request timed out. Please try again.",
                    },
                    { status: 504 }
                );
            }

            console.error("Error calling Google Script after retries:", {
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
        console.error("Unexpected error in submit-lead API:", error);
        return NextResponse.json(
            {
                success: false,
                error: "An unexpected error occurred. Please try again.",
            },
            { status: 500 }
        );
    }
}
