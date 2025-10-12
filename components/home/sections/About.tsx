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
            <Container>
                {/* Unified content block with RTL-specific styling */}
                <div
                    className={clsx(
                        "mx-auto text-center",
                        isRTL ? "max-w-4xl space-y-7" : "max-w-4xl space-y-8"
                    )}
                    dir={isRTL ? "rtl" : "ltr"}
                >
                    {/* Quote headline */}
                    <h2
                        className={clsx(
                            "font-heading text-text text-center",
                            isRTL
                                ? "text-section-title font-semibold"
                                : "text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[1.3] font-medium"
                        )}
                    >
                        {headline}
                    </h2>

                    {/* Narrative with inline link */}
                    <div
                        className={clsx(
                            "mx-auto text-center",
                            isRTL ? "max-w-[65ch]" : "max-w-3xl"
                        )}
                    >
                        <div
                            className={clsx(
                                isRTL
                                    ? "text-body-lg text-[#444] mb-6 space-y-4"
                                    : "text-body-lg leading-relaxed space-y-4"
                            )}
                            dir={isRTL ? "rtl" : "ltr"}
                        >
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
                                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
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
                            "text-center space-y-3",
                            isRTL ? "mt-5 pb-14" : "mt-10 pb-10"
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
