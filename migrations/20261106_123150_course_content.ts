import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_courses_structure" AS ENUM('simple', 'modular', 'structured');
  CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__courses_v_version_structure" AS ENUM('simple', 'modular', 'structured');
  CREATE TYPE "public"."enum__courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_modules_classification" AS ENUM('regular', 'premium');
  CREATE TYPE "public"."enum_lessons_blocks_video_videos_provider" AS ENUM('mux');
  CREATE TYPE "public"."enum_lessons_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lessons_v_blocks_video_videos_provider" AS ENUM('mux');
  CREATE TYPE "public"."enum__lessons_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "courses_learning_outcomes" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "outcome" varchar
  );

  CREATE TABLE "courses_lessons" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "lesson_id" integer
  );

  CREATE TABLE "courses_modules_lessons" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "lesson_id" integer
  );

  CREATE TABLE "courses_modules" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "module_id" integer
  );

  CREATE TABLE "courses_parts_modules_lessons" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "lesson_id" integer
  );

  CREATE TABLE "courses_parts_modules" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "module_id" integer
  );

  CREATE TABLE "courses_parts" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar
  );

  CREATE TABLE "courses" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "slug" varchar,
    "description" varchar,
    "cover_id" integer,
    "instructor_id" integer,
    "estimated_duration" varchar,
    "difficulty" varchar,
    "category" varchar,
    "structure" "enum_courses_structure" DEFAULT 'simple',
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_courses_status" DEFAULT 'draft'
  );

  CREATE TABLE "_courses_v_version_learning_outcomes" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "outcome" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_courses_v_version_lessons" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "lesson_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_courses_v_version_modules_lessons" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "lesson_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_courses_v_version_modules" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "module_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_courses_v_version_parts_modules_lessons" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "lesson_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_courses_v_version_parts_modules" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "module_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_courses_v_version_parts" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_courses_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_slug" varchar,
    "version_description" varchar,
    "version_cover_id" integer,
    "version_instructor_id" integer,
    "version_estimated_duration" varchar,
    "version_difficulty" varchar,
    "version_category" varchar,
    "version_structure" "enum__courses_v_version_structure" DEFAULT 'simple',
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__courses_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "modules" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "course_id" integer NOT NULL,
    "classification" "enum_modules_classification" DEFAULT 'regular' NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "lessons_blocks_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "content" jsonb,
    "block_name" varchar
  );

  CREATE TABLE "lessons_blocks_video_videos" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "provider" "enum_lessons_blocks_video_videos_provider" DEFAULT 'mux',
    "reference" varchar
  );

  CREATE TABLE "lessons_blocks_video" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "lessons_blocks_link" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "url" varchar,
    "block_name" varchar
  );

  CREATE TABLE "lessons_blocks_download" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "file_id" integer,
    "block_name" varchar
  );

  CREATE TABLE "lessons_blocks_resources" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "block_name" varchar
  );

  CREATE TABLE "lessons" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "course_id" integer,
    "description" varchar,
    "free_preview" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_lessons_status" DEFAULT 'draft'
  );

  CREATE TABLE "_lessons_v_blocks_text" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "content" jsonb,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_lessons_v_blocks_video_videos" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "provider" "enum__lessons_v_blocks_video_videos_provider" DEFAULT 'mux',
    "reference" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_lessons_v_blocks_video" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_lessons_v_blocks_link" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "url" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_lessons_v_blocks_download" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "file_id" integer,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_lessons_v_blocks_resources" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_lessons_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_title" varchar,
    "version_course_id" integer,
    "version_description" varchar,
    "version_free_preview" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__lessons_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "latest" boolean
  );

  CREATE TABLE "instructors" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "biography" varchar,
    "image_u_r_l" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "course_covers" (
    "id" serial PRIMARY KEY NOT NULL,
    "alt" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric,
    "focal_x" numeric,
    "focal_y" numeric
  );

  CREATE TABLE "lesson_files" (
    "id" serial PRIMARY KEY NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "url" varchar,
    "thumbnail_u_r_l" varchar,
    "filename" varchar,
    "mime_type" varchar,
    "filesize" numeric,
    "width" numeric,
    "height" numeric,
    "focal_x" numeric,
    "focal_y" numeric
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "courses_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "modules_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lessons_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "instructors_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "course_covers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lesson_files_id" integer;
  ALTER TABLE "courses_learning_outcomes" ADD CONSTRAINT "courses_learning_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_lessons" ADD CONSTRAINT "courses_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_lessons" ADD CONSTRAINT "courses_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_modules_lessons" ADD CONSTRAINT "courses_modules_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_modules_lessons" ADD CONSTRAINT "courses_modules_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_modules" ADD CONSTRAINT "courses_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_modules" ADD CONSTRAINT "courses_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_parts_modules_lessons" ADD CONSTRAINT "courses_parts_modules_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_parts_modules_lessons" ADD CONSTRAINT "courses_parts_modules_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_parts_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_parts_modules" ADD CONSTRAINT "courses_parts_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_parts_modules" ADD CONSTRAINT "courses_parts_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_parts" ADD CONSTRAINT "courses_parts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_cover_id_course_covers_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."course_covers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_learning_outcomes" ADD CONSTRAINT "_courses_v_version_learning_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_lessons" ADD CONSTRAINT "_courses_v_version_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_lessons" ADD CONSTRAINT "_courses_v_version_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules_lessons" ADD CONSTRAINT "_courses_v_version_modules_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules_lessons" ADD CONSTRAINT "_courses_v_version_modules_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules" ADD CONSTRAINT "_courses_v_version_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules" ADD CONSTRAINT "_courses_v_version_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_parts_modules_lessons" ADD CONSTRAINT "_courses_v_version_parts_modules_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_parts_modules_lessons" ADD CONSTRAINT "_courses_v_version_parts_modules_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_parts_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_parts_modules" ADD CONSTRAINT "_courses_v_version_parts_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_parts_modules" ADD CONSTRAINT "_courses_v_version_parts_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_parts" ADD CONSTRAINT "_courses_v_version_parts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_cover_id_course_covers_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."course_covers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_instructor_id_instructors_id_fk" FOREIGN KEY ("version_instructor_id") REFERENCES "public"."instructors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_blocks_text" ADD CONSTRAINT "lessons_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_video_videos" ADD CONSTRAINT "lessons_blocks_video_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons_blocks_video"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_video" ADD CONSTRAINT "lessons_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_link" ADD CONSTRAINT "lessons_blocks_link_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_download" ADD CONSTRAINT "lessons_blocks_download_file_id_lesson_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."lesson_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_blocks_download" ADD CONSTRAINT "lessons_blocks_download_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_blocks_resources" ADD CONSTRAINT "lessons_blocks_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_text" ADD CONSTRAINT "_lessons_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_video_videos" ADD CONSTRAINT "_lessons_v_blocks_video_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v_blocks_video"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_video" ADD CONSTRAINT "_lessons_v_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_link" ADD CONSTRAINT "_lessons_v_blocks_link_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_download" ADD CONSTRAINT "_lessons_v_blocks_download_file_id_lesson_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."lesson_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_download" ADD CONSTRAINT "_lessons_v_blocks_download_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_blocks_resources" ADD CONSTRAINT "_lessons_v_blocks_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_parent_id_lessons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_course_id_courses_id_fk" FOREIGN KEY ("version_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "courses_learning_outcomes_order_idx" ON "courses_learning_outcomes" USING btree ("_order");
  CREATE INDEX "courses_learning_outcomes_parent_id_idx" ON "courses_learning_outcomes" USING btree ("_parent_id");
  CREATE INDEX "courses_lessons_order_idx" ON "courses_lessons" USING btree ("_order");
  CREATE INDEX "courses_lessons_parent_id_idx" ON "courses_lessons" USING btree ("_parent_id");
  CREATE INDEX "courses_lessons_lesson_idx" ON "courses_lessons" USING btree ("lesson_id");
  CREATE INDEX "courses_modules_lessons_order_idx" ON "courses_modules_lessons" USING btree ("_order");
  CREATE INDEX "courses_modules_lessons_parent_id_idx" ON "courses_modules_lessons" USING btree ("_parent_id");
  CREATE INDEX "courses_modules_lessons_lesson_idx" ON "courses_modules_lessons" USING btree ("lesson_id");
  CREATE INDEX "courses_modules_order_idx" ON "courses_modules" USING btree ("_order");
  CREATE INDEX "courses_modules_parent_id_idx" ON "courses_modules" USING btree ("_parent_id");
  CREATE INDEX "courses_modules_module_idx" ON "courses_modules" USING btree ("module_id");
  CREATE INDEX "courses_parts_modules_lessons_order_idx" ON "courses_parts_modules_lessons" USING btree ("_order");
  CREATE INDEX "courses_parts_modules_lessons_parent_id_idx" ON "courses_parts_modules_lessons" USING btree ("_parent_id");
  CREATE INDEX "courses_parts_modules_lessons_lesson_idx" ON "courses_parts_modules_lessons" USING btree ("lesson_id");
  CREATE INDEX "courses_parts_modules_order_idx" ON "courses_parts_modules" USING btree ("_order");
  CREATE INDEX "courses_parts_modules_parent_id_idx" ON "courses_parts_modules" USING btree ("_parent_id");
  CREATE INDEX "courses_parts_modules_module_idx" ON "courses_parts_modules" USING btree ("module_id");
  CREATE INDEX "courses_parts_order_idx" ON "courses_parts" USING btree ("_order");
  CREATE INDEX "courses_parts_parent_id_idx" ON "courses_parts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
  CREATE INDEX "courses_cover_idx" ON "courses" USING btree ("cover_id");
  CREATE INDEX "courses_instructor_idx" ON "courses" USING btree ("instructor_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE INDEX "courses__status_idx" ON "courses" USING btree ("_status");
  CREATE INDEX "_courses_v_version_learning_outcomes_order_idx" ON "_courses_v_version_learning_outcomes" USING btree ("_order");
  CREATE INDEX "_courses_v_version_learning_outcomes_parent_id_idx" ON "_courses_v_version_learning_outcomes" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_lessons_order_idx" ON "_courses_v_version_lessons" USING btree ("_order");
  CREATE INDEX "_courses_v_version_lessons_parent_id_idx" ON "_courses_v_version_lessons" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_lessons_lesson_idx" ON "_courses_v_version_lessons" USING btree ("lesson_id");
  CREATE INDEX "_courses_v_version_modules_lessons_order_idx" ON "_courses_v_version_modules_lessons" USING btree ("_order");
  CREATE INDEX "_courses_v_version_modules_lessons_parent_id_idx" ON "_courses_v_version_modules_lessons" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_modules_lessons_lesson_idx" ON "_courses_v_version_modules_lessons" USING btree ("lesson_id");
  CREATE INDEX "_courses_v_version_modules_order_idx" ON "_courses_v_version_modules" USING btree ("_order");
  CREATE INDEX "_courses_v_version_modules_parent_id_idx" ON "_courses_v_version_modules" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_modules_module_idx" ON "_courses_v_version_modules" USING btree ("module_id");
  CREATE INDEX "_courses_v_version_parts_modules_lessons_order_idx" ON "_courses_v_version_parts_modules_lessons" USING btree ("_order");
  CREATE INDEX "_courses_v_version_parts_modules_lessons_parent_id_idx" ON "_courses_v_version_parts_modules_lessons" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_parts_modules_lessons_lesson_idx" ON "_courses_v_version_parts_modules_lessons" USING btree ("lesson_id");
  CREATE INDEX "_courses_v_version_parts_modules_order_idx" ON "_courses_v_version_parts_modules" USING btree ("_order");
  CREATE INDEX "_courses_v_version_parts_modules_parent_id_idx" ON "_courses_v_version_parts_modules" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_parts_modules_module_idx" ON "_courses_v_version_parts_modules" USING btree ("module_id");
  CREATE INDEX "_courses_v_version_parts_order_idx" ON "_courses_v_version_parts" USING btree ("_order");
  CREATE INDEX "_courses_v_version_parts_parent_id_idx" ON "_courses_v_version_parts" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_parent_idx" ON "_courses_v" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_version_slug_idx" ON "_courses_v" USING btree ("version_slug");
  CREATE INDEX "_courses_v_version_version_cover_idx" ON "_courses_v" USING btree ("version_cover_id");
  CREATE INDEX "_courses_v_version_version_instructor_idx" ON "_courses_v" USING btree ("version_instructor_id");
  CREATE INDEX "_courses_v_version_version_updated_at_idx" ON "_courses_v" USING btree ("version_updated_at");
  CREATE INDEX "_courses_v_version_version_created_at_idx" ON "_courses_v" USING btree ("version_created_at");
  CREATE INDEX "_courses_v_version_version__status_idx" ON "_courses_v" USING btree ("version__status");
  CREATE INDEX "_courses_v_created_at_idx" ON "_courses_v" USING btree ("created_at");
  CREATE INDEX "_courses_v_updated_at_idx" ON "_courses_v" USING btree ("updated_at");
  CREATE INDEX "_courses_v_latest_idx" ON "_courses_v" USING btree ("latest");
  CREATE INDEX "modules_course_idx" ON "modules" USING btree ("course_id");
  CREATE INDEX "modules_updated_at_idx" ON "modules" USING btree ("updated_at");
  CREATE INDEX "modules_created_at_idx" ON "modules" USING btree ("created_at");
  CREATE INDEX "lessons_blocks_text_order_idx" ON "lessons_blocks_text" USING btree ("_order");
  CREATE INDEX "lessons_blocks_text_parent_id_idx" ON "lessons_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_text_path_idx" ON "lessons_blocks_text" USING btree ("_path");
  CREATE INDEX "lessons_blocks_video_videos_order_idx" ON "lessons_blocks_video_videos" USING btree ("_order");
  CREATE INDEX "lessons_blocks_video_videos_parent_id_idx" ON "lessons_blocks_video_videos" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_video_order_idx" ON "lessons_blocks_video" USING btree ("_order");
  CREATE INDEX "lessons_blocks_video_parent_id_idx" ON "lessons_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_video_path_idx" ON "lessons_blocks_video" USING btree ("_path");
  CREATE INDEX "lessons_blocks_link_order_idx" ON "lessons_blocks_link" USING btree ("_order");
  CREATE INDEX "lessons_blocks_link_parent_id_idx" ON "lessons_blocks_link" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_link_path_idx" ON "lessons_blocks_link" USING btree ("_path");
  CREATE INDEX "lessons_blocks_download_order_idx" ON "lessons_blocks_download" USING btree ("_order");
  CREATE INDEX "lessons_blocks_download_parent_id_idx" ON "lessons_blocks_download" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_download_path_idx" ON "lessons_blocks_download" USING btree ("_path");
  CREATE INDEX "lessons_blocks_download_file_idx" ON "lessons_blocks_download" USING btree ("file_id");
  CREATE INDEX "lessons_blocks_resources_order_idx" ON "lessons_blocks_resources" USING btree ("_order");
  CREATE INDEX "lessons_blocks_resources_parent_id_idx" ON "lessons_blocks_resources" USING btree ("_parent_id");
  CREATE INDEX "lessons_blocks_resources_path_idx" ON "lessons_blocks_resources" USING btree ("_path");
  CREATE INDEX "lessons_course_idx" ON "lessons" USING btree ("course_id");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  CREATE INDEX "lessons__status_idx" ON "lessons" USING btree ("_status");
  CREATE INDEX "_lessons_v_blocks_text_order_idx" ON "_lessons_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_lessons_v_blocks_text_parent_id_idx" ON "_lessons_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_text_path_idx" ON "_lessons_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_lessons_v_blocks_video_videos_order_idx" ON "_lessons_v_blocks_video_videos" USING btree ("_order");
  CREATE INDEX "_lessons_v_blocks_video_videos_parent_id_idx" ON "_lessons_v_blocks_video_videos" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_video_order_idx" ON "_lessons_v_blocks_video" USING btree ("_order");
  CREATE INDEX "_lessons_v_blocks_video_parent_id_idx" ON "_lessons_v_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_video_path_idx" ON "_lessons_v_blocks_video" USING btree ("_path");
  CREATE INDEX "_lessons_v_blocks_link_order_idx" ON "_lessons_v_blocks_link" USING btree ("_order");
  CREATE INDEX "_lessons_v_blocks_link_parent_id_idx" ON "_lessons_v_blocks_link" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_link_path_idx" ON "_lessons_v_blocks_link" USING btree ("_path");
  CREATE INDEX "_lessons_v_blocks_download_order_idx" ON "_lessons_v_blocks_download" USING btree ("_order");
  CREATE INDEX "_lessons_v_blocks_download_parent_id_idx" ON "_lessons_v_blocks_download" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_download_path_idx" ON "_lessons_v_blocks_download" USING btree ("_path");
  CREATE INDEX "_lessons_v_blocks_download_file_idx" ON "_lessons_v_blocks_download" USING btree ("file_id");
  CREATE INDEX "_lessons_v_blocks_resources_order_idx" ON "_lessons_v_blocks_resources" USING btree ("_order");
  CREATE INDEX "_lessons_v_blocks_resources_parent_id_idx" ON "_lessons_v_blocks_resources" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_blocks_resources_path_idx" ON "_lessons_v_blocks_resources" USING btree ("_path");
  CREATE INDEX "_lessons_v_parent_idx" ON "_lessons_v" USING btree ("parent_id");
  CREATE INDEX "_lessons_v_version_version_course_idx" ON "_lessons_v" USING btree ("version_course_id");
  CREATE INDEX "_lessons_v_version_version_updated_at_idx" ON "_lessons_v" USING btree ("version_updated_at");
  CREATE INDEX "_lessons_v_version_version_created_at_idx" ON "_lessons_v" USING btree ("version_created_at");
  CREATE INDEX "_lessons_v_version_version__status_idx" ON "_lessons_v" USING btree ("version__status");
  CREATE INDEX "_lessons_v_created_at_idx" ON "_lessons_v" USING btree ("created_at");
  CREATE INDEX "_lessons_v_updated_at_idx" ON "_lessons_v" USING btree ("updated_at");
  CREATE INDEX "_lessons_v_latest_idx" ON "_lessons_v" USING btree ("latest");
  CREATE INDEX "instructors_updated_at_idx" ON "instructors" USING btree ("updated_at");
  CREATE INDEX "instructors_created_at_idx" ON "instructors" USING btree ("created_at");
  CREATE INDEX "course_covers_updated_at_idx" ON "course_covers" USING btree ("updated_at");
  CREATE INDEX "course_covers_created_at_idx" ON "course_covers" USING btree ("created_at");
  CREATE UNIQUE INDEX "course_covers_filename_idx" ON "course_covers" USING btree ("filename");
  CREATE INDEX "lesson_files_updated_at_idx" ON "lesson_files" USING btree ("updated_at");
  CREATE INDEX "lesson_files_created_at_idx" ON "lesson_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "lesson_files_filename_idx" ON "lesson_files" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modules_fk" FOREIGN KEY ("modules_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_instructors_fk" FOREIGN KEY ("instructors_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_covers_fk" FOREIGN KEY ("course_covers_id") REFERENCES "public"."course_covers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lesson_files_fk" FOREIGN KEY ("lesson_files_id") REFERENCES "public"."lesson_files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_modules_id_idx" ON "payload_locked_documents_rels" USING btree ("modules_id");
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");
  CREATE INDEX "payload_locked_documents_rels_instructors_id_idx" ON "payload_locked_documents_rels" USING btree ("instructors_id");
  CREATE INDEX "payload_locked_documents_rels_course_covers_id_idx" ON "payload_locked_documents_rels" USING btree ("course_covers_id");
  CREATE INDEX "payload_locked_documents_rels_lesson_files_id_idx" ON "payload_locked_documents_rels" USING btree ("lesson_files_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses_learning_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_modules_lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_parts_modules_lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_parts_modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_parts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_learning_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_modules_lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_parts_modules_lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_parts_modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_version_parts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_video_videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_link" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_download" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_blocks_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_video_videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_link" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_download" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_blocks_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "instructors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "course_covers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lesson_files" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "courses_learning_outcomes" CASCADE;
  DROP TABLE "courses_lessons" CASCADE;
  DROP TABLE "courses_modules_lessons" CASCADE;
  DROP TABLE "courses_modules" CASCADE;
  DROP TABLE "courses_parts_modules_lessons" CASCADE;
  DROP TABLE "courses_parts_modules" CASCADE;
  DROP TABLE "courses_parts" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "_courses_v_version_learning_outcomes" CASCADE;
  DROP TABLE "_courses_v_version_lessons" CASCADE;
  DROP TABLE "_courses_v_version_modules_lessons" CASCADE;
  DROP TABLE "_courses_v_version_modules" CASCADE;
  DROP TABLE "_courses_v_version_parts_modules_lessons" CASCADE;
  DROP TABLE "_courses_v_version_parts_modules" CASCADE;
  DROP TABLE "_courses_v_version_parts" CASCADE;
  DROP TABLE "_courses_v" CASCADE;
  DROP TABLE "modules" CASCADE;
  DROP TABLE "lessons_blocks_text" CASCADE;
  DROP TABLE "lessons_blocks_video_videos" CASCADE;
  DROP TABLE "lessons_blocks_video" CASCADE;
  DROP TABLE "lessons_blocks_link" CASCADE;
  DROP TABLE "lessons_blocks_download" CASCADE;
  DROP TABLE "lessons_blocks_resources" CASCADE;
  DROP TABLE "lessons" CASCADE;
  DROP TABLE "_lessons_v_blocks_text" CASCADE;
  DROP TABLE "_lessons_v_blocks_video_videos" CASCADE;
  DROP TABLE "_lessons_v_blocks_video" CASCADE;
  DROP TABLE "_lessons_v_blocks_link" CASCADE;
  DROP TABLE "_lessons_v_blocks_download" CASCADE;
  DROP TABLE "_lessons_v_blocks_resources" CASCADE;
  DROP TABLE "_lessons_v" CASCADE;
  DROP TABLE "instructors" CASCADE;
  DROP TABLE "course_covers" CASCADE;
  DROP TABLE "lesson_files" CASCADE;






  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "courses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "modules_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lessons_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "instructors_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "course_covers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lesson_files_id";
  DROP TYPE "public"."enum_courses_structure";
  DROP TYPE "public"."enum_courses_status";
  DROP TYPE "public"."enum__courses_v_version_structure";
  DROP TYPE "public"."enum__courses_v_version_status";
  DROP TYPE "public"."enum_modules_classification";
  DROP TYPE "public"."enum_lessons_blocks_video_videos_provider";
  DROP TYPE "public"."enum_lessons_status";
  DROP TYPE "public"."enum__lessons_v_blocks_video_videos_provider";
  DROP TYPE "public"."enum__lessons_v_version_status";`)
}
