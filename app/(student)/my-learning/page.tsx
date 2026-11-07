import { listOwnedCourseIds } from "@/lib/learning/entitlements";
import { listPublishedCourses } from "@/lib/learning/payload-reader";
import { readStudentSession } from "@/lib/student-auth/session";
import { StudentAccount } from "@/components/student-auth/StudentAccount";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "My Learning | Barhoum" };

export default async function MyLearningPage() {
  const student = await readStudentSession();
  const ownedCourses = student ? await listPublishedCourses(await listOwnedCourseIds(student.id)) : [];
  return <StudentShell title="My Learning" wide><StudentAccount learning ownedCourses={ownedCourses} /></StudentShell>;
}
