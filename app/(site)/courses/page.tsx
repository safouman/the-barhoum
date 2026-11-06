import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { demoCourseSlug, getDemoCourse } from "@/components/learning/fixtures";

export const metadata: Metadata = {
  title: "Learning preview",
  robots: { index: false, follow: false },
};

export default function CoursesPage() {
  const course = getDemoCourse(demoCourseSlug);
  if (!course) notFound();

  return (
    <div dir="ltr" lang="en">
      <Container className="space-y-5 py-10">
        <h1 className="text-display">Courses</h1>
        <p className="text-lead">Explore a representative course in this learning preview.</p>
        <Button className="!text-[#14312e]" href={`/courses/${encodeURIComponent(course.slug)}`}>{course.title}</Button>
      </Container>
    </div>
  );
}
