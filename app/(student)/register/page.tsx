import { safeReturnTo } from "@/lib/student-auth/return-to";
import { InboxForm } from "@/components/student-auth/EntryForms";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "إنشاء حساب | Barhoum" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <StudentShell title="إنشاء حساب" intro="ابدأ ببريدك الإلكتروني. ستختار كلمة مرور بعد التحقق من بريدك."><InboxForm mode="register" returnTo={safeReturnTo(returnTo)} /></StudentShell>;
}
