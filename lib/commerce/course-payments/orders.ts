import "server-only";

import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { authTransaction, type AuthTx } from "../../student-auth/core";
import { requireCurrentStudent, type StudentIdentity } from "../../student-auth/session";
import { CommerceError } from "./core";

export type OrderStatus = "creating" | "open" | "processing" | "fulfilled" | "failed" | "expired" | "support_required";
export type Order = {
    id: string;
    student_id: number;
    offer_id: number;
    course_id: number;
    module_id: number | null;
    stripe_account: string;
    livemode: boolean;
    stripe_price_id: string;
    amount_minor: number;
    currency: string;
    tax_minor: number | null;
    total_minor: number | null;
    stripe_session_id: string | null;
    stripe_payment_intent_id: string | null;
    checkout_url: string | null;
    checkout_origin: string;
    cancel_course_slug: string;
    expires_at: Date | string | null;
    status: OrderStatus;
    reason: string | null;
    created_at: Date | string;
    course_slug: string;
    course_title: string;
    revision: string;
};

export type AvailableOffer = {
    id: number;
    course_id: number;
    module_id: number | null;
    stripe_price_id: string;
    course_slug: string;
};

export type ChargePrice = { amountMinor: number; currency: string };

export async function lockCourseCommerce({ tx }: AuthTx, studentID: number, courseID: number) {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`barhoum:commerce:${studentID}:${courseID}`}, 0))`);
}

const available = sql`
    o.enabled AND c._status = 'published' AND (o.module_id IS NULL OR EXISTS (
        SELECT 1 FROM modules m WHERE m.id = o.module_id AND m.course_id = c.id
          AND m.classification = 'premium' AND m._status = 'published'
          AND (
            (c.structure = 'modular' AND EXISTS (
                SELECT 1 FROM courses_modules placement WHERE placement._parent_id = c.id AND placement.module_id = m.id
            )) OR (c.structure = 'structured' AND EXISTS (
                SELECT 1 FROM courses_parts p JOIN courses_parts_modules placement ON placement._parent_id = p.id
                WHERE p._parent_id = c.id AND placement.module_id = m.id
            ))
          )
    ))`;

export async function readOffers({ tx }: AuthTx, target: { offerId: number } | { courseId: number }, lock = false) {
    const where = "offerId" in target ? sql`o.id = ${target.offerId}` : sql`o.course_id = ${target.courseId}`;
    const result = await tx.execute(sql`
        SELECT o.id, o.course_id, o.module_id, o.stripe_price_id, c.slug AS course_slug
        FROM course_offers o JOIN courses c ON c.id = o.course_id
        WHERE ${where} AND ${available}
        ORDER BY o.module_id NULLS FIRST, o.id
        ${lock ? sql`FOR SHARE OF o, c` : sql``}
    `);
    return result.rows as AvailableOffer[];
}

export async function findOrder({ tx }: AuthTx, orderID: string, studentID?: number) {
    const result = await tx.execute(sql`
        SELECT o.*, c.slug AS course_slug, c.title AS course_title, o.xmin::text AS revision
        FROM course_orders o JOIN courses c ON c.id = o.course_id
        WHERE o.id = ${orderID}::uuid ${studentID === undefined ? sql`` : sql`AND o.student_id = ${studentID}`}
    `);
    return result.rows[0] as Order | undefined;
}

export function orderStatus(order: Order) {
    const status = ["creating", "open", "processing"].includes(order.status) ? "processing" : order.status;
    return { orderId: order.id, status, courseSlug: order.course_slug, courseTitle: order.course_title };
}

export async function reserveOrder(payload: Payload, identity: StudentIdentity, offer: AvailableOffer, price: ChargePrice, settings: { account: string; livemode: boolean; origin: URL }) {
    return authTransaction(payload, async context => {
        const { tx } = context;
        const student = await requireCurrentStudent(payload, context, identity);
        await tx.execute(sql`SELECT pg_advisory_xact_lock(40196, ${offer.course_id}::integer)`);
        await lockCourseCommerce(context, student.id, offer.course_id);
        const [fresh] = await readOffers(context, { offerId: offer.id }, true);
        if (!fresh || fresh.course_id !== offer.course_id || fresh.module_id !== offer.module_id || fresh.stripe_price_id !== offer.stripe_price_id) {
            throw new CommerceError("OFFER_UNAVAILABLE");
        }
        const entitlements = await tx.execute(sql`
            SELECT module_id FROM course_entitlements
            WHERE student_id = ${student.id} AND course_id = ${fresh.course_id} AND status = 'active'
              AND (module_id IS NULL OR module_id = ${fresh.module_id})
        `);
        const hasBase = entitlements.rows.some(row => row.module_id == null);
        if (fresh.module_id != null && !hasBase) throw new CommerceError("BASE_REQUIRED");
        if (entitlements.rows.some(row => row.module_id === fresh.module_id)) throw new CommerceError("ALREADY_OWNED");

        const pending = await tx.execute(sql`
            SELECT id FROM course_orders
            WHERE student_id = ${student.id} AND course_id = ${fresh.course_id}
              AND module_id IS NOT DISTINCT FROM ${fresh.module_id}::integer
              AND (status IN ('creating','open','processing') OR (status = 'support_required' AND reason IN (
                  'ambiguous_checkout', 'checkout_amount_mismatch', 'payment_intent_mismatch', 'charge_mismatch'
              )))
            ORDER BY created_at DESC LIMIT 1
        `);
        let id = pending.rows[0]?.id as string | undefined;
        if (!id) {
            id = randomUUID();
            await tx.execute(sql`
                INSERT INTO course_orders (id, student_id, offer_id, course_id, module_id, stripe_account, livemode,
                    stripe_price_id, amount_minor, currency, checkout_origin, cancel_course_slug, status)
                VALUES (${id}::uuid, ${student.id}, ${fresh.id}, ${fresh.course_id}, ${fresh.module_id}, ${settings.account},
                    ${settings.livemode}, ${fresh.stripe_price_id}, ${price.amountMinor}, ${price.currency}, ${settings.origin.origin},
                    ${fresh.course_slug}, 'creating')
            `);
        }
        const order = await findOrder(context, id, student.id);
        if (!order) throw new CommerceError("UNAVAILABLE");
        return order;
    }, identity.user.id);
}
