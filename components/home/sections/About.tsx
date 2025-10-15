import clsx from "classnames";
import { Children, isValidElement, type ReactNode, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "../types";

type AccordionListProps = {
    children?: ReactNode;
    isRTL: boolean;
};

type AccordionItem = {
    key: string | number;
    title: ReactNode;
    description: ReactNode[];
};

const easingClass = "ease-[cubic-bezier(0.16,1,0.3,1)]";

const AccordionList = ({ children, isRTL }: AccordionListProps) => {
    const items = useMemo<AccordionItem[]>(() => {
        return Children.toArray(children)
            .map((child, index) => {
                if (!isValidElement(child)) return null;
                const childNodes = Children.toArray(child.props.children as ReactNode);
                if (childNodes.length === 0) return null;

                const strongIndex = childNodes.findIndex(
                    (node) => isValidElement(node) && node.type === "strong"
                );
                const strongNode =
                    strongIndex >= 0 && isValidElement(childNodes[strongIndex])
                        ? childNodes[strongIndex]
                        : null;

                const title =
                    strongNode && isValidElement(strongNode)
                        ? Children.toArray(strongNode.props.children as ReactNode)
                        : [childNodes[0]];

                const rawDescription =
                    strongIndex >= 0
                        ? childNodes.slice(strongIndex + 1)
                        : childNodes.slice(1);

                const cleanedDescription = rawDescription
                    .map((node, nodeIndex) => {
                        if (typeof node === "string") {
                            let text = node;
                            if (nodeIndex === 0) {
                                text = text.replace(/^\s*[-–—]\s*/u, "");
                            }
                            return text.replace(/^\s+/u, "");
                        }
                        return node;
                    })
                    .filter((node) => {
                        if (typeof node === "string") {
                            return node.trim().length > 0;
                        }
                        return node !== null && node !== undefined;
                    });

                return {
                    key: child.key ?? index,
                    title,
                    description: cleanedDescription,
                };
            })
            .filter((item): item is AccordionItem => item !== null);
    }, [children]);

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (items.length === 0) {
        return (
            <ol
                className={clsx(
                    "list-decimal space-y-3 pl-6 text-start",
                    isRTL && "pl-0 pr-6 text-right"
                )}
                dir={isRTL ? "rtl" : "ltr"}
            >
                {children}
            </ol>
        );
    }

    return (
        <div
            className={clsx(
                "w-full rounded-[18px] border border-border/40 bg-white/40 px-2 py-3 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.35)] backdrop-blur-[2px]",
                "space-y-2 sm:space-y-3"
            )}
            dir={isRTL ? "rtl" : "ltr"}
            role="list"
        >
            {items.map((item, index) => {
                const isOpen = openIndex === index;
                const contentId = `about-accordion-panel-${index}`;
                const triggerId = `about-accordion-trigger-${index}`;
                return (
                    <div
                        key={item.key}
                        className={clsx(
                            "overflow-hidden rounded-[14px] border border-border/40 bg-white/90 transition-shadow duration-200",
                            isOpen
                                ? "shadow-[0_18px_42px_-26px_rgba(15,23,42,0.35)]"
                                : "shadow-[0_6px_24px_-18px_rgba(15,23,42,0.25)]"
                        )}
                        role="listitem"
                    >
                        <button
                            type="button"
                            onClick={() =>
                                setOpenIndex((prev) => (prev === index ? null : index))
                            }
                            className={clsx(
                                "flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200",
                                easingClass,
                                isRTL ? "text-right" : "text-left",
                                isOpen ? "bg-primary/5" : "bg-transparent"
                            )}
                            aria-expanded={isOpen}
                            aria-controls={contentId}
                            id={triggerId}
                        >
                            <span
                                className={clsx(
                                    "text-[clamp(1.02rem,3vw,1.18rem)] font-semibold leading-tight text-text"
                                )}
                            >
                                {item.title}
                            </span>
                            <span
                                className={clsx(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/50 bg-white text-text transition-transform duration-300",
                                    easingClass,
                                    isOpen ? "rotate-180" : "rotate-0"
                                )}
                                aria-hidden
                            >
                                <svg
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M4.5 8.25L10 13.25L15.5 8.25"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        </button>
                        <div
                            className={clsx(
                                "grid overflow-hidden transition-all duration-300",
                                easingClass,
                                isOpen
                                    ? "grid-rows-[1fr] opacity-100"
                                    : "grid-rows-[0fr] opacity-0"
                            )}
                            id={contentId}
                            role="region"
                            aria-labelledby={triggerId}
                            aria-hidden={!isOpen}
                        >
                            <div className="overflow-hidden">
                                {item.description.length > 0 && (
                                    <div
                                        className={clsx(
                                            "px-5 pb-5 pt-0 text-[clamp(0.94rem,2.7vw,1.05rem)] leading-[1.75] text-subtle/90",
                                            isRTL ? "text-right" : "text-left"
                                        )}
                                    >
                                        <p className="m-0 whitespace-pre-line">
                                            {item.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

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
                                        <AccordionList isRTL={isRTL}>
                                            {children}
                                        </AccordionList>
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
