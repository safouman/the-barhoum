import { AuthCourseContext } from "@/components/student-auth/AuthCourseContext";
import { safeReturnTo } from "@/lib/student-auth/return-to";
import { resolveLocale } from "@/lib/i18n.server";
import { studentCopy } from "@/lib/student-copy";
import { TokenForm } from "@/components/student-auth/TokenForm";
import { StudentShell } from "@/components/student-auth/ui";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: studentCopy[locale].pages.reset.title + " | Barhoum" };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const destination = safeReturnTo(returnTo);
  const locale = await resolveLocale();
  const copy = studentCopy[locale].pages.reset;
  return <StudentShell editorial context={destination.startsWith("/courses/") ? <AuthCourseContext returnTo={destination} locale={locale} /> : undefined} locale={locale} title={copy.title} intro={copy.intro}><TokenForm mode="reset-password" returnTo={destination} /></StudentShell>;
}
