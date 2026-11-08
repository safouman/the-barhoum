import { readCourseProgress } from "@/lib/learning/progress-reader";
import { purchaseAvailability } from "@/lib/commerce/course-payments/eligibility";
import { headers } from "next/headers";
import { readCourseCommerce } from "@/lib/commerce/course-payments/offers";
import { readStudentSession } from "@/lib/student-auth/session";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseDetailView } from "@/components/learning/CourseDetailView";
import { getDemoCourse, getDemoCourses } from "@/components/learning/fixtures";
import { getPublishedCourse } from "@/lib/learning/payload-reader";
import { courseMetadata, listDiscoverableCourses } from "@/lib/learning/course-seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ courseSlug: string }> }): Promise<Metadata> {
  const { courseSlug } = await params;
  const [course] = await listDiscoverableCourses(courseSlug);
  return courseMetadata({ index: !!course, course, slug: courseSlug });
}

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
  const availability = purchaseAvailability(await headers());
  const commerce = await readCourseCommerce(course.id, student?.id, availability);
  const progress = student && commerce.ownership.base ? await readCourseProgress(student.id, courseSlug) : null;
  return <CourseDetailView course={course} progress={progress} commerce={commerce} />;
}
