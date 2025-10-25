"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "./Container";
import { LangSwitch } from "./LangSwitch";
import { useLocale } from "@/providers/locale-provider";
import { localizationConfig } from "@/config/localization";
import type { Locale, SiteConfig, UIStrings } from "@/lib/content";

interface SiteHeaderProps {
    ui: Record<Locale, UIStrings>;
    site: SiteConfig;
}

export function SiteHeader({ ui: _ui, site }: SiteHeaderProps) {
    const { locale } = useLocale();
    const brandLabel = site.brand.header[locale];
    const isRtl = locale === "ar";
    const languageOptions = site.languageSwitch.options.map((option) => ({
        value: option.value as Locale,
        label: option.label,
    }));
    const filteredLanguageOptions = languageOptions.filter((option) =>
        localizationConfig.enabledLocales.includes(option.value)
    );
    const shouldRenderLanguageSwitcher =
        localizationConfig.showLanguageSwitcher && filteredLanguageOptions.length > 1;

    return (
        <header className="relative top-0 z-50 border-border bg-background/70 backdrop-blur h-16 overflow-visible">
            <Container className="flex items-center gap-sm h-full overflow-visible">
                <div className="flex flex-1 flex-wrap items-center gap-4">
                    <Link
                        href="/"
                        className="inline-flex items-center relative z-10 overflow-visible"
                        aria-label={brandLabel}
                    >
                        <span className="relative block translate-y-[12px] md:translate-y-[18px] z-20 overflow-visible">
                            <Image
                                src="/images/logo.png"
                                alt={brandLabel}
                                priority
                                width={96}
                                height={96}
                                className="h-[4.5rem] md:h-[5rem] w-auto"
                            />
                        </span>
                    </Link>
                </div>
                {shouldRenderLanguageSwitcher && (
                    <LangSwitch
                        className={`flex-shrink-0 ${isRtl ? "mr-auto" : "ml-auto"}`}
                        options={filteredLanguageOptions}
                    />
                )}
            </Container>
        </header>
    );
}
