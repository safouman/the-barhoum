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

const structuredCourse: CourseDetail = {
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

const simpleStart: LessonSummary = {
  id: "name-your-next-step",
  title: "Name your next step",
  description: "Choose one thing you can do today to move forward.",
  access: "free",
};

const simpleCourse: CourseDetail = {
  slug: "one-deliberate-step",
  title: "One deliberate step",
  description: "Turn an idea you have been sitting with into one small action you can take today.",
  cover: {
    url: "/images/opengraph-image.png",
    alt: "Barhoum's turquoise mark on a dark background",
  },
  curriculum: {
    type: "simple",
    lessons: [simpleStart, { id: "make-time", title: "Make time for it", access: "locked" }],
  },
};

const modularStart: LessonSummary = {
  id: "observe-your-day",
  title: "Observe your day",
  description: "Take stock of your daily rhythms before you try to change them.",
  access: "free",
};

const modularCourse: CourseDetail = {
  slug: "make-room-for-focus",
  title: "Make room for focus",
  description: "Notice the moments that pull you off track and design a routine that makes room for your best work.",
  cover: {
    url: "/video/promo-poster.jpg",
    alt: "Ibrahim Ben Abdallah in the Barhoum recording studio",
  },
  estimatedDuration: "30 minutes",
  category: "Personal practice",
  curriculum: {
    type: "modular",
    modules: [
      {
        id: "notice",
        title: "Notice your rhythms",
        classification: "regular",
        lessons: [modularStart],
      },
      {
        id: "make-space",
        title: "Make space",
        classification: "regular",
        lessons: [{ id: "choose-your-routine", title: "Choose your routine", access: "locked" }],
      },
    ],
  },
};

const courses = [structuredCourse, simpleCourse, modularCourse];

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

const lessonBlocks: Record<string, LessonBlock[]> = {
  [introduction.id]: introductionBlocks,
  [attention.id]: attentionBlocks,
  [simpleStart.id]: [
    {
      id: "next-step-notes",
      type: "text",
      markdown: "## Choose one small action\n\nWrite down what you will do, when you will do it, and how you will know it is complete.",
    },
  ],
  [modularStart.id]: [
    {
      id: "observe-your-day-notes",
      type: "text",
      markdown: "## Notice where focus comes easily\n\nLook back over yesterday and name one moment when it was easy to give your full attention to what you were doing.",
    },
  ],
};

export function getDemoCourses(): CourseDetail[] | undefined {
  // The demo is opt-in and only works under next dev.
  if (process.env.NODE_ENV !== "development" || process.env.LEARNING_DEMO !== "1") {
    return undefined;
  }

  return courses;
}

export function getDemoCourse(courseSlug: string): CourseDetail | undefined {
  return getDemoCourses()?.find(({ slug }) => slug === courseSlug);
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
    blocks: lessonBlocks[lesson.id] ?? [],
  };
}
