import { listCourseOffers } from "@/lib/commerce/course-payments/offers";
import { getCourseOwnership } from "@/lib/learning/entitlements";
import { readStudentSession } from "@/lib/student-auth/session";
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
  if (getDemoCourses()) {
    const course = getDemoCourse(courseSlug);
    if (!course) notFound();
    return <CourseDetailView course={course} />;
  }

  const student = await readStudentSession();
  const course = await getPublishedCourse(courseSlug, student?.id);
  if (!course) notFound();
  const [offers, ownership] = await Promise.all([
    listCourseOffers(course.id),
    getCourseOwnership(student?.id, course.id),
  ]);

  return <CourseDetailView course={course} commerce={{ offers, ownership, signedIn: Boolean(student) }} />;
}
