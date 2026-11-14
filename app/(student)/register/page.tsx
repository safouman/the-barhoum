import { resolveLocale } from "@/lib/i18n.server";
import { studentCopy } from "@/lib/student-copy";
import { safeReturnTo } from "@/lib/student-auth/return-to";
import { InboxForm } from "@/components/student-auth/EntryForms";
import { StudentShell } from "@/components/student-auth/ui";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: studentCopy[locale].pages.register.title + " | Barhoum" };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const locale = await resolveLocale();
  const copy = studentCopy[locale].pages.register;
  return <StudentShell locale={locale} title={copy.title} intro={copy.intro}><InboxForm mode="register" returnTo={safeReturnTo(returnTo)} /></StudentShell>;
}
