import { resolveLocale } from "@/lib/i18n.server";
import { learningCopy } from "@/components/learning/learning-copy";
import { readOwnedLearningProgress } from "@/lib/learning/progress-reader";
import { readStudentSession } from "@/lib/student-auth/session";
import { LearningLibrary } from "@/components/learning/LearningLibrary";
import { Button } from "@/components/Button";
import { Notice, Panel, StudentShell } from "@/components/student-auth/ui";
import { loginHref } from "@/components/student-auth/api";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: learningCopy[locale].library };
}

export default async function MyLearningPage() {
  const locale = await resolveLocale();
  const copy = learningCopy[locale];
  const student = await readStudentSession();
  if (!student) {
    return (
      <StudentShell title={copy.library} locale={locale} wide>
        <Panel>
          <Notice>{copy.signInDescription}</Notice>
          <Button href={loginHref("/my-learning")}>{copy.signIn}</Button>
        </Panel>
      </StudentShell>
    );
  }
  return <LearningLibrary entries={await readOwnedLearningProgress(student.id)} locale={locale} />;
}
