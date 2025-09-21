"use client";

import clsx from "classnames";
import { event } from "@/lib/analytics";

export interface PackageCardProps {
  id: string;
  title: string;
  price: string;
  features: string[];
  visible?: boolean;
  active?: boolean;
  onSelect?: (id: string) => void;
}

export function PackageCard({ id, title, price, features, visible = true, active = false, onSelect }: PackageCardProps) {
  if (!visible) return null;

  const handleClick = () => {
    onSelect?.(id);
    event("package_click", { package: id });
  };

  return (
    <button
      type="button"
      className={clsx(
        "surface-panel grid gap-sm p-sm text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm",
        active && "border-accent shadow-sm"
      )}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-heading text-xl text-text">{title}</span>
        <span className="text-lg font-semibold text-subtle">{price}</span>
      </div>
      <ul className="grid list-disc gap-1 pl-5 text-label">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </button>
  );
}
