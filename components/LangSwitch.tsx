"use client";

import clsx from "classnames";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/providers/locale-provider";
import type { Locale } from "@/lib/content";

interface LangSwitchProps {
    options: { value: Locale; label: string }[];
    className?: string;
}

export function LangSwitch({ options, className }: LangSwitchProps) {
    const { locale, setLocale } = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isRtl = locale === "ar";

    const handleChange = (value: Locale) => {
        setLocale(value);
        const params = new URLSearchParams(searchParams?.toString());
        params.set("lang", value);
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
            scroll: false,
        });
    };

    return (
        <div
            className={clsx(
                "inline-flex overflow-hidden rounded-[8px] border border-border",
                isRtl ? "flex-row-reverse" : "flex-row",
                className
            )}
            dir={isRtl ? "rtl" : "ltr"}
        >
            {options.map((option) => (
                <button
                    type="button"
                    key={option.value}
                    className={clsx(
                        "px-3 py-1 text-sm transition",
                        option.value === locale
                            ? "bg-primary text-accent"
                            : "bg-transparent text-subtle hover:bg-primary/10 hover:text-primary"
                    )}
                    onClick={() => handleChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
