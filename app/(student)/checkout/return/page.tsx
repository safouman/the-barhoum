import Link from "next/link";
import { CheckoutReturn } from "@/components/commerce/CheckoutReturn";
import { isOrderId } from "@/components/commerce/checkout";
import { Notice, Panel, StudentShell, studentLink } from "@/components/student-auth/ui";

export const metadata = { title: "Order status | Barhoum" };

export default async function CheckoutReturnPage({ searchParams }: { searchParams: Promise<{ orderId?: string | string[] }> }) {
  const { orderId } = await searchParams;
  return (
    <StudentShell title="Order status">
      {isOrderId(orderId) ? <CheckoutReturn key={orderId} orderId={orderId} /> : (
        <Panel>
          <Notice error>This order link is missing or invalid.</Notice>
          <Link href="/my-learning" className={studentLink}>Go to My Learning</Link>
        </Panel>
      )}
    </StudentShell>
  );
}
