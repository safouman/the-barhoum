import type { UIFieldServerProps } from "payload";
import { courseCurriculumReferences } from "../curriculum";

export async function CourseReadiness({ id, req, data }: UIFieldServerProps) {
    if (id == null || req.user?.collection !== "admins") return null;

    const references = courseCurriculumReferences(data);
    const [published, ...placements] = await Promise.all([
        req.payload.findByID({
            collection: "courses", id, depth: 0, draft: false, disableErrors: true,
            overrideAccess: false, req, select: { _status: true },
        }),
        ...(["modules", "lessons"] as const).map(async (collection) => {
            const ids = references?.[collection] ?? [];
            if (!ids.length) return { collection, missing: 0, total: 0 };

            const { totalDocs } = await req.payload.count({
                collection, overrideAccess: false, req,
                where: { id: { in: ids }, course: { equals: id }, _status: { equals: "published" } },
            });
            const total = new Set(ids).size;
            return { collection, missing: Math.max(0, total - totalDocs), total };
        }),
    ]);

    return (
        <section aria-label="Course readiness">
            <h2>Readiness</h2>
            <p>{published?._status === "published"
                ? "A published version is live. Use Versions to review saved changes."
                : "This course has no live version. Publish it when the content is ready."}</p>
            <p>These checks describe saved curriculum. They are editorial guidance. Payload checks publication rules when you publish.</p>
            {!references?.lessons.length && <p>Add lessons in Curriculum so students have something to open.</p>}
            {placements.some(({ total }) => total > 0) && <ul>
                {placements.filter(({ total }) => total > 0).map(({ collection, missing, total }) => (
                    <li key={collection}>{`${total - missing} of ${total} placed ${collection} published.`}
                        {missing > 0 && " Open the selected records in Curriculum to review their status."}</li>
                ))}
            </ul>}
        </section>
    );
}
