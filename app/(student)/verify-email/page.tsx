import { safeReturnTo } from "@/lib/student-auth/return-to";
import { TokenForm } from "@/components/student-auth/TokenForm";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "Verify your email | Barhoum" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ method?: string; status?: string; returnTo?: string }> }) {
  const { method, status, returnTo } = await searchParams;
  return (
    <StudentShell title="Verify your email" intro="Verify that you own this address to finish setting up your student account.">
      <TokenForm mode="verify" returnTo={safeReturnTo(returnTo)} google={method === "google"} checkInbox={status === "check-inbox"} />
    </StudentShell>
  );
}
