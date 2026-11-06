"use client";

import Link from "next/link";
import { useState } from "react";
import { authError, googleHref } from "./api";
import { Field, GoogleLink, Notice, Panel, studentLink, Submit } from "./ui";
import { fieldText, useSubmission } from "./use-submission";

const loginStatuses: Record<string, string> = {
  "google-canceled": "Google sign-in was canceled. You can try again or use your password.",
  "google-failed": "Google sign-in didn’t finish. Try again or use your password.",
  "google-link-required": "To connect Google, sign in to your existing account first, then link Google in Account.",
  "google-linked": "Google is linked. Sign in again to continue.",
  "reauth-required": "Sign in again to confirm your identity.",
};

export function LoginForm({ returnTo, status }: { returnTo: string; status?: string }) {
  const submission = useSubmission();
  const statusMessage = status && Object.hasOwn(loginStatuses, status) ? loginStatuses[status] : undefined;
  return (
    <Panel>
      {statusMessage ? <Notice>{statusMessage}</Notice> : null}
      <form
        method="post"
        className="space-y-4"
        aria-busy={submission.busy}
        onSubmit={submission.handler("login", (data) => ({
          email: fieldText(data, "email").trim(),
          password: fieldText(data, "password"),
        }), () => window.location.replace(returnTo))}
      >
        <Field id="login-email" name="email" type="email" label="Email address" autoComplete="username" required maxLength={254} />
        <Field id="login-password" name="password" type="password" label="Password" autoComplete="current-password" required />
        <p className="text-sm"><Link href="/forgot-password" className={studentLink}>Forgot your password?</Link></p>
        {submission.error ? <Notice error>{authError(submission.error)}</Notice> : null}
        <Submit busy={submission.busy}>Sign in</Submit>
      </form>
      <p className="text-center text-sm text-subtle">or</p>
      <GoogleLink href={googleHref("login", returnTo)}>Continue with Google</GoogleLink>
      <p className="text-sm text-subtle">New to Barhoum Learning? <Link href="/register" className={studentLink}>Create an account</Link></p>
    </Panel>
  );
}

const inboxCopy = {
  register: {
    button: "Send verification email",
    success: "If this email can be used to register, we’ll send a verification link. Check your inbox and spam folder.",
  },
  "resend-verification": {
    button: "Resend verification email",
    success: "If a verification link can be sent to this email, it will arrive shortly. Check your inbox and spam folder.",
  },
  "forgot-password": {
    button: "Send reset link",
    success: "If a reset link can be sent to this email, it will arrive shortly. Check your inbox and spam folder.",
  },
} as const;

export function InboxForm({ mode }: { mode: keyof typeof inboxCopy }) {
  const submission = useSubmission();
  const [sent, setSent] = useState(false);
  const copy = inboxCopy[mode];

  return (
    <Panel>
      {sent ? <Notice>{copy.success}</Notice> : null}
      <form
        method="post"
        className="space-y-4"
        aria-busy={submission.busy}
        onSubmit={submission.handler(mode, (data) => {
          setSent(false);
          return { email: fieldText(data, "email").trim() };
        }, () => setSent(true))}
      >
        <Field id="inbox-email" name="email" type="email" label="Email address" autoComplete="email" required maxLength={254} />
        {submission.error ? <Notice error>{authError(submission.error)}</Notice> : null}
        <Submit busy={submission.busy}>{copy.button}</Submit>
      </form>
      {mode === "register" ? (
        <>
          <p className="text-center text-sm text-subtle">or</p>
          <GoogleLink href={googleHref("login", "/my-learning")}>Continue with Google</GoogleLink>
          <p className="text-sm text-subtle">No email yet? <Link href="/verify-email" className={studentLink}>Request another verification link</Link></p>
        </>
      ) : null}
      <p className="text-sm"><Link href="/login" className={studentLink}>Back to sign in</Link></p>
    </Panel>
  );
}
