import { readOwnedLearningProgress } from "@/lib/learning/progress-reader";
import { readStudentSession } from "@/lib/student-auth/session";
import { LearningLibrary } from "@/components/learning/LearningLibrary";
import { Button } from "@/components/Button";
import { Notice, Panel, StudentShell } from "@/components/student-auth/ui";
import { loginHref } from "@/components/student-auth/api";

export const metadata = { title: "My Learning | Barhoum" };

export default async function MyLearningPage() {
  const student = await readStudentSession();
  if (!student) {
    return (
      <StudentShell title="My Learning" wide>
        <Panel>
          <Notice>Sign in to view your student account.</Notice>
          <Button href={loginHref("/my-learning")} className="!text-[#14312e]">Sign in</Button>
        </Panel>
      </StudentShell>
    );
  }
  return <LearningLibrary entries={await readOwnedLearningProgress(student.id)} />;
}
