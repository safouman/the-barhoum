import "server-only";
import config from "@payload-config";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import { convertLexicalToMarkdown, editorConfigFactory } from "@payloadcms/richtext-lexical";
import { getPayload } from "payload";

import type { Course, Lesson } from "../../payload-types";
import type {
    CourseDetail,
    CourseSummary,
    Curriculum,
    LessonBlock,
    LessonDetail,
    LessonSummary,
    ModulePlacement,
} from "./contracts";
import type { AuthTx } from "../student-auth/core";
import { vimeoEmbedURL } from "./vimeo";
import { getCourseOwnership, lessonAccess } from "./entitlements";

function relationID(relation: number | { id: number } | null | undefined): number | undefined {
    return typeof relation === "number" ? relation : relation?.id;
}

function publicBlobCoverURL(value: string | null | undefined): string | undefined {
    const url = value ? URL.parse(value) : null;
    if (
        url?.protocol === "https:" &&
        url.hostname.endsWith(".public.blob.vercel-storage.com") &&
        !url.username && !url.password && !url.port
    ) {
        return url.href;
    }
}

function courseSummary(course: Pick<Course, "slug" | "title" | "description" | "cover">): CourseSummary {
    const cover = typeof course.cover === "object" ? course.cover : undefined;
    const coverURL = cover?.publicURL || publicBlobCoverURL(cover?.url);
    return {
        slug: course.slug,
        title: course.title,
        description: course.description,
        cover: cover && coverURL
            ? { url: coverURL, alt: cover.alt }
            : { url: "/images/hero.jpeg", alt: "Barhoum course cover" },
    };
}

export async function listPublishedCourses(courseIds?: number[]) {
    if (courseIds?.length === 0) return [];
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
        collection: "courses",
        where: { _status: { equals: "published" }, ...(courseIds ? { id: { in: courseIds } } : {}) },
        draft: false,
        depth: 1,
        limit: 0,
        pagination: false,
        sort: "title",
        select: { slug: true, title: true, description: true, cover: true, estimatedDuration: true, difficulty: true, category: true },
    });
    return docs.map((course) => ({
        ...courseSummary(course),
        id: course.id,
        estimatedDuration: course.estimatedDuration ?? undefined,
        difficulty: course.difficulty ?? undefined,
        category: course.category ?? undefined,
    }));
}

export async function listPublishedCourseMetadata(slugs: string[]) {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
        collection: "courses",
        where: { slug: { in: slugs }, _status: { equals: "published" } },
        draft: false,
        depth: 1,
        limit: 0,
        pagination: false,
        select: { slug: true, title: true, description: true, cover: true, updatedAt: true },
    });
    return docs.map((course) => ({ ...courseSummary(course), updatedAt: course.updatedAt }));
}

type ModuleRow = NonNullable<Course["modules"]>[number];
type LessonRow = NonNullable<Course["lessons"]>[number];

async function readCourse(slug: string, studentId?: number, context?: AuthTx): Promise<{ course: Course; curriculum: Curriculum } | null> {
    const payload = await getPayload({ config });
    const { docs: [course] } = await payload.find({
        req: context?.req,
        collection: "courses",
        where: { slug: { equals: slug }, _status: { equals: "published" } },
        draft: false,
        depth: 1,
        populate: { lessons: { title: true }, instructors: { name: true } },
        limit: 1,
    });
    if (!course) return null;

    const placements = course.structure === "structured"
        ? (course.parts ?? []).flatMap((part) => part.modules ?? [])
        : course.structure === "modular" ? course.modules ?? [] : [];
    const lessonRows = course.structure === "simple"
        ? course.lessons ?? []
        : placements.flatMap((row) => row.lessons ?? []);
    const lessonIDs = lessonRows.map((row) => relationID(row.lesson)).filter((id) => id !== undefined);
    const { docs } = lessonIDs.length > 0 ? await payload.find({
        req: context?.req,
        collection: "lessons",
        where: {
            id: { in: lessonIDs },
            course: { equals: course.id },
            _status: { equals: "published" },
        },
        draft: false,
        depth: 0,
        limit: 0,
        pagination: false,
        select: { title: true, description: true, freePreview: true },
    }) : { docs: [] };

    const ownership = await getCourseOwnership(studentId, course.id, context);
    const summaries = new Map(docs.map((lesson) => [lesson.id, lesson]));

    function projectLessons(rows: LessonRow[], premiumModuleId?: number): LessonSummary[] {
        return rows.flatMap((row) => {
            const id = relationID(row.lesson);
            const summary = id === undefined ? undefined : summaries.get(id);
            if (!summary) return [];
            const access = lessonAccess(summary.freePreview, ownership, premiumModuleId);
            return [{
                id: String(summary.id), title: summary.title ?? "", access,
                description: access === "locked" ? undefined : summary.description ?? undefined,
            }];
        });
    }

    function projectModules(rows: ModuleRow[]): ModulePlacement[] {
        return rows.flatMap((row) => {
            const placedModule = row.module;
            if (!placedModule || typeof placedModule !== "object" || placedModule._status !== "published"
                || !placedModule.title || !placedModule.classification
                || relationID(placedModule.course) !== course.id) return [];
            return [{
                id: String(placedModule.id),
                title: placedModule.title,
                classification: placedModule.classification,
                lessons: projectLessons(row.lessons ?? [], placedModule.classification === "premium" ? placedModule.id : undefined),
            }];
        });
    }

    switch (course.structure) {
        case "simple":
            return { course, curriculum: { type: "simple", lessons: projectLessons(course.lessons ?? []) } };
        case "modular":
            return { course, curriculum: { type: "modular", modules: projectModules(course.modules ?? []) } };
        case "structured":
            return {
                course,
                curriculum: {
                    type: "structured",
                    parts: (course.parts ?? []).map((part, index) => ({
                        id: part.id ?? String(index),
                        title: part.title,
                        modules: projectModules(part.modules ?? []),
                    })),
                },
            };
    }
}

export async function getPublishedCourse(slug: string, studentId?: number, context?: AuthTx): Promise<(CourseDetail & { id: number }) | null> {
    const result = await readCourse(slug, studentId, context);
    if (!result) return null;
    const { course, curriculum } = result;
    return {
        ...courseSummary(course),
        id: course.id,
        estimatedDuration: course.estimatedDuration ?? undefined,
        learningOutcomes: course.learningOutcomes?.map(({ outcome }) => outcome),
        difficulty: course.difficulty ?? undefined,
        category: course.category ?? undefined,
        curriculum,
    };
}

function projectBlocks(
    blocks: NonNullable<Lesson["content"]>,
    editorConfig: Awaited<ReturnType<typeof editorConfigFactory.default>>,
    downloadBase: string,
    freePreview: boolean,
    paidFiles: ReadonlySet<number>,
): LessonBlock[] {
    return blocks.map((block, index) => {
        const id = block.id ?? String(index);
        switch (block.blockType) {
            case "text":
                return { id, type: "text", markdown: convertLexicalToMarkdown({ data: block.content, editorConfig }) };
            case "video":
                return {
                    id,
                    type: "video",
                    videos: block.videos.map(({ title, provider, reference }) => ({
                        title,
                        vimeoEmbedUrl: provider === "vimeo" ? vimeoEmbedURL(reference) : undefined,
                    })),
                };
            case "resources":
                return {
                    id,
                    type: "resources",
                    items: block.items.flatMap<{ kind: "link" | "download"; label: string; url: string }>((item) => {
                        if (item.blockType === "download") {
                            const fileID = relationID(item.file);
                            return fileID === undefined || paidFiles.has(fileID) ? [] : [{ kind: "download", label: item.label, url: `${downloadBase}/${fileID}` }];
                        }
                        if (!freePreview || item.blockType !== "link" || !/^https?:\/\//i.test(item.url)) return [];
                        return [{ kind: "link", label: item.label, url: item.url }];
                    }),
                };
        }
    });
}

async function paidDownloadIds(db: PostgresAdapter, blocks: NonNullable<Lesson["content"]>) {
    const ids = blocks.flatMap((block) => block.blockType === "resources"
        ? block.items.flatMap((item) => item.blockType === "download" ? [relationID(item.file)] : [])
        : []).filter((id): id is number => id !== undefined);
    if (!ids.length) return new Set<number>();
    const { rows } = await db.drizzle.execute<{ file_id: number }>(sql`
        SELECT DISTINCT download.file_id
        FROM lessons_blocks_download download
        JOIN lessons lesson ON lesson.id = download._parent_id
        WHERE download.file_id IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})
          AND lesson._status = 'published' AND lesson.free_preview IS NOT TRUE
    `);
    return new Set(rows.map(({ file_id }) => file_id));
}

export async function getPublishedLesson(slug: string, lessonID: string, studentId?: number, context?: AuthTx): Promise<LessonDetail | null> {
    const result = await readCourse(slug, studentId, context);
    if (!result) return null;
    const { course, curriculum } = result;
    const modules = curriculum.type === "structured"
        ? curriculum.parts.flatMap((part) => part.modules)
        : curriculum.type === "modular" ? curriculum.modules : [];
    const lessons = curriculum.type === "simple" ? curriculum.lessons : modules.flatMap((module) => module.lessons);
    const lesson = lessons.find((item) => item.id === lessonID);
    if (!lesson) return null;

    const detail = { course: { slug: course.slug, title: course.title }, curriculum, lesson };
    if (lesson.access === "locked") return detail;

    const payload = await getPayload({ config });
    const { docs: [published] } = await payload.find({
        req: context?.req,
        collection: "lessons",
        where: {
            id: { equals: Number(lessonID) },
            course: { equals: course.id },
            _status: { equals: "published" },
            ...(lesson.access === "free" ? { freePreview: { equals: true } } : {}),
        },
        draft: false,
        depth: 0,
        limit: 1,
        select: { content: true },
    });
    if (!published) return null;
    const blocks = published.content ?? [];
    const isFree = lesson.access === "free";
    const paidFiles = isFree ? await paidDownloadIds(payload.db as unknown as PostgresAdapter, blocks) : new Set<number>();
    const editorConfig = await editorConfigFactory.default({ config: payload.config });
    return { ...detail, blocks: projectBlocks(blocks, editorConfig, lessonDownloadBase(slug, lessonID), isFree, paidFiles) };
}

export function lessonDownloadBase(slug: string, lessonID: string) {
    return `/api/lesson-downloads/${encodeURIComponent(slug)}/${encodeURIComponent(lessonID)}`;
}
