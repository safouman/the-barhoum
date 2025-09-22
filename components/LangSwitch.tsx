"use client";

import clsx from "classnames";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/providers/locale-provider";
import type { Locale } from "@/lib/content";

interface LangSwitchProps {
    options: { value: Locale; label: string }[];
}

export function LangSwitch({ options }: LangSwitchProps) {
    const { locale, setLocale } = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

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
        <div className="inline-flex items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-sm border border-border">
                {options.map((option) => (
                    <button
                        type="button"
                        key={option.value}
                        className={clsx(
                            "px-3 py-1 text-sm transition",
                            option.value === locale
                                ? "bg-accent text-accentText"
                                : "bg-transparent text-subtle hover:bg-white/10"
                        )}
                        onClick={() => handleChange(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
