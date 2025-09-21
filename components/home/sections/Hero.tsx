import Image from "next/image";
import clsx from "classnames";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import type { HomeThemeDefinition } from "../types";
import styles from "./HomeHero.module.css";

export const HomeHero: HomeThemeDefinition["Hero"] = ({ hero, locale }) => {
  const isRTL = locale === "ar";

  return (
    <section className={styles.hero}>
      <Container className={clsx(styles.container, isRTL ? styles.containerRtl : styles.containerLtr)}>
        <div className={clsx(styles.text, isRTL ? styles.textRtl : styles.textLtr)}>
          <span className="text-eyebrow">
            {hero.cta[locale]}
          </span>
          <h1
            className={clsx(
              "text-display font-heading",
              isRTL ? "font-[var(--font-scheherazade)]" : "font-[var(--font-fraunces)]"
            )}
          >
            {hero.title[locale]}
          </h1>
          <p
            className={clsx(
              "text-lead",
              isRTL ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"
            )}
          >
            {hero.subtitle[locale]}
          </p>
          <div className={clsx("mt-10 flex flex-wrap items-center gap-6", isRTL ? "justify-end" : "justify-start")}>
            <Button
              href="#categories"
              className="px-8 py-[0.95rem] text-sm"
            >
              {hero.cta[locale]}
            </Button>
            <Button
              href="#media"
              variant="ghost"
              className="px-7 py-[0.9rem] text-sm"
            >
              {locale === "ar" ? "عرض المنهج" : "View Approach"}
            </Button>
          </div>
        </div>
        <div className={styles.logo}>
          <Image
            src="/images/logo.png"
            alt="Barhoum watermark"
            width={720}
            height={720}
            className={styles.logoImage}
            priority
          />
        </div>
      </Container>
    </section>
  );
};
