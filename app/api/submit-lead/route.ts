import { NextRequest, NextResponse } from "next/server";
import { leadFormSchema } from "@/lib/validation/lead-form";
import { z } from "zod";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

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
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(googleScriptUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(
                    "Google Script responded with error:",
                    response.status
                );
                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to submit form. Please try again.",
                    },
                    { status: 500 }
                );
            }

            const result = await response.json();

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
                console.error("Request to Google Script timed out");
                return NextResponse.json(
                    {
                        success: false,
                        error: "Request timed out. Please try again.",
                    },
                    { status: 504 }
                );
            }

            console.error("Error calling Google Script:", fetchError);
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
