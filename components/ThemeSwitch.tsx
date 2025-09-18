"use client";

import { useTheme } from "@/providers/theme-provider";
import type { ThemeName } from "@/design/tokens";

interface ThemeSwitchProps {
  label: string;
  options: { value: ThemeName; label: string }[];
}

export function ThemeSwitch({ label, options }: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme();

  const handleChange = (eventTarget: React.ChangeEvent<HTMLSelectElement>) => {
    const value = eventTarget.target.value as ThemeName;
    setTheme(value);
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm text-subtle">
      <span className="text-xs uppercase tracking-wide">{label}</span>
      <select
        className="rounded-sm border border-border bg-surface px-3 py-1 text-sm text-text"
        value={theme}
        onChange={handleChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
