import type { CourseProgressView, LessonProgressView } from "./progress-contract";

const nextLesson = { lessonId: 2, title: "A daily practice", href: "/courses/attention-and-practice/lessons/2" };

export const courseProgressFixture: CourseProgressView = {
    courseProgress: {
        base: { completed: 1, total: 2, percent: 50 },
        premiumModules: [
            { moduleId: 2, title: "Deep practice", progress: { completed: 0, total: 1, percent: 0 } },
        ],
        firstCompletedAt: null,
    },
    continueTarget: nextLesson,
    continueState: "continue",
    lastVisitedAt: "2026-11-07T12:00:00.000Z",
};

export const lessonProgressFixture: LessonProgressView = {
    completion: { completed: true, completedAt: "2026-11-07T12:00:00.000Z", revision: 1 },
    courseProgress: courseProgressFixture.courseProgress,
    completedLessonIds: [1],
    resumePositions: [],
    previousLesson: null,
    nextLesson,
};
