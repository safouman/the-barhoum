import { resolveLocale } from "@/lib/i18n.server";
import { studentCopy } from "@/lib/student-copy";
import { TokenForm } from "@/components/student-auth/TokenForm";
import { StudentShell } from "@/components/student-auth/ui";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: studentCopy[locale].pages.reset.title + " | Barhoum" };
}

export default async function ResetPasswordPage() {
  const locale = await resolveLocale();
  const copy = studentCopy[locale].pages.reset;
  return <StudentShell locale={locale} title={copy.title} intro={copy.intro}><TokenForm mode="reset-password" /></StudentShell>;
}
