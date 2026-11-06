export interface CourseSummary {
    slug: string;
    title: string;
    description: string;
    cover: { url: string; alt: string };
}

export interface CourseDetail extends CourseSummary {
    estimatedDuration?: string;
    learningOutcomes?: string[];
    difficulty?: string;
    category?: string;
    curriculum: Curriculum;
}

export interface LessonSummary {
    id: string;
    title: string;
    description?: string;
    access: "free" | "locked" | "unlocked";
}

export interface ModulePlacement {
    id: string;
    title: string;
    classification: "regular" | "premium";
    lessons: LessonSummary[];
}

export interface PartPlacement {
    id: string;
    title: string;
    modules: ModulePlacement[];
}

export type Curriculum =
    | { type: "simple"; lessons: LessonSummary[] }
    | { type: "modular"; modules: ModulePlacement[] }
    | { type: "structured"; parts: PartPlacement[] };

export type LessonBlock =
    | { id: string; type: "text"; markdown: string }
    | {
        id: string;
        type: "video";
        videos: { title: string; playbackUrl?: string; posterUrl?: string }[];
    }
    | {
        id: string;
        type: "resources";
        items: { kind: "link" | "download"; label: string; url: string }[];
    };

export interface LessonDetail {
    course: Pick<CourseSummary, "slug" | "title">;
    lesson: LessonSummary;
    curriculum: Curriculum;
    blocks?: LessonBlock[];
}
