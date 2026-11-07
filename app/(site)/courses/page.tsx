import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CourseCard } from "@/components/learning/CourseCard";
import { getDemoCourses } from "@/components/learning/fixtures";

import { listPublishedCourses } from "@/lib/learning/payload-reader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses",
  robots: { index: false, follow: false },
};

export default async function CoursesPage() {
  const courses = getDemoCourses() ?? await listPublishedCourses();

  return (
    <div dir="ltr" lang="en">
      <section className="border-b border-border bg-[#f2f8f6] py-9 sm:py-12">
        <Container className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#12685f]">Barhoum learning</p>
          <h1 className="text-display">Courses</h1>
          <p className="text-lead max-w-[56ch]">
            Make time for a practice that matters to you. Explore the curriculum and start with a free lesson.
          </p>
        </Container>
      </section>
      <Container className="py-8 sm:py-10">
        {courses.length ? (
          <ul role="list" aria-label="Course catalog" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <li key={course.slug} className="min-w-0">
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-subtle">No courses are available yet. Check back soon.</p>
        )}
      </Container>
    </div>
  );
}
