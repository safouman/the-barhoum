import Link from "next/link";
import { MAIN_PROGRAM_SLUG } from "@/lib/learning/main-program";
import featured from "./FeaturedCourse.module.css";
import type { Locale } from "@/lib/content";
import type { Curriculum, LessonSummary, ModulePlacement } from "@/lib/learning/contracts";
import type { CourseProgress } from "@/lib/learning/progress-contract";
import { learningCopy } from "./learning-copy";
import { ProgressMeter } from "./ProgressMeter";
import { lessonHref } from "./curriculum";
import { LearningIcon } from "./LearningIcon";

export function LessonAccessBadge({ access, locale = "ar" }: { access: LessonSummary["access"]; locale?: Locale }) {
  const copy = learningCopy[locale];
  return (
    <span className="shrink-0 rounded-full bg-[var(--brand-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-primary)]">
      {copy[access]}
    </span>
  );
}

type ListProps = {
  courseSlug: string;
  activeLessonId?: string;
  completedLessonIds?: number[];
  premiumProgress?: CourseProgress["premiumModules"];
  locale?: Locale;
  variant?: "default" | "featured";
};

function LessonList({ lessons, courseSlug, activeLessonId, completedLessonIds, locale = "ar" }: ListProps & { lessons: LessonSummary[] }) {
  const copy = learningCopy[locale];
  return (
    <ul className="divide-y divide-border" role="list">
      {lessons.map((lesson) => {
        const current = activeLessonId === lesson.id;
        const complete = lesson.access !== "locked" && completedLessonIds?.includes(Number(lesson.id));
        return (
          <li key={lesson.id}>
            <Link
              href={lessonHref(courseSlug, lesson.id)}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-[var(--brand-surface)] ${current ? "bg-[var(--brand-surface)] font-semibold" : ""}`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-[var(--brand-background)] text-[var(--brand-primary)]">
                <LearningIcon name={lesson.access === "locked" ? "lock" : complete ? "check" : "list"} />
              </span>
              <span className="min-w-0 flex-1 break-words"><bdi>{lesson.title}</bdi></span>
              {complete ? <span className="sr-only">{copy.completed}</span> : null}
              {lesson.access !== "unlocked" ? <LessonAccessBadge access={lesson.access} locale={locale} /> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Modules({ modules, premiumProgress, variant = "default", ...listProps }: ListProps & { modules: ModulePlacement[] }) {
  const copy = learningCopy[listProps.locale ?? "ar"];
  const isFeatured = variant === "featured" && listProps.courseSlug === MAIN_PROGRAM_SLUG;
  return (
    <div className={isFeatured ? featured.moduleGrid : "space-y-2"}>
      {modules.map((module, index) => {
        const progress = module.classification === "premium"
          ? premiumProgress?.find(({ moduleId }) => String(moduleId) === module.id)
          : undefined;
        return (
          <details
            key={module.id}
            open={isFeatured
              ? Boolean(listProps.activeLessonId && module.lessons.some(({ id }) => id === listProps.activeLessonId))
              : !listProps.activeLessonId || module.lessons.some(({ id }) => id === listProps.activeLessonId)}
            data-featured-module={isFeatured || undefined}
            className={isFeatured ? featured.module : "group/module rounded-sm border border-border bg-[var(--brand-background)]"}
          >
            <summary className={isFeatured ? featured.moduleSummary : "flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden"}>
              {isFeatured ? <span aria-hidden="true" className={featured.moduleNumber}><bdi dir="ltr">{String(index + 1).padStart(2, "0")}</bdi></span> : null}
              <LearningIcon name="down" className={isFeatured ? featured.moduleChevron : "size-4 shrink-0 transition-transform group-open/module:rotate-180"} />
              <span className={isFeatured ? featured.moduleTitle : "min-w-0 flex-1 break-words"}><bdi>{module.title}</bdi></span>
              {module.classification === "premium" ? (
                <span className="rounded-full bg-[var(--brand-surface)] px-2 py-0.5 text-xs text-[var(--brand-primary)]">{copy.premiumBadge}</span>
              ) : null}
            </summary>
            {progress ? (
              <div className="border-t border-border px-3 py-2">
                <ProgressMeter label={copy.moduleProgress} count={progress.progress} locale={listProps.locale} />
              </div>
            ) : null}
            <div className={isFeatured ? featured.moduleLessons : "border-t border-border p-1.5"}>
              <LessonList lessons={module.lessons} {...listProps} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function CurriculumList({ curriculum, ...listProps }: ListProps & { curriculum: Curriculum }) {
  const copy = learningCopy[listProps.locale ?? "ar"];
  switch (curriculum.type) {
    case "simple":
      return <LessonList lessons={curriculum.lessons} {...listProps} />;
    case "modular":
      return <Modules modules={curriculum.modules} {...listProps} />;
    case "structured":
      return (
        <div className="space-y-5">
          {curriculum.parts.map((part, index) => (
            <section key={part.id} aria-label={part.title} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 text-sm font-semibold text-[var(--brand-primary)]">{copy.part} <bdi dir="ltr">{index + 1}</bdi></span>
                <span className="min-w-0 text-sm font-semibold text-text"><bdi>{part.title}</bdi></span>
              </div>
              <Modules modules={part.modules} {...listProps} />
            </section>
          ))}
        </div>
      );
  }
}
