import { TokenForm } from "@/components/student-auth/TokenForm";
import { StudentShell } from "@/components/student-auth/ui";

export const metadata = { title: "Verify your email | Barhoum" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ method?: string; status?: string }> }) {
  const { method, status } = await searchParams;
  return (
    <StudentShell title="Verify your email" intro="Verify that you own this address to finish setting up your student account.">
      <TokenForm mode="verify" google={method === "google"} checkInbox={status === "check-inbox"} />
    </StudentShell>
  );
}
