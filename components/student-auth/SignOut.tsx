"use client";

import type { Locale } from "@/lib/content";
import { studentCopy } from "@/lib/student-copy";
import { useLocale } from "@/providers/locale-provider";
import { Button } from "@/components/Button";
import { authError } from "./api";
import { Notice } from "./ui";
import { useSubmission } from "./use-submission";

export function SignOut({ locale: selectedLocale }: { locale?: Locale }) {
  const { locale: currentLocale } = useLocale();
  const locale = selectedLocale ?? currentLocale;
  const copy = studentCopy[locale];
  const logout = useSubmission();

  return (
    <form
      method="post"
      className="max-w-xs space-y-3"
      aria-busy={logout.busy}
      onSubmit={logout.handler("logout", () => ({}), () => window.location.replace("/login"))}
    >
      {logout.error ? <Notice error>{authError(logout.error, locale)}</Notice> : null}
      <Button type="submit" variant="ghost" disabled={logout.busy} className="min-h-11 !normal-case !tracking-normal">
        {logout.busy ? copy.signingOut : copy.signOut}
      </Button>
    </form>
  );
}
