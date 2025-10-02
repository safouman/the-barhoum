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
            {/* Fixed-side image layer */}
            <div
                className={clsx(
                    styles.imageLayer,
                    isRTL ? styles.imageLeft : styles.imageRight,
                    // Apply the mask on the container so image mirroring doesn't invert it
                    isRTL ? styles.maskRtl : styles.maskLtr
                )}
            >
                <Image
                    src="/images/hero.jpg"
                    alt="Portrait"
                    className={clsx(
                        styles.imageMedia,
                        isRTL ? styles.posLeft : styles.posRight,
                        !isRTL && styles.flipX
                    )}
                    priority
                    fill
                    sizes="(min-width: 1024px) 50vw, (min-width: 768px) 60vw, 100vw"
                />
            </div>
            <Container
                className={clsx(
                    styles.container,
                    isRTL ? styles.containerRtl : styles.containerLtr
                )}
            >
                <div
                    className={clsx(
                        styles.text,
                        isRTL ? styles.textRtl : styles.textLtr
                    )}
                >
                    <span className="text-eyebrow">{hero.cta[locale]}</span>
                    <h1 className="text-display font-heading">
                        {hero.title[locale]}
                    </h1>
                    <p className="text-lead">{hero.subtitle[locale]}</p>
                    <p
                        className={clsx(
                            "mt-4 text-xl text-primary",
                            locale === "ar"
                                ? "font-signature-arabic"
                                : "font-signature-latin"
                        )}
                    >
                        {locale === "ar" ? "و شكرا" : "— with gratitude"}
                    </p>
                    <div
                        className={clsx(
                            "mt-10 flex flex-wrap items-center gap-6",
                            isRTL ? "justify-end" : "justify-start"
                        )}
                    >
                        <Image
                            src="/images/logo.png"
                            alt="Logo"
                            width={120}
                            height={120}
                            className="h-28 w-auto"
                        />
                    </div>
                </div>
            </Container>
        </section>
    );
};
