import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@payloadcms/db-postgres";
import type { AdminViewServerProps } from "payload";
import type { ProgressCount } from "../../lib/learning/progress-contract";
import { progressDB, readCourseProgress } from "../../lib/learning/progress/service";

const pageSize = 20;
const rowStyle = { borderBottom: "1px solid var(--theme-elevation-150)", padding: "0.75rem 0" };
const digits = /^[1-9]\d{0,9}$/;
const integer = (value: string | string[] | undefined) =>
    typeof value === "string" && digits.test(value) && Number(value) <= 2_147_483_647 ? Number(value) : undefined;

function formatProgress(progress: ProgressCount) {
    return progress.total ? `${progress.completed}/${progress.total} lessons (${progress.percent}%)` : "No eligible published lessons";
}

function PageLinks({ base, page, more }: { base: string; page: number; more: boolean }) {
    const separator = base.includes("?") ? "&" : "?";
    return (
        <nav aria-label="Progress list pagination" style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            {page > 1 && <Link href={`${base}${separator}page=${page - 1}`}>Previous page</Link>}
            <span>Page {page}</span>
            {more && <Link href={`${base}${separator}page=${page + 1}`}>Next page</Link>}
        </nav>
    );
}

export default async function StudentProgressView({ initPageResult: { req }, searchParams }: AdminViewServerProps) {
    if (req.user?.collection !== "admins") notFound();

    const db = progressDB(req.payload);
    const root = `${req.payload.config.routes.admin}/student-progress`;
    const studentId = integer(searchParams?.student);
    const courseId = integer(searchParams?.course);
    const page = Math.min(integer(searchParams?.page) ?? 1, 100_000);
    const offset = (page - 1) * pageSize;
    const query = typeof searchParams?.q === "string" ? searchParams.q.trim().slice(0, 120) : "";
    const listLink = query ? `${root}?q=${encodeURIComponent(query)}` : root;
    const sectionStyle = { padding: "2rem", maxWidth: "70rem" };

    if (!studentId) {
        const { rows } = await db.execute<{ id: number; name: string; email: string }>(sql`
            SELECT id, name, email FROM students
            WHERE ${query} = '' OR strpos(lower(name), lower(${query})) > 0 OR strpos(lower(email), lower(${query})) > 0
            ORDER BY id DESC LIMIT ${pageSize + 1} OFFSET ${offset}
        `);
        return (
            <section style={sectionStyle}>
                <h1>Student progress</h1>
                <p>Review student learning and access. Progress is read-only.</p>
                <form action={root} method="get" role="search">
                    <label htmlFor="progress-search">Student name or email</label>{" "}
                    <input id="progress-search" name="q" type="search" defaultValue={query} maxLength={120} />{" "}
                    <button type="submit">Search</button>
                </form>
                {rows.length ? <ul>
                    {rows.slice(0, pageSize).map(student => (
                        <li key={student.id} style={rowStyle}>
                            <Link href={`${root}?student=${student.id}`}>{student.name}</Link>{" · "}{student.email}
                        </li>
                    ))}
                </ul> : <p>No students found.</p>}
                <PageLinks base={listLink} page={page} more={rows.length > pageSize} />
            </section>
        );
    }

    const { rows: [student] } = await db.execute<{ name: string }>(sql`SELECT name FROM students WHERE id = ${studentId}`);
    if (!student) notFound();
    const studentLink = `${root}?student=${studentId}`;

    const { rows: courses } = await db.execute<{
        id: number; slug: string; title: string; active: boolean; first_completed_at: Date | string | null;
    }>(sql`
        WITH related AS (
            SELECT course_id FROM course_orders WHERE student_id = ${studentId}
            UNION
            SELECT course_id FROM course_achievements WHERE student_id = ${studentId}
        )
        SELECT c.id, c.slug, c.title, a.first_completed_at, EXISTS (
            SELECT 1 FROM course_entitlements e
            WHERE e.student_id = ${studentId} AND e.course_id = c.id AND e.module_id IS NULL AND e.status = 'active'
        ) AS active
        FROM related r JOIN courses c ON c.id = r.course_id
        LEFT JOIN course_achievements a ON a.course_id = c.id AND a.student_id = ${studentId}
        ${courseId === undefined ? sql`` : sql`WHERE c.id = ${courseId}`}
        ORDER BY active DESC, c.id DESC
        LIMIT ${pageSize + 1} OFFSET ${courseId === undefined ? offset : 0}
    `);

    if (!courseId) {
        return (
            <section style={sectionStyle}>
                <Link href={root}>All students</Link>
                <h1>{student.name}</h1>
                {courses.length ? <ul>
                    {courses.slice(0, pageSize).map(course => (
                        <li key={course.id} style={rowStyle}>
                            <Link href={`${studentLink}&course=${course.id}`}>{course.title || "Untitled course"}</Link>
                            {" · "}{course.active ? "Owned" : "No active base entitlement"}
                        </li>
                    ))}
                </ul> : <p>No course purchases or completion achievements.</p>}
                <PageLinks base={studentLink} page={page} more={courses.length > pageSize} />
            </section>
        );
    }

    const [course] = courses;
    if (!course) notFound();
    const [view, { rows: orders }] = await Promise.all([
        readCourseProgress(studentId, course.slug),
        db.execute<{ id: string; order_status: string; entitlement_status: string | null; reason: string | null; module_title: string | null }>(sql`
            SELECT o.id, o.status AS order_status, e.status AS entitlement_status, o.reason, m.title AS module_title
            FROM course_orders o
            LEFT JOIN course_entitlements e ON e.source_order_id = o.id
            LEFT JOIN modules m ON m.id = o.module_id
            WHERE o.student_id = ${studentId} AND o.course_id = ${course.id}
            ORDER BY o.created_at DESC, o.id DESC
            LIMIT ${pageSize + 1} OFFSET ${offset}
        `),
    ]);
    const progress = view?.courseProgress;
    const achievement = progress?.firstCompletedAt ?? course.first_completed_at;

    return (
        <section style={sectionStyle}>
            <Link href={studentLink}>Back to {student.name}</Link>
            <h1>{course.title || "Untitled course"}</h1>
            <p>Base entitlement: {course.active ? "Active" : "No active entitlement"}</p>
            <h2>Learning progress</h2>
            <p>{progress ? formatProgress(progress.base) : "This course is not published."}</p>
            <p>{achievement ? `First completed on ${new Date(achievement).toISOString().slice(0, 10)} (UTC)` : "No completion achievement"}</p>
            {progress && progress.premiumModules.length > 0 && <>
                <h3>Purchased premium modules</h3>
                <ul>{progress.premiumModules.map(module => (
                    <li key={module.moduleId}>{module.title} · {formatProgress(module.progress)}</li>
                ))}</ul>
            </>}
            <h2>Orders and access</h2>
            {orders.length ? <ul>
                {orders.slice(0, pageSize).map(order => (
                    <li key={order.id} style={rowStyle}>
                        {order.module_title || "Base course"} · {order.order_status.replaceAll("_", " ")}
                        {order.entitlement_status && ` · Access ${order.entitlement_status}`}
                        {order.reason && ` · ${order.reason.replaceAll("_", " ")}`}
                    </li>
                ))}
            </ul> : <p>No orders for this course.</p>}
            <PageLinks base={`${studentLink}&course=${course.id}`} page={page} more={orders.length > pageSize} />
        </section>
    );
}
