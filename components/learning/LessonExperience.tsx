import type { Locale } from "@/lib/content";
import { learningCopy } from "./learning-copy";
import styles from "./Learning.module.css";
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

export function LessonExperience({ detail, progress, locale = "ar" }: {
  detail: LessonDetail;
  progress?: LessonProgressView | null;
  locale?: Locale;
}) {
  const copy = learningCopy[locale];
  const direction = locale === "ar" ? "rtl" : "ltr";
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
    <ProgressMeter label={copy.courseProgress} locale={locale} count={progress.courseProgress.base} />
  ) : null;
  const curriculumList = (
    <CurriculumList locale={locale} curriculum={curriculum} courseSlug={course.slug} activeLessonId={lesson.id} completedLessonIds={progress?.completedLessonIds} premiumProgress={progress?.courseProgress.premiumModules} />
  );

  return (
    <div dir={direction} lang={locale} className={styles.learning}>
      <Container className={styles.playerGrid}>
        <div dir={direction} className="min-w-0 space-y-6">
          <header className="space-y-3">
            <Link href={courseHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--brand-primary)] hover:underline">
              <LearningIcon name={locale === "ar" ? "right" : "left"} />
              <bdi>{course.title}</bdi>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-subtle">
                {copy.lesson} <bdi dir="ltr">{position + 1}</bdi> {copy.of} <bdi dir="ltr">{lessons.length}</bdi>
              </p>
              <LessonAccessBadge locale={locale} access={lesson.access} />
              {progress?.completion.completed ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]"><LearningIcon name="check" /> {copy.completed}</span> : null}
            </div>
            <h1 className={styles.playerTitle}><bdi>{lesson.title}</bdi></h1>
            {lesson.description ? <p className="text-sm leading-relaxed text-subtle" dir="auto">{lesson.description}</p> : null}
          </header>

          <details className="group/mobile rounded-sm border border-border bg-surface lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
              <LearningIcon name="list" />
              <span className="flex-1">{copy.curriculum}</span>
              <LearningIcon name="down" className="size-4 transition-transform group-open/mobile:rotate-180" />
            </summary>
            {curriculumProgress ? <div className="border-t border-border bg-[var(--brand-background)] px-4 py-3">{curriculumProgress}</div> : null}
            <nav aria-label={copy.curriculum} className="border-t border-border p-2.5">
              {curriculumList}
            </nav>
          </details>

          {lesson.access === "locked" ? (
            <section aria-label={copy.locked} className="grid min-h-56 place-items-center rounded-md border border-border bg-[var(--brand-surface)] px-5 py-8 text-center">
              <div className="space-y-3">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-[var(--brand-background)] text-[var(--brand-primary)]">
                  <LearningIcon name="lock" className="size-5" />
                </span>
                <h2 className="text-2xl">{copy.lockedHeading}</h2>
                <p className="text-sm text-subtle">{copy.lockedDescription}</p>
                <Link href={courseHref} className="inline-block text-sm font-semibold text-[var(--brand-primary)] underline underline-offset-4">
                  {copy.accessOptions}
                </Link>
              </div>
            </section>
          ) : (
            <>
              <LessonBlocks locale={locale} blocks={detail.blocks ?? []} endpoint={endpoint} resumePositions={progress?.resumePositions} />
              {endpoint && progress ? <LessonCompletion locale={locale} key={endpoint} endpoint={endpoint} initial={progress.completion} hasNext={hasNextUnfinished} /> : null}
            </>
          )}

          {previous || next ? (
            <nav aria-label={copy.navigation} className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
              {previous ? (
                <Button href={lessonHref(course.slug, previous.id)} variant="ghost" className="!px-3 !py-2 !text-xs !normal-case !tracking-normal">
                  <LearningIcon name={locale === "ar" ? "right" : "left"} />
                  {copy.previous}
                </Button>
              ) : null}
              {next ? (
                <Button href={lessonHref(course.slug, next.id)} variant="ghost" className="ms-auto !px-3 !py-2 !text-xs !normal-case !tracking-normal">
                  {copy.next}
                  <LearningIcon name={locale === "ar" ? "left" : "right"} />
                </Button>
              ) : null}
            </nav>
          ) : null}
        </div>

        <aside dir={direction} className={styles.sidebar}>
          <header className="border-b border-border p-4">
            <h2 className="text-lg">{copy.curriculum}</h2>
            <p className="mt-1 text-xs text-subtle">{copy.lessonCount}: <bdi dir="ltr">{lessons.length}</bdi></p>
            {curriculumProgress ? <div className="mt-4">{curriculumProgress}</div> : null}
          </header>
          <nav aria-label={copy.curriculum} className="max-h-[calc(100vh-10rem)] overflow-y-auto p-3">
            {curriculumList}
          </nav>
        </aside>
      </Container>
    </div>
  );
}
