import { resolveLocale } from "@/lib/i18n.server";
import { studentCopy } from "@/lib/student-copy";
import { LoginForm } from "@/components/student-auth/EntryForms";
import { safeReturnTo } from "@/components/student-auth/api";
import { StudentShell } from "@/components/student-auth/ui";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: studentCopy[locale].pages.login.title + " | Barhoum" };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; status?: string }> }) {
  const { returnTo, status } = await searchParams;
  const locale = await resolveLocale();
  const copy = studentCopy[locale].pages.login;
  return <StudentShell locale={locale} title={copy.title} intro={copy.intro}><LoginForm returnTo={safeReturnTo(returnTo)} status={status} /></StudentShell>;
}
