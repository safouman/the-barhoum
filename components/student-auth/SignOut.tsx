"use client";

import { Button } from "@/components/Button";
import { authError } from "./api";
import { Notice } from "./ui";
import { useSubmission } from "./use-submission";

export function SignOut({ locale = "en" }: { locale?: "ar" | "en" }) {
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
        {locale === "ar" ? (logout.busy ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج") : (logout.busy ? "Signing out…" : "Sign out")}
      </Button>
    </form>
  );
}
