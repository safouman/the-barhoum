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
    <section id={id} className={clsx("py-[clamp(var(--space-lg),14vh,var(--space-xl))]", className)}>
      {(title || subtitle) && (
        <header className="mb-md grid gap-sm">
          {title && <h2 className="font-heading text-[clamp(1.75rem,4vw,3rem)] font-bold leading-tight">{title}</h2>}
          {subtitle && <p className="max-w-prose text-[clamp(1rem,2vw,1.25rem)] text-subtle">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
