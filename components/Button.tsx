import clsx from "classnames";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

interface BaseProps {
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonElementProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;
type AnchorElementProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href">;

interface ButtonAsButtonProps extends BaseProps, ButtonElementProps {
  href?: undefined;
}

interface ButtonAsLinkProps extends BaseProps, AnchorElementProps {
  href: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const baseClass =
  "btn inline-flex items-center justify-center gap-2 rounded-[8px] border px-6 py-3 text-base font-semibold uppercase tracking-[0.08em] transition duration-200 ease-out";

export function Button({ variant = "primary", fullWidth = false, className, children, ...props }: ButtonProps) {
  const variantClass = variant === "ghost" ? "btn-outline" : "btn-solid";

  const combinedClass = clsx(baseClass, variantClass, fullWidth && "w-full", className);

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={combinedClass} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = props as ButtonElementProps;
  return (
    <button className={combinedClass} type={type} {...buttonProps}>
      {children}
    </button>
  );
}
