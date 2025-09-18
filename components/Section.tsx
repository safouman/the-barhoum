import clsx from "classnames";
import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, subtitle, children, className }: SectionProps) {
  return (
    <section id={id} className={clsx("py-[clamp(5rem,15vh,7.5rem)]", className)}>
      {(title || subtitle) && (
        <header className="mb-lg grid gap-sm text-center">
          {title && (
            <h2 className="font-heading text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold uppercase tracking-[0.35em]">
              {title}
            </h2>
          )}
          {subtitle && <p className="mx-auto max-w-3xl text-[clamp(1.05rem,2.2vw,1.35rem)] text-subtle">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
