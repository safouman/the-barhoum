import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionBeforeOperationHook, type PayloadRequest } from "payload";
import type { Course, Lesson, Module } from "../payload-types.ts";
import { relationshipID } from "./curriculum.ts";

const commerceDraft = "commerceDraft";

export const markCommercePublication: CollectionBeforeOperationHook = ({ args, operation, req }) => {
    if (operation === "create" || operation === "update" || operation === "restoreVersion") {
        const draft = "draft" in args && args.draft === true;
        const publishes = "publishAllLocales" in args && args.publishAllLocales === true;
        const status = "data" in args && args.data && "_status" in args.data ? args.data._status : undefined;
        req.context[commerceDraft] = draft && !publishes && status !== "published";
    }
    return args;
};

async function transaction(req: PayloadRequest) {
    const adapter = req.payload.db as unknown as PostgresAdapter;
    const id = await req.transactionID;
    const tx = id == null ? undefined : adapter.sessions[id]?.db;
    if (!tx) throw new APIError("Commerce protection requires a database transaction.", 503);
    return tx;
}

type Transaction = Awaited<ReturnType<typeof transaction>>;

async function lockCourse(req: PayloadRequest, courseId: number) {
    const tx = await transaction(req);
    // Checkout reservation uses the same lock before rechecking target publication.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(40196, ${courseId}::integer)`);
    return tx;
}

async function hasReservedOrSoldAccess(tx: Transaction, courseId: number, moduleId?: number) {
    const { rows } = await tx.execute(sql`
        SELECT 1 FROM course_orders
        WHERE course_id = ${courseId}
          AND status IN ('creating', 'open', 'processing', 'fulfilled', 'support_required')
          ${moduleId === undefined ? sql`` : sql`AND module_id = ${moduleId}`}
        LIMIT 1
    `);
    return rows.length > 0;
}

const idOf = (value: unknown) => Number(relationshipID(value)) || undefined;

function placements(course: Partial<Course>) {
    const modules = course.structure === "structured"
        ? (course.parts ?? []).flatMap((part) => part.modules ?? [])
        : course.structure === "modular" ? course.modules ?? [] : [];
    const lessons = new Map<number, number | undefined>();
    for (const { lesson } of course.structure === "simple" ? course.lessons ?? [] : []) {
        const lessonId = idOf(lesson);
        if (lessonId !== undefined) lessons.set(lessonId, undefined);
    }
    for (const row of modules) {
        for (const { lesson } of row.lessons ?? []) {
            const lessonId = idOf(lesson);
            if (lessonId !== undefined) lessons.set(lessonId, idOf(row.module));
        }
    }
    return { lessons, moduleIds: modules.flatMap(({ module }) => idOf(module) ?? []) };
}

async function readPublishedCourse(req: PayloadRequest, id: number) {
    const course = await req.payload.findByID({ collection: "courses", id, depth: 0, draft: false, disableErrors: true, req });
    return course?._status === "published" ? course : undefined;
}

function unavailable(message: string): never {
    throw new APIError(message, 409);
}

export const protectCourseCommerce: CollectionBeforeChangeHook<Course> = async ({ data, originalDoc, req }) => {
    if (!originalDoc?.id || req.context[commerceDraft]) return data;
    const tx = await lockCourse(req, originalDoc.id);
    if (!await hasReservedOrSoldAccess(tx, originalDoc.id)) return data;
    const published = await readPublishedCourse(req, originalDoc.id);
    if (!published) return data;
    if (data._status === "draft") unavailable("This course has purchases or open checkouts. Disable its offer to stop sales.");

    const before = placements(published);
    const after = placements({ ...originalDoc, ...data });
    const changed = Array.from(before.lessons).filter(([lesson, module]) =>
        !after.lessons.has(lesson) || after.lessons.get(lesson) !== module);
    const removed = before.moduleIds.filter((id) => !after.moduleIds.includes(id));
    if (removed.length) {
        const { rows } = await tx.execute(sql`
            SELECT 1 FROM course_orders
            WHERE course_id = ${originalDoc.id}
              AND module_id IN (${sql.join(removed.map((id) => sql`${id}`), sql`, `)})
              AND status IN ('creating', 'open', 'processing', 'fulfilled', 'support_required')
            LIMIT 1
        `);
        if (rows.length) unavailable("Keep purchased modules in the published curriculum.");
    }
    if (!changed.length) return data;

    const moduleIds = Array.from(new Set(changed.flatMap(([lesson, module]) =>
        [module, after.lessons.get(lesson)].filter((id): id is number => id !== undefined))));
    const { docs } = moduleIds.length
        ? await req.payload.find({
            collection: "modules", draft: false, depth: 0, pagination: false, req,
            where: { id: { in: moduleIds }, course: { equals: originalDoc.id } },
            select: { classification: true, _status: true },
        })
        : { docs: [] };
    const premium = new Set(docs.filter((module) => module.classification === "premium").map(({ id }) => id));
    const publishedModules = new Set(docs.filter((module) => module._status === "published").map(({ id }) => id));
    for (const [lesson, module] of changed) {
        const next = after.lessons.get(lesson);
        if (!after.lessons.has(lesson)
            || (next !== undefined && !publishedModules.has(next))
            || (module !== undefined && premium.has(module))
            || (next !== undefined && premium.has(next))) {
            unavailable("Keep purchased lessons available in the same access tier.");
        }
    }
    return data;
};

export const protectModuleCommerce: CollectionBeforeChangeHook<Module> = async ({ data, originalDoc, req }) => {
    const courseId = idOf(originalDoc?.course);
    if (!originalDoc || !courseId || req.context[commerceDraft]) return data;
    const tx = await lockCourse(req, courseId);
    const published = await req.payload.findByID({
        collection: "modules", id: originalDoc.id, depth: 0, draft: false, disableErrors: true, req,
    });
    const changesAccess = data._status === "draft"
        || (data.classification !== undefined && published?.classification !== data.classification);
    if (published?._status !== "published" || !changesAccess) return data;
    const targetModule = published.classification === "premium" && data._status === "draft" ? published.id : undefined;
    if (await hasReservedOrSoldAccess(tx, courseId, targetModule)) {
        unavailable("This module affects purchased access. Keep it published in its existing access tier.");
    }
    return data;
};

export const protectLessonCommerce: CollectionBeforeChangeHook<Lesson> = async ({ data, originalDoc, req }) => {
    if (req.context[commerceDraft]) return data;
    const courseId = idOf(data.course ?? originalDoc?.course);
    if (!courseId) return data;
    const tx = await lockCourse(req, courseId);
    const free = (data.freePreview === undefined ? originalDoc?.freePreview : data.freePreview) === true;
    const changesAccess = data._status === "draft" || data.freePreview !== undefined;
    if (changesAccess && originalDoc?.id && await hasReservedOrSoldAccess(tx, courseId)) {
        const course = await readPublishedCourse(req, courseId);
        const lesson = await req.payload.findByID({
            collection: "lessons", id: originalDoc.id, depth: 0, draft: false, disableErrors: true, req,
        });
        if (course && lesson?._status === "published" && placements(course).lessons.has(originalDoc.id)
            && (data._status === "draft" || (lesson.freePreview === true) !== free)) {
            unavailable("Keep this lesson published in its existing access tier while it belongs to a purchased course.");
        }
    }
    if (data._status === "draft") return data;

    const fileIds = new Set<number>();
    const content = data.content === undefined ? originalDoc?.content : data.content;
    for (const block of content ?? []) {
        if (block.blockType !== "resources") continue;
        for (const item of block.items) {
            if (item.blockType === "link" && !free) unavailable("Paid lesson resources must use private file attachments.");
            if (item.blockType === "download") {
                const id = idOf(item.file);
                if (id !== undefined) fileIds.add(id);
            }
        }
    }
    if (!fileIds.size) return data;

    // Serialize cross-course checks as a file can appear in more than one lesson.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(40197, 1)`);
    const { rows } = await tx.execute(sql`
        SELECT 1 FROM lessons_blocks_download download
        JOIN lessons lesson ON lesson.id = download._parent_id
        WHERE download.file_id IN (${sql.join(Array.from(fileIds, (id) => sql`${id}`), sql`, `)})
          AND lesson.id <> ${originalDoc?.id ?? 0} AND lesson._status = 'published'
          AND COALESCE(lesson.free_preview, false) <> ${free}
        LIMIT 1
    `);
    if (rows.length) unavailable("A download cannot be shared between published free and paid lessons.");
    return data;
};

export function protectCommerceDeletion(collection: "courses" | "modules" | "course-offers"): CollectionBeforeDeleteHook {
    const column = collection === "courses" ? sql`course_id` : collection === "modules" ? sql`module_id` : sql`offer_id`;
    return async ({ id, req }) => {
        const tx = await transaction(req);
        const { rows } = await tx.execute(sql`SELECT 1 FROM course_orders WHERE ${column} = ${id} LIMIT 1`);
        if (rows.length) unavailable("This record has checkout history and cannot be deleted.");
    };
}
