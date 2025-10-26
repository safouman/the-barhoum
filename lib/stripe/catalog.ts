import { cache } from "react";
import type Stripe from "stripe";
import { getStripeClient } from "./client";

const SOURCE_FILTER = "Ibrahim ben Abdallah";

export interface StripeProgramRecord {
    programId: string;
    productId: string;
    priceId: string;
    priceAmount: number;
    currency: string;
    sessions?: number;
    durationLabel?: string;
    metadata: Stripe.Metadata;
}

export interface StripeCatalogResult {
    programs: StripeProgramRecord[];
    warnings: string[];
}

async function fetchStripePrograms(): Promise<StripeCatalogResult> {
    const stripe = getStripeClient();
    if (!stripe) {
        console.warn(
            "[Stripe Catalog] ⚠️ Stripe client unavailable. Returning empty catalog."
        );
        return { programs: [], warnings: ["missing-stripe-client"] };
    }

    const programs: StripeProgramRecord[] = [];
    const warnings: string[] = [];

    const query = "metadata['brand']:'Ibrahim ben Abdallah'";
    let result = await stripe.products.search({
        query,
        limit: 100,
        expand: ["data.default_price"],
    });

    const processProduct = async (product: Stripe.Product) => {
        if (!product.active) {
            console.log("[Stripe Catalog] Skipping inactive product", {
                productId: product.id,
            });
            return;
        }

        const sourceTag = product.metadata?.brand;
        if (sourceTag !== SOURCE_FILTER) {
            console.log(
                "[Stripe Catalog] Skipping product with mismatched source",
                {
                    productId: product.id,
                    brand: sourceTag,
                }
            );
            return;
        }

        const programId =
            product.metadata?.program_id ?? product.metadata?.program_key;

        if (!programId) {
            const message = `[Stripe Catalog] ⚠️ Product "${product.id}" missing metadata.program_id`;
            console.warn(message, { metadata: product.metadata });
            warnings.push(message);
            return;
        }

        let priceId: string | null = null;
        let unitAmount: number | null | undefined;
        let currency: string | undefined;

        const defaultPrice = product.default_price;
        if (defaultPrice && typeof defaultPrice === "object") {
            if (defaultPrice.active) {
                priceId = defaultPrice.id;
                unitAmount = defaultPrice.unit_amount;
                currency = defaultPrice.currency;
            }
        } else if (typeof defaultPrice === "string") {
            try {
                const price = await stripe.prices.retrieve(defaultPrice);
                if (price.active) {
                    priceId = price.id;
                    unitAmount = price.unit_amount;
                    currency = price.currency;
                }
            } catch (error) {
                const message = `[Stripe Catalog] ❌ Failed to retrieve price "${defaultPrice}" for product "${product.id}"`;
                console.error(message, error);
                warnings.push(message);
            }
        }

        if (!priceId || unitAmount == null || currency == null) {
            try {
                const prices = await stripe.prices.list({
                    product: product.id,
                    active: true,
                    limit: 1,
                });
                const fallbackPrice = prices.data[0];
                if (fallbackPrice) {
                    priceId = fallbackPrice.id;
                    unitAmount = fallbackPrice.unit_amount;
                    currency = fallbackPrice.currency;
                }
            } catch (error) {
                const message = `[Stripe Catalog] ❌ Failed to list prices for product "${product.id}"`;
                console.error(message, error);
                warnings.push(message);
            }
        }

        if (!priceId || unitAmount == null || currency == null) {
            const message = `[Stripe Catalog] ⚠️ Skipping product "${product.id}" - missing active price information.`;
            console.warn(message);
            warnings.push(message);
            return;
        }

        const sessionsRaw = product.metadata?.sessions;
        const sessions = sessionsRaw ? Number(sessionsRaw) : undefined;
        if (sessionsRaw && Number.isNaN(sessions)) {
            const message = `[Stripe Catalog] ⚠️ Product "${product.id}" has non-numeric sessions metadata (${sessionsRaw}).`;
            console.warn(message);
            warnings.push(message);
        }

        const durationLabel =
            product.metadata?.duration_label ??
            product.metadata?.duration ??
            "";

        programs.push({
            programId,
            productId: product.id,
            priceId,
            priceAmount: unitAmount,
            currency: currency.toUpperCase(),
            sessions: sessions && sessions > 0 ? sessions : undefined,
            durationLabel: durationLabel || undefined,
            metadata: product.metadata ?? {},
        });

        console.log("[Stripe Catalog] Program pricing refreshed", {
            programId,
            productId: product.id,
            priceId,
            priceAmountMinor: unitAmount,
            currency,
        });
    };

    for (const product of result.data) {
        await processProduct(product);
    }

    while (result.has_more && result.next_page) {
        result = await stripe.products.search({
            query,
            limit: 100,
            expand: ["data.default_price"],
            page: result.next_page,
        });

        for (const product of result.data) {
            await processProduct(product);
        }
    }

    console.log("[Stripe Catalog] Completed fetch", {
        keys: programs.map((program) => program.programId),
    });

    return { programs, warnings };
}

export const getStripeProgramCatalog = cache(fetchStripePrograms);
