import type { Metadata } from "next";
import { cookies } from "next/headers";
import "../styles/globals.css";
import { LocaleProvider } from "@/providers/locale-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { SiteHeader } from "@/components/SiteHeader";
import { getPayments, getUiStrings, type UIStrings } from "@/lib/content";
import { getDirection } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n.server";
import type { ThemeName } from "@/design/tokens";
import { THEME_NAMES } from "@/design/theme";
const brand = { ar: "برهوم", en: "Barhoum" };

function resolveTheme(): ThemeName {
  const themeCookie = cookies().get("barhoum_theme")?.value;
  if (themeCookie && (THEME_NAMES as readonly string[]).includes(themeCookie)) {
    return themeCookie as ThemeName;
  }
  return "a";
}

async function loadUi(): Promise<Record<"ar" | "en", UIStrings>> {
  const [ar, en] = await Promise.all([getUiStrings("ar"), getUiStrings("en")]);
  return { ar, en };
}

export const metadata: Metadata = {
  title: "Barhoum Coaching",
  description: "Personal coaching for individuals, couples, and organizations.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = resolveLocale();
  const direction = getDirection(locale);
  const initialTheme = resolveTheme();
  const [ui, payments] = await Promise.all([loadUi(), getPayments()]);
  const defaultPaymentSlug = payments[0]?.slug;

  return (
    <html lang={locale} dir={direction}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider initialTheme={initialTheme}>
            <SiteHeader ui={ui} brand={brand} paymentSlug={defaultPaymentSlug} />
            <main>{children}</main>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
