import type { CourseSummary } from "./contracts";

export type Completion = { completed: boolean; completedAt: string | null; revision: number };
export type ProgressCount = { completed: number; total: number; percent: number | null };
export type CourseProgress = {
    base: ProgressCount;
    premiumModules: { moduleId: number; title: string; progress: ProgressCount }[];
    firstCompletedAt: string | null;
};
export type LessonTarget = { lessonId: number; title: string; href: string };
export type VideoResume = { videoId: string; seconds: number; revision: number };
export type CourseProgressView = {
    courseProgress: CourseProgress;
    continueTarget: LessonTarget | null;
    continueState: "start" | "continue" | "review";
    lastVisitedAt: string | null;
};
export type OwnedCourseProgress = CourseSummary & CourseProgressView;
export type LessonProgressView = {
    completion: Completion;
    courseProgress: CourseProgress;
    completedLessonIds: number[];
    resumePositions: VideoResume[];
    previousLesson: LessonTarget | null;
    nextLesson: LessonTarget | null;
};
