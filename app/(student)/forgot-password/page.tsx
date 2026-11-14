import { resolveLocale } from "@/lib/i18n.server";
import { studentCopy } from "@/lib/student-copy";
import { InboxForm } from "@/components/student-auth/EntryForms";
import { StudentShell } from "@/components/student-auth/ui";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: studentCopy[locale].pages.forgot.title + " | Barhoum" };
}

export default async function ForgotPasswordPage() {
  const locale = await resolveLocale();
  const copy = studentCopy[locale].pages.forgot;
  return <StudentShell locale={locale} title={copy.title} intro={copy.intro}><InboxForm mode="forgot-password" /></StudentShell>;
}
