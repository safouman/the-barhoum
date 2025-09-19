import { cookies } from "next/headers";
import type { ThemeName } from "@/design/tokens";
import { THEME_NAMES } from "@/design/theme";
import { ThemeProvider } from "@/providers/theme-provider";

export default async function ThemeGate({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const v = store.get("barhoum_theme")?.value;
  const theme: ThemeName =
    v && (THEME_NAMES as readonly string[]).includes(v) ? (v as ThemeName) : "a";

  return <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>;
}