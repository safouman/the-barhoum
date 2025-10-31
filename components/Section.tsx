import clsx from "classnames";
import type { ReactNode, HTMLAttributes } from "react";

interface SectionProps
    extends Omit<HTMLAttributes<HTMLElement>, "id" | "className" | "title"> {
    id?: string;
    title?: ReactNode;
    subtitle?: ReactNode;
    children: ReactNode;
    className?: string;
    titleClassName?: string;
    subtitleClassName?: string;
}

export function Section({
    id,
    title,
    subtitle,
    children,
    className,
    titleClassName,
    subtitleClassName,
    ...props
}: SectionProps) {
    return (
        <section
            id={id}
            data-section="true"
            className={clsx(
                "py-10 md:py-[clamp(var(--space-lg),14vh,var(--space-xl))]",
                className
            )}
            {...props}
        >
            {(title || subtitle) && (
                <header className="mb-8 md:mb-md grid gap-sm text-center">
                    {title && (
                        <h2 className={clsx("text-section-title", titleClassName)}>
                            {title}
                        </h2>
                    )}
                    {subtitle && (
                        <p
                            className={clsx(
                                "mx-auto max-w-3xl whitespace-pre-line text-body-lg text-subtle",
                                subtitleClassName
                            )}
                        >
                            {subtitle}
                        </p>
                    )}
                </header>
            )}
            {children}
        </section>
    );
}
