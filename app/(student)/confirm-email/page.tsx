import { TokenForm } from "@/components/student-auth/TokenForm";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "Confirm your new email | Barhoum" };

export default function ConfirmEmailPage() {
  return <StudentShell title="Confirm your new email" intro="Confirm this change to use your new email address. You’ll need to sign in again."><TokenForm mode="email-change/confirm" /></StudentShell>;
}
