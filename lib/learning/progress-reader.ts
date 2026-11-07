import "server-only";

import { listOwnedCourseIds } from "./entitlements";
import { listPublishedCourses } from "./payload-reader";
import * as progress from "./progress/service";

async function optionalProgress<T>(read: () => Promise<T>): Promise<T | null> {
    try {
        return await read();
    } catch {
        console.error("Unable to read learner progress");
        return null;
    }
}

export function readCourseProgress(studentId: number, courseSlug: string) {
    return optionalProgress(() => progress.readCourseProgress(studentId, courseSlug));
}

export function readLessonProgress(studentId: number, courseSlug: string, lessonId: number) {
    return optionalProgress(() => progress.readLessonProgress(studentId, courseSlug, lessonId));
}

// Keep ownership visible if a progress read fails. Limit parallel reads so
// students with larger libraries do not create a burst of database queries.
export async function readOwnedLearningProgress(studentId: number) {
    const courses = await listPublishedCourses(await listOwnedCourseIds(studentId));
    const entries = [];
    for (let offset = 0; offset < courses.length; offset += 4) {
        const batch = courses.slice(offset, offset + 4);
        entries.push(...await Promise.all(batch.map(async course => ({
            course,
            progress: await readCourseProgress(studentId, course.slug),
        }))));
    }
    return entries;
}
