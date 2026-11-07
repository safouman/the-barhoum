import type { Curriculum, LessonSummary } from "../contracts";
import type { Completion, CourseProgressView, LessonTarget, ProgressCount } from "../progress-contract";

export type ProgressRow = { lesson_id: number; completed_at: Date | string | null; last_visited_at: Date | string | null; completion_revision: number };

export function modulesIn(curriculum: Curriculum) {
    switch (curriculum.type) {
        case "simple": return [];
        case "modular": return curriculum.modules;
        case "structured": return curriculum.parts.flatMap(part => part.modules);
    }
}

function distinct(lessons: LessonSummary[]) {
    return [...new Map(lessons.map(lesson => [lesson.id, lesson])).values()];
}

export function curriculumLessons(curriculum: Curriculum) {
    return distinct(curriculum.type === "simple" ? curriculum.lessons : modulesIn(curriculum).flatMap(module => module.lessons));
}

export function baseLessons(curriculum: Curriculum) {
    return distinct(curriculum.type === "simple" ? curriculum.lessons : modulesIn(curriculum)
        .filter(module => module.classification === "regular").flatMap(module => module.lessons));
}

export function progressCount(lessons: LessonSummary[], completedIds: ReadonlySet<string>): ProgressCount {
    const ids = new Set(lessons.map(lesson => lesson.id));
    const total = ids.size;
    const completed = [...ids].filter(id => completedIds.has(id)).length;
    return { completed, total, percent: total ? Math.floor(completed * 100 / total) : null };
}

export function lessonTarget(slug: string, lesson: LessonSummary | undefined): LessonTarget | null {
    if (!lesson) return null;
    return { lessonId: Number(lesson.id), title: lesson.title, href: `/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lesson.id)}` };
}

export function isAccessible(lesson: LessonSummary) {
    return lesson.access !== "locked";
}

export function continuation(slug: string, lessons: LessonSummary[], rows: ProgressRow[], completed: ReadonlySet<string>): Omit<CourseProgressView, "courseProgress"> {
    const accessible = lessons.filter(isAccessible);
    const visited = new Map(rows.map(row => [String(row.lesson_id), row.last_visited_at]));
    const latest = accessible.reduce<LessonSummary | undefined>((best, lesson) => {
        const date = visited.get(lesson.id);
        if (!date) return best;
        const previous = best && visited.get(best.id);
        return !previous || new Date(date).getTime() > new Date(previous).getTime() ? lesson : best;
    }, undefined);
    const date = latest && visited.get(latest.id);
    const unfinished = accessible.find(lesson => !completed.has(lesson.id));
    const continueState = accessible.length && !unfinished ? "review" : latest ? "continue" : "start";
    return {
        continueTarget: lessonTarget(slug, latest ?? unfinished ?? accessible[0]),
        continueState,
        lastVisitedAt: date ? new Date(date).toISOString() : null,
    } as const;
}

export function adjacentLessons(slug: string, lessons: LessonSummary[], lessonId: string, completed: ReadonlySet<string>) {
    const index = lessons.findIndex(lesson => lesson.id === lessonId);
    const before = lessons.slice(0, index);
    const after = lessons.slice(index + 1);
    return {
        previousLesson: lessonTarget(slug, before.findLast(isAccessible)),
        nextLesson: lessonTarget(slug, after.find(isAccessible)),
        nextUnfinishedLesson: lessonTarget(slug, [...after, ...before].find(lesson => isAccessible(lesson) && !completed.has(lesson.id))),
    };
}

export function completedIds(rows: ProgressRow[]) {
    return new Set(rows.filter(row => row.completed_at).map(row => String(row.lesson_id)));
}

export function completionState(row?: ProgressRow): Completion {
    return {
        completed: !!row?.completed_at,
        completedAt: row?.completed_at ? new Date(row.completed_at).toISOString() : null,
        revision: row?.completion_revision ?? 0,
    };
}

export function compareRevision<T>(current: T, desired: T, revision: number, expected: number) {
    if (expected === revision) return current === desired ? "unchanged" : "write";
    if (expected === revision - 1 && current === desired) return "unchanged";
    return "conflict";
}
