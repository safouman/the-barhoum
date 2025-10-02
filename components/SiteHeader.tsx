"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";
import { LangSwitch } from "./LangSwitch";
import { useLocale } from "@/providers/locale-provider";
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
    const isRtl = locale === "ar";

    const navItems = [{ href: "/links", label: currentUi.nav.links }];

    if (paymentSlug) {
        navItems.push({
            href: `/pay/${paymentSlug}`,
            label: currentUi.nav.pay,
        });
    }

    return (
        <header className="sticky top-0 z-50 border-border bg-background/70 backdrop-blur h-16">
            <Container className="flex items-center gap-sm h-full">
                <div
                    className="flex flex-1 flex-wrap items-center gap-4"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center relative z-10"
                        aria-label={brandLabel}
                    >
                        <Image
                            src="/images/logo.png"
                            alt={brandLabel}
                            priority
                            width={80}
                            height={80}
                            className="h-[4rem] w-auto"
                        />
                    </Link>
                    {navItems.length > 0 && (
                        <nav
                            className="flex flex-wrap items-center gap-4"
                            aria-label={brandLabel}
                        >
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-[8px] px-2 py-1 transition hover:bg-primary/10 hover:text-primary"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>
                <LangSwitch
                    className={`flex-shrink-0 ${isRtl ? "mr-auto" : "ml-auto"}`}
                    options={[
                        { value: "ar", label: "AR" },
                        { value: "en", label: "EN" },
                    ]}
                />
            </Container>
        </header>
    );
}
