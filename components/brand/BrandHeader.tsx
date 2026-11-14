"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import { brandCopy } from "@/lib/brand-copy";
import type { Locale } from "@/lib/content";
import { safeReturnTo } from "@/lib/student-auth/return-to";
import { useLocale } from "@/providers/locale-provider";
import styles from "./BrandHeader.module.css";

export function BrandHeader({ locale: initialLocale, signedIn }: { locale: Locale; signedIn: boolean }) {
  const { locale: selectedLocale, setLocale } = useLocale();
  const locale = selectedLocale ?? initialLocale;
  const text = brandCopy[locale].nav;
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const orderId = pathname === "/checkout/return" ? search.get("orderId") : null;
  const destination = pathname === "/login" || pathname === "/register" ? search.get("returnTo")
    : orderId ? pathname + "?" + new URLSearchParams({ orderId }) : pathname;
  const returnTo = safeReturnTo(destination, "");
  const entry = "/login" + (returnTo ? "?" + new URLSearchParams({ returnTo }) : "");
  const primaryLinks = [
    { href: "/program", label: text.program },
    { href: "/organizations", label: text.organizations },
    { href: "/resources", label: text.resources },
  ];
  const accountLinks = signedIn
    ? [{ href: "/my-learning", label: text.library }, { href: "/account", label: text.account }]
    : [{ href: entry, label: text.entry }];


  function closeMenu() {
    setOpenPath(null);
    trigger.current?.focus();
  }

  function changeLocale(value: Locale) {
    setLocale(value);
    const params = new URLSearchParams(search.toString());
    params.set("lang", value);
    router.replace(pathname + "?" + params + window.location.hash, { scroll: false });
  }

  return (
    <header className={styles.header} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} onKeyDown={(event) => {
      if (event.key === "Escape" && open) closeMenu();
    }}>
      <a href="#main-content" className={styles.skip}>{text.skip}</a>
      <div className={styles.desktopPrimary}>
        <nav aria-label={text.menu}>
          {primaryLinks.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </div>
      <Link href="/" className={styles.logo} aria-label="Ibrahim Ben Abdallah">
        <Image src="/images/logo.png" alt="" width={473} height={667} preload />
      </Link>
      <div className={styles.desktopSecondary}>
        <Link href="/about">{text.about}</Link>
        <div className={styles.accountLinks}>
          {accountLinks.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
        </div>
      </div>
      <label className={styles.language}>
        <span className={styles.srOnly}>{text.language}</span>
        <select value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}>
          <option value="en">EN</option>
          <option value="ar">AR</option>
          <option value="fr">FR</option>
        </select>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="m2 2 5 5 5-5" stroke="currentColor" strokeWidth="1.25" /></svg>
      </label>
      <button ref={trigger} type="button" className={styles.mobileToggle} aria-expanded={open} aria-controls={menuId} aria-label={open ? text.close : text.menu} onClick={() => setOpenPath(open ? null : pathname)}>
        <svg width="40" height="28" viewBox="0 0 40 28" fill="none" aria-hidden="true">
          {open ? <path d="m7 2 26 24M33 2 7 26" /> : <path d="M1 4H39M1 14H39M1 24H39" />}
        </svg>
      </button>
      <nav id={menuId} className={styles.mobileMenu} aria-label={text.menu} hidden={!open}>
        {[...primaryLinks, { href: "/about", label: text.about }, { href: "/coaching", label: text.coaching }, { href: "/courses", label: text.courses }, ...accountLinks].map(({ href, label }) => (
          <Link key={href} href={href} onClick={() => setOpenPath(null)}>{label}</Link>
        ))}
      </nav>
      <span className={styles.divider} aria-hidden="true" />
    </header>
  );
}
