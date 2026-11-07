import { readCourseProgress } from "@/lib/learning/progress-reader";
import { purchaseAvailability } from "@/lib/commerce/course-payments/eligibility";
import { headers } from "next/headers";
import { listComingSoonOffers, listCourseOffers } from "@/lib/commerce/course-payments/offers";
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
  const availability = purchaseAvailability(await headers());
  const [offers, comingSoonOffers, ownership] = await Promise.all([
    availability === "available" ? listCourseOffers(course.id) : [],
    availability === "coming-soon" ? listComingSoonOffers(course.id) : [],
    getCourseOwnership(student?.id, course.id),
  ]);

  const progress = student && ownership.base ? await readCourseProgress(student.id, courseSlug) : null;
  return <CourseDetailView course={course} progress={progress} commerce={{ offers, comingSoonOffers, ownership, signedIn: Boolean(student) }} />;
}
