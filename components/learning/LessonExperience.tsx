import Link from "next/link";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import type { LessonDetail } from "@/lib/learning/contracts";
import type { LessonProgressView } from "@/lib/learning/progress-contract";
import { CurriculumList, LessonAccessBadge } from "./CurriculumList";
import { LearningIcon } from "./LearningIcon";
import { LessonBlocks } from "./LessonBlocks";
import { LessonCompletion } from "./LessonCompletion";
import { progressEndpoint } from "./progress-endpoint";
import { ProgressMeter } from "./ProgressMeter";
import { lessonHref, orderedLessons } from "./curriculum";

export function LessonExperience({ detail, progress }: {
  detail: LessonDetail;
  progress?: LessonProgressView | null;
}) {
  const { course, curriculum, lesson } = detail;
  const lessons = orderedLessons(curriculum);
  const position = lessons.findIndex(({ id }) => id === lesson.id);
  const previous = lessons.slice(0, position).reverse().find(({ access }) => access !== "locked");
  const next = lessons.slice(position + 1).find(({ access }) => access !== "locked");
  const hasNextUnfinished = Boolean(progress && lessons.some((entry) =>
    entry.id !== lesson.id && entry.access !== "locked" && !progress.completedLessonIds.includes(Number(entry.id)),
  ));
  const endpoint = progress && lesson.access !== "locked" ? progressEndpoint(course.slug, lesson.id) : null;
  const courseHref = `/courses/${encodeURIComponent(course.slug)}`;
  const curriculumProgress = progress ? (
    <div className="space-y-3">
      <ProgressMeter label="تقدّمك في الدورة" count={progress.courseProgress.base} />
      {progress.courseProgress.premiumModules.map((module) => <ProgressMeter key={module.moduleId} label={module.title} count={module.progress} />)}
    </div>
  ) : null;
  const curriculumList = (
    <CurriculumList curriculum={curriculum} courseSlug={course.slug} activeLessonId={lesson.id} completedLessonIds={progress?.completedLessonIds} />
  );

  return (
    <div dir="rtl" lang="ar" className="border-t border-border bg-[#fcfdfc] text-text">
      <Container className="grid items-start gap-7 py-6 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.44fr)] lg:gap-10">
        <div className="min-w-0 space-y-6">
          <header className="space-y-3">
            <Link href={courseHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#12685f] hover:underline">
              <LearningIcon name="right" />
              <bdi>{course.title}</bdi>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-subtle">
                الدرس <bdi dir="ltr">{position + 1}</bdi> من <bdi dir="ltr">{lessons.length}</bdi>
              </p>
              <LessonAccessBadge access={lesson.access} />
              {progress?.completion.completed ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0b625b]"><LearningIcon name="check" /> مكتمل</span> : null}
            </div>
            <h1 className="text-4xl leading-tight sm:text-5xl"><bdi>{lesson.title}</bdi></h1>
            {lesson.description ? <p className="text-sm leading-relaxed text-subtle" dir="auto">{lesson.description}</p> : null}
          </header>

          <details className="group/mobile rounded-sm border border-border bg-surface lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
              <LearningIcon name="list" />
              <span className="flex-1">محتوى الدورة</span>
              <LearningIcon name="down" className="size-4 transition-transform group-open/mobile:rotate-180" />
            </summary>
            {curriculumProgress ? <div className="border-t border-border bg-white px-4 py-3">{curriculumProgress}</div> : null}
            <nav aria-label="محتوى الدورة" className="border-t border-border p-2.5">
              {curriculumList}
            </nav>
          </details>

          {lesson.access === "locked" ? (
            <section aria-label="درس مغلق" className="grid min-h-56 place-items-center rounded-md border border-border bg-[#f2f8f6] px-5 py-8 text-center">
              <div className="space-y-3">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-white text-[#12685f]">
                  <LearningIcon name="lock" className="size-5" />
                </span>
                <h2 className="text-2xl">هذا الدرس مغلق</h2>
                <p className="text-sm text-subtle">انتقل إلى صفحة الدورة لمعرفة خيارات الوصول ومشاهدة الدرس المجاني.</p>
                <Link href={courseHref} className="inline-block text-sm font-semibold text-[#12685f] underline underline-offset-4">
                  عرض خيارات الوصول
                </Link>
              </div>
            </section>
          ) : (
            <>
              <LessonBlocks blocks={detail.blocks ?? []} endpoint={endpoint} resumePositions={progress?.resumePositions} />
              {endpoint && progress ? <LessonCompletion key={endpoint} endpoint={endpoint} initial={progress.completion} hasNext={hasNextUnfinished} /> : null}
            </>
          )}

          {previous || next ? (
            <nav aria-label="التنقّل بين الدروس" className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
              {previous ? (
                <Button href={lessonHref(course.slug, previous.id)} variant="ghost" className="!px-3 !py-2 !text-xs !normal-case !tracking-normal">
                  <LearningIcon name="right" />
                  الدرس السابق
                </Button>
              ) : null}
              {next ? (
                <Button href={lessonHref(course.slug, next.id)} variant="ghost" className="ms-auto !px-3 !py-2 !text-xs !normal-case !tracking-normal">
                  الدرس التالي
                  <LearningIcon name="left" />
                </Button>
              ) : null}
            </nav>
          ) : null}
        </div>

        <aside className="hidden min-w-0 rounded-md border border-border bg-white lg:sticky lg:top-5 lg:block">
          <header className="border-b border-border p-4">
            <h2 className="text-lg">محتوى الدورة</h2>
            <p className="mt-1 text-xs text-subtle">عدد الدروس: <bdi dir="ltr">{lessons.length}</bdi></p>
            {curriculumProgress ? <div className="mt-4">{curriculumProgress}</div> : null}
          </header>
          <nav aria-label="محتوى الدورة" className="max-h-[calc(100vh-10rem)] overflow-y-auto p-3">
            {curriculumList}
          </nav>
        </aside>
      </Container>
    </div>
  );
}
