import { LoginForm } from "@/components/student-auth/EntryForms";
import { safeReturnTo } from "@/components/student-auth/api";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "Sign in | Barhoum" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; status?: string }> }) {
  const { returnTo, status } = await searchParams;
  return <StudentShell title="Sign in" intro="Access your Barhoum student account."><LoginForm returnTo={safeReturnTo(returnTo)} status={status} /></StudentShell>;
}
