import { cookies } from "next/headers";
import { ThemeProvider } from "@/providers/theme-provider";
import type { ThemeName } from "@/design/tokens";
import { THEME_NAMES } from "@/design/theme";

function isTheme(value: string | null | undefined): value is ThemeName {
  return !!value && (THEME_NAMES as readonly string[]).includes(value);
}

interface ThemeGateProps {
  children: React.ReactNode;
}

export default async function ThemeGate({ children }: ThemeGateProps) {
  const cookiesStore = cookies();
  const themeCookie = cookiesStore.get("barhoum_theme")?.value;
  const initialTheme: ThemeName = isTheme(themeCookie) ? themeCookie : "a";

  return <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>;
}