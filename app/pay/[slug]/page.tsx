import { notFound } from "next/navigation";
import { PaymentView } from "@/components/PaymentView";
import { getPayments, getUiStrings } from "@/lib/content";

interface PayPageProps {
  params: { slug: string };
}

export default async function PayPage({ params }: PayPageProps) {
  const [payments, uiAr, uiEn] = await Promise.all([getPayments(), getUiStrings("ar"), getUiStrings("en")]);
  const payment = payments.find((item) => item.slug === params.slug);

  if (!payment) {
    notFound();
  }

  return <PaymentView payment={payment} ui={{ ar: uiAr, en: uiEn }} />;
}

export async function generateStaticParams() {
  const payments = await getPayments();
  return payments.map((payment) => ({ slug: payment.slug }));
}
