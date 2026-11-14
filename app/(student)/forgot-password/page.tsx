import { AuthCourseContext } from "@/components/student-auth/AuthCourseContext";
import { safeReturnTo } from "@/lib/student-auth/return-to";
import { resolveLocale } from "@/lib/i18n.server";
import { studentCopy } from "@/lib/student-copy";
import { InboxForm } from "@/components/student-auth/EntryForms";
import { StudentShell } from "@/components/student-auth/ui";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: studentCopy[locale].pages.forgot.title + " | Barhoum" };
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const destination = safeReturnTo(returnTo);
  const locale = await resolveLocale();
  const copy = studentCopy[locale].pages.forgot;
  return <StudentShell editorial context={destination.startsWith("/courses/") ? <AuthCourseContext returnTo={destination} locale={locale} /> : undefined} locale={locale} title={copy.title} intro={copy.intro}><InboxForm mode="forgot-password" returnTo={destination} /></StudentShell>;
}
