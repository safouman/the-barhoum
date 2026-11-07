"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useId, useRef, useState, type ReactNode } from "react";
import { Container } from "./Container";
import { LangSwitch } from "./LangSwitch";
import { safeReturnTo } from "@/lib/student-auth/return-to";
import { localizationConfig } from "@/config/localization";
import { useLocale } from "@/providers/locale-provider";
import type { Locale, SiteConfig } from "@/lib/content";
import styles from "./SiteHeader.module.css";

const labels = {
    en: { primary: "Primary", menu: "Menu", courses: "Courses", login: "Sign in", register: "Register", library: "My Learning", account: "Account" },
    ar: { primary: "التنقل الرئيسي", menu: "القائمة", courses: "الدورات", login: "تسجيل الدخول", register: "إنشاء حساب", library: "دوراتي", account: "حسابي" },
};

type HeaderProps = {
    brandLabel: string;
    signedIn: boolean;
    locale: Locale;
    languageSwitch?: ReactNode;
};

export function LocalizedSiteHeader({ site, signedIn }: { site: SiteConfig; signedIn: boolean }) {
    const { locale } = useLocale();
    const languageOptions = site.languageSwitch.options
        .map((option) => ({ value: option.value as Locale, label: option.label }))
        .filter((option) => localizationConfig.enabledLocales.includes(option.value));

    return <SiteHeader
        brandLabel={site.brand.header[locale]}
        locale={locale}
        signedIn={signedIn}
        languageSwitch={localizationConfig.showLanguageSwitcher && languageOptions.length > 1
            ? <LangSwitch options={languageOptions} /> : undefined}
    />;
}

export function SiteHeader(props: HeaderProps) {
    const pathname = usePathname();
    const search = useSearchParams();
    const orderId = pathname === "/checkout/return" ? search.get("orderId") : null;
    const returnTo = safeReturnTo(orderId ? pathname + "?orderId=" + orderId : pathname.startsWith("/courses") ? pathname : null, "");
    // Reset the disclosure on history navigation as well as link activation.
    return <Header key={pathname} {...props} pathname={pathname} returnTo={returnTo} />;
}

function Header({ brandLabel, signedIn, locale, languageSwitch, pathname, returnTo }: HeaderProps & { pathname: string; returnTo: string }) {
    const [open, setOpen] = useState(false);
    const toggle = useRef<HTMLButtonElement>(null);
    const navId = useId();
    const text = labels[locale];
    const authQuery = returnTo ? "?" + new URLSearchParams({ returnTo }) : "";
    const links = [
        { href: "/courses", label: text.courses },
        ...(signedIn
            ? [{ href: "/my-learning", label: text.library }, { href: "/account", label: text.account }]
            : [{ href: "/login", label: text.login }, { href: "/register", label: text.register }]),
    ];

    function closeMenu(restoreFocus = false) {
        setOpen(false);
        if (restoreFocus) toggle.current?.focus();
    }

    return (
        <header
            className={styles.header}
            onKeyDown={(event) => {
                if (open && event.key === "Escape") {
                    event.preventDefault();
                    closeMenu(true);
                }
            }}
        >
            <Container className="flex h-full items-center gap-2 sm:gap-4">
                <Link href="/" className={styles.brand} aria-label={brandLabel} onClick={() => closeMenu()}>
                    <Image
                        src="/images/logo.png"
                        alt=""
                        preload
                        width={96}
                        height={96}
                        className="h-16 w-auto md:h-20"
                    />
                </Link>
                {languageSwitch}
                <button
                    ref={toggle}
                    type="button"
                    className={styles.toggle}
                    aria-controls={navId}
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                        {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
                    </svg>
                    {text.menu}
                </button>
                <nav id={navId} aria-label={text.primary} className={styles.navigation} data-open={open}>
                    <ul className={styles.links}>
                        {links.map(({ href, label }) => {
                            const current = pathname === href;
                            const active = current || pathname.startsWith(href + "/");

                            return <li key={href}>
                                <Link
                                    href={href === "/login" || href === "/register" ? href + authQuery : href}
                                    aria-current={current ? "page" : active ? "location" : undefined}
                                    className={styles.link}
                                    onClick={() => closeMenu(current && open)}
                                >
                                    {label}
                                </Link>
                            </li>;
                        })}
                    </ul>
                </nav>
            </Container>
        </header>
    );
}
