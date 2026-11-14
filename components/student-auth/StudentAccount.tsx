"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/providers/locale-provider";
import { studentCopy } from "@/lib/student-copy";
import { Button } from "@/components/Button";
import { authError, authRequest, googleHref, loginHref, type AuthResult, type Student } from "./api";
import { Field, fieldClass, GoogleLink, Notice, Panel, studentLink, Submit } from "./ui";
import { fieldText, useSubmission } from "./use-submission";
import { SignOut } from "./SignOut";

const ageRanges = [
  ["under-18", ""], ["18-24", "18–24"], ["25-34", "25–34"],
  ["35-44", "35–44"], ["45-54", "45–54"], ["55-64", "55–64"], ["65+", "65+"],
];

export function StudentAccount({ status }: { status?: string }) {
  const { locale } = useLocale();
  const copy = studentCopy[locale];
  const [session, setSession] = useState<AuthResult<{ student: Student }> | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void authRequest<{ student: Student }>("me", { signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setSession(result);
    });
    return () => controller.abort();
  }, [retry]);

  if (!session) return <Panel><p role="status" className="text-subtle">{copy.loadingAccount}</p></Panel>;
  if (!session.ok) {
    return (
      <Panel>
        <Notice error>{session.code === "UNAUTHENTICATED" ? copy.signInAccount : authError(session.code, locale)}</Notice>
        {session.code === "UNAUTHENTICATED" ? (
          <Button href={loginHref("/account")} className="!rounded-full !bg-[var(--brand-primary)] !normal-case !tracking-normal !text-[var(--brand-background)]">{copy.signIn}</Button>
        ) : (
          <Button onClick={() => { setSession(null); setRetry((attempt) => attempt + 1); }} className="!rounded-full !bg-[var(--brand-primary)] !normal-case !tracking-normal !text-[var(--brand-background)]">{copy.retry}</Button>
        )}
      </Panel>
    );
  }

  const { student } = session.data;
  return (
    <div className="space-y-5">
      <ProfileForm student={student} onSave={(updated) => setSession({ ok: true, data: { student: updated } })} />
      <EmailChangeForm student={student} />
      <LoginMethods student={student} status={status} />
      <SignOut locale={locale} />
    </div>
  );
}

function ProfileForm({ student, onSave }: { student: Student; onSave: (updated: Student) => void }) {
  const { locale } = useLocale();
  const copy = studentCopy[locale];
  const submission = useSubmission();
  const [saved, setSaved] = useState(false);
  const initials = student.name.trim().split(/\s+/u).slice(0, 2).map((name) => Array.from(name)[0]).join("").toLocaleUpperCase();

  return (
    <Panel>
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--brand-surface)] font-semibold text-[var(--brand-primary)]">{initials}</span>
        <div className="min-w-0">
          <h2 className="text-2xl">{copy.profile}</h2>
          <p dir="ltr" className="break-all text-sm text-subtle">{student.email}</p>
        </div>
      </div>
      <form
        method="post"
        className="space-y-4"
        aria-busy={submission.busy}
        onSubmit={submission.handler<{ student: Student }>("profile", (data) => {
          setSaved(false);
          return {
            name: fieldText(data, "name").trim(),
            city: fieldText(data, "city").trim() || null,
            ageRange: fieldText(data, "ageRange") || null,
          };
        }, ({ student: updated }) => { onSave(updated); setSaved(true); }, "PATCH")}
      >
        <Field id="profile-name" name="name" label={copy.fullName} dir="auto" autoComplete="name" defaultValue={student.name} required maxLength={120} />
        <Field id="profile-city" name="city" label={copy.city} dir="auto" autoComplete="address-level2" defaultValue={student.city ?? ""} maxLength={120} />
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold" htmlFor="profile-age">{copy.age}</label>
          <select id="profile-age" name="ageRange" className={fieldClass} defaultValue={student.ageRange ?? ""}>
            <option value="">{copy.preferNotSay}</option>
            {ageRanges.map(([value, label]) => <option key={value} value={value} dir={value === "under-18" ? undefined : "ltr"}>{value === "under-18" ? copy.under18 : label}</option>)}
          </select>
        </div>
        {submission.error ? <Notice error>{authError(submission.error, locale)}</Notice> : null}
        {saved ? <Notice>{copy.profileSaved}</Notice> : null}
        <Submit busy={submission.busy} busyLabel={copy.busy}>{copy.saveProfile}</Submit>
      </form>
    </Panel>
  );
}

function EmailChangeForm({ student }: { student: Student }) {
  const { locale } = useLocale();
  const copy = studentCopy[locale];
  const submission = useSubmission();
  const [sent, setSent] = useState(false);
  return (
    <Panel>
      <h2 className="text-2xl">{copy.changeEmail}</h2>
      <p className="text-sm text-subtle">{copy.changeEmailIntro}</p>
      <form
        method="post"
        className="space-y-4"
        aria-busy={submission.busy}
        onSubmit={submission.handler("email-change", (data) => {
          setSent(false);
          return { email: fieldText(data, "email").trim() };
        }, () => setSent(true))}
      >
        <Field id="change-email" name="email" type="email" label={copy.newEmail} dir="ltr" autoComplete="email" required maxLength={254} />
        {submission.error ? <Notice error>{authError(submission.error, locale)}</Notice> : null}
        {sent ? <Notice>{copy.changeEmailSent}</Notice> : null}
        <Submit busy={submission.busy} busyLabel={copy.busy}>{copy.sendConfirmation}</Submit>
      </form>
      {submission.error === "REAUTH_REQUIRED" ? <Reauthenticate student={student} /> : null}
      {submission.error === "UNAUTHENTICATED" ? <Link href={loginHref("/account")} className={studentLink}>{copy.signIn}</Link> : null}
    </Panel>
  );
}

function Reauthenticate({ student }: { student: Student }) {
  const { locale } = useLocale();
  const copy = studentCopy[locale];
  return (
    <div className="space-y-3 text-sm">
      <p className="text-subtle">{copy.reauthIntro}</p>
      {student.hasPassword ? <Link href={loginHref("/account")} className={studentLink}>{copy.reauthPassword}</Link> : null}
      {student.hasGoogle ? <GoogleLink href={googleHref("reauth", "/account")}>{copy.google}</GoogleLink> : null}
    </div>
  );
}

function LoginMethods({ student, status }: { student: Student; status?: string }) {
  const { locale } = useLocale();
  const copy = studentCopy[locale];
  return (
    <Panel>
      <h2 className="text-2xl">{copy.methods}</h2>
      {status === "reauth-required" ? (
        <>
          <Notice error>{authError("REAUTH_REQUIRED", locale)}</Notice>
          <Reauthenticate student={student} />
        </>
      ) : null}
      {status === "google-canceled" || status === "google-failed" ? (
        <Notice error>{copy.statuses[status]}</Notice>
      ) : null}
      <p className="text-sm text-subtle">{student.hasPassword ? copy.passwordSet : copy.passwordUnset}</p>
      <Link href="/forgot-password" className={studentLink}>{student.hasPassword ? copy.resetPassword : copy.setPassword}</Link>
      {student.hasGoogle ? (
        <p className="text-sm text-subtle">{copy.googleLinked}</p>
      ) : (
        <GoogleLink href={googleHref("link", "/account")}>{copy.linkGoogle}</GoogleLink>
      )}
    </Panel>
  );
}
