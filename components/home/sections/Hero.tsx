import Image from "next/image";
import clsx from "classnames";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import type { HomeThemeDefinition } from "../types";

export const Hero: HomeThemeDefinition["Hero"] = ({ hero, locale }) => {
  const isRTL = locale === "ar";

  return (
    <section className="theme-b-hero relative isolate overflow-hidden bg-[#ffffff] text-[#0f0f0f]">
      <Container
        className={clsx(
          "theme-b-hero__container relative grid min-h-[calc(100dvh-80px)] items-center gap-[clamp(32px,6vw,64px)] py-[clamp(4rem,14vh,7rem)]",
          "md:grid-cols-[minmax(0,65ch)_minmax(0,1fr)]",
          isRTL ? "md:[direction:rtl]" : "md:[direction:ltr]"
        )}
      >
        <div
          className={clsx(
            "theme-b-hero__text relative z-10 flex max-w-[65ch] flex-col gap-10",
            isRTL ? "text-right" : "text-left"
          )}
        >
          <span className="text-[clamp(0.85rem,1.2vw,0.95rem)] font-medium uppercase tracking-[0.15em] text-[#888888]">
            {hero.cta[locale]}
          </span>
          <h1
            className={clsx(
              "text-[clamp(2.6rem,6.5vw,5.3rem)] font-semibold leading-[1.15] tracking-[-0.012em] text-[#0a0a0a]",
              isRTL ? "font-[var(--font-scheherazade)]" : "font-[var(--font-fraunces)]"
            )}
          >
            {hero.title[locale]}
          </h1>
          <p
            className={clsx(
              "max-w-[62ch] text-[clamp(1.18rem,2.4vw,1.45rem)] leading-[1.8] text-[#333333]",
              isRTL ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"
            )}
          >
            {hero.subtitle[locale]}
          </p>
          <div className={clsx("mt-10 flex flex-wrap items-center gap-6", isRTL ? "justify-end" : "justify-start")}
          >
            <Button href="#categories" className="theme-b-hero__btn-primary px-8 py-[0.95rem] text-sm uppercase">
              {hero.cta[locale]}
            </Button>
            <Button
              href="#media"
              variant="ghost"
              className="theme-b-hero__btn-secondary px-7 py-[0.9rem] text-sm uppercase"
            >
              {locale === "ar" ? "عرض المنهج" : "View Approach"}
            </Button>
          </div>
        </div>
        <div className="theme-b-hero__logo pointer-events-none relative w-full md:justify-self-end">
          <Image
            src="/images/logo.png"
            alt="Barhoum watermark"
            width={720}
            height={720}
            className="theme-b-hero__logo-image"
            priority
          />
        </div>
      </Container>
    </section>
  );
};
