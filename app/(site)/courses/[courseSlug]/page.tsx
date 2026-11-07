import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseDetailView } from "@/components/learning/CourseDetailView";
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

  return <CourseDetailView course={course} />;
}
