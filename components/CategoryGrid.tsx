"use client";

import clsx from "classnames";
import { event } from "@/lib/analytics";

export interface CategoryItemProps {
  id: string;
  label: string;
  description: string;
}

interface CategoryGridProps {
  categories: CategoryItemProps[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function CategoryGrid({ categories, selectedId, onSelect }: CategoryGridProps) {
  const handleSelect = (id: string) => {
    onSelect?.(id);
    event("category_view", { category: id });
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-sm">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={clsx(
            "grid gap-2 rounded-[8px] border border-border bg-surface p-sm text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm",
            selectedId === category.id && "border-accent shadow-sm"
          )}
          onClick={() => handleSelect(category.id)}
        >
          <span className="font-heading text-xl">{category.label}</span>
          <span className="text-sm text-subtle">{category.description}</span>
        </button>
      ))}
    </div>
  );
}
