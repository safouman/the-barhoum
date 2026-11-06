import "server-only";

import type {
  CourseDetail,
  LessonBlock,
  LessonDetail,
  LessonSummary,
} from "@/lib/learning/contracts";
import { orderedLessons } from "./curriculum";

const introduction: LessonSummary = {
  id: "start-here",
  title: "Start here",
  description: "An introduction to the course and how to get the most out of it.",
  access: "free",
};

const attention: LessonSummary = {
  id: "notice-your-patterns",
  title: "Notice your patterns",
  description: "Observe where your attention goes over the course of a day.",
  access: "unlocked",
};

const reflection: LessonSummary = {
  id: "reflect-with-intention",
  title: "Reflect with intention",
  access: "locked",
};

const routine: LessonSummary = {
  id: "build-a-routine",
  title: "Build a routine you can keep",
  access: "locked",
};

const course: CourseDetail = {
  slug: "self-leadership-foundations",
  title: "Self-leadership foundations",
  description:
    "Build a more intentional relationship with your attention, decisions, and daily habits. Start by noticing what drives you, then turn those observations into a practice you can keep.",
  cover: {
    url: "/images/hero.jpeg",
    alt: "Ibrahim Ben Abdallah sitting for a portrait",
  },
  estimatedDuration: "45 minutes",
  difficulty: "Beginner",
  learningOutcomes: [
    "Recognize the patterns that shape your decisions.",
    "Use reflection to choose a small, deliberate next step.",
    "Build a repeatable practice around what matters to you.",
  ],
  curriculum: {
    type: "structured",
    parts: [
      {
        id: "awareness",
        title: "Start with awareness",
        modules: [
          {
            id: "orientation",
            title: "Orientation",
            classification: "regular",
            lessons: [introduction, attention],
          },
          {
            id: "reflection",
            title: "Reflect and choose",
            classification: "regular",
            lessons: [reflection],
          },
        ],
      },
      {
        id: "practice",
        title: "Put it into practice",
        modules: [
          {
            id: "routines",
            title: "Personal routines",
            classification: "premium",
            lessons: [routine],
          },
        ],
      },
    ],
  },
};

const introductionBlocks: LessonBlock[] = [
  {
    id: "sample-video",
    type: "video",
    videos: [
      {
        title: "Sample video from the Barhoum site",
        playbackUrl: "/video/promo.mp4",
        posterUrl: "/video/promo-poster.jpg",
      },
    ],
  },
  {
    id: "orientation-notes",
    type: "text",
    markdown:
      "## Before you begin\n\nStart with one ordinary moment when you acted on autopilot. Write down what was happening, what you did, and what you might choose next time.\n\n**Keep it specific.** A short note about one real moment is enough to bring into the next lesson.",
  },
  {
    id: "orientation-resources",
    type: "resources",
    items: [
      { kind: "download", label: "Barhoum introduction · PDF", url: "/docs/intro.pdf" },
    ],
  },
];

const attentionBlocks: LessonBlock[] = [
  {
    id: "attention-exercise",
    type: "text",
    markdown:
      "## An observation exercise\n\nPick three moments today to pause and notice where your attention is. At each pause, write down one thing you were choosing and one thing you were reacting to.",
  },
];

export function getDemoCourse(courseSlug: string): CourseDetail | undefined {
  // The demo is opt-in and only works under next dev.
  if (process.env.NODE_ENV !== "development" || process.env.LEARNING_DEMO !== "1") {
    return undefined;
  }

  return course.slug === courseSlug ? course : undefined;
}

export function getDemoLesson(courseSlug: string, lessonId: string): LessonDetail | undefined {
  const courseDetail = getDemoCourse(courseSlug);
  if (!courseDetail) return undefined;

  const lesson = orderedLessons(courseDetail.curriculum).find(({ id }) => id === lessonId);
  if (!lesson) return undefined;

  const detail: LessonDetail = {
    course: { slug: courseDetail.slug, title: courseDetail.title },
    curriculum: courseDetail.curriculum,
    lesson,
  };

  if (lesson.access === "locked") return detail;

  return {
    ...detail,
    blocks: lesson.id === introduction.id ? introductionBlocks : attentionBlocks,
  };
}

export const demoCourseSlug = course.slug;
