import "server-only";
import config from "@payload-config";
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
import { vimeoEmbedURL } from "./vimeo";

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

export async function listPublishedCourses() {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
        collection: "courses",
        where: { _status: { equals: "published" } },
        draft: false,
        depth: 1,
        limit: 0,
        pagination: false,
        sort: "title",
        select: { slug: true, title: true, description: true, cover: true, estimatedDuration: true, difficulty: true, category: true },
    });
    return docs.map((course) => ({
        ...courseSummary(course),
        estimatedDuration: course.estimatedDuration ?? undefined,
        difficulty: course.difficulty ?? undefined,
        category: course.category ?? undefined,
    }));
}

type ModuleRow = NonNullable<Course["modules"]>[number];
type LessonRow = NonNullable<Course["lessons"]>[number];

async function readCourse(slug: string): Promise<{ course: Course; curriculum: Curriculum } | null> {
    const payload = await getPayload({ config });
    const { docs: [course] } = await payload.find({
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

    const summaries = new Map<number, LessonSummary>(docs.map((lesson) => [
        lesson.id,
        {
            id: String(lesson.id),
            title: lesson.title ?? "",
            description: lesson.freePreview ? lesson.description ?? undefined : undefined,
            access: lesson.freePreview ? "free" : "locked",
        },
    ]));

    function projectLessons(rows: LessonRow[]): LessonSummary[] {
        return rows.flatMap((row) => {
            const id = relationID(row.lesson);
            const summary = id === undefined ? undefined : summaries.get(id);
            return summary ? [summary] : [];
        });
    }

    function projectModules(rows: ModuleRow[]): ModulePlacement[] {
        return rows.flatMap((row) => {
            const placedModule = row.module;
            if (!placedModule || typeof placedModule !== "object" || relationID(placedModule.course) !== course.id) return [];
            return [{
                id: String(placedModule.id),
                title: placedModule.title,
                classification: placedModule.classification,
                lessons: projectLessons(row.lessons ?? []),
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

export async function getPublishedCourse(slug: string): Promise<CourseDetail | null> {
    const result = await readCourse(slug);
    if (!result) return null;
    const { course, curriculum } = result;
    return {
        ...courseSummary(course),
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
                    items: block.items.flatMap((item) => {
                        if (item.blockType !== "link" || !/^https?:\/\//i.test(item.url)) return [];
                        return [{ kind: "link", label: item.label, url: item.url }];
                    }),
                };
        }
    });
}

export async function getPublishedLesson(slug: string, lessonID: string): Promise<LessonDetail | null> {
    const result = await readCourse(slug);
    if (!result) return null;
    const { course, curriculum } = result;
    const modules = curriculum.type === "structured"
        ? curriculum.parts.flatMap((part) => part.modules)
        : curriculum.type === "modular" ? curriculum.modules : [];
    const lessons = curriculum.type === "simple" ? curriculum.lessons : modules.flatMap((module) => module.lessons);
    const lesson = lessons.find((item) => item.id === lessonID);
    if (!lesson) return null;

    const detail = { course: { slug: course.slug, title: course.title }, curriculum, lesson };
    if (lesson.access !== "free") return detail;

    const payload = await getPayload({ config });
    const { docs: [published] } = await payload.find({
        collection: "lessons",
        where: {
            id: { equals: Number(lessonID) },
            course: { equals: course.id },
            _status: { equals: "published" },
            freePreview: { equals: true },
        },
        draft: false,
        depth: 0,
        limit: 1,
        select: { content: true },
    });
    if (!published) return null;
    const editorConfig = await editorConfigFactory.default({ config: payload.config });
    return { ...detail, blocks: projectBlocks(published.content ?? [], editorConfig) };
}
