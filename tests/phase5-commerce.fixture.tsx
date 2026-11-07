import { CourseDetailView } from "@/components/learning/CourseDetailView";
import { StudentAccount } from "@/components/student-auth/StudentAccount";
import { StudentShell } from "@/components/student-auth/ui";
import type { CourseDetail } from "@/lib/learning/contracts";

export default async function CommerceFixture({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const owner = view === "owner" || view === "upgraded";
  const upgraded = view === "upgraded";
  const course: CourseDetail = {
    slug: "attention-and-practice",
    title: "Attention and Practice",
    description: "Build a practical routine for more deliberate focus.",
    cover: { url: "/images/hero.jpeg", alt: "Barhoum course cover" },
    curriculum: {
      type: "modular",
      modules: [
        {
          id: "24", title: "Find your focus", classification: "regular",
          lessons: [
            { id: "1", title: "Orientation", access: "free" },
            { id: "2", title: "A daily practice", access: owner ? "unlocked" : "locked" },
          ],
        },
        {
          id: "25", title: "Deep practice", classification: "premium",
          lessons: [{ id: "3", title: "Deep focus", access: upgraded ? "unlocked" : "locked" }],
        },
      ],
    },
  };

  if (view === "owned-learning" || view === "empty-learning") {
    return <StudentShell title="My Learning" wide><StudentAccount learning ownedCourses={view === "owned-learning" ? [course] : []} /></StudentShell>;
  }

  return (
    <CourseDetailView
      course={course}
      commerce={{
        signedIn: view !== "visitor",
        ownership: { base: owner, moduleIds: upgraded ? [25] : [] },
        offers: [
          { id: 17, moduleId: null, amountMinor: 14900, currency: "usd" },
          { id: 18, moduleId: 25, amountMinor: 4500, currency: "usd" },
        ],
      }}
    />
  );
}
