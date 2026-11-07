"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { CourseCard } from "@/components/learning/CourseCard";
import type { CourseSummary } from "@/lib/learning/contracts";
import { authError, authRequest, googleHref, loginHref, type AuthResult, type Student } from "./api";
import { Field, fieldClass, GoogleLink, Notice, Panel, studentLink, StudentNav, Submit } from "./ui";
import { fieldText, useSubmission } from "./use-submission";

const ageRanges = [
  ["under-18", "Under 18"], ["18-24", "18–24"], ["25-34", "25–34"],
  ["35-44", "35–44"], ["45-54", "45–54"], ["55-64", "55–64"], ["65+", "65+"],
];

export function StudentAccount({ learning = false, status, ownedCourses = [] }: { learning?: boolean; status?: string; ownedCourses?: CourseSummary[] }) {
  const [session, setSession] = useState<AuthResult<{ student: Student }> | null>(null);
  const [retry, setRetry] = useState(0);
  const logout = useSubmission();
  const currentPath = learning ? "/my-learning" : "/account";

  useEffect(() => {
    const controller = new AbortController();
    void authRequest<{ student: Student }>("me", { signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setSession(result);
    });
    return () => controller.abort();
  }, [retry]);

  if (!session) return <Panel><p role="status" className="text-subtle">Loading your student account…</p></Panel>;
  if (!session.ok) {
    return (
      <Panel>
        <Notice error>{session.code === "UNAUTHENTICATED" ? "Sign in to view your student account." : authError(session.code)}</Notice>
        {session.code === "UNAUTHENTICATED" ? (
          <Button href={loginHref(currentPath)} className="!text-[#14312e]">Sign in</Button>
        ) : (
          <Button onClick={() => { setSession(null); setRetry((attempt) => attempt + 1); }} className="!text-[#14312e]">Try again</Button>
        )}
      </Panel>
    );
  }

  const { student } = session.data;
  return (
    <div className="space-y-5">
      <StudentNav learning={learning} />
      {learning ? (
        ownedCourses.length ? (
          <ul role="list" aria-label="Owned courses" className="grid gap-4 sm:grid-cols-2">
            {ownedCourses.map((course) => <li key={course.slug} className="min-w-0"><CourseCard course={course} owned /></li>)}
          </ul>
        ) : (
          <Panel>
            <h2 className="text-2xl">Your courses will appear here</h2>
            <p className="text-subtle">You can explore the catalog and try a free lesson while you decide where to start.</p>
            <Button href="/courses" className="!text-[#14312e]">Browse Courses</Button>
          </Panel>
        )
      ) : (
        <>
          <ProfileForm student={student} onSave={(updated) => setSession({ ok: true, data: { student: updated } })} />
          <EmailChangeForm student={student} />
          <LoginMethods student={student} status={status} />
        </>
      )}
      <form
        method="post"
        className="max-w-xs space-y-3"
        aria-busy={logout.busy}
        onSubmit={logout.handler("logout", () => ({}), () => window.location.replace("/login"))}
      >
        {logout.error ? <Notice error>{authError(logout.error)}</Notice> : null}
        <Button type="submit" variant="ghost" disabled={logout.busy} className="min-h-11 !normal-case !tracking-normal">
          {logout.busy ? "Signing out…" : "Sign out"}
        </Button>
      </form>
    </div>
  );
}

function ProfileForm({ student, onSave }: { student: Student; onSave: (updated: Student) => void }) {
  const submission = useSubmission();
  const [saved, setSaved] = useState(false);
  const initials = student.name.trim().split(/\s+/u).slice(0, 2).map((name) => Array.from(name)[0]).join("").toLocaleUpperCase();

  return (
    <Panel>
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-[#d7efeb] font-semibold text-[#12685f]">{initials}</span>
        <div className="min-w-0">
          <h2 className="text-2xl">Profile</h2>
          <p className="break-all text-sm text-subtle">{student.email}</p>
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
        <Field id="profile-name" name="name" label="Full name" autoComplete="name" defaultValue={student.name} required maxLength={120} />
        <Field id="profile-city" name="city" label="City (optional)" autoComplete="address-level2" defaultValue={student.city ?? ""} maxLength={120} />
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold" htmlFor="profile-age">Age range (optional)</label>
          <select id="profile-age" name="ageRange" className={fieldClass} defaultValue={student.ageRange ?? ""}>
            <option value="">Prefer not to say</option>
            {ageRanges.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {submission.error ? <Notice error>{authError(submission.error)}</Notice> : null}
        {saved ? <Notice>Your profile was saved.</Notice> : null}
        <Submit busy={submission.busy}>Save profile</Submit>
      </form>
    </Panel>
  );
}

function EmailChangeForm({ student }: { student: Student }) {
  const submission = useSubmission();
  const [sent, setSent] = useState(false);
  return (
    <Panel>
      <h2 className="text-2xl">Change email</h2>
      <p className="text-sm text-subtle">Your current address stays active until you verify the new one.</p>
      <form
        method="post"
        className="space-y-4"
        aria-busy={submission.busy}
        onSubmit={submission.handler("email-change", (data) => {
          setSent(false);
          return { email: fieldText(data, "email").trim() };
        }, () => setSent(true))}
      >
        <Field id="change-email" name="email" type="email" label="New email address" autoComplete="email" required maxLength={254} />
        {submission.error ? <Notice error>{authError(submission.error)}</Notice> : null}
        {sent ? <Notice>If this address can be used, we’ll send a verification link. Check your new inbox and spam folder.</Notice> : null}
        <Submit busy={submission.busy}>Send confirmation link</Submit>
      </form>
      {submission.error === "REAUTH_REQUIRED" ? <Reauthenticate student={student} /> : null}
      {submission.error === "UNAUTHENTICATED" ? <Link href={loginHref("/account")} className={studentLink}>Sign in</Link> : null}
    </Panel>
  );
}

function Reauthenticate({ student }: { student: Student }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-subtle">After signing in again, return here and retry the change.</p>
      {student.hasPassword ? <Link href={loginHref("/account")} className={studentLink}>Sign in again with your password</Link> : null}
      {student.hasGoogle ? <GoogleLink href={googleHref("reauth", "/account")}>Continue with Google</GoogleLink> : null}
    </div>
  );
}

function LoginMethods({ student, status }: { student: Student; status?: string }) {
  return (
    <Panel>
      <h2 className="text-2xl">Sign-in methods</h2>
      {status === "reauth-required" ? (
        <>
          <Notice error>{authError("REAUTH_REQUIRED")}</Notice>
          <Reauthenticate student={student} />
        </>
      ) : null}
      {status === "google-canceled" || status === "google-failed" ? (
        <Notice error>{status === "google-canceled" ? "The Google request was canceled." : "The Google request didn’t finish. Try again."}</Notice>
      ) : null}
      <p className="text-sm text-subtle">Password {student.hasPassword ? "is set." : "hasn’t been set."}</p>
      <Link href="/forgot-password" className={studentLink}>{student.hasPassword ? "Reset your password" : "Set a password using email"}</Link>
      {student.hasGoogle ? (
        <p className="text-sm text-subtle">Google is linked to this account.</p>
      ) : (
        <GoogleLink href={googleHref("link", "/account")}>Link Google account</GoogleLink>
      )}
    </Panel>
  );
}
