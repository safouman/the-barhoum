import "server-only";

import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { lockCourseCommerce } from "../../commerce/course-payments/orders";
import { authTransaction, studentPayload, type AuthTx } from "../../student-auth/core";
import { requireCurrentStudent, type StudentIdentity } from "../../student-auth/session";
import type { Curriculum } from "../contracts";
import { getCourseOwnership } from "../entitlements";
import { getPublishedCourse } from "../payload-reader";
import type { CourseProgress, CourseProgressView, LessonProgressView, VideoResume } from "../progress-contract";
import { vimeoEmbedURL } from "../vimeo";
import { ProgressError } from "./errors";
import { adjacentLessons, baseLessons, compareRevision, completedIds, completionState, continuation, curriculumLessons, isAccessible, modulesIn, progressCount, type ProgressRow } from "./model";

type ProgressDB = AuthTx["tx"] | PostgresAdapter["drizzle"];
type Course = NonNullable<Awaited<ReturnType<typeof getPublishedCourse>>>;
type ResumeRow = { video_id: string; seconds: number | string; revision: number };
type AchievementRow = { first_completed_at: Date | string };
type LessonScope = { course: Course; lessonId: number };

export function progressDB(payload: Payload) {
    return (payload.db as unknown as PostgresAdapter).drizzle;
}

async function readRows(db: ProgressDB, studentId: number, curriculum: Curriculum) {
    const ids = curriculumLessons(curriculum).map(lesson => Number(lesson.id));
    if (!ids.length) return [];
    const { rows } = await db.execute<ProgressRow>(sql`
        SELECT lesson_id, completed_at, last_visited_at, completion_revision
        FROM lesson_progress
        WHERE student_id = ${studentId}
          AND lesson_id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})
    `);
    return rows;
}

async function courseSnapshot(db: ProgressDB, studentId: number, course: Course, context?: AuthTx) {
    const rows = await readRows(db, studentId, course.curriculum);
    const achievement = await db.execute<AchievementRow>(sql`
        SELECT first_completed_at FROM course_achievements
        WHERE student_id = ${studentId} AND course_id = ${course.id}
    `);
    const ownership = await getCourseOwnership(studentId, course.id, context);
    const lessons = curriculumLessons(course.curriculum);
    const completed = completedIds(rows);
    const ownedModules = new Set(ownership.moduleIds.map(String));
    const visibleCompletedIds = lessons.filter(lesson => isAccessible(lesson) && completed.has(lesson.id)).map(lesson => Number(lesson.id));
    const firstCompletedAt = achievement.rows[0]?.first_completed_at;
    const courseProgress: CourseProgress = {
        base: progressCount(baseLessons(course.curriculum), completed),
        premiumModules: modulesIn(course.curriculum)
            .filter(module => module.classification === "premium" && ownedModules.has(module.id))
            .map(module => ({ moduleId: Number(module.id), title: module.title, progress: progressCount(module.lessons, completed) })),
        firstCompletedAt: firstCompletedAt ? new Date(firstCompletedAt).toISOString() : null,
    };
    return { rows, lessons, completed, visibleCompletedIds, courseProgress };
}

export async function readCourseProgress(studentId: number, courseSlug: string): Promise<CourseProgressView | null> {
    const payload = await studentPayload();
    const course = await getPublishedCourse(courseSlug, studentId);
    if (!course) return null;
    const snapshot = await courseSnapshot(progressDB(payload), studentId, course);
    return {
        courseProgress: snapshot.courseProgress,
        ...continuation(course.slug, snapshot.lessons, snapshot.rows, snapshot.completed),
    };
}

function accessibleLesson(course: Course, lessonId: number) {
    return curriculumLessons(course.curriculum).some(lesson => lesson.id === String(lessonId) && isAccessible(lesson));
}

async function lessonVideoIds(payload: Payload, courseId: number, lessonId: number, context?: AuthTx) {
    const { docs: [lesson] } = await payload.find({
        collection: "lessons",
        where: { id: { equals: lessonId }, course: { equals: courseId }, _status: { equals: "published" } },
        select: { content: true },
        draft: false,
        depth: 0,
        limit: 1,
        req: context?.req,
    });
    const ids = new Set<string>();
    for (const block of lesson?.content ?? []) {
        if (block.blockType !== "video") continue;
        for (const video of block.videos) {
            if (video.provider !== "vimeo") continue;
            const embed = vimeoEmbedURL(video.reference);
            if (embed) ids.add(new URL(embed).pathname.split("/").pop()!);
        }
    }
    return ids;
}

function resumeState(videoId: string, row?: ResumeRow): VideoResume {
    return { videoId, seconds: Number(row?.seconds ?? 0), revision: row?.revision ?? 0 };
}

export async function readLessonProgress(studentId: number, courseSlug: string, lessonId: number | string): Promise<LessonProgressView | null> {
    const payload = await studentPayload();
    const course = await getPublishedCourse(courseSlug, studentId);
    const id = Number(lessonId);
    if (!course || !accessibleLesson(course, id)) return null;
    const db = progressDB(payload);
    const [snapshot, videoIds, resume] = await Promise.all([
        courseSnapshot(db, studentId, course),
        lessonVideoIds(payload, course.id, id),
        db.execute<ResumeRow>(sql`
            SELECT video_id, seconds, revision FROM lesson_video_resume
            WHERE student_id = ${studentId} AND lesson_id = ${id}
        `),
    ]);
    const { previousLesson, nextLesson } = adjacentLessons(course.slug, snapshot.lessons, String(id), snapshot.completed);
    return {
        courseProgress: snapshot.courseProgress,
        completedLessonIds: snapshot.visibleCompletedIds,
        completion: completionState(snapshot.rows.find(row => row.lesson_id === id)),
        resumePositions: resume.rows.filter(row => videoIds.has(row.video_id)).map(row => resumeState(row.video_id, row)),
        previousLesson,
        nextLesson,
    };
}

export async function authorizedProgressWrite<T>(
    payload: Payload, identity: StudentIdentity, courseSlug: string, lessonId: number,
    mutate: (context: AuthTx, studentId: number, scope: LessonScope) => Promise<T>,
) {
    return authTransaction(payload, async context => {
        const student = await requireCurrentStudent(payload, context, identity);
        const { rows: [match] } = await context.tx.execute<{ id: number }>(sql`
            SELECT id FROM courses WHERE slug = ${courseSlug} AND _status = 'published' LIMIT 1
        `);
        if (!match) throw new ProgressError("NOT_FOUND");
        // Preserve checkout's publication-before-entitlement lock order.
        await context.tx.execute(sql`SELECT pg_advisory_xact_lock(40196, ${match.id}::integer)`);
        await lockCourseCommerce(context, student.id, match.id);
        const course = await getPublishedCourse(courseSlug, student.id, context);
        if (!course || course.id !== match.id || !accessibleLesson(course, lessonId)) throw new ProgressError("NOT_FOUND");
        return mutate(context, student.id, { course, lessonId });
    }, identity.user.id);
}

export async function recordVisit({ tx }: AuthTx, studentId: number, { lessonId }: LessonScope) {
    const { rows: [row] } = await tx.execute<{ last_visited_at: Date | string }>(sql`
        INSERT INTO lesson_progress (student_id, lesson_id, last_visited_at)
        VALUES (${studentId}, ${lessonId}, clock_timestamp())
        ON CONFLICT (student_id, lesson_id) DO UPDATE SET last_visited_at = clock_timestamp()
        RETURNING last_visited_at
    `);
    return { lastVisitedAt: new Date(row.last_visited_at).toISOString() };
}

export async function setCompletion(
    context: AuthTx, studentId: number, { course, lessonId }: LessonScope,
    completed: boolean, expectedRevision: number,
) {
    const { tx } = context;
    const { rows: [row] } = await tx.execute<ProgressRow>(sql`
        SELECT lesson_id, completed_at, last_visited_at, completion_revision FROM lesson_progress
        WHERE student_id = ${studentId} AND lesson_id = ${lessonId}
    `);
    let completion = completionState(row);
    const decision = compareRevision(completion.completed, completed, completion.revision, expectedRevision);
    if (decision === "conflict") throw new ProgressError("REVISION_CONFLICT", completion);
    if (decision === "write") {
        const { rows: [saved] } = await tx.execute<ProgressRow>(sql`
            INSERT INTO lesson_progress (student_id, lesson_id, completed_at, completion_revision)
            VALUES (${studentId}, ${lessonId}, ${completed ? sql`clock_timestamp()` : sql`NULL`}, 1)
            ON CONFLICT (student_id, lesson_id) DO UPDATE SET
                completed_at = EXCLUDED.completed_at,
                completion_revision = lesson_progress.completion_revision + 1
            RETURNING lesson_id, completed_at, last_visited_at, completion_revision
        `);
        completion = completionState(saved);
    }
    const snapshot = await courseSnapshot(tx, studentId, course, context);
    const { courseProgress } = snapshot;
    const base = baseLessons(course.curriculum);
    if (decision === "write" && completed && base.some(lesson => lesson.id === String(lessonId)) &&
        courseProgress.base.total > 0 && courseProgress.base.percent === 100 && !courseProgress.firstCompletedAt) {
        const { rows: [achievement] } = await tx.execute<AchievementRow>(sql`
            INSERT INTO course_achievements (student_id, course_id, first_completed_at)
            VALUES (${studentId}, ${course.id}, clock_timestamp())
            ON CONFLICT (student_id, course_id) DO NOTHING
            RETURNING first_completed_at
        `);
        if (achievement) courseProgress.firstCompletedAt = new Date(achievement.first_completed_at).toISOString();
    }
    return {
        completion,
        courseProgress,
        nextUnfinishedLesson: adjacentLessons(course.slug, snapshot.lessons, String(lessonId), snapshot.completed).nextUnfinishedLesson,
    };
}

export async function saveResume(
    payload: Payload, context: AuthTx, studentId: number, { course, lessonId }: LessonScope,
    videoId: string, seconds: number, expectedRevision: number,
) {
    if (!(await lessonVideoIds(payload, course.id, lessonId, context)).has(videoId)) throw new ProgressError("NOT_FOUND");
    const { tx } = context;
    const { rows: [row] } = await tx.execute<ResumeRow>(sql`
        SELECT video_id, seconds, revision FROM lesson_video_resume
        WHERE student_id = ${studentId} AND lesson_id = ${lessonId} AND video_id = ${videoId}
    `);
    const current = resumeState(videoId, row);
    const decision = compareRevision(current.seconds, seconds, current.revision, expectedRevision);
    if (decision === "conflict") throw new ProgressError("REVISION_CONFLICT", current);
    if (decision === "unchanged") return current;
    const { rows: [saved] } = await tx.execute<ResumeRow>(sql`
        INSERT INTO lesson_video_resume (student_id, lesson_id, video_id, seconds, revision, updated_at)
        VALUES (${studentId}, ${lessonId}, ${videoId}, ${seconds}, 1, clock_timestamp())
        ON CONFLICT (student_id, lesson_id, video_id) DO UPDATE SET
            seconds = EXCLUDED.seconds, revision = lesson_video_resume.revision + 1, updated_at = EXCLUDED.updated_at
        RETURNING video_id, seconds, revision
    `);
    return resumeState(videoId, saved);
}
