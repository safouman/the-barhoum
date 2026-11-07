"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Notice, Panel, studentLink } from "@/components/student-auth/ui";
import { orderSignInHref } from "./checkout";

const pending = new Set(["creating", "open", "processing"]);
const messages = {
  creating: ["Checking your payment", "We’re waiting for payment confirmation. This page will check again automatically."],
  open: ["Checking your payment", "We’re waiting for payment confirmation. If you completed checkout, give it a moment and check again."],
  processing: ["Payment is processing", "We’re waiting for payment confirmation. Access appears in My Learning once your order is complete."],
  fulfilled: ["Payment confirmed", "You can now start learning."],
  failed: ["Your order didn’t complete", "No access was added for this order. Return to the course to review your options."],
  expired: ["This checkout has expired", "Return to the course to start a new checkout."],
  support_required: ["This order needs review", "Please contact support with the order reference below. Wait for a response before trying to purchase again."],
} as const;

type Status = keyof typeof messages;
type Order = { orderId: string; status: Status; courseSlug: string; courseTitle: string; paymentConfirmed?: boolean };
type Result = { order: Order } | { error: "login" | "missing" | "unavailable" };

const pollInterval = 3_000;
const maxPolls = 6;

function isOrder(value: unknown, orderId: string): value is Order {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<Order>;
  return order.orderId === orderId &&
    typeof order.status === "string" && Object.hasOwn(messages, order.status) &&
    typeof order.courseSlug === "string" && typeof order.courseTitle === "string";
}

export function CheckoutReturn({ orderId }: { orderId: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const orderPath = "/api/course-commerce/orders/" + encodeURIComponent(orderId);

    let paymentConfirmed = false;

    async function readOrder(verify: boolean, pollsLeft: number) {
      let next: Result;
      try {
        const response = await fetch(verify ? orderPath + "/refresh" : orderPath, {
          method: verify ? "POST" : "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) next = { error: "login" };
        else if (response.status === 404) next = { error: "missing" };
        else {
          const data: unknown = response.ok ? await response.json() : null;
          next = isOrder(data, orderId) ? { order: data } : { error: "unavailable" };
        }
      } catch {
        next = { error: "unavailable" };
      }

      if (controller.signal.aborted) return;
      if (verify && "error" in next && next.error === "unavailable") {
        setRefreshing(false);
        await readOrder(false, pollsLeft);
        return;
      }
      if ("order" in next && pending.has(next.order.status)) {
        paymentConfirmed ||= next.order.paymentConfirmed === true;
        next.order = { ...next.order, paymentConfirmed };
      }
      setResult(next);
      if (verify) setRefreshing(false);
      if ("order" in next && pending.has(next.order.status) && pollsLeft > 0) {
        timer = setTimeout(() => void readOrder(false, pollsLeft - 1), pollInterval);
      }
    }

    void readOrder(true, maxPolls);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [orderId, refreshCount]);

  function refresh() {
    setRefreshing(true);
    setRefreshCount((count) => count + 1);
  }

  if (!result) return <Panel><p role="status">Checking your order…</p></Panel>;

  if ("error" in result) {
    return (
      <Panel>
        {result.error === "login" ? (
          <>
            <Notice error>Sign in with the account you used at checkout to view this order.</Notice>
            <Button href={orderSignInHref(orderId)} className="!text-[#14312e]">Sign in</Button>
          </>
        ) : result.error === "missing" ? (
          <>
            <Notice error>We couldn’t find this order for your account.</Notice>
            <Link href="/my-learning" className={studentLink}>Go to My Learning</Link>
          </>
        ) : (
          <>
            <Notice error>We couldn’t check your order right now. Try checking the status again.</Notice>
            <Button onClick={refresh} disabled={refreshing} variant="ghost">{refreshing ? "Checking…" : "Check payment status"}</Button>
            <Link href="/#lead-form" className={studentLink}>Contact support</Link>
          </>
        )}
      </Panel>
    );
  }

  const { order } = result;
  const [heading, description] = messages[order.status];
  const courseHref = /^[a-z0-9-]+$/.test(order.courseSlug) && order.courseSlug.trim() === order.courseSlug
    ? "/courses/" + order.courseSlug : "/courses";
  return (
    <Panel>
      <div className="space-y-2" role="status">
        <h2 className="text-2xl">{order.paymentConfirmed ? "Payment confirmed. We’re setting up your access." : heading}</h2>
        <p className="font-semibold">{order.courseTitle}</p>
        <p className="text-subtle">{order.paymentConfirmed ? "Your course will appear in My Learning when access is ready." : description}</p>
      </div>
      <p className="break-all text-sm text-subtle">Order reference <span className="font-mono">{orderId}</span></p>
      <div className="flex flex-wrap items-center gap-4">
        {pending.has(order.status) ? (
          <Button onClick={refresh} disabled={refreshing} variant="ghost">{refreshing ? "Checking…" : "Check payment status"}</Button>
        ) : order.status === "fulfilled" ? (
          <Button href={courseHref} className="!text-[#14312e]">Start course</Button>
        ) : order.status === "support_required" ? (
          <Link href="/#lead-form" className={studentLink}>Contact support</Link>
        ) : (
          <Button href={courseHref} className="!text-[#14312e]">Return to course</Button>
        )}
        {pending.has(order.status) ? <Link href="/#lead-form" className={studentLink}>Contact support</Link> : null}
        <Link href="/my-learning" className={studentLink}>My Learning</Link>
      </div>
    </Panel>
  );
}
