"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/providers/locale-provider";
import { studentCopy } from "@/lib/student-copy";
import { authError, loginHref } from "./api";
import { InboxForm } from "./EntryForms";
import { Field, Notice, Panel, studentLink, Submit } from "./ui";
import { fieldText, useSubmission } from "./use-submission";

export function TokenForm({ mode, google = false, checkInbox = false, returnTo }: { mode: "verify" | "reset-password" | "email-change/confirm"; google?: boolean; checkInbox?: boolean; returnTo?: string }) {
  const { locale } = useLocale();
  const text = studentCopy[locale];
  const tokenCopy = {
    verify: { button: text.finishRegistration, done: text.verified, retry: "/verify-email", retryLabel: text.requestVerification },
    "reset-password": { button: text.savePassword, done: text.passwordSaved, retry: "/forgot-password", retryLabel: text.requestReset },
    "email-change/confirm": { button: text.confirmEmail, done: text.emailSaved, retry: "/account", retryLabel: text.returnAccount },
  };
  const submission = useSubmission();
  const [complete, setComplete] = useState(false);
  const [token, setToken] = useState<string | null>();
  const copy = tokenCopy[mode];

  useEffect(() => {
    let canceled = false;
    function readFragment() {
      const current = new URL(window.location.href);
      const tokens = new URLSearchParams(current.hash.slice(1)).getAll("token");
      if (tokens.length) {
        setComplete(false);
        window.history.replaceState(window.history.state, "", current.pathname + current.search);
      }
      setToken(tokens.length === 1 && tokens[0] ? tokens[0] : null);
    }
    queueMicrotask(() => { if (!canceled) readFragment(); });
    window.addEventListener("hashchange", readFragment);
    return () => {
      canceled = true;
      window.removeEventListener("hashchange", readFragment);
    };
  }, []);

  if (!complete && mode === "verify" && token === null) {
    return (
      <div className="space-y-5">
        {checkInbox ? <Notice>{text.checkInbox}</Notice> : null}
        <InboxForm mode="resend-verification" returnTo={returnTo} />
      </div>
    );
  }

  return (
    <Panel>
      {complete ? (
        <>
          <Notice>{copy.done}</Notice>
          <p><Link href={returnTo ? loginHref(returnTo) : "/login"} className={studentLink}>{text.signIn}</Link></p>
        </>
      ) : token === undefined ? (
        <p role="status" className="text-sm text-subtle">{text.checkingLink}</p>
      ) : token ? (
        <>
          <form
            method="post"
            className="space-y-5"
            aria-busy={submission.busy}
            onSubmit={submission.handler(mode, (data) => {
              const body: Record<string, string> = { token };
              if (mode === "verify") body.name = fieldText(data, "name").trim();
              if (mode === "reset-password" || (mode === "verify" && !google)) body.password = fieldText(data, "password");
              return body;
            }, () => { setComplete(true); setToken(null); })}
          >
            {mode === "verify" ? <Field id="verify-name" name="name" label={text.fullName} dir="auto" autoComplete="name" required maxLength={120} /> : null}
            {mode === "reset-password" || (mode === "verify" && !google) ? (
              <Field id="new-password" name="password" type="password" label={text.newPassword} dir="ltr" autoComplete="new-password" required minLength={12} maxLength={128} hint={text.passwordHint} />
            ) : null}
            {submission.error ? <Notice error>{authError(submission.error, locale)}</Notice> : null}
            <Submit busy={submission.busy} busyLabel={text.busy}>{copy.button}</Submit>
          </form>
          {submission.error === "INVALID_TOKEN" ? (
            <p>
              {mode === "verify" ? (
                <button type="button" className={studentLink} onClick={() => setToken(null)}>{copy.retryLabel}</button>
              ) : (
                <Link href={copy.retry} className={studentLink}>{copy.retryLabel}</Link>
              )}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <Notice error>{authError("INVALID_TOKEN", locale)}</Notice>
          <p><Link href={copy.retry} className={studentLink}>{copy.retryLabel}</Link></p>
        </>
      )}
    </Panel>
  );
}
