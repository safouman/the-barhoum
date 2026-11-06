import { postgresAdapter } from "@payloadcms/db-postgres";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig, type CollectionConfig } from "payload";
import { adminAccess, CourseCovers, Courses, Instructors, LessonFiles, Lessons, Modules } from "./payload/collections.ts";

const Admins: CollectionConfig = {
    slug: "admins",
    auth: true,
    admin: { useAsTitle: "email" },
    access: adminAccess,
    fields: [],
};

const isMigration = process.env.PAYLOAD_MIGRATING === "1";
const connectionString = isMigration
    ? process.env.DATABASE_URL_UNPOOLED
    : process.env.DATABASE_URL;

if (isMigration && !connectionString) {
    throw new Error("DATABASE_URL_UNPOOLED is required for Payload migrations");
}

export default buildConfig({
    admin: {
        user: Admins.slug,
        importMap: { importMapFile: "./app/(payload)/admin/importMap.ts" },
    },
    collections: [Admins, Courses, Modules, Lessons, Instructors, CourseCovers, LessonFiles],
    db: postgresAdapter({
        pool: { connectionString },
        push: false,
    }),
    plugins: [vercelBlobStorage({
        token: process.env.BLOB_READ_WRITE_TOKEN,
        access: "public",
        alwaysInsertFields: true,
        collections: { "course-covers": { disablePayloadAccessControl: true } },
    })],
    graphQL: { disable: true },
    secret: process.env.PAYLOAD_SECRET ?? "",
});
