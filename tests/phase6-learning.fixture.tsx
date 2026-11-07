import { LearningLibrary } from "@/components/learning/LearningLibrary";
import { LessonExperience } from "@/components/learning/LessonExperience";
import type { Curriculum, LessonBlock, LessonSummary } from "@/lib/learning/contracts";
import type { CourseProgress, LessonProgressView } from "@/lib/learning/progress-contract";

const course = {
  slug: "attention-and-practice",
  title: "The Art of Paying Attention",
  description: "Build a calmer, more deliberate relationship with your attention through small, repeatable practices.",
  cover: { url: "/images/hero.jpeg", alt: "Barhoum instructor" },
};

const lessons: LessonSummary[] = [
  { id: "1", title: "Begin with one small action", access: "free" },
  { id: "2", title: "Make room for focus", access: "unlocked", description: "A short practice for noticing where your attention goes, and choosing where it returns." },
  { id: "3", title: "Your daily practice worksheet", access: "unlocked" },
  { id: "4", title: "Reflect on what changed", access: "unlocked" },
  { id: "5", title: "A deeper practice", access: "locked" },
  { id: "6", title: "Put the practice to work", access: "unlocked" },
];

const curriculum: Curriculum = {
  type: "modular",
  modules: [
    { id: "21", title: "Foundations", classification: "regular", lessons: lessons.slice(0, 4) },
    { id: "22", title: "Advanced practice", classification: "premium", lessons: [lessons[5]] },
    { id: "23", title: "The focused mind", classification: "premium", lessons: [lessons[4]] },
  ],
};

const progress: CourseProgress = {
  base: { completed: 1, total: 4, percent: 25 },
  premiumModules: [{ moduleId: 22, title: "Advanced practice", progress: { completed: 0, total: 1, percent: 0 } }],
  firstCompletedAt: null,
};
const video: LessonBlock = {
  id: "video",
  type: "video",
  videos: [{ title: "Barhoum practice video", vimeoEmbedUrl: "https://player.vimeo.com/video/76979871" }],
};
const text: LessonBlock = {
  id: "text", type: "text",
  markdown: "## Before you begin\n\nFind a quiet place and take a minute to settle. You only need a pen and a few minutes of undivided attention.\n\n1. Notice what is competing for your attention.\n2. Name one thing you want to return to.\n3. Give it five quiet minutes.\n\nWrite down what you noticed before moving on.",
};
const pdf: LessonBlock = {
  id: "worksheet", type: "resources",
  items: [{ kind: "download", label: "Daily practice worksheet (PDF)", url: "/api/lesson-downloads/attention-and-practice/3/1" }],
};
const path = (view: string) => `/phase-6-lesson-browser-test?view=${view}`;

export default async function LearningFixture({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view ?? "video";
  if (view === "library" || view === "empty") {
    return <LearningLibrary entries={view === "empty" ? [] : [
      {
        course,
        progress: { courseProgress: progress, continueTarget: { lessonId: 2, title: lessons[1].title, href: path("video") }, continueState: "continue", lastVisitedAt: "2026-11-07T15:00:00Z" },
      },
      {
        course: { ...course, slug: "steady-habits", title: "Steady Habits", description: "Make lasting change one small step at a time.", cover: { url: "/images/hero.jpeg", alt: "Barhoum instructor" } },
        progress: { courseProgress: { base: { completed: 3, total: 3, percent: 100 }, premiumModules: [], firstCompletedAt: "2026-11-01T15:00:00Z" }, continueTarget: { lessonId: 4, title: lessons[3].title, href: path("completed") }, continueState: "review", lastVisitedAt: "2026-11-01T15:00:00Z" },
      },
    ]} />;
  }

  const preview = view === "free" || view === "anonymous";
  const signedIn = view !== "anonymous";
  const lesson = lessons[preview ? 0 : view === "pdf" ? 2 : view === "text" || view === "completed" ? 3 : view === "locked" ? 4 : view === "mixed" ? 5 : 1];
  const completed = view === "completed";
  const blocks = preview ? [video] : view === "text" || completed ? [text] : view === "pdf" ? [pdf] : view === "mixed" ? [video, text, pdf] : view === "locked" ? undefined : [video];
  const authorized = signedIn && lesson.access !== "locked";
  const lessonProgress: LessonProgressView | null = authorized ? {
    completion: { completed, completedAt: completed ? "2026-11-07T15:00:00Z" : null, revision: completed ? 1 : 0 },
    courseProgress: progress,
    completedLessonIds: preview ? [] : [1, ...(completed ? [4] : [])],
    resumePositions: view === "video" ? [{ videoId: "76979871", seconds: 32, revision: 1 }] : [],
    previousLesson: null,
    nextLesson: { lessonId: 3, title: lessons[2].title, href: path("pdf") },
  } : null;

  return <LessonExperience detail={{ course, lesson, curriculum, blocks }} progress={lessonProgress} />;
}
