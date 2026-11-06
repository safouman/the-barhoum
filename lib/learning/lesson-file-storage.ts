import { del, get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ValidationError, type CollectionAfterChangeHook, type CollectionAfterDeleteHook, type CollectionBeforeOperationHook, type UploadConfig } from "payload";
import { lessonFileDirectory } from "../../payload/media-protection.ts";

const token = process.env.LESSON_BLOB_READ_WRITE_TOKEN;
const hosted = process.env.VERCEL === "1";
export const usePrivateLessonStorage = hosted && Boolean(token);

const key = (filename: string) => `lesson-files/${filename}`;

export const validatePrivateLessonUpload: CollectionBeforeOperationHook = ({ operation, req }) => {
    if (!usePrivateLessonStorage || operation !== "create" || !req.file) return;
    if (req.file.size > 4 * 1024 * 1024) {
        throw new ValidationError({ errors: [{ path: "filename", message: "Choose a PDF of 4 MB or less." }] });
    }
    req.file.name = `${randomUUID()}-${req.file.name}`;
};

export const storePrivateLessonFile: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
    if (usePrivateLessonStorage && operation === "create" && req.file && doc.filename) {
        await put(key(doc.filename), req.file.data, {
            access: "private", token, contentType: "application/pdf", addRandomSuffix: false,
        });
    }
    return doc;
};

export const deletePrivateLessonFile: CollectionAfterDeleteHook = async ({ doc }) => {
    if (usePrivateLessonStorage && doc.filename) {
        await del(key(doc.filename), { token });
    }
    return doc;
};

export async function readLessonPDF(filename: string): Promise<BodyInit | null> {
    if (!filename || filename !== path.basename(filename) || filename.includes("\\") || !/\.pdf$/i.test(filename)) return null;
    if (hosted) {
        if (!usePrivateLessonStorage) return null;
        const result = await get(key(filename), { access: "private", token });
        return result?.statusCode === 200 ? result.stream : null;
    }
    try {
        return new Uint8Array(await readFile(path.join(lessonFileDirectory, filename)));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
    }
}

export const servePrivateAdminFile: NonNullable<UploadConfig["handlers"]>[number] = async (_req, { params }) => {
    const body = await readLessonPDF(params.filename);
    return new Response(body, {
        status: body ? 200 : 404,
        headers: { "Content-Type": "application/pdf", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
};
