import Link from "next/link";
import type { Curriculum, LessonSummary, ModulePlacement } from "@/lib/learning/contracts";
import type { CourseProgress } from "@/lib/learning/progress-contract";
import { ProgressMeter } from "./ProgressMeter";
import { lessonHref } from "./curriculum";
import { LearningIcon } from "./LearningIcon";

const accessLabels = {
  free: "درس مجاني",
  unlocked: "متاح",
  locked: "مغلق",
} as const;

export function LessonAccessBadge({ access }: { access: LessonSummary["access"] }) {
  const color = {
    free: "bg-[#e4f8f5] text-[#0b625b]",
    unlocked: "bg-surface text-text",
    locked: "bg-surface text-subtle",
  }[access];

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {accessLabels[access]}
    </span>
  );
}

type ListProps = {
  courseSlug: string;
  activeLessonId?: string;
  completedLessonIds?: number[];
  premiumProgress?: CourseProgress["premiumModules"];
};

function LessonList({ lessons, courseSlug, activeLessonId, completedLessonIds }: ListProps & { lessons: LessonSummary[] }) {
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
              className={`flex min-h-12 items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-[#eaf8f6] ${current ? "bg-[#eaf8f6] font-semibold" : ""}`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-white text-[#12685f]">
                <LearningIcon name={lesson.access === "locked" ? "lock" : complete ? "check" : "list"} />
              </span>
              <span className="min-w-0 flex-1 break-words"><bdi>{lesson.title}</bdi></span>
              {complete ? <span className="sr-only">مكتمل</span> : null}
              {lesson.access !== "unlocked" ? <LessonAccessBadge access={lesson.access} /> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Modules({ modules, premiumProgress, ...listProps }: ListProps & { modules: ModulePlacement[] }) {
  return (
    <div className="space-y-2">
      {modules.map((module) => {
        const progress = module.classification === "premium"
          ? premiumProgress?.find(({ moduleId }) => String(moduleId) === module.id)
          : undefined;
        return (
          <details
            key={module.id}
            open={!listProps.activeLessonId || module.lessons.some(({ id }) => id === listProps.activeLessonId)}
            className="group/module rounded-sm border border-border bg-white"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
              <LearningIcon name="down" className="size-4 shrink-0 transition-transform group-open/module:rotate-180" />
              <span className="min-w-0 flex-1 break-words"><bdi>{module.title}</bdi></span>
              {module.classification === "premium" ? (
                <span className="rounded-full bg-[#edf2ef] px-2 py-0.5 text-xs text-[#35574d]">إضافية</span>
              ) : null}
            </summary>
            {progress ? (
              <div className="border-t border-border px-3 py-2">
                <ProgressMeter label="تقدّمك في الوحدة" count={progress.progress} />
              </div>
            ) : null}
            <div className="border-t border-border p-1.5">
              <LessonList lessons={module.lessons} {...listProps} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function CurriculumList({ curriculum, ...listProps }: ListProps & { curriculum: Curriculum }) {
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
                <span className="shrink-0 text-sm font-semibold text-[#12685f]">الجزء <bdi dir="ltr">{index + 1}</bdi></span>
                <span className="min-w-0 text-sm font-semibold text-text"><bdi>{part.title}</bdi></span>
              </div>
              <Modules modules={part.modules} {...listProps} />
            </section>
          ))}
        </div>
      );
  }
}
