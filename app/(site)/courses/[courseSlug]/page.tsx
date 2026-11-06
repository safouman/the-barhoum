import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { CurriculumList } from "@/components/learning/CurriculumList";
import { LearningIcon } from "@/components/learning/LearningIcon";
import { lessonHref, orderedLessons } from "@/components/learning/curriculum";
import { getDemoCourse, getDemoCourses } from "@/components/learning/fixtures";

import { getPublishedCourse } from "@/lib/learning/payload-reader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Course preview",
  robots: { index: false, follow: false },
};

export default async function CoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const course = getDemoCourses() ? getDemoCourse(courseSlug) : await getPublishedCourse(courseSlug);
  if (!course) notFound();

  const lessons = orderedLessons(course.curriculum);
  const preview = lessons.find(({ access }) => access === "free");
  const info = [
    `${lessons.length} lessons`,
    course.estimatedDuration,
    course.difficulty,
  ].filter(Boolean).join(" · ");

  return (
    <div dir="ltr" lang="en" className="text-text">
      <section className="border-b border-border bg-[#f2f8f6] py-8 sm:py-9">
        <Container className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
          <div className="space-y-4">
            <Link href="/courses" className="inline-flex items-center gap-2 text-sm font-medium text-[#12685f] hover:underline">
              <LearningIcon name="left" />
              Courses
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#12685f]">Course preview</p>
            <h1 className="text-display leading-tight">{course.title}</h1>
            <p className="text-lead max-w-[55ch]">{course.description}</p>
            <p className="text-sm text-subtle">{info}</p>
            {preview ? (
              <Button href={lessonHref(course.slug, preview.id)} className="!text-[#14312e] max-sm:w-full">
                <LearningIcon name="play" />
                Watch free preview
              </Button>
            ) : null}
          </div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-[#14312e] shadow-sm">
            <Image
              src={course.cover.url}
              alt={course.cover.alt}
              unoptimized={course.cover.url.startsWith("https://")}
              fill
              preload
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </Container>
      </section>

      <Container className="grid gap-9 py-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.52fr)] lg:gap-12">
        <section id="curriculum" aria-labelledby="curriculum-title" className="min-w-0 space-y-5">
          <div className="space-y-1">
            <h2 id="curriculum-title" className="text-3xl">Course curriculum</h2>
            <p className="text-sm text-subtle">Explore the lessons in order or start with the free preview.</p>
          </div>
          <CurriculumList curriculum={course.curriculum} courseSlug={course.slug} />
        </section>
        {course.learningOutcomes?.length ? (
          <section aria-labelledby="outcomes-title" className="self-start rounded-md border border-border bg-surface p-5 sm:p-6">
            <h2 id="outcomes-title" className="text-xl">What you’ll learn</h2>
            <ul role="list" className="mt-4 space-y-3">
              {course.learningOutcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2.5 text-sm leading-relaxed text-subtle">
                  <LearningIcon name="check" className="mt-1 size-4 shrink-0 text-[#12685f]" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </div>
  );
}
