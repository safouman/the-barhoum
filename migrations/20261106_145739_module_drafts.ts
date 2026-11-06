import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_modules_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__modules_v_version_classification" AS ENUM('regular', 'premium');
  CREATE TYPE "public"."enum__modules_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_modules_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_course_id" integer,
    "version_classification" "enum__modules_v_version_classification" DEFAULT 'regular',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__modules_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  ALTER TABLE "modules" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "modules" ALTER COLUMN "course_id" DROP NOT NULL;
  ALTER TABLE "modules" ALTER COLUMN "classification" DROP NOT NULL;
  ALTER TABLE "modules" ADD COLUMN "_status" "enum_modules_status" DEFAULT 'draft';
  ALTER TABLE "_modules_v" ADD CONSTRAINT "_modules_v_parent_id_modules_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_modules_v" ADD CONSTRAINT "_modules_v_version_course_id_courses_id_fk" FOREIGN KEY ("version_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_modules_v_parent_idx" ON "_modules_v" USING btree ("parent_id");
  CREATE INDEX "_modules_v_version_version_course_idx" ON "_modules_v" USING btree ("version_course_id");
  CREATE INDEX "_modules_v_version_version_updated_at_idx" ON "_modules_v" USING btree ("version_updated_at");
  CREATE INDEX "_modules_v_version_version_created_at_idx" ON "_modules_v" USING btree ("version_created_at");
  CREATE INDEX "_modules_v_version_version__status_idx" ON "_modules_v" USING btree ("version__status");
  CREATE INDEX "_modules_v_created_at_idx" ON "_modules_v" USING btree ("created_at");
  CREATE INDEX "_modules_v_updated_at_idx" ON "_modules_v" USING btree ("updated_at");
  CREATE INDEX "_modules_v_latest_idx" ON "_modules_v" USING btree ("latest");
  CREATE INDEX "modules__status_idx" ON "modules" USING btree ("_status");

  -- Existing modules were already live. Preserve their IDs and seed native version history.
  UPDATE "modules" SET "_status" = 'published';
  INSERT INTO "_modules_v" (
    "parent_id", "version_title", "version_course_id", "version_classification",
    "version_updated_at", "version_created_at", "version__status", "latest"
  )
  SELECT "id", "title", "course_id", "classification"::text::"enum__modules_v_version_classification",
    "updated_at", "created_at", 'published', true
  FROM "modules";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_modules_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_modules_v" CASCADE;
  DROP INDEX "modules__status_idx";
  ALTER TABLE "modules" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "modules" ALTER COLUMN "course_id" SET NOT NULL;
  ALTER TABLE "modules" ALTER COLUMN "classification" SET NOT NULL;
  ALTER TABLE "modules" DROP COLUMN "_status";
  DROP TYPE "public"."enum_modules_status";
  DROP TYPE "public"."enum__modules_v_version_classification";
  DROP TYPE "public"."enum__modules_v_version_status";`)
}
