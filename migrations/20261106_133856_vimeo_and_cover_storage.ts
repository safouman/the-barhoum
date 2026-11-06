import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Rebuild the enum so its new value can be used as the default in this transaction.
  await db.execute(sql`
    ALTER TABLE "lessons_blocks_video_videos" ALTER COLUMN "provider" DROP DEFAULT;
    ALTER TABLE "lessons_blocks_video_videos" ALTER COLUMN "provider" TYPE text USING "provider"::text;
    DROP TYPE "public"."enum_lessons_blocks_video_videos_provider";
    CREATE TYPE "public"."enum_lessons_blocks_video_videos_provider" AS ENUM ('vimeo', 'mux');
    ALTER TABLE "lessons_blocks_video_videos" ALTER COLUMN "provider" TYPE "public"."enum_lessons_blocks_video_videos_provider" USING "provider"::"public"."enum_lessons_blocks_video_videos_provider";
    ALTER TABLE "lessons_blocks_video_videos" ALTER COLUMN "provider" SET DEFAULT 'vimeo';
    ALTER TABLE "_lessons_v_blocks_video_videos" ALTER COLUMN "provider" DROP DEFAULT;
    ALTER TABLE "_lessons_v_blocks_video_videos" ALTER COLUMN "provider" TYPE text USING "provider"::text;
    DROP TYPE "public"."enum__lessons_v_blocks_video_videos_provider";
    CREATE TYPE "public"."enum__lessons_v_blocks_video_videos_provider" AS ENUM ('vimeo', 'mux');
    ALTER TABLE "_lessons_v_blocks_video_videos" ALTER COLUMN "provider" TYPE "public"."enum__lessons_v_blocks_video_videos_provider" USING "provider"::"public"."enum__lessons_v_blocks_video_videos_provider";
    ALTER TABLE "_lessons_v_blocks_video_videos" ALTER COLUMN "provider" SET DEFAULT 'vimeo';
    ALTER TABLE "course_covers" ADD COLUMN "prefix" varchar DEFAULT '';
    ALTER TABLE "course_covers" ADD COLUMN "_objectkey" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // The casts deliberately reject rollback while Vimeo references still exist.
  await db.execute(sql`
    ALTER TABLE "lessons_blocks_video_videos" ALTER COLUMN "provider" DROP DEFAULT;
    ALTER TABLE "lessons_blocks_video_videos" ALTER COLUMN "provider" TYPE text USING "provider"::text;
    DROP TYPE "public"."enum_lessons_blocks_video_videos_provider";
    CREATE TYPE "public"."enum_lessons_blocks_video_videos_provider" AS ENUM ('mux');
    ALTER TABLE "lessons_blocks_video_videos" ALTER COLUMN "provider" TYPE "public"."enum_lessons_blocks_video_videos_provider" USING "provider"::"public"."enum_lessons_blocks_video_videos_provider";
    ALTER TABLE "lessons_blocks_video_videos" ALTER COLUMN "provider" SET DEFAULT 'mux';
    ALTER TABLE "_lessons_v_blocks_video_videos" ALTER COLUMN "provider" DROP DEFAULT;
    ALTER TABLE "_lessons_v_blocks_video_videos" ALTER COLUMN "provider" TYPE text USING "provider"::text;
    DROP TYPE "public"."enum__lessons_v_blocks_video_videos_provider";
    CREATE TYPE "public"."enum__lessons_v_blocks_video_videos_provider" AS ENUM ('mux');
    ALTER TABLE "_lessons_v_blocks_video_videos" ALTER COLUMN "provider" TYPE "public"."enum__lessons_v_blocks_video_videos_provider" USING "provider"::"public"."enum__lessons_v_blocks_video_videos_provider";
    ALTER TABLE "_lessons_v_blocks_video_videos" ALTER COLUMN "provider" SET DEFAULT 'mux';
    ALTER TABLE "course_covers" DROP COLUMN "prefix";
    ALTER TABLE "course_covers" DROP COLUMN "_objectkey";
  `);
}
