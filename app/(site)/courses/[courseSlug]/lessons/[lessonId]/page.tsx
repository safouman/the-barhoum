import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { CurriculumList, LessonAccessBadge } from "@/components/learning/CurriculumList";
import { LearningIcon } from "@/components/learning/LearningIcon";
import { LessonBlocks } from "@/components/learning/LessonBlocks";
import { lessonHref, orderedLessons } from "@/components/learning/curriculum";
import { getDemoLesson, getDemoCourses } from "@/components/learning/fixtures";

import { getPublishedLesson } from "@/lib/learning/payload-reader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lesson preview",
  robots: { index: false, follow: false },
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  const detail = getDemoCourses() ? getDemoLesson(courseSlug, lessonId) : await getPublishedLesson(courseSlug, lessonId);
  if (!detail) notFound();

  const { course, curriculum, lesson } = detail;
  const lessons = orderedLessons(curriculum);
  const position = lessons.findIndex(({ id }) => id === lesson.id);
  const previous = lessons[position - 1];
  const next = lessons[position + 1];
  const courseHref = `/courses/${encodeURIComponent(course.slug)}`;
  const curriculumList = (
    <CurriculumList curriculum={curriculum} courseSlug={course.slug} activeLessonId={lesson.id} />
  );

  return (
    <div dir="ltr" lang="en" className="border-t border-border text-text">
      <Container className="grid items-start gap-7 py-7 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.48fr)] lg:gap-9">
        <div className="min-w-0 space-y-6">
          <header className="space-y-3">
            <Link href={courseHref} className="inline-flex min-h-8 items-center gap-2 text-sm font-medium text-[#12685f] hover:underline">
              <LearningIcon name="left" />
              {course.title}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-subtle">
                Lesson {position + 1} of {lessons.length}
              </p>
              <LessonAccessBadge access={lesson.access} />
            </div>
            <h1 className="text-4xl leading-tight sm:text-5xl">{lesson.title}</h1>
            {lesson.description ? <p className="text-sm leading-relaxed text-subtle">{lesson.description}</p> : null}
          </header>

          <details className="group/mobile rounded-sm border border-border bg-surface lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
              <LearningIcon name="list" />
              <span className="flex-1">Course curriculum</span>
              <LearningIcon name="down" className="size-4 transition-transform group-open/mobile:rotate-180" />
            </summary>
            <nav aria-label="Course curriculum" className="border-t border-border p-2.5">
              {curriculumList}
            </nav>
          </details>

          {lesson.access === "locked" ? (
            <section aria-label="Locked lesson" className="grid min-h-56 place-items-center rounded-md border border-border bg-[#f2f8f6] px-5 py-8 text-center">
              <div className="space-y-3">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-white text-[#12685f]">
                  <LearningIcon name="lock" className="size-5" />
                </span>
                <h2 className="text-2xl">This lesson is locked</h2>
                <p className="text-sm text-subtle">You can return to the curriculum to find the free preview.</p>
                <Link href={courseHref + "#curriculum"} className="inline-block text-sm font-semibold text-[#12685f] underline underline-offset-4">
                  Browse curriculum
                </Link>
              </div>
            </section>
          ) : (
            <LessonBlocks blocks={detail.blocks ?? []} />
          )}

          {previous || next ? (
            <nav aria-label="Previous and next lesson" className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
              {previous ? (
                <Button href={lessonHref(course.slug, previous.id)} variant="ghost" className="!px-3 !py-2 !text-xs !normal-case !tracking-normal">
                  <LearningIcon name="left" />
                  Previous lesson
                </Button>
              ) : null}
              {next ? (
                <Button href={lessonHref(course.slug, next.id)} className="ms-auto !text-[#14312e] !px-3 !py-2 !text-xs !normal-case !tracking-normal">
                  Next lesson
                  <LearningIcon name="right" />
                </Button>
              ) : null}
            </nav>
          ) : null}
        </div>

        <aside className="hidden min-w-0 rounded-md border border-border bg-surface lg:sticky lg:top-5 lg:block">
          <header className="border-b border-border p-4">
            <h2 className="text-lg">Course curriculum</h2>
            <p className="mt-1 text-xs text-subtle">{lessons.length} lessons</p>
          </header>
          <nav aria-label="Course curriculum" className="max-h-[calc(100vh-10rem)] overflow-y-auto p-3">
            {curriculumList}
          </nav>
        </aside>
      </Container>
    </div>
  );
}
