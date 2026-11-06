import { StudentAccount } from "@/components/student-auth/StudentAccount";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "Account | Barhoum" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return <StudentShell title="Account" intro="Manage your profile and how you sign in." wide><StudentAccount status={status} /></StudentShell>;
}
