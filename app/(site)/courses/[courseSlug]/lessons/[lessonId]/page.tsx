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
  const detail = getDemoCourses() ? getDemoLesson(courseSlug, lessonId) : await getPublishedLesson(courseSlug, lessonId, student?.id);
  if (!detail) notFound();
  return <LessonExperience detail={detail} signedIn={Boolean(student)} />;
}
