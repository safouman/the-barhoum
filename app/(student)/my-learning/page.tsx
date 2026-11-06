import { StudentAccount } from "@/components/student-auth/StudentAccount";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "My Learning | Barhoum" };

export default function MyLearningPage() {
  return <StudentShell title="My Learning" wide><StudentAccount learning /></StudentShell>;
}
