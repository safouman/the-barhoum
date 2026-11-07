import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        CREATE TABLE lesson_progress (
            student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            lesson_id integer NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            completed_at timestamptz,
            last_visited_at timestamptz,
            completion_revision integer NOT NULL DEFAULT 0 CHECK (completion_revision >= 0),
            PRIMARY KEY (student_id, lesson_id)
        );
        CREATE INDEX lesson_progress_lesson_idx ON lesson_progress (lesson_id);

        CREATE TABLE lesson_video_resume (
            student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            lesson_id integer NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            video_id text NOT NULL CHECK (video_id ~ '^[1-9][0-9]{0,29}$'),
            seconds double precision NOT NULL CHECK (seconds >= 0 AND seconds <= 86400),
            revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
            updated_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (student_id, lesson_id, video_id)
        );
        CREATE INDEX lesson_video_resume_lesson_idx ON lesson_video_resume (lesson_id);

        CREATE TABLE course_achievements (
            student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            course_id integer NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            first_completed_at timestamptz NOT NULL DEFAULT now(),
            PRIMARY KEY (student_id, course_id)
        );
        CREATE INDEX course_achievements_course_idx ON course_achievements (course_id);
    `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        DROP TABLE course_achievements;
        DROP TABLE lesson_video_resume;
        DROP TABLE lesson_progress;
    `);
}
