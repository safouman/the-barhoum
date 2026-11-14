"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/providers/locale-provider";
import { studentCopy } from "@/lib/student-copy";
import { authError, googleHref, loginHref } from "./api";
import { Field, GoogleLink, Notice, Panel, studentLink, Submit } from "./ui";
import { fieldText, useSubmission } from "./use-submission";

export function LoginForm({ returnTo, status }: { returnTo: string; status?: string }) {
  const { locale } = useLocale();
  const copy = studentCopy[locale];
  const submission = useSubmission();
  const statusMessage = status && Object.hasOwn(copy.statuses, status) ? copy.statuses[status] : undefined;
  return (
    <Panel>
      {statusMessage ? <Notice>{statusMessage}</Notice> : null}
      <form
        method="post"
        className="space-y-5"
        aria-busy={submission.busy}
        onSubmit={submission.handler("login", (data) => ({
          email: fieldText(data, "email").trim(),
          password: fieldText(data, "password"),
        }), () => window.location.replace(returnTo))}
      >
        <Field id="login-email" name="email" type="email" label={copy.email} dir="ltr" autoComplete="username" required maxLength={254} />
        <Field id="login-password" name="password" type="password" label={copy.password} dir="ltr" autoComplete="current-password" required />
        <p className="text-sm"><Link href="/forgot-password" className={studentLink}>{copy.forgotPassword}</Link></p>
        {submission.error ? <Notice error>{authError(submission.error, locale)}</Notice> : null}
        <Submit busy={submission.busy} busyLabel={copy.busy}>{copy.signIn}</Submit>
      </form>
      <p className="text-center text-sm text-subtle">{copy.or}</p>
      <GoogleLink href={googleHref("login", returnTo)}>{copy.google}</GoogleLink>
      <p className="text-sm text-subtle">{copy.noAccount} <Link href={`/register?${new URLSearchParams({ returnTo })}`} className={studentLink}>{copy.createAccount}</Link></p>
    </Panel>
  );
}

type InboxMode = "register" | "resend-verification" | "forgot-password";

export function InboxForm({ mode, returnTo }: { mode: InboxMode; returnTo?: string }) {
  const { locale } = useLocale();
  const copy = studentCopy[locale];
  const submission = useSubmission();
  const [sent, setSent] = useState(false);
  const isReset = mode === "forgot-password";

  return (
    <Panel>
      {sent ? <Notice>{isReset ? copy.resetSent : copy.verificationSent}</Notice> : null}
      <form
        method="post"
        className="space-y-5"
        aria-busy={submission.busy}
        onSubmit={submission.handler(mode, (data) => {
          setSent(false);
          return { email: fieldText(data, "email").trim(), ...(returnTo && returnTo !== "/my-learning" && mode !== "forgot-password" ? { returnTo } : {}) };
        }, () => setSent(true))}
      >
        <Field id="inbox-email" name="email" type="email" label={copy.email} dir="ltr" autoComplete="email" required maxLength={254} />
        {submission.error ? <Notice error>{authError(submission.error, locale)}</Notice> : null}
        <Submit busy={submission.busy} busyLabel={copy.busy}>{isReset ? copy.sendReset : copy.sendVerification}</Submit>
      </form>
      {mode === "register" ? (
        <>
          <p className="text-center text-sm text-subtle">{copy.or}</p>
          <GoogleLink href={googleHref("login", returnTo ?? "/my-learning")}>{copy.google}</GoogleLink>
          <p className="text-sm text-subtle">{copy.noEmail} <Link href={returnTo ? `/verify-email?${new URLSearchParams({ returnTo })}` : "/verify-email"} className={studentLink}>{copy.requestVerification}</Link></p>
        </>
      ) : null}
      <p className="text-sm"><Link href={returnTo ? loginHref(returnTo) : "/login"} className={studentLink}>{copy.backToSignIn}</Link></p>
    </Panel>
  );
}
