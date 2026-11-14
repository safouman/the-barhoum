import { catalogCopy } from "@/components/learning/catalog-copy";
import { resolveLocale } from "@/lib/i18n.server";
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
  const locale = await resolveLocale();
  const metadata = courseMetadata({ index: !!course, course, slug: courseSlug });
  const title = course?.title ?? catalogCopy[locale].title;
  const description = course?.description ?? catalogCopy[locale].description;
  return {
    ...metadata, title, description,
    openGraph: { ...metadata.openGraph, title, description },
    twitter: { ...metadata.twitter, title, description },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const locale = await resolveLocale();
  if (getDemoCourses()) {
    const course = getDemoCourse(courseSlug);
    if (!course) notFound();
    return <CourseDetailView course={course} locale={locale} />;
  }

  const student = await readStudentSession();
  const course = await getPublishedCourse(courseSlug, student?.id);
  if (!course) notFound();
  const availability = purchaseAvailability(await headers());
  const commerce = await readCourseCommerce(course.id, student?.id, availability);
  const progress = student && commerce.ownership.base ? await readCourseProgress(student.id, courseSlug) : null;
  return <CourseDetailView course={course} progress={progress} commerce={commerce} locale={locale} />;
}
