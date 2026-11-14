import type { ComponentProps, ReactNode } from "react";
import type { Locale } from "@/lib/content";
import { studentCopy } from "@/lib/student-copy";
import { Button } from "@/components/Button";

export const fieldClass = "min-h-12 w-full rounded-xl border border-[var(--brand-primary)] bg-[var(--brand-background)] px-4 py-3 text-base text-[var(--brand-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]";
export const studentLink = "font-medium text-[var(--brand-primary)] underline decoration-[var(--brand-primary)] underline-offset-4";

export function StudentShell({ title, intro, children, wide = false, locale = "en" }: { title: string; intro?: string; children: ReactNode; wide?: boolean; locale?: Locale }) {
  return (
    <div className={`mx-auto w-full px-5 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 ${wide ? "max-w-3xl" : "max-w-xl"}`}>
      <header className="mb-8 space-y-4">
        <p className="text-xs font-medium tracking-[0.12em] text-[var(--brand-primary)]">{studentCopy[locale].eyebrow}</p>
        <h1 className="text-4xl leading-tight text-[var(--brand-text)] sm:text-5xl">{title}</h1>
        {intro ? <p className="max-w-prose text-sm leading-7 text-[var(--brand-text)]">{intro}</p> : null}
      </header>
      {children}
    </div>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="min-w-0 space-y-6 rounded-[1.5rem] border border-[var(--brand-surface)] bg-[var(--brand-background)] p-5 shadow-sm sm:p-8">{children}</div>;
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <p role={error ? "alert" : "status"} className={`rounded-xl border bg-[var(--brand-surface)] px-4 py-3 text-sm leading-6 text-[var(--brand-text)] ${error ? "border-[var(--brand-primary)] font-medium" : "border-[var(--brand-surface)]"}`}>
      {children}
    </p>
  );
}

export function Field({ label, hint, id, ...props }: ComponentProps<"input"> & { label: string; id: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold" htmlFor={id}>{label}</label>
      <input id={id} aria-describedby={hint ? id + "-hint" : undefined} className={fieldClass} {...props} />
      {hint ? <p id={id + "-hint"} className="text-sm text-subtle">{hint}</p> : null}
    </div>
  );
}

export function Submit({ busy, children, busyLabel = "Please wait…" }: { busy: boolean; children: ReactNode; busyLabel?: string }) {
  return (
    <Button type="submit" disabled={busy} fullWidth className="min-h-12 !rounded-full !bg-[var(--brand-primary)] !normal-case !tracking-normal !text-[var(--brand-background)] disabled:cursor-wait disabled:opacity-60">
      {busy ? busyLabel : children}
    </Button>
  );
}

export function GoogleLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-background)] px-4 py-3 text-center text-sm font-medium text-[var(--brand-text)] hover:bg-[var(--brand-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
        <path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.34-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.15v5.11h6.59c3.86-3.56 6.1-8.8 6.1-14.76Z" />
        <path fill="#34A853" d="M24 44c5.51 0 10.13-1.83 13.51-4.78l-6.59-5.11c-1.83 1.23-4.16 1.96-6.92 1.96-5.33 0-9.84-3.6-11.45-8.44H5.75v5.27A20 20 0 0 0 24 44Z" />
        <path fill="#FBBC05" d="M12.55 27.63a12 12 0 0 1 0-7.26V15.1H5.75a20 20 0 0 0 0 17.8l6.8-5.27Z" />
        <path fill="#EA4335" d="M24 11.93c3 0 5.69 1.03 7.81 3.04l5.85-5.85A19.2 19.2 0 0 0 24 4 20 20 0 0 0 5.75 15.1l6.8 5.27c1.61-4.84 6.12-8.44 11.45-8.44Z" />
      </svg>
      {children}
    </a>
  );
}
