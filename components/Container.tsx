import clsx from "classnames";
import type { ReactNode } from "react";

interface ContainerProps {
  className?: string;
  children: ReactNode;
}

export function Container({ className, children }: ContainerProps) {
  return <div className={clsx("mx-auto w-full max-w-screen-xl px-sm", className)}>{children}</div>;
}
