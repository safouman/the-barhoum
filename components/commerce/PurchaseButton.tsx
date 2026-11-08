"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Notice, studentLink } from "@/components/student-auth/ui";
import { event } from "@/lib/analytics";
import { stripeCheckoutHref } from "./checkout";

const englishErrors: Record<string, string> = {
  ALREADY_OWNED: "You already have access. Reload the course to continue learning.",
  BASE_REQUIRED: "You need access to the base course before buying this module.",
  GEOGRAPHIC_RESTRICTION: "Course purchases are coming soon in your location.",
  OFFER_UNAVAILABLE: "This offer is currently unavailable. Reload the course for the latest options.",
  UNAUTHENTICATED: "Sign in to continue to checkout.",
};

const arabicErrors: Record<string, string> = {
  ALREADY_OWNED: "الدورة متاحة لك بالفعل. حدّث الصفحة لمتابعة التعلّم.",
  BASE_REQUIRED: "اشترك في الدورة أولًا لشراء هذه الوحدة.",
  GEOGRAPHIC_RESTRICTION: "شراء الدورات سيتاح قريبًا في منطقتك.",
  OFFER_UNAVAILABLE: "هذا العرض غير متاح حاليًا. حدّث الصفحة لمعرفة الخيارات المتاحة.",
  UNAUTHENTICATED: "سجّل الدخول لإتمام الشراء.",
};

const purchaseCopy = {
  en: { errors: englishErrors, signIn: "Sign in", signInToBuy: "Sign in to purchase", busy: "Opening secure checkout…", failed: "Checkout couldn’t open. Try again in a moment.", reload: "Reload course" },
  ar: { errors: arabicErrors, signIn: "دخول / تسجيل", signInToBuy: "سجّل الدخول للشراء", busy: "جارٍ فتح صفحة الدفع…", failed: "تعذّر فتح صفحة الدفع. حاول مرة أخرى بعد قليل.", reload: "تحديث صفحة الدورة" },
};

export function PurchaseButton({
  offerId, signedIn, signInHref, courseHref, children, locale = "ar", courseKey, offerCategory = "base",
}: {
  offerId: number;
  signedIn: boolean;
  signInHref: string;
  courseHref: string;
  children: React.ReactNode;
  locale?: keyof typeof purchaseCopy;
  courseKey?: string;
  offerCategory?: "base" | "premium_module";
}) {
  const copy = purchaseCopy[locale];
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function beginCheckout() {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/course-commerce/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      const data = await response.json();
      const checkout = response.ok ? stripeCheckoutHref(data?.checkoutUrl) : undefined;
      if (checkout) {
        if (courseKey) event("course_checkout_started", { course_key: courseKey, offer_category: offerCategory, locale });
        window.location.assign(checkout);
        return;
      }
      const code = response.status === 401 ? "UNAUTHENTICATED" : data?.error?.code;
      setError(typeof code === "string" ? code : "UNAVAILABLE");
    } catch {
      setError("UNAVAILABLE");
    }
    active.current = false;
    setBusy(false);
  }

  if (!signedIn) {
    return <Button href={signInHref} className="!text-[#14312e] max-sm:w-full">{copy.signInToBuy}</Button>;
  }

  return (
    <div className="space-y-3" aria-busy={busy}>
      <Button onClick={beginCheckout} disabled={busy} className="!text-[#14312e] max-sm:w-full disabled:opacity-60">
        {busy ? copy.busy : children}
      </Button>
      {error ? (
        <>
          <Notice error>{Object.hasOwn(copy.errors, error) ? copy.errors[error] : copy.failed}</Notice>
          {error === "UNAUTHENTICATED" ? <Link href={signInHref} className={studentLink}>{copy.signIn}</Link> : null}
          {error === "ALREADY_OWNED" || error === "BASE_REQUIRED" || error === "OFFER_UNAVAILABLE" ? (
            <Link href={courseHref} className={studentLink} onClick={(event) => { event.preventDefault(); window.location.assign(courseHref); }}>{copy.reload}</Link>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
