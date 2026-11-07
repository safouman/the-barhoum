import { safeReturnTo } from "@/lib/student-auth/return-to";
import { InboxForm } from "@/components/student-auth/EntryForms";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "Create an account | Barhoum" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <StudentShell title="Create an account" intro="Start with your email. You’ll choose a password after verifying your inbox."><InboxForm mode="register" returnTo={safeReturnTo(returnTo)} /></StudentShell>;
}
