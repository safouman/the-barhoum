"use client";

import Link from "next/link";
import { Container } from "./Container";
import { LangSwitch } from "./LangSwitch";
import { ThemeSwitch } from "./ThemeSwitch";
import { useLocale } from "@/providers/locale-provider";
import { THEME_NAMES } from "@/design/theme";
import type { Locale, UIStrings } from "@/lib/content";

interface SiteHeaderProps {
  ui: Record<Locale, UIStrings>;
  brand: { ar: string; en: string };
  paymentSlug?: string;
}

export function SiteHeader({ ui, brand, paymentSlug }: SiteHeaderProps) {
  const { locale } = useLocale();
  const currentUi = ui[locale];
  const brandLabel = locale === "ar" ? brand.ar : brand.en;

  const navItems = [
    { href: "/", label: currentUi.nav.home },
    { href: "/cv", label: currentUi.nav.cv },
    { href: "/links", label: currentUi.nav.links },
  ];

  if (paymentSlug) {
    navItems.push({ href: `/pay/${paymentSlug}`, label: currentUi.nav.pay });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur">
      <Container className="flex flex-wrap items-center justify-between gap-sm py-4">
        <Link href="/" className="font-heading text-xl">
          {brandLabel}
        </Link>
        <nav className="flex flex-wrap items-center gap-4" aria-label={brandLabel}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-2 py-1 transition hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-4">
          <LangSwitch
            label={currentUi.language.label}
            options={[
              { value: "ar", label: currentUi.language.ar },
              { value: "en", label: currentUi.language.en },
            ]}
          />
          <ThemeSwitch
            label={currentUi.theme.label}
            options={THEME_NAMES.map((name) => ({
              value: name,
              label: currentUi.theme[name],
            }))}
          />
        </div>
      </Container>
    </header>
  );
}
