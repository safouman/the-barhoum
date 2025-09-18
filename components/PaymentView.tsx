"use client";

import { useEffect } from "react";
import type { Locale, Payment, UIStrings } from "@/lib/content";
import { useLocale } from "@/providers/locale-provider";
import { event } from "@/lib/analytics";

interface PaymentViewProps {
  payment: Payment;
  ui: Record<Locale, UIStrings>;
}

function fmtAmount(payment: Payment["amount"], locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: payment.currency,
  }).format(payment.amount);
}

export function PaymentView({ payment, ui }: PaymentViewProps) {
  const { locale } = useLocale();
  const strings = ui[locale];

  useEffect(() => {
    event("pay_page_view", { slug: payment.slug });
  }, [payment.slug]);

  return (
    <div className="py-[clamp(var(--space-lg),18vh,var(--space-xl))]">
      <div className="mx-auto grid max-w-lg gap-sm rounded-lg border border-border bg-surface p-md shadow-sm">
        <h1 className="text-2xl font-heading">{strings.payment.title}</h1>
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-subtle">{strings.payment.client}</span>
          <span>{payment.client[locale]}</span>
        </div>
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-subtle">{strings.payment.price}</span>
          <span>{payment.packageTitle[locale]}</span>
        </div>
        <div className="flex justify-between gap-4 text-lg font-bold">
          <span className="text-subtle">{strings.payment.amount}</span>
          <span className="font-heading">{fmtAmount(payment.amount, locale)}</span>
        </div>
        {typeof payment.discount === "number" && (
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-subtle">{strings.payment.discount}</span>
            <span>{payment.discount}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
