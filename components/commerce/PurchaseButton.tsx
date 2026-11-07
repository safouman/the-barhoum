"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Notice, studentLink } from "@/components/student-auth/ui";
import { stripeCheckoutHref } from "./checkout";

const errorMessages: Record<string, string> = {
  ALREADY_OWNED: "You already have access. Reload the course to continue learning.",
  BASE_REQUIRED: "You need access to the base course before buying this module.",
  GEOGRAPHIC_RESTRICTION: "Course purchases are coming soon in your location.",
  OFFER_UNAVAILABLE: "This offer is currently unavailable. Reload the course for the latest options.",
  UNAUTHENTICATED: "Sign in to continue to checkout.",
};

export function PurchaseButton({
  offerId, signedIn, signInHref, courseHref, children,
}: {
  offerId: number;
  signedIn: boolean;
  signInHref: string;
  courseHref: string;
  children: React.ReactNode;
}) {
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
    return <Button href={signInHref} className="!text-[#14312e] max-sm:w-full">Sign in to purchase</Button>;
  }

  return (
    <div className="space-y-3" aria-busy={busy}>
      <Button onClick={beginCheckout} disabled={busy} className="!text-[#14312e] max-sm:w-full disabled:opacity-60">
        {busy ? "Opening secure checkout…" : children}
      </Button>
      {error ? (
        <>
          <Notice error>{Object.hasOwn(errorMessages, error) ? errorMessages[error] : "Checkout couldn’t open. Try again in a moment."}</Notice>
          {error === "UNAUTHENTICATED" ? <Link href={signInHref} className={studentLink}>Sign in</Link> : null}
          {error === "ALREADY_OWNED" || error === "BASE_REQUIRED" || error === "OFFER_UNAVAILABLE" ? (
            <Link href={courseHref} className={studentLink} onClick={(event) => { event.preventDefault(); window.location.assign(courseHref); }}>Reload course</Link>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
