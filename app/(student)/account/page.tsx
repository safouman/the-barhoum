import { StudentAccount } from "@/components/student-auth/StudentAccount";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "حسابي | Barhoum" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  return <StudentShell title="حسابي" intro="أدر ملفك الشخصي وطرق تسجيل الدخول." wide><StudentAccount status={status} /></StudentShell>;
}
