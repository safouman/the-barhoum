import { TokenForm } from "@/components/student-auth/TokenForm";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "Set a new password | Barhoum" };

export default function ResetPasswordPage() {
  return <StudentShell title="Set a new password" intro="Updating your password signs you out on all devices."><TokenForm mode="reset-password" /></StudentShell>;
}
