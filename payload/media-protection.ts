import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import { statSync } from "node:fs";
import path from "node:path";
import { headersWithCors, ValidationError, type CollectionBeforeDeleteHook, type PayloadRequest, type UploadConfig } from "payload";

export const lessonFileDirectory = "uploads/lesson-files";
export const courseCoverDirectory = "uploads/course-covers";

async function transaction(req: PayloadRequest) {
    const adapter = req.payload.db as unknown as PostgresAdapter;
    const session = req.transactionID && adapter.sessions[await req.transactionID];
    if (!session) throw new Error("Media deletion requires a database transaction.");
    return session.db;
}

export const protectReferencedMedia: CollectionBeforeDeleteHook = async ({ collection, id, req }) => {
    const db = await transaction(req);
    const isLessonFile = collection.slug === "lesson-files";
    const table = isLessonFile ? sql`lesson_files` : sql`course_covers`;
    // Serialize with PostgreSQL's foreign-key checks before Payload deletes the binary.
    await db.execute(sql`SELECT id FROM ${table} WHERE id = ${id} FOR UPDATE`);

    const directReferences = isLessonFile
        ? sql`SELECT 1 FROM lessons_blocks_download WHERE file_id = ${id}
              UNION ALL SELECT 1 FROM _lessons_v_blocks_download WHERE file_id = ${id}`
        : sql`SELECT 1 FROM courses WHERE cover_id = ${id}
              UNION ALL SELECT 1 FROM _courses_v WHERE version_cover_id = ${id}`;
    // Lexical stores uploaded media as JSON rather than a foreign key.
    const mediaPath = sql`'$.** ? ((@.type == "upload" || @.type == "relationship") && @.relationTo == $collection && (@.value == $id || @.value == $stringId || @.value.id == $id || @.value.id == $stringId))'`;
    const variables = sql`jsonb_build_object('collection', ${collection.slug}::text, 'id', ${id}::integer, 'stringId', ${String(id)}::text)`;
    const result = await db.execute(sql`
        ${directReferences}
        UNION ALL SELECT 1 FROM lessons_blocks_text
            WHERE jsonb_path_exists(content, ${mediaPath}::jsonpath, ${variables})
        UNION ALL SELECT 1 FROM _lessons_v_blocks_text
            WHERE jsonb_path_exists(content, ${mediaPath}::jsonpath, ${variables})
        LIMIT 1
    `);
    if (result.rows.length) {
        throw new ValidationError({
            errors: [{ path: "filename", message: "This media is used by a course or lesson, including a saved version. Remove its references before deleting it." }],
        });
    }
};

export const handleMissingLocalMedia: NonNullable<UploadConfig["handlers"]>[number] = (req, { params }) => {
    const { collection, filename } = params;
    const directory = collection === "course-covers" ? courseCoverDirectory : lessonFileDirectory;
    if (!filename || path.basename(filename) !== filename || filename.includes("\\")) return;
    if (process.env.VERCEL !== "1"
        && statSync(path.resolve(directory, filename), { throwIfNoEntry: false })?.isFile()) return;
    return Response.json({ errors: [{ message: "File not found." }] }, {
        status: 404,
        headers: headersWithCors({ headers: new Headers({ "Cache-Control": "no-store" }), req }),
    });
};
