import { AuthCourseContext } from "@/components/student-auth/AuthCourseContext";
import { resolveLocale } from "@/lib/i18n.server";
import { studentCopy } from "@/lib/student-copy";
import { safeReturnTo } from "@/lib/student-auth/return-to";
import { TokenForm } from "@/components/student-auth/TokenForm";
import { StudentShell } from "@/components/student-auth/ui";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: studentCopy[locale].pages.verify.title + " | Barhoum" };
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ method?: string; status?: string; returnTo?: string }> }) {
  const { method, status, returnTo } = await searchParams;
  const destination = safeReturnTo(returnTo);
  const locale = await resolveLocale();
  const copy = studentCopy[locale].pages.verify;
  return (
    <StudentShell editorial context={destination.startsWith("/courses/") ? <AuthCourseContext returnTo={destination} locale={locale} /> : undefined} locale={locale} title={copy.title} intro={copy.intro}>
      <TokenForm mode="verify" returnTo={destination} google={method === "google"} checkInbox={status === "check-inbox"} />
    </StudentShell>
  );
}
