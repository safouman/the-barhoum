import { resolveLocale } from "@/lib/i18n.server";
import { studentCopy } from "@/lib/student-copy";
import { StudentAccount } from "@/components/student-auth/StudentAccount";
import { StudentShell } from "@/components/student-auth/ui";

export async function generateMetadata() {
  const locale = await resolveLocale();
  return { title: studentCopy[locale].pages.account.title + " | Barhoum" };
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const locale = await resolveLocale();
  const copy = studentCopy[locale].pages.account;
  return <StudentShell locale={locale} title={copy.title} intro={copy.intro} wide><StudentAccount status={status} /></StudentShell>;
}
