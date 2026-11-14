import { resolveLocale } from "@/lib/i18n.server";
import { studentCopy } from "@/lib/student-copy";
import { TokenForm } from "@/components/student-auth/TokenForm";
import { StudentShell } from "@/components/student-auth/ui";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: studentCopy[locale].pages.confirm.title + " | Barhoum" };
}

export default async function ConfirmEmailPage() {
  const locale = await resolveLocale();
  const copy = studentCopy[locale].pages.confirm;
  return <StudentShell locale={locale} title={copy.title} intro={copy.intro}><TokenForm mode="email-change/confirm" /></StudentShell>;
}
