import { readLessonProgress } from "@/lib/learning/progress-reader";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  return <LessonExperience detail={detail} progress={progress} signedIn={Boolean(student)} />;
}
