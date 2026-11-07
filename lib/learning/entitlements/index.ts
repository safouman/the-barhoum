import "server-only";
import config from "@payload-config";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import { getPayload } from "payload";

export type CourseOwnership = { base: boolean; moduleIds: number[] };

export async function getCourseOwnership(studentId: number | undefined, courseId: number): Promise<CourseOwnership> {
    if (studentId === undefined) return { base: false, moduleIds: [] };
    const payload = await getPayload({ config });
    const { rows } = await (payload.db as unknown as PostgresAdapter).drizzle.execute<{ module_id: number | null }>(sql`
        SELECT module_id FROM course_entitlements
        WHERE student_id = ${studentId} AND course_id = ${courseId} AND status = 'active'
    `);
    const base = rows.some(({ module_id }) => module_id === null);
    return { base, moduleIds: base ? rows.flatMap(({ module_id }) => module_id === null ? [] : [module_id]) : [] };
}

export async function listOwnedCourseIds(studentId: number): Promise<number[]> {
    const payload = await getPayload({ config });
    const { rows } = await (payload.db as unknown as PostgresAdapter).drizzle.execute<{ course_id: number }>(sql`
        SELECT course_id FROM course_entitlements
        WHERE student_id = ${studentId} AND module_id IS NULL AND status = 'active'
        ORDER BY course_id
    `);
    return rows.map(({ course_id }) => course_id);
}

export function lessonAccess(
    freePreview: boolean | null | undefined,
    ownership: CourseOwnership,
    premiumModuleId?: number,
): "free" | "unlocked" | "locked" {
    if (freePreview) return "free";
    return ownership.base && (premiumModuleId === undefined || ownership.moduleIds.includes(premiumModuleId))
        ? "unlocked"
        : "locked";
}
