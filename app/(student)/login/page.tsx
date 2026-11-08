import { LoginForm } from "@/components/student-auth/EntryForms";
import { safeReturnTo } from "@/components/student-auth/api";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "تسجيل الدخول | Barhoum" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; status?: string }> }) {
  const { returnTo, status } = await searchParams;
  return <StudentShell title="تسجيل الدخول" intro="ادخل إلى حسابك لمتابعة دوراتك."><LoginForm returnTo={safeReturnTo(returnTo)} status={status} /></StudentShell>;
}
