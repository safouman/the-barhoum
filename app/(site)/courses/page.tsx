import { headers } from "next/headers";
import { CourseCatalogView } from "@/components/learning/CourseCatalogView";
import { getDemoCourses } from "@/components/learning/fixtures";
import { purchaseAvailability } from "@/lib/commerce/course-payments/eligibility";
import { readCourseCommerce } from "@/lib/commerce/course-payments/offers";
import { listPublishedCourses } from "@/lib/learning/payload-reader";
import { readStudentSession } from "@/lib/student-auth/session";
import { courseMetadata, listDiscoverableCourses } from "@/lib/learning/course-seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const courses = await listDiscoverableCourses();
  return courseMetadata({ index: courses.length > 0 });
}

const technicalCourseSlugs = new Set([
  "preview-simple", "preview-modular", "preview-structured", "test-course", "phase-5-checkout-test",
]);

export default async function CoursesPage() {
  const demo = getDemoCourses();
  if (demo) return <CourseCatalogView entries={demo.map((course) => ({ course }))} />;

  const [courses, student, requestHeaders] = await Promise.all([
    listPublishedCourses(),
    readStudentSession(),
    headers(),
  ]);
  const hideTechnicalCourses = process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "development" || (process.env.NODE_ENV === "development" && !process.env.VERCEL_ENV);
  const availability = purchaseAvailability(requestHeaders);
  const entries = await Promise.all(courses
    .filter(({ slug }) => !hideTechnicalCourses || !technicalCourseSlugs.has(slug))
    .map(async (course) => ({
      course,
      commerce: await readCourseCommerce(course.id, student?.id, availability, "catalog"),
    })));
  return <CourseCatalogView entries={entries} />;
}
