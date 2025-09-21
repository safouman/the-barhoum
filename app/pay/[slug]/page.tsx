import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaymentView } from "@/components/PaymentView";
import { getPayments, getUiStrings } from "@/lib/content";
import { getPayMetadata } from "@/lib/seo";

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

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  const payments = await getPayments();
  const payment = payments.find((item) => item.slug === params.slug);

  if (!payment) {
    return getPayMetadata();
  }

  const amountLabel = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: payment.amount.currency,
  }).format(payment.amount.amount);

  return getPayMetadata({
    slug: payment.slug,
    clientName: payment.client.en,
    packageTitle: payment.packageTitle.en,
    amountLabel,
  });
}
