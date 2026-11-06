import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig, type CollectionConfig } from "payload";

const Admins: CollectionConfig = {
    slug: "admins",
    auth: true,
    admin: { useAsTitle: "email" },
    access: {
        create: ({ req }) => Boolean(req.user),
        read: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
    },
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
    collections: [Admins],
    db: postgresAdapter({
        pool: { connectionString },
        push: false,
    }),
    graphQL: { disable: true },
    secret: process.env.PAYLOAD_SECRET ?? "",
});
