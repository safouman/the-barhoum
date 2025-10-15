import Image from "next/image";
import clsx from "classnames";
import ReactMarkdown from "react-markdown";
import { Container } from "@/components/Container";
import type { HomeThemeDefinition } from "../types";
import styles from "./HomeHero.module.css";

export const HomeHero: HomeThemeDefinition["Hero"] = ({
    hero,
    locale,
    copy,
}) => {
    const isRTL = locale === "ar";
    const signature = hero.signature[locale];

    return (
        <section
            className={clsx(
                styles.hero,
                isRTL ? styles.heroRtl : styles.heroLtr
            )}
        >
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
                    src="/images/hero.jpeg"
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
                <span
                    className={clsx(
                        styles.edgeFade,
                        isRTL ? styles.edgeFadeRtl : styles.edgeFadeLtr
                    )}
                />
            </div>
            <Container
                className={clsx(
                    styles.container,
                    isRTL ? styles.containerRtl : styles.containerLtr
                )}
            >
                <div className={styles.heroContent}>
                    <div
                        className={clsx(
                            styles.text,
                            isRTL ? styles.textRtl : styles.textLtr
                        )}
                    >
                        <h1 className="text-display">
                            {hero.title[locale]}
                        </h1>
                        <div className="text-lead space-y-4" dir={isRTL ? "rtl" : "ltr"}>
                            <ReactMarkdown
                                components={{
                                    p: ({ children }) => <p className="m-0">{children}</p>,
                                    strong: ({ children }) => (
                                        <strong className="font-semibold">{children}</strong>
                                    ),
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    ol: ({ children }) => (
                                        <ol
                                            className={clsx(
                                                "list-decimal space-y-3 pl-6",
                                                isRTL && "pl-0 pr-6"
                                            )}
                                            dir={isRTL ? "rtl" : "ltr"}
                                        >
                                            {children}
                                        </ol>
                                    ),
                                    ul: ({ children }) => (
                                        <ul
                                            className={clsx(
                                                "list-disc space-y-3 pl-6",
                                                isRTL && "pl-0 pr-6"
                                            )}
                                            dir={isRTL ? "rtl" : "ltr"}
                                        >
                                            {children}
                                        </ul>
                                    ),
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
                </div>
            </Container>
        </section>
    );
};
