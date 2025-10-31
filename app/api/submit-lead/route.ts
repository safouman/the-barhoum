import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAllStripeIdentifiers, resolveStripeSelection, type StripeSelection, type IndividualProgramConfig } from "@/lib/stripe/config";
import { leadFormSchema, type LeadFormData } from "@/lib/validation/lead-form";
import { createPaymentLink } from "@/lib/stripe/payment-links";
import { requiresPayment } from "@/lib/utils/geo";
import type { SharedAnalyticsContext } from "@/lib/analytics/shared";
import { trackAutomationEvent } from "@/lib/analytics/server";
import { sendLeadWhatsAppNotification } from "@/lib/whatsapp/notifications";
import { isStripeEnabled } from "@/config/features";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function resolveProgramLabel(program: IndividualProgramConfig): string {
    return (
        program.metadata?.program_label ??
        program.metadata?.title_en ??
        program.programId
    );
}

function resolveProgramDescription(program: IndividualProgramConfig): string {
    return program.metadata?.description ?? "";
}

const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000;

function parseDeviceType(userAgent: string | null): string {
    if (!userAgent) return "unknown";
    const ua = userAgent.toLowerCase();
    if (ua.includes("tablet") || ua.includes("ipad")) return "tablet";
    if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) return "mobile";
    return "desktop";
}

function parseLocale(acceptLanguage: string | null): string {
    if (!acceptLanguage) return "unknown";
    const primary = acceptLanguage.split(",")[0] ?? "";
    const [raw] = primary.split(";");
    const normalized = raw?.trim() ?? "";
    if (!normalized) return "unknown";
    return normalized.length > 5 ? normalized.slice(0, 5) : normalized;
}

function extractUtmFromReferer(referer: string | null): Pick<SharedAnalyticsContext, "utm_source" | "utm_medium" | "utm_campaign"> {
    const defaults = {
        utm_source: "direct",
        utm_medium: "direct",
        utm_campaign: "none",
    };
    if (!referer) {
        return defaults;
    }
    try {
        const url = new URL(referer);
        return {
            utm_source: url.searchParams.get("utm_source") ?? defaults.utm_source,
            utm_medium: url.searchParams.get("utm_medium") ?? defaults.utm_medium,
            utm_campaign: url.searchParams.get("utm_campaign") ?? defaults.utm_campaign,
        };
    } catch {
        return defaults;
    }
}

function resolveReferrerValue(referer: string | null): string {
    if (!referer) return "server";
    try {
        const refUrl = new URL(referer);
        return refUrl.origin + refUrl.pathname;
    } catch {
        return referer;
    }
}

function buildAutomationContext(
    req: NextRequest,
    formData: LeadFormData,
    stripeSelection?: StripeSelection | null
): Partial<SharedAnalyticsContext> {
    const referer = req.headers.get("referer");
    const utm = extractUtmFromReferer(referer);
    const trimmedCountry = formData.country?.trim() ?? "";
    const trimmedPackage = formData.package?.trim() ?? "";
    const resolvedProgramName =
        stripeSelection && stripeSelection.type === "individual-program"
            ? resolveProgramLabel(stripeSelection.program)
            : trimmedPackage || "none";
    return {
        locale: parseLocale(req.headers.get("accept-language")),
        form_country: trimmedCountry || undefined,
        device_type: parseDeviceType(req.headers.get("user-agent")),
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        category: formData.category?.trim() || "none",
        program_name: resolvedProgramName,
        referrer: resolveReferrerValue(referer),
    };
}

function getRateLimitKey(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
        ? forwarded.split(",")[0]
        : req.headers.get("x-real-ip") || "unknown";
    return ip;
}

function cleanupRateLimitEntries(currentTime: number): void {
    rateLimitMap.forEach((record, ip) => {
        if (currentTime > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    });
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
                `[${requestId}] 📡 Attempt ${
                    attempt + 1
                }/${maxAttempts} - Sending request to Google Sheets`
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

type StripeJobResult =
    | { status: "success" }
    | { status: "skipped"; reason: string }
    | { status: "failed"; reason: string; details?: unknown };

async function processStripePaymentLink({
    requestId,
    formData,
    googleScriptUrl,
    googleScriptSecret,
    analyticsContext,
    stripeSelection,
    packageIdentifier,
}: {
    requestId: string;
    formData: LeadFormData;
    googleScriptUrl: string;
    googleScriptSecret: string;
    analyticsContext: Partial<SharedAnalyticsContext>;
    stripeSelection?: StripeSelection | null;
    packageIdentifier?: string | null;
}): Promise<StripeJobResult> {
    const jobId = `${requestId}:stripe`;

    console.log(`[${jobId}] 🧵 Starting Stripe payment link workflow`);

    if (!isStripeEnabled) {
        console.log(
            `[${jobId}] 🔕 Stripe disabled via feature flag; skipping payment link generation`
        );
        return { status: "skipped", reason: "stripe-disabled" };
    }

    if (!formData.package?.trim()) {
        console.warn(
            `[${jobId}] ⚠️ No package provided; skipping payment link generation`
        );
        return { status: "skipped", reason: "missing-package" };
    }

    const selectionIdentifier = packageIdentifier ?? formData.package;
    const resolvedSelection =
        stripeSelection ??
        (selectionIdentifier
            ? await resolveStripeSelection(selectionIdentifier)
            : null);

    const packageIdForStripe =
        resolvedSelection && resolvedSelection.type === "individual-program"
            ? resolvedSelection.program.programId
            : resolvedSelection && resolvedSelection.type === "legacy-price"
              ? resolvedSelection.packageId
              : packageIdentifier ?? formData.package;

    const packageLabelForStripe =
        resolvedSelection && resolvedSelection.type === "individual-program"
            ? resolveProgramLabel(resolvedSelection.program)
            : formData.package;

    if (resolvedSelection && resolvedSelection.type === "individual-program") {
        console.log(`[${jobId}] 🎯 Stripe program context`, {
            programKey: resolvedSelection.program.programId,
            programLabel: resolveProgramLabel(resolvedSelection.program),
            productId: resolvedSelection.program.productId,
            priceId: resolvedSelection.program.priceId,
        });
    } else if (resolvedSelection && resolvedSelection.type === "legacy-price") {
        console.log(`[${jobId}] 🎯 Stripe legacy package context`, {
            packageId: resolvedSelection.packageId,
            priceId: resolvedSelection.priceId,
        });
    } else if (!resolvedSelection) {
        console.warn(
            `[${jobId}] ⚠️ Unable to resolve Stripe mapping inside payment workflow for package="${formData.package}"`
        );
    }

    const stripeUpdateDetails: Record<string, string> = {};

    if (resolvedSelection) {
        if (resolvedSelection.type === "individual-program") {
            stripeUpdateDetails.stripe_product_id =
                resolvedSelection.program.productId;
            stripeUpdateDetails.stripe_price_id =
                resolvedSelection.program.priceId;
            stripeUpdateDetails.stripe_program_key =
                resolvedSelection.program.programId;
            stripeUpdateDetails.stripe_program_label =
                packageLabelForStripe;
            stripeUpdateDetails.stripe_program_description =
                resolveProgramDescription(resolvedSelection.program);
            stripeUpdateDetails.stripe_program_sessions = String(
                resolvedSelection.program.sessions ??
                    resolvedSelection.program.metadata?.sessions ??
                    ""
            );
            stripeUpdateDetails.stripe_program_duration =
                resolvedSelection.program.durationLabel ??
                resolvedSelection.program.metadata?.duration_label ??
                resolvedSelection.program.metadata?.duration ??
                "";
            stripeUpdateDetails.stripe_program_currency =
                resolvedSelection.program.currency;
            stripeUpdateDetails.stripe_program_amount_minor = String(
                resolvedSelection.program.priceAmount
            );
        } else {
            stripeUpdateDetails.stripe_price_id = resolvedSelection.priceId;
            stripeUpdateDetails.stripe_package_id =
                resolvedSelection.packageId;
        }
    }

    try {
        const paymentLink = await createPaymentLink({
            fullName: formData.fullName,
            country: formData.country,
            phone: formData.phone,
            packageId: packageIdForStripe,
            category: formData.category,
            leadId: formData.leadId,
            email: formData.email,
        });

        if (!paymentLink) {
            console.warn(
                `[${jobId}] ⚠️ Stripe payment link could not be created`
            );
            return { status: "failed", reason: "create-payment-link-failed" };
        }

        const updatePayload = {
            secret: googleScriptSecret,
            operation: "attachPaymentLink",
            leadId: formData.leadId,
            payment_link: paymentLink,
            ...stripeUpdateDetails,
            package_key: packageIdentifier ?? "",
            package_label: packageLabelForStripe,
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
                return {
                    status: "failed",
                    reason: "sheet-update-failed",
                    details: {
                        status: response.status,
                        body: responseText,
                    },
                };
        }

        const responseText = await response
            .text()
            .catch(() => "Unable to read response");
        console.log(
            `[${jobId}] ✅ Payment link applied in Google Sheet`,
            responseText.substring(0, 500)
        );
        const analyticsPayload: Record<string, string> = {
            package_id: packageIdForStripe,
            package_label: packageLabelForStripe,
            payment_link_url: paymentLink,
        };

        if (resolvedSelection?.type === "individual-program") {
            analyticsPayload.program_key = resolvedSelection.program.programId;
            analyticsPayload.program_label = resolveProgramLabel(resolvedSelection.program);
            analyticsPayload.stripe_product_id =
                resolvedSelection.program.productId;
            analyticsPayload.stripe_price_id =
                resolvedSelection.program.priceId;
            analyticsPayload.program_currency =
                resolvedSelection.program.currency;
            analyticsPayload.program_amount_minor = String(
                resolvedSelection.program.priceAmount
            );
        } else if (resolvedSelection?.type === "legacy-price") {
            analyticsPayload.stripe_price_id = resolvedSelection.priceId;
            analyticsPayload.stripe_package_id =
                resolvedSelection.packageId;
        }

        await trackAutomationEvent(
            "stripe_link_generated",
            analyticsPayload,
            analyticsContext,
            { clientId: requestId }
        );
        return { status: "success" };
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                console.error(
                    `[${jobId}] ⏱️ Timed out while updating Google Sheet with payment link`
                );
                return { status: "failed", reason: "sheet-update-timeout" };
            }

            console.error(
                `[${jobId}] ❌ Unexpected error while updating payment link`,
                error
            );
            return {
                status: "failed",
                reason: "sheet-update-error",
                details: error instanceof Error ? error.message : error,
            };
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        console.error(
            `[${jobId}] ❌ Stripe workflow encountered an error`,
            error
        );
        return {
            status: "failed",
            reason: "unexpected-error",
            details: error instanceof Error ? error.message : error,
        };
    }
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
            if (
                !rawLeadId ||
                typeof rawLeadId !== "string" ||
                !rawLeadId.trim()
            ) {
                const generatedLeadId = `srv-${Date.now()}-${randomUUID().slice(
                    0,
                    8
                )}`;
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

        const rawPackageLabelInput = formData.package.trim();
        const rawPackageIdInput = formData.packageId?.trim?.() ?? "";
        const identifierCandidate = rawPackageIdInput || rawPackageLabelInput;
        let stripeSelectionForLead: StripeSelection | null = null;
        let packageIdentifier: string | null = rawPackageIdInput || null;
        let packageDisplayLabel: string = rawPackageLabelInput || rawPackageIdInput || "";

        if (isStripeEnabled && identifierCandidate) {
            stripeSelectionForLead = await resolveStripeSelection(identifierCandidate);
            if (!stripeSelectionForLead) {
                const allowedIdentifiers = await getAllStripeIdentifiers();
                console.warn(
                    `[${requestId}] ⚠️ Unknown package identifier "${identifierCandidate}" received. Allowed identifiers: ${allowedIdentifiers.join(
                        ", "
                    )}`
                );
                return NextResponse.json(
                    {
                        success: false,
                        error: "Invalid package selection. Please refresh and try again.",
                    },
                    { status: 400 }
                );
            }

            console.log(
                `[${requestId}] 🎯 Resolved package selection`,
                stripeSelectionForLead.type === "individual-program"
                    ? {
                          requested: identifierCandidate,
                          programKey: stripeSelectionForLead.program.programId,
                          programLabel: resolveProgramLabel(stripeSelectionForLead.program),
                          productId: stripeSelectionForLead.program.productId,
                          priceId: stripeSelectionForLead.program.priceId,
                      }
                    : {
                          packageId: identifierCandidate,
                          priceId: stripeSelectionForLead.priceId,
                      }
            );

            if (stripeSelectionForLead.type === "individual-program") {
                packageIdentifier = stripeSelectionForLead.program.programId;
                if (!packageDisplayLabel) {
                    packageDisplayLabel = resolveProgramLabel(
                        stripeSelectionForLead.program
                    );
                }
            } else {
                packageIdentifier = stripeSelectionForLead.packageId;
                if (!packageDisplayLabel) {
                    packageDisplayLabel = identifierCandidate;
                }
            }
        } else {
            packageIdentifier = rawPackageIdInput || null;
            packageDisplayLabel = rawPackageLabelInput || rawPackageIdInput || "";
        }

        formData.package = packageDisplayLabel;
        formData.packageId = packageIdentifier ?? "";

        const automationContext = buildAutomationContext(
            req,
            formData,
            stripeSelectionForLead
        );

        console.log(
            `[${requestId}] 💰 Payment eligibility check - category: ${formData.category}, country: ${formData.country}`
        );
        const needsPayment =
            formData.category === "me_and_me" &&
            requiresPayment(formData.country, requestId);
        const packagePresent = Boolean(formData.package?.trim().length);
        const shouldAttemptStripe =
            isStripeEnabled && needsPayment && packagePresent;

        console.log(
            `[${requestId}] Payment required: ${
                needsPayment ? "✅ YES" : "❌ NO"
            }`
        );
        if (!isStripeEnabled) {
            console.log(
                `[${requestId}] 🔕 Stripe disabled via feature flag; payment links will not be generated`
            );
        }
        console.log(
            `[${requestId}] Category match check: "${
                formData.category
            }" === "me_and_me" = ${formData.category === "me_and_me"}`
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

        const packageDisplayName = packageDisplayLabel || formData.package;

        const stripeLeadDetails: Record<string, string> = {};

        if (stripeSelectionForLead) {
            if (stripeSelectionForLead.type === "individual-program") {
                stripeLeadDetails.stripe_product_id =
                    stripeSelectionForLead.program.productId;
                stripeLeadDetails.stripe_price_id =
                    stripeSelectionForLead.program.priceId;
                stripeLeadDetails.stripe_program_key =
                    stripeSelectionForLead.program.programId;
                stripeLeadDetails.stripe_program_label =
                    packageDisplayName;
                stripeLeadDetails.stripe_program_description =
                    resolveProgramDescription(stripeSelectionForLead.program);
                stripeLeadDetails.stripe_program_sessions = String(
                    stripeSelectionForLead.program.sessions ??
                        stripeSelectionForLead.program.metadata?.sessions ??
                        ""
                );
                stripeLeadDetails.stripe_program_duration =
                    stripeSelectionForLead.program.durationLabel ??
                    stripeSelectionForLead.program.metadata?.duration_label ??
                    stripeSelectionForLead.program.metadata?.duration ??
                    "";
                stripeLeadDetails.stripe_program_currency =
                    stripeSelectionForLead.program.currency;
                stripeLeadDetails.stripe_program_amount_minor = String(
                    stripeSelectionForLead.program.priceAmount
                );
            } else {
                stripeLeadDetails.stripe_price_id = stripeSelectionForLead.priceId;
                stripeLeadDetails.stripe_package_id =
                    stripeSelectionForLead.packageId;
            }
        }

        const payload = {
            secret: googleScriptSecret,
            operation: "createLead",
            ...formData,
            package: packageDisplayName,
            package_key: packageIdentifier ?? "",
            ...stripeLeadDetails,
            payment_link: "",
        };

        console.log(`[${requestId}] 📦 Payload prepared for Google Sheets:`, {
            category: formData.category,
            package_key: packageIdentifier ?? "",
            package_label: packageDisplayName,
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
                        await sendLeadWhatsAppNotification({
                            formData,
                            requestId,
                            analyticsContext: automationContext,
                            programName: packageDisplayName,
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

                let paymentLinkStatus:
                    | StripeJobResult["status"]
                    | "not-required" = "not-required";
                let paymentLinkError: string | undefined;

                if (!isDuplicate && shouldAttemptStripe) {
                    console.log(
                        `[${requestId}] 🧾 Processing Stripe payment link for leadId=${formData.leadId}`
                    );
                    const stripeResult = await processStripePaymentLink({
                        requestId,
                        formData,
                        googleScriptUrl,
                        googleScriptSecret,
                        analyticsContext: automationContext,
                        stripeSelection: stripeSelectionForLead,
                        packageIdentifier,
                    });

                    paymentLinkStatus = stripeResult.status;
                    if (stripeResult.status !== "success") {
                        paymentLinkError = stripeResult.reason;
                    }
                } else if (isDuplicate) {
                    console.log(
                        `[${requestId}] 🔁 Duplicate lead detected for leadId=${formData.leadId}; skipping Stripe workflow`
                    );
                    paymentLinkStatus = "skipped";
                    paymentLinkError = "duplicate-lead";
                } else if (needsPayment && !packagePresent) {
                    paymentLinkStatus = "skipped";
                    paymentLinkError = "missing-package";
                }

                return NextResponse.json({
                    success: true,
                    message: isDuplicate
                        ? "Form already submitted. We will be in touch soon."
                        : "Form submitted successfully",
                    paymentLinkStatus,
                    paymentLinkError,
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
