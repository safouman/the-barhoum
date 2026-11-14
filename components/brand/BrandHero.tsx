"use client";

import Link from "next/link";
import type { Locale } from "@/lib/content";
import { brandCopy } from "@/lib/brand-copy";
import { useLocale } from "@/providers/locale-provider";
import styles from "./BrandHero.module.css";

export function BrandHero({ locale: initialLocale }: { locale: Locale }) {
  const context = useLocale();
  const locale = context.locale ?? initialLocale;
  const copy = brandCopy[locale].hero;

  return (
    <section className={styles.hero} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-locale={locale} aria-labelledby="brand-hero-title">
      <svg className={styles.desktopCurves} viewBox="0 0 1280 720" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-120 482C123 458 202 308 166 150" />
        <path d="M1350 96C1051 194 1043 452 1280 612" />
        <path d="M930 770C1006 626 1142 555 1325 614" />
      </svg>
      <svg className={styles.mobileCurves} viewBox="0 0 720 1280" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-90 422C84 346 151 231 104 81" />
        <path d="M786 630C647 700 607 789 611 903" />
        <path d="M388 1363C492 1180 611 1104 780 1134" />
      </svg>
      <div className={styles.content}>
        <h1 id="brand-hero-title" className={styles.heading}>
          <span className={styles.title}>{copy.title}</span>
          <span className={styles.subtitle}>
            <span className={styles.lead}>{copy.lead}</span>{" "}
            <em className={styles.emphasis}>{copy.emphasis}</em>
          </span>
        </h1>
        <span className={styles.divider} aria-hidden="true" />
        <p className={styles.description}>{copy.description}</p>
        <Link href="/program" className={styles.action}>
          <span>{copy.action}</span>
          <svg viewBox="0 0 28 24" width="28" height="24" fill="none" aria-hidden="true">
            <path d="M2 12H24M16 4L24 12L16 20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
