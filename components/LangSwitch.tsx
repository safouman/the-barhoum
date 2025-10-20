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

    if (!options || options.length <= 1) {
        return null;
    }

    const handleChange = (value: Locale) => {
        if (value === locale) {
            return;
        }

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
                "inline-flex overflow-hidden rounded-[6px] border border-border text-[0.7rem] md:text-sm",
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
                        "px-1.5 py-1 md:px-2.5 md:py-1 transition text-[0.7rem] md:text-sm",
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
