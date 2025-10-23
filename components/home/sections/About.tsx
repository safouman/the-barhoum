"use client";

import clsx from "classnames";
import {
    Children,
    cloneElement,
    isValidElement,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
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
    title: ReactNode[];
    description: ReactNode[];
};

const easingClass = "ease-[cubic-bezier(0.16,1,0.3,1)]";
const desktopMediaQuery = "(min-width: 768px)";
const cardBaseClasses =
    "rounded-[18px] border border-border/40 bg-white/90 shadow-[0_26px_48px_-28px_rgba(15,23,42,0.18)]";

const findFirstStrongNode = (
    nodes: ReactNode[]
): ReactElement<{ children?: ReactNode }> | null => {
    for (const node of nodes) {
        if (!isValidElement(node)) {
            if (Array.isArray(node)) {
                const result = findFirstStrongNode(node);
                if (result) return result;
            }
            continue;
        }

        if (node.type === "strong") {
            return node as ReactElement<{ children?: ReactNode }>;
        }

        if ('props' in node && node.props && typeof node.props === 'object' && 'children' in node.props) {
            const childNodes = Children.toArray(node.props.children as ReactNode);
            const result = findFirstStrongNode(childNodes);
            if (result) return result;
        }
    }

    return null;
};

const findFirstContentNode = (nodes: ReactNode[]): ReactNode | null => {
    for (const node of nodes) {
        if (node === null || node === undefined || typeof node === "boolean") {
            continue;
        }
        if (typeof node === "string" && node.trim().length === 0) {
            continue;
        }
        return node;
    }

    return null;
};

const removeLeadingWhitespace = (nodes: ReactNode[]): ReactNode[] =>
    nodes.filter((node) => {
        if (typeof node === "string") {
            return node.trim().length > 0;
        }
        return node !== null && node !== undefined && node !== false;
    });

const AccordionList = ({ children, isRTL }: AccordionListProps) => {
    const items = useMemo(() => {
        const result: AccordionItem[] = [];

        Children.toArray(children).forEach((child, index) => {
            if (!isValidElement(child)) return;
            if (!('props' in child) || !child.props || typeof child.props !== 'object') return;
            const childElement = child as React.ReactElement<{ children?: ReactNode }>;
            const childNodes = Children.toArray(childElement.props.children as ReactNode);
            if (childNodes.length === 0) return;

            const trimmedNodes = childNodes.filter((node) => {
                if (typeof node === "string") {
                    return node.trim().length > 0;
                }
                return node !== null && node !== undefined;
            });

            if (trimmedNodes.length === 0) return;

            const strongNode = findFirstStrongNode(trimmedNodes);

            const rawTitleNodes =
                strongNode && isValidElement(strongNode)
                    ? Children.toArray((strongNode as ReactElement<{ children?: ReactNode }>).props.children as ReactNode)
                    : (() => {
                          const fallbackNode = findFirstContentNode(trimmedNodes);
                          if (!fallbackNode) return [];
                          if (isValidElement(fallbackNode) && 'props' in fallbackNode && fallbackNode.props && typeof fallbackNode.props === 'object' && 'children' in fallbackNode.props) {
                              return Children.toArray(fallbackNode.props.children as ReactNode);
                          }
                          return [fallbackNode];
                      })();

            const title = removeLeadingWhitespace(rawTitleNodes);

            const firstContentNode = findFirstContentNode(trimmedNodes);
            const firstContentIndex = firstContentNode
                ? trimmedNodes.findIndex(node => node === firstContentNode)
                : 0;

            let rawDescription: ReactNode[] = [];
            if (strongNode) {
                const directStrongIndex = trimmedNodes.findIndex(node => node === strongNode);
                if (directStrongIndex >= 0) {
                    rawDescription = trimmedNodes.slice(directStrongIndex + 1);
                } else {
                    const firstNode =
                        firstContentIndex >= 0 ? trimmedNodes[firstContentIndex] : null;
                    const restNodes = trimmedNodes.slice(firstContentIndex + 1);
                    rawDescription = [
                        ...(firstNode ? [firstNode] : []),
                        ...restNodes,
                    ];
                }
            } else {
                rawDescription = trimmedNodes.slice(firstContentIndex + 1);
            }

            const cleanedDescription = removeLeadingWhitespace(
                rawDescription.map((node, nodeIndex) => {
                    if (typeof node === "string") {
                        let text = node;
                        if (nodeIndex === 0) {
                            text = text.replace(/^\s*[-–—]\s*/, "");
                        }
                        return text.replace(/^\s+/, "");
                    }

                    if (strongNode && isValidElement(node) && node.type === "p" && 'props' in node && node.props && typeof node.props === 'object' && 'children' in node.props) {
                        const paragraphChildren = Children.toArray(node.props.children as ReactNode);
                        const remainingChildren = removeLeadingWhitespace(
                            paragraphChildren.filter(
                                (paragraphChild) => paragraphChild !== strongNode
                            )
                        );
                        if (remainingChildren.length === 0) {
                            return null;
                        }
                        return cloneElement(node as ReactElement<{ children?: ReactNode }>, {
                            children: remainingChildren,
                        });
                    }

                    return node;
                })
            );

            result.push({
                key: childElement.key ?? index,
                title,
                description: cleanedDescription,
            });
        });

        return result;
    }, [children]);

    const [openIndexes, setOpenIndexes] = useState<number[]>([]);
    const [isDesktop, setIsDesktop] = useState(false);
    const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const lastOpenedRef = useRef<number | null>(null);
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return;
        }
        const mediaQuery = window.matchMedia(desktopMediaQuery);
        const updateMatch = (eventOrMedia: MediaQueryList | MediaQueryListEvent) => {
            setIsDesktop(eventOrMedia.matches);
        };
        updateMatch(mediaQuery);

        const listener = (event: MediaQueryListEvent) => updateMatch(event);

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", listener);
        } else {
            mediaQuery.addListener(listener);
        }

        return () => {
            if (typeof mediaQuery.removeEventListener === "function") {
                mediaQuery.removeEventListener("change", listener);
            } else {
                mediaQuery.removeListener(listener);
            }
        };
    }, []);

    useEffect(() => {
        triggerRefs.current = triggerRefs.current.slice(0, items.length);
        setOpenIndexes((prev) => prev.filter((index) => index < items.length));
    }, [items.length]);

    useEffect(() => {
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            return;
        }
        if (!isDesktop) return;
        setOpenIndexes((prev) => {
            if (prev.length <= 1) return prev;
            const latest = prev[prev.length - 1];
            return [latest];
        });
    }, [isDesktop]);

    const scrollItemIntoView = useCallback((index: number) => {
        if (typeof window === "undefined") return;
        const target = triggerRefs.current[index];
        if (!target) return;
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
        const rect = target.getBoundingClientRect();
        const viewportHeight =
            window.innerHeight || document.documentElement.clientHeight;
        const topComfort = 72;
        const bottomComfort = viewportHeight - 56;
        if (rect.top >= topComfort && rect.bottom <= bottomComfort) return;

        const targetOffset = Math.max(rect.top + window.scrollY - topComfort, 0);
        window.scrollTo({
            top: targetOffset,
            behavior: prefersReducedMotion ? "auto" : "smooth",
        });
    }, []);

    useEffect(() => {
        const lastOpened = lastOpenedRef.current;
        if (lastOpened === null) return;
        if (!openIndexes.includes(lastOpened)) return;
        scrollItemIntoView(lastOpened);
    }, [openIndexes, scrollItemIntoView]);

    const toggleItem = useCallback(
        (index: number) => {
            setOpenIndexes((prev) => {
                const isAlreadyOpen = prev.includes(index);

                if (isAlreadyOpen) {
                    lastOpenedRef.current = null;
                    return [];
                }

                lastOpenedRef.current = index;
                return [index];
            });
        },
        []
    );

    const handleKeyNavigation = useCallback(
        (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
            const total = items.length;
            if (total === 0) return;
            let targetIndex: number | null = null;

            if (
                event.key === "ArrowDown" ||
                (!isRTL && event.key === "ArrowRight") ||
                (isRTL && event.key === "ArrowLeft")
            ) {
                targetIndex = (index + 1) % total;
            } else if (
                event.key === "ArrowUp" ||
                (!isRTL && event.key === "ArrowLeft") ||
                (isRTL && event.key === "ArrowRight")
            ) {
                targetIndex = (index - 1 + total) % total;
            } else if (event.key === "Home") {
                targetIndex = 0;
            } else if (event.key === "End") {
                targetIndex = total - 1;
            }

            if (targetIndex !== null) {
                event.preventDefault();
                const nextTrigger = triggerRefs.current[targetIndex];
                nextTrigger?.focus();
            }
        },
        [isRTL, items.length]
    );

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
                "w-full space-y-3 sm:space-y-4",
                "md:mx-auto",
                isRTL ? "lg:w-[110%] lg:max-w-none" : "lg:w-[112%] lg:max-w-none"
            )}
            dir={isRTL ? "rtl" : "ltr"}
            role="list"
        >
            {items.map((item, index) => {
                const isOpen = openIndexes.includes(index);
                const contentId = `about-accordion-panel-${index}`;
                const triggerId = `about-accordion-trigger-${index}`;
                return (
                    <div
                        key={item.key}
                        className={clsx(
                            "relative overflow-hidden transition-shadow duration-200",
                            "before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:rounded-t-[18px] before:bg-primary before:opacity-0 before:transition-opacity before:duration-200 before:ease-out before:content-['']",
                            cardBaseClasses,
                            isOpen
                                ? "shadow-[0_32px_56px_-32px_rgba(15,23,42,0.28),0_0_0_2px_rgba(42,214,202,0.15)] before:opacity-100"
                                : "shadow-[0_20px_42px_-34px_rgba(15,23,42,0.2)]"
                        )}
                        role="listitem"
                    >
                        <button
                            type="button"
                            onClick={() => toggleItem(index)}
                            className={clsx(
                                "flex w-full items-baseline gap-4 text-left transition-colors duration-200",
                                isRTL ? "px-6 py-[1.875rem]" : "px-6 py-7",
                                easingClass,
                                isRTL
                                    ? "flex-row-reverse text-right"
                                    : "flex-row text-left",
                                isOpen ? "bg-primary/8" : "bg-white/0 hover:bg-primary/3"
                            )}
                            aria-expanded={isOpen}
                            aria-controls={contentId}
                            id={triggerId}
                            onKeyDown={(event) => handleKeyNavigation(event, index)}
                            ref={(node) => {
                                triggerRefs.current[index] = node;
                            }}
                        >
                            <span
                                className={clsx(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-[transform,color,border-color,background-color] duration-300",
                                    easingClass,
                                    isOpen
                                        ? "border-primary/60 text-primary bg-primary/5 rotate-180"
                                        : "border-border/50 text-text/80 bg-white rotate-0",
                                    "self-baseline"
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
                            <span className="flex-1">
                                <span
                                    className={clsx(
                                        "leading-tight font-semibold transition-colors duration-200",
                                        isOpen ? "text-primary" : "text-text",
                                        isRTL
                                            ? "text-[clamp(1.07rem,3.1vw,1.24rem)]"
                                            : "text-[clamp(1.02rem,3vw,1.18rem)]"
                                    )}
                                >
                                    {item.title}
                                </span>
                            </span>
                        </button>
                        <div
                            className={clsx(
                                "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out",
                                isOpen
                                    ? "grid-rows-[1fr]"
                                    : "grid-rows-[0fr]"
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
                                            "accordion-prose transition-opacity ease-out",
                                            isRTL
                                                ? "px-6 pb-[1.875rem] pt-3 duration-[180ms] font-light"
                                                : "px-6 pb-7 pt-3 duration-200",
                                            isRTL ? "text-right" : "text-left",
                                            isOpen ? "opacity-100" : "opacity-0"
                                        )}
                                    >
                                        {Children.toArray(item.description)}
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
                            "mx-auto w-full px-4 text-center sm:px-6 lg:px-10 xl:px-12 flex flex-col items-center",
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
