import { InboxForm } from "@/components/student-auth/EntryForms";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "Forgot password | Barhoum" };

export default function ForgotPasswordPage() {
  return <StudentShell title="Forgot your password?" intro="Use your verified email to reset your password or set one if you usually sign in with Google."><InboxForm mode="forgot-password" /></StudentShell>;
}
