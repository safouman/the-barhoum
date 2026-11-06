import type { Curriculum, LessonSummary } from "@/lib/learning/contracts";

export function orderedLessons(curriculum: Curriculum): LessonSummary[] {
  switch (curriculum.type) {
    case "simple":
      return curriculum.lessons;
    case "modular":
      return curriculum.modules.flatMap(({ lessons }) => lessons);
    case "structured":
      return curriculum.parts.flatMap(({ modules }) => modules.flatMap(({ lessons }) => lessons));
  }
}

export function lessonHref(courseSlug: string, lessonId: string) {
  return `/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonId)}`;
}
