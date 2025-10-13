import Image from "next/image";
import clsx from "classnames";
import ReactMarkdown from "react-markdown";
import { Container } from "@/components/Container";
import type { HomeThemeDefinition } from "../types";
import styles from "./HomeHero.module.css";

export const HomeHero: HomeThemeDefinition["Hero"] = ({ hero, locale, copy }) => {
    const isRTL = locale === "ar";
    const signature = hero.signature[locale];

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
                    isRTL ? styles.containerRtl : styles.containerLtr,
                    "pt-[12px] md:pt-[18px]"
                )}
            >
                <div
                    className={clsx(
                        styles.text,
                        isRTL ? styles.textRtl : styles.textLtr
                    )}
                >
                    <h1 className="text-display font-heading leading-[1.2]">
                        {hero.title[locale]}
                    </h1>
                    <div
                        className={clsx(
                            styles.copy,
                            isRTL ? styles.copyRtl : styles.copyLtr
                        )}
                        dir={isRTL ? "rtl" : "ltr"}
                    >
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p>{children}</p>,
                                strong: ({ children }) => <strong>{children}</strong>,
                                em: ({ children }) => <em>{children}</em>,
                                ol: ({ children }) => <ol>{children}</ol>,
                                ul: ({ children }) => <ul>{children}</ul>,
                                li: ({ children }) => <li>{children}</li>,
                            }}
                        >
                            {copy}
                        </ReactMarkdown>
                    </div>
                    <p
                        className={clsx(
                            "mt-4 text-xl text-primary",
                            locale === "ar"
                                ? "font-signature-arabic"
                                : "font-signature-latin"
                        )}
                    >
                        {signature}
                    </p>
                </div>
            </Container>
        </section>
    );
};
