import clsx from "classnames";
import ReactMarkdown from "react-markdown";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "../types";

export const HomeAbout: HomeThemeDefinition["About"] = ({
    locale,
    media,
    about,
    markdown,
}) => {
    const isRTL = locale === "ar";

    const headline = about.headline[locale];

    const video = media.videos[0];

    return (
        <Section id="about" className="bg-background">
            <Container className="pt-20 pb-16 sm:pt-24 sm:pb-20 md:pt-24 md:pb-24">
                {/* Unified content block with RTL-specific styling */}
                <div
                    className={clsx(
                        "mx-auto flex w-full max-w-[92vw] flex-col items-center text-center gap-12 sm:max-w-[560px] md:max-w-4xl lg:max-w-5xl lg:px-8 xl:max-w-6xl xl:px-12",
                        isRTL ? "lg:gap-14" : "lg:gap-16"
                    )}
                    dir={isRTL ? "rtl" : "ltr"}
                >
                    {/* Quote headline */}
                    <h2 className="text-section-title text-center break-words">
                        {headline}
                    </h2>

                    {/* Narrative with inline link */}
                    <div
                        className={clsx(
                            "mx-auto w-full px-4 text-center sm:px-6 lg:px-10 xl:px-12",
                            isRTL
                                ? "max-w-[40ch] lg:max-w-[72ch]"
                                : "max-w-[36ch] lg:max-w-[70ch]"
                        )}
                    >
                        <div
                            className={clsx(
                                "mb-8 flex flex-col items-center text-left sm:text-center",
                                isRTL
                                    ? "space-y-6 text-[#444]"
                                    : "space-y-5"
                            )}
                            dir={isRTL ? "rtl" : "ltr"}
                        >
                            <ReactMarkdown
                                components={{
                                    p: ({ children }) => (
                                        <p
                                            className={clsx(
                                                "m-0 text-center",
                                                "first:relative first:mx-auto first:max-w-[92%] first:text-[clamp(1.05rem,4vw,1.2rem)] first:font-medium first:pb-5 first:after:absolute first:after:left-1/2 first:after:top-full first:after:h-[1px] first:after:w-12 first:after:-translate-x-1/2 first:after:bg-current",
                                                isRTL
                                                    ? "text-[clamp(0.9rem,3.2vw,1.05rem)] leading-[1.6]"
                                                    : "text-[clamp(1rem,3.6vw,1.12rem)] leading-[1.6]"
                                            )}
                                        >
                                            {children}
                                        </p>
                                    ),
                                    strong: ({ children }) => (
                                        <strong className="font-semibold">{children}</strong>
                                    ),
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    ol: ({ children }) => (
                                        <ol
                                            className={clsx(
                                                "list-decimal space-y-3 pl-6 text-start",
                                                isRTL && "pl-0 pr-6 text-right"
                                            )}
                                            dir={isRTL ? "rtl" : "ltr"}
                                        >
                                            {children}
                                        </ol>
                                    ),
                                    ul: ({ children }) => (
                                        <ul
                                            className={clsx(
                                                "list-disc space-y-3 pl-6 text-start",
                                                isRTL && "pl-0 pr-6 text-right"
                                            )}
                                            dir={isRTL ? "rtl" : "ltr"}
                                        >
                                            {children}
                                        </ul>
                                    ),
                                    li: ({ children }) => (
                                        <li className="text-center sm:text-left">
                                            {children}
                                        </li>
                                    ),
                                    a: ({ children, href }) => (
                                        <a
                                            href={href}
                                            className="text-subtle hover:text-primary transition-colors duration-200 border-b border-transparent hover:border-primary"
                                            target={href?.startsWith("http") ? "_blank" : undefined}
                                            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                                        >
                                            {children}
                                        </a>
                                    ),
                                }}
                            >
                                {markdown}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Video block with RTL-specific spacing */}
                {video && (
                    <div
                        className={clsx(
                            "text-center space-y-4",
                            isRTL ? "mt-6 pb-16" : "mt-10 pb-12"
                        )}
                        dir={isRTL ? "rtl" : "ltr"}
                    >
                        {/* Video embed */}
                        <div className="flex justify-center">
                            <div className="w-full max-w-2xl">
                                <VideoEmbed
                                    videoId={video.id}
                                    title={video.title[locale]}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Container>
        </Section>
    );
};
