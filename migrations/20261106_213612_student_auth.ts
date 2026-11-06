import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_students_age_range" AS ENUM('under-18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+');
  CREATE TABLE "students_sessions" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "created_at" timestamp(3) with time zone,
    "expires_at" timestamp(3) with time zone NOT NULL
  );

  CREATE TABLE "students" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "city" varchar,
    "age_range" "enum_students_age_range",
    "picture" varchar,
    "has_password" boolean DEFAULT false NOT NULL,
    "google_subject" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "email" varchar NOT NULL,
    "reset_password_token" varchar,
    "reset_password_expiration" timestamp(3) with time zone,
    "salt" varchar,
    "hash" varchar,
    "_verified" boolean,
    "_verificationtoken" varchar
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "students_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "students_id" integer;
  ALTER TABLE "students_sessions" ADD CONSTRAINT "students_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "students_sessions_order_idx" ON "students_sessions" USING btree ("_order");
  CREATE INDEX "students_sessions_parent_id_idx" ON "students_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "students_google_subject_idx" ON "students" USING btree ("google_subject");
  CREATE INDEX "students_updated_at_idx" ON "students" USING btree ("updated_at");
  CREATE INDEX "students_created_at_idx" ON "students" USING btree ("created_at");
  CREATE UNIQUE INDEX "students_email_idx" ON "students" USING btree ("email");
  ALTER TABLE "students" ADD CONSTRAINT "students_email_normalized" CHECK (email = lower(btrim(email)));
  CREATE INDEX "students_reset_password_token_idx" ON "students" ("reset_password_token") WHERE "reset_password_token" IS NOT NULL;

  CREATE TABLE student_auth_challenges (
    token_hash varchar(64) PRIMARY KEY,
    purpose varchar(24) NOT NULL CHECK (purpose IN ('signup', 'google-signup', 'email-change', 'google-oauth')),
    context jsonb NOT NULL,
    expires_at timestamptz NOT NULL
  );
  CREATE INDEX student_auth_challenges_expires_idx ON student_auth_challenges (expires_at);
  CREATE TABLE student_auth_rate_limits (
    key varchar(64) PRIMARY KEY,
    expires_at timestamptz NOT NULL,
    attempts integer NOT NULL CHECK (attempts > 0)
  );
  CREATE INDEX student_auth_rate_limits_expires_idx ON student_auth_rate_limits (expires_at);
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_students_fk" FOREIGN KEY ("students_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_students_fk" FOREIGN KEY ("students_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_students_id_idx" ON "payload_locked_documents_rels" USING btree ("students_id");
  CREATE INDEX "payload_preferences_rels_students_id_idx" ON "payload_preferences_rels" USING btree ("students_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE student_auth_rate_limits;
    DROP TABLE student_auth_challenges;
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "students_id";
    ALTER TABLE "payload_preferences_rels" DROP COLUMN "students_id";
    DROP TABLE "students_sessions";
    DROP TABLE "students";
    DROP TYPE "public"."enum_students_age_range";`)
}
