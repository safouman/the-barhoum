"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getThemeVars, THEME_NAMES } from "@/design/theme";
import type { ThemeName } from "@/design/tokens";
import { event } from "@/lib/analytics";

const THEME_COOKIE = "barhoum_theme";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const defaultTheme: ThemeName = "a";

function readCookie(): ThemeName | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  for (const entry of cookies) {
    const [key, value] = entry.split("=");
    if (key === THEME_COOKIE && isTheme(value)) {
      return value;
    }
  }
  return null;
}

function isTheme(value: string | null | undefined): value is ThemeName {
  return !!value && (THEME_NAMES as readonly string[]).includes(value);
}

function applyTheme(name: ThemeName) {
  if (typeof document === "undefined") return;
  const vars = getThemeVars(name);
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, String(value));
  });
  root.setAttribute("data-theme", name);
  root.style.setProperty("color-scheme", name === "a" ? "dark" : "light");
}

export function ThemeProvider({ children, initialTheme = defaultTheme }: { children: React.ReactNode; initialTheme?: ThemeName; }) {
  const searchParams = useSearchParams();
  const [theme, setThemeState] = useState<ThemeName>(() => initialTheme);

  useEffect(() => {
    const existing = readCookie();
    if (existing && existing !== theme) {
      setThemeState(existing);
    } else {
      applyTheme(theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const param = searchParams?.get("theme");
    if (isTheme(param) && param !== theme) {
      setThemeState(param);
    }
  }, [searchParams, theme]);

  useEffect(() => {
    applyTheme(theme);
    if (typeof document !== "undefined") {
      document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  }, [theme]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeState(name);
    event("theme_switch", { theme: name });
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
