import { readLessonProgress } from "@/lib/learning/progress-reader";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseFunnelTracker } from "@/components/analytics/CourseFunnelTracker";
import { LessonExperience } from "@/components/learning/LessonExperience";
import { getDemoLesson, getDemoCourses } from "@/components/learning/fixtures";
import { getPublishedLesson } from "@/lib/learning/payload-reader";
import { readStudentSession } from "@/lib/student-auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lesson preview", robots: { index: false, follow: false } };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  const student = await readStudentSession();
  const demo = Boolean(getDemoCourses());
  const detail = demo ? getDemoLesson(courseSlug, lessonId) : await getPublishedLesson(courseSlug, lessonId, student?.id);
  if (!detail) notFound();
  const progress = !demo && student && detail.lesson.access !== "locked"
    ? await readLessonProgress(student.id, courseSlug, Number(lessonId))
    : null;
  const viewEvent = detail.lesson.access === "free" ? "course_free_preview_opened"
    : student && detail.lesson.access === "unlocked" ? "course_first_lesson_opened" : null;
  return (
    <>
      {!demo && viewEvent ? <CourseFunnelTracker name={viewEvent} courseKey={detail.course.slug} /> : null}
      <LessonExperience detail={detail} progress={progress} />
    </>
  );
}
