import { markCommercePublication, protectCommerceDeletion, protectCourseCommerce, protectLessonCommerce, protectModuleCommerce } from "./commerce-lifecycle.ts";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { APIError, ValidationError, type Access, type Block, type CollectionBeforeOperationHook, type CollectionConfig, type Field, type TextFieldSingleValidation } from "payload";
import { text as validateText } from "payload/shared";
import { curriculumFields, keepCourseOwnership, protectPlacedRecord, validateCurriculum } from "./curriculum.ts";

import { copyLessonEndpoint } from "./copy-lesson.ts";
import { courseCoverDirectory, handleMissingLocalMedia, lessonFileDirectory, protectReferencedMedia } from "./media-protection.ts";

import {
    deletePrivateLessonFile, servePrivateAdminFile, storePrivateLessonFile,
    usePrivateLessonStorage, validatePrivateLessonUpload,
} from "../lib/learning/lesson-file-storage.ts";

const isAdmin: Access = ({ req }) => req.user?.collection === "admins";
export const adminAccess = { create: isAdmin, read: isAdmin, update: isAdmin, delete: isAdmin };
const ownedCourse: Field = {
    name: "course", type: "relationship", relationTo: "courses", required: true,
    admin: { description: "The owning course is fixed after creation." },
};
const isHosted = process.env.VERCEL === "1";
const canUploadCover = !isHosted || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const validateHttpURL: TextFieldSingleValidation = async (value, options) => {
    const result = await validateText(value, options);
    if (result !== true || !value) return result;
    try {
        const url = new URL(value);
        if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) return true;
    } catch {
        // Invalid URLs use the same message as unsupported protocols.
    }
    return "Enter a valid HTTP or HTTPS URL.";
};

const validateCoverURL: TextFieldSingleValidation = async (value, options) => {
    const result = await validateText(value, options);
    if (result !== true || !value) return result;
    if (/^\/images\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:avif|jpe?g|png|webp)$/i.test(value)) return true;
    if (value.startsWith("https://") && await validateHttpURL(value, options) === true) return true;
    return "Enter a public HTTPS URL or an image path under /images/.";
};

const blockHostedFileUpload: CollectionBeforeOperationHook = ({ operation, req }) => {
    if (isHosted && req.file && (operation === "create" || operation === "update")) {
        throw new ValidationError({
            errors: [{ path: "filename", message: "File uploads are unavailable on Vercel until durable storage is configured." }],
        });
    }
};

const validateSlug: TextFieldSingleValidation = async (value, options) => {
    const result = await validateText(value, options);
    if (result !== true || !value) return result;
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || "Use lowercase letters, numbers, and single hyphens.";
};

const TextBlock: Block = {
    slug: "text",
    fields: [{ name: "content", type: "richText", editor: lexicalEditor(), required: true }],
};

const VideoBlock: Block = {
    slug: "video",
    fields: [{
        name: "videos",
        type: "array",
        minRows: 1,
        required: true,
        fields: [
            { name: "title", type: "text", required: true },
            { name: "provider", type: "select", options: ["vimeo", "mux"], defaultValue: "vimeo", required: true },
            {
                name: "reference",
                type: "text",
                required: true,
                admin: { description: "Paste the Vimeo video link or ID. Keep the privacy hash when using an unlisted link." },
            },
        ],
    }],
};

const ResourcesBlock: Block = {
    slug: "resources",
    fields: [{
        name: "items",
        type: "blocks",
        required: true,
        minRows: 1,
        blocks: [
            {
                slug: "link",
                fields: [
                    { name: "label", type: "text", required: true },
                    { name: "url", type: "text", required: true, validate: validateHttpURL },
                ],
            },
            {
                slug: "download",
                fields: [
                    { name: "label", type: "text", required: true },
                    { name: "file", type: "upload", relationTo: "lesson-files", required: true, admin: { allowCreate: true } },
                ],
            },
        ],
    }],
};

export const CourseCovers: CollectionConfig = {
    slug: "course-covers",
    access: adminAccess,
    disableDuplicate: true,
    upload: {
        mimeTypes: imageTypes,
        staticDir: courseCoverDirectory,
        handlers: process.env.BLOB_READ_WRITE_TOKEN ? [] : [handleMissingLocalMedia],
        disableLocalStorage: isHosted,
        pasteURL: false,
        filesRequiredOnCreate: false,
    },
    hooks: {
        beforeOperation: canUploadCover ? [] : [blockHostedFileUpload],
        beforeDelete: [protectReferencedMedia],
        beforeChange: [({ data, originalDoc, req }) => {
            const publicURL = data.publicURL === undefined ? originalDoc?.publicURL : data.publicURL;
            const uploadedFile = canUploadCover && (req.file || originalDoc?.filename);
            if (!publicURL && !uploadedFile) {
                throw new ValidationError({
                    errors: [{ path: "publicURL", message: "Upload a cover image or enter a public cover URL." }],
                });
            }
            return data;
        }],
    },
    fields: [
        {
            name: "alt", type: "text", required: true,
            admin: { description: "Use only images approved for public course covers." },
        },
        {
            name: "publicURL", type: "text", validate: validateCoverURL,
            admin: { description: "Optional when uploading a cover. Use a public HTTPS image URL or an app image under /images/." },
        },
    ],
};

export const LessonFiles: CollectionConfig = {
    slug: "lesson-files",
    access: {
        ...adminAccess,
        create: isHosted && !usePrivateLessonStorage ? () => false : isAdmin,
        update: isHosted ? () => false : isAdmin,
    },
    upload: {
        staticDir: lessonFileDirectory,
        mimeTypes: ["application/pdf"],
        disableLocalStorage: isHosted,
        pasteURL: false,
        handlers: usePrivateLessonStorage ? [servePrivateAdminFile] : [handleMissingLocalMedia],
    },
    hooks: {
        beforeOperation: usePrivateLessonStorage ? [validatePrivateLessonUpload] : [blockHostedFileUpload],
        afterChange: [storePrivateLessonFile],
        beforeDelete: [protectReferencedMedia],
        afterDelete: [deletePrivateLessonFile],
    },
    fields: [],
};

export const Instructors: CollectionConfig = {
    slug: "instructors",
    access: adminAccess,
    admin: { useAsTitle: "name" },
    fields: [
        { name: "name", type: "text", required: true },
        { name: "biography", type: "textarea" },
        { name: "imageURL", type: "text", validate: validateHttpURL },
    ],
};

export const Courses: CollectionConfig = {
    slug: "courses",
    access: { ...adminAccess, readVersions: isAdmin },
    admin: { useAsTitle: "title", defaultColumns: ["title", "structure", "_status", "updatedAt"] },
    disableDuplicate: true,
    versions: { drafts: true },
    hooks: {
        beforeOperation: [markCommercePublication],
        beforeChange: [validateCurriculum, protectCourseCommerce],
        beforeDelete: [protectCommerceDeletion("courses"), async ({ id, req }) => {
            for (const collection of ["modules", "lessons"] as const) {
                const { totalDocs } = await req.payload.find({
                    collection, depth: 0, draft: true, limit: 1, req,
                    where: { course: { equals: id } },
                });
                if (totalDocs) {
                    throw new APIError("This course still owns modules or lessons, including drafts. Unpublish it to hide it and keep its content.", 409);
                }
            }
        }],
    },
    fields: [
        { name: "title", type: "text", required: true },
        {
            name: "slug", type: "text", required: true, unique: true,
            validate: validateSlug,
        },
        { name: "description", type: "textarea", required: true },
        { name: "cover", type: "upload", relationTo: "course-covers", required: true },
        { name: "instructor", type: "relationship", relationTo: "instructors" },
        { name: "estimatedDuration", type: "text" },
        { name: "learningOutcomes", type: "array", fields: [{ name: "outcome", type: "text", required: true }] },
        { name: "difficulty", type: "text" },
        { name: "category", type: "text" },
        ...curriculumFields,
    ],
};

export const Modules: CollectionConfig = {
    slug: "modules",
    access: { ...adminAccess, readVersions: isAdmin },
    admin: { useAsTitle: "title", defaultColumns: ["title", "course", "classification", "_status"] },
    versions: { drafts: true },
    hooks: {
        beforeOperation: [markCommercePublication],
        beforeChange: [keepCourseOwnership, protectModuleCommerce],
        beforeDelete: [protectPlacedRecord("modules"), protectCommerceDeletion("modules")],
    },
    fields: [
        { name: "title", type: "text", required: true },
        ownedCourse,
        { name: "classification", type: "select", options: ["regular", "premium"], defaultValue: "regular", required: true },
    ],
};

export const Lessons: CollectionConfig = {
    slug: "lessons",
    access: { ...adminAccess, readVersions: isAdmin },
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "course", "_status", "freePreview"],
        components: { edit: { beforeDocumentControls: ["/payload/CopyLessonAction#CopyLessonAction"] } },
    },
    endpoints: [copyLessonEndpoint],
    versions: { drafts: true },
    hooks: {
        beforeOperation: [markCommercePublication],
        beforeChange: [keepCourseOwnership, protectLessonCommerce],
        beforeDelete: [protectPlacedRecord("lessons")],
    },
    fields: [
        { name: "title", type: "text", required: true },
        ownedCourse,
        { name: "description", type: "textarea" },
        { name: "freePreview", type: "checkbox", defaultValue: false },
        { name: "content", type: "blocks", blocks: [TextBlock, VideoBlock, ResourcesBlock] },
    ],
};
