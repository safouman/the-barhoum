"use client";

import Link from "next/link";
import type { Locale } from "@/lib/content";
import { brandCopy } from "@/lib/brand-copy";
import { homeRefinementCopy } from "@/lib/home-refinement-copy";
import { useLocale } from "@/providers/locale-provider";
import styles from "./HomeIntroduction.module.css";

export function HomeIntroduction({ locale: initialLocale }: { locale: Locale }) {
  const { locale: selectedLocale } = useLocale();
  const locale = selectedLocale ?? initialLocale;
  const copy = brandCopy[locale];

  return (
    <section
      className={styles.introduction}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      aria-labelledby="home-introduction-title"
    >
      <div className={styles.content}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>{copy.nav.program}</p>
          <h2 id="home-introduction-title">{homeRefinementCopy[locale].heading}</h2>
        </div>
        <div className={styles.description}>
          <p className={styles.lead}>{copy.pages.program.intro}</p>
          <p className={styles.context}>{copy.pages.about.intro}</p>
          <Link href={"/program?" + new URLSearchParams({ lang: locale })} className={styles.action}>
            <span>{copy.hero.action}</span>
            <svg viewBox="0 0 28 24" width="28" height="24" fill="none" aria-hidden="true">
              <path d="M2 12H24M16 4L24 12L16 20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
