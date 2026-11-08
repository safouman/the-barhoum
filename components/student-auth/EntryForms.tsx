"use client";

import Link from "next/link";
import { useState } from "react";
import { authError, googleHref, loginHref } from "./api";
import { Field, GoogleLink, Notice, Panel, studentLink, Submit } from "./ui";
import { fieldText, useSubmission } from "./use-submission";

const loginStatuses: Record<string, string> = {
  "google-canceled": "أُلغي تسجيل الدخول عبر Google. يمكنك المحاولة مجددًا أو استخدام كلمة المرور.",
  "google-failed": "لم يكتمل تسجيل الدخول عبر Google. حاول مجددًا أو استخدم كلمة المرور.",
  "google-link-required": "لربط حساب Google، سجّل الدخول إلى حسابك أولًا ثم اربطه من صفحة حسابي.",
  "google-linked": "تم ربط حساب Google. سجّل الدخول مجددًا للمتابعة.",
  "reauth-required": "سجّل الدخول مجددًا لتأكيد هويتك.",
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
        <Field id="login-email" name="email" type="email" label="البريد الإلكتروني" dir="ltr" autoComplete="username" required maxLength={254} />
        <Field id="login-password" name="password" type="password" label="كلمة المرور" dir="ltr" autoComplete="current-password" required />
        <p className="text-sm"><Link href="/forgot-password" className={studentLink}>نسيت كلمة المرور؟</Link></p>
        {submission.error ? <Notice error>{authError(submission.error, "ar")}</Notice> : null}
        <Submit busy={submission.busy} busyLabel="لحظة من فضلك…">تسجيل الدخول</Submit>
      </form>
      <p className="text-center text-sm text-subtle">أو</p>
      <GoogleLink href={googleHref("login", returnTo)}>المتابعة باستخدام <bdi dir="ltr">Google</bdi></GoogleLink>
      <p className="text-sm text-subtle">ليس لديك حساب؟ <Link href={`/register?${new URLSearchParams({ returnTo })}`} className={studentLink}>إنشاء حساب</Link></p>
    </Panel>
  );
}

const inboxCopy = {
  register: {
    button: "إرسال رابط التحقق",
    success: "إذا كان التسجيل بهذا البريد ممكنًا، فسيصلك رابط للتحقق. تحقّق من صندوق الوارد ومجلد البريد غير المرغوب فيه.",
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

export function InboxForm({ mode, returnTo }: { mode: keyof typeof inboxCopy; returnTo?: string }) {
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
          return { email: fieldText(data, "email").trim(), ...(returnTo && returnTo !== "/my-learning" && mode !== "forgot-password" ? { returnTo } : {}) };
        }, () => setSent(true))}
      >
        <Field id="inbox-email" name="email" type="email" label={mode === "register" ? "البريد الإلكتروني" : "Email address"} dir="ltr" autoComplete="email" required maxLength={254} />
        {submission.error ? <Notice error>{authError(submission.error, mode === "register" ? "ar" : "en")}</Notice> : null}
        <Submit busy={submission.busy} busyLabel={mode === "register" ? "لحظة من فضلك…" : undefined}>{copy.button}</Submit>
      </form>
      {mode === "register" ? (
        <>
          <p className="text-center text-sm text-subtle">أو</p>
          <GoogleLink href={googleHref("login", returnTo ?? "/my-learning")}>المتابعة باستخدام <bdi dir="ltr">Google</bdi></GoogleLink>
          <p className="text-sm text-subtle">لم تصلك الرسالة؟ <Link href={returnTo ? `/verify-email?${new URLSearchParams({ returnTo })}` : "/verify-email"} className={studentLink}>اطلب رابط تحقق جديدًا</Link></p>
        </>
      ) : null}
      <p className="text-sm"><Link href={returnTo ? loginHref(returnTo) : "/login"} className={studentLink}>{mode === "register" ? "العودة إلى تسجيل الدخول" : "Back to sign in"}</Link></p>
    </Panel>
  );
}
