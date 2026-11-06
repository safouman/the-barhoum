"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authError } from "./api";
import { InboxForm } from "./EntryForms";
import { Field, Notice, Panel, studentLink, Submit } from "./ui";
import { fieldText, useSubmission } from "./use-submission";

const tokenCopy = {
  verify: {
    button: "Finish registration",
    done: "Your email is verified. Sign in to access your student account.",
    retry: "/verify-email",
    retryLabel: "Request another verification link",
  },
  "reset-password": {
    button: "Save new password",
    done: "Your password was updated and your other sessions were signed out. Sign in with your new password.",
    retry: "/forgot-password",
    retryLabel: "Request a new reset link",
  },
  "email-change/confirm": {
    button: "Confirm new email",
    done: "Your email was updated and your other sessions were signed out. Sign in using your new email address.",
    retry: "/account",
    retryLabel: "Return to Account",
  },
} as const;

export function TokenForm({ mode, google = false, checkInbox = false }: { mode: keyof typeof tokenCopy; google?: boolean; checkInbox?: boolean }) {
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
      <div className="space-y-4">
        {checkInbox ? <Notice>Check your inbox for the link to finish registration.</Notice> : null}
        <InboxForm mode="resend-verification" />
      </div>
    );
  }

  return (
    <Panel>
      {complete ? (
        <>
          <Notice>{copy.done}</Notice>
          <p><Link href="/login" className={studentLink}>Sign in</Link></p>
        </>
      ) : token === undefined ? (
        <p role="status" className="text-sm text-subtle">Checking the link…</p>
      ) : token ? (
        <>
          <form
            method="post"
            className="space-y-4"
            aria-busy={submission.busy}
            onSubmit={submission.handler(mode, (data) => {
              const body: Record<string, string> = { token };
              if (mode === "verify") body.name = fieldText(data, "name").trim();
              if (mode === "reset-password" || (mode === "verify" && !google)) body.password = fieldText(data, "password");
              return body;
            }, () => { setComplete(true); setToken(null); })}
          >
            {mode === "verify" ? <Field id="verify-name" name="name" label="Full name" autoComplete="name" required maxLength={120} /> : null}
            {mode === "reset-password" || (mode === "verify" && !google) ? (
              <Field id="new-password" name="password" type="password" label="New password" autoComplete="new-password" required minLength={12} maxLength={128} hint="Use at least 12 characters." />
            ) : null}
            {submission.error ? <Notice error>{authError(submission.error)}</Notice> : null}
            <Submit busy={submission.busy}>{copy.button}</Submit>
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
          <Notice error>{authError("INVALID_TOKEN")}</Notice>
          <p><Link href={copy.retry} className={studentLink}>{copy.retryLabel}</Link></p>
        </>
      )}
    </Panel>
  );
}
