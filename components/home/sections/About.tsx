import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "../types";

export const HomeAbout: HomeThemeDefinition["About"] = ({
    locale,
    media,
    about,
}) => {
    const isRTL = locale === "ar";

    const headline = about.headline[locale];
    const narrative = about.narrative[locale];
    const linkText = about.link.label[locale];
    const linkArrow = isRTL ? " ←" : " →";

    const pdfs = media.pdfs.length
        ? media.pdfs
        : Array.from({ length: 1 }, () => ({
              url: "#",
              label: { en: "Guided approach", ar: "ملف تعريفي" },
          }));

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
                        >
                            {narrative
                                .split(/\n{2,}/)
                                .map((paragraph) => paragraph.trim())
                                .filter(Boolean)
                                .map((paragraph, index, paragraphs) => {
                                    const lines = paragraph.split(/\n/);
                                    const isLast =
                                        index === paragraphs.length - 1;
                                    return (
                                        <p key={index} className="m-0">
                                            {lines.map((line, lineIndex) => (
                                                <span key={lineIndex}>
                                                    {line}
                                                    {lineIndex <
                                                        lines.length - 1 && (
                                                        <br />
                                                    )}
                                                </span>
                                            ))}
                                            {/* {isLast && (
                        <>
                          {" — "}
                          <a
                            href={pdfs[0]?.url ?? "#"}
                            className="text-subtle hover:text-primary transition-colors duration-200 border-b border-transparent hover:border-primary"
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {linkText}
                            <span className="text-xs" aria-hidden="true">{linkArrow}</span>
                          </a>
                        </>
                      )} */}
                                        </p>
                                    );
                                })}
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
