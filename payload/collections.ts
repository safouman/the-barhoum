import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { ValidationError, type Access, type Block, type CollectionConfig, type Field, type TextFieldSingleValidation } from "payload";
import { text as validateText } from "payload/shared";
import { curriculumFields, keepCourseOwnership, protectPlacedRecord, validateCurriculum } from "./curriculum.ts";

const isAdmin: Access = ({ req }) => req.user?.collection === "admins";
const adminAccess = { create: isAdmin, read: isAdmin, update: isAdmin, delete: isAdmin };
const ownedCourse: Field = {
    name: "course", type: "relationship", relationTo: "courses", required: true,
    admin: { description: "The owning course is fixed after creation." },
};
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
            { name: "provider", type: "select", options: ["mux"], defaultValue: "mux", required: true },
            {
                name: "reference",
                type: "text",
                required: true,
                admin: { description: "Enter the provider's video reference. The application resolves access and playback separately." },
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
                    { name: "file", type: "upload", relationTo: "lesson-files", required: true },
                ],
            },
        ],
    }],
};

export const CourseCovers: CollectionConfig = {
    slug: "course-covers",
    access: adminAccess,
    upload: { mimeTypes: imageTypes, staticDir: "uploads/course-covers" },
    fields: [{
        name: "alt", type: "text", required: true,
        admin: { description: "Use only images approved for public course covers." },
    }],
};

export const LessonFiles: CollectionConfig = {
    slug: "lesson-files",
    access: adminAccess,
    upload: { staticDir: "uploads/lesson-files" },
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
    access: adminAccess,
    admin: { useAsTitle: "title", defaultColumns: ["title", "structure", "_status", "updatedAt"] },
    disableDuplicate: true,
    versions: { drafts: true },
    hooks: {
        beforeChange: [validateCurriculum],
        beforeDelete: [async ({ id, req }) => {
            for (const collection of ["modules", "lessons"] as const) {
                const { totalDocs } = await req.payload.find({
                    collection, depth: 0, draft: collection === "lessons", limit: 1, req,
                    where: { course: { equals: id } },
                });
                if (totalDocs) {
                    throw new ValidationError({ errors: [{ path: "title", message: "Unpublish this course to retain its modules and lessons." }] });
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
    access: adminAccess,
    admin: { useAsTitle: "title", defaultColumns: ["title", "course", "classification"] },
    hooks: { beforeChange: [keepCourseOwnership], beforeDelete: [protectPlacedRecord("modules")] },
    fields: [
        { name: "title", type: "text", required: true },
        ownedCourse,
        { name: "classification", type: "select", options: ["regular", "premium"], defaultValue: "regular", required: true },
    ],
};

export const Lessons: CollectionConfig = {
    slug: "lessons",
    access: adminAccess,
    admin: { useAsTitle: "title", defaultColumns: ["title", "course", "_status", "freePreview"] },
    versions: { drafts: true },
    hooks: { beforeChange: [keepCourseOwnership], beforeDelete: [protectPlacedRecord("lessons")] },
    fields: [
        { name: "title", type: "text", required: true },
        ownedCourse,
        { name: "description", type: "textarea" },
        { name: "freePreview", type: "checkbox", defaultValue: false },
        { name: "content", type: "blocks", blocks: [TextBlock, VideoBlock, ResourcesBlock] },
    ],
};
