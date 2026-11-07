import config from "@payload-config";
import { getPayload } from "payload";
import { getPublishedLesson, lessonDownloadBase } from "@/lib/learning/payload-reader";
import { readLessonPDF } from "@/lib/learning/lesson-file-storage";
import { readStudentSession } from "@/lib/student-auth/session";

const noStore = { "Cache-Control": "private, no-store" };
const missing = () => new Response("File not found.", { status: 404, headers: noStore });

export async function GET(_request: Request, context: RouteContext<"/api/lesson-downloads/[courseSlug]/[lessonId]/[fileId]">) {
    const { courseSlug, lessonId, fileId } = await context.params;
    if (!/^[1-9]\d{0,9}$/.test(fileId) || Number(fileId) > 2147483647) return missing();
    const student = await readStudentSession();
    const detail = await getPublishedLesson(courseSlug, lessonId, student?.id);
    const url = `${lessonDownloadBase(courseSlug, lessonId)}/${fileId}`;
    const download = detail?.blocks?.some((block) => block.type === "resources"
        && block.items.some((item) => item.kind === "download" && item.url === url));
    if (!download) return missing();

    const payload = await getPayload({ config });
    const file = await payload.findByID({
        collection: "lesson-files", id: Number(fileId), depth: 0, disableErrors: true,
    });
    if (!file?.filename || file.mimeType !== "application/pdf") return missing();
    const body = await readLessonPDF(file.filename);
    if (!body) return missing();
    const filename = file.filename.replace(/^[a-f0-9-]{36}-/i, "").replace(/[^a-zA-Z0-9._-]/g, "_");
    return new Response(body, {
        headers: {
            ...noStore,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "X-Content-Type-Options": "nosniff",
        },
    });
}
