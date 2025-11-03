"use client";

const TRACK_TRANSITION_IDLE = "height 240ms ease-out, transform 240ms ease-out";
const TRACK_TRANSITION_DRAG = "height 240ms ease-out, transform 0s";
const TRACK_TRANSITION_RELEASE =
    "height 240ms ease-out, transform 260ms ease-out";
const TRACK_TRANSITION_TIMEOUT = 300;

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition, LocalizedTestimonial } from "../types";
import { useTestimonialLayout } from "../hooks/useTestimonialLayout";

export const HomeTestimonials: HomeThemeDefinition["Testimonials"] = ({
    testimonials,
    meta,
    ui,
    locale,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [maxVisibleHeight, setMaxVisibleHeight] = useState<number | null>(
        null
    );
    const trackRef = useRef<HTMLDivElement>(null);
    const cardObserversRef = useRef<Map<number, ResizeObserver>>(new Map());
    const cardHeightsRef = useRef<Map<number, number>>(new Map());
    const transitionTimeoutRef = useRef<number | null>(null);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    const isRTL = locale === "ar";
    const { getLayout, isMobile } = useTestimonialLayout({ isRTL });
    const testimonialCount = testimonials.length;

    // Localized content
    const eyebrow = meta.eyebrow[locale];
    const sectionTitle = ui.testimonials;

    // Navigation handlers
    const handlePrevious = useCallback(() => {
        setCurrentIndex(
            (prev) => (prev - 1 + testimonialCount) % testimonialCount
        );
    }, [testimonialCount]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonialCount);
    }, [testimonialCount]);

    const handleDotClick = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    // Touch/drag handlers
    const applyDragOffset = useCallback((offset: number) => {
        if (!trackRef.current) return;
        trackRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
    }, []);

    const resetDragOffset = useCallback(() => {
        if (!trackRef.current) return;
        trackRef.current.style.transition = TRACK_TRANSITION_RELEASE;
        trackRef.current.style.transform = "translate3d(0, 0, 0)";
        if (transitionTimeoutRef.current) {
            window.clearTimeout(transitionTimeoutRef.current);
        }
        transitionTimeoutRef.current = window.setTimeout(() => {
            if (trackRef.current) {
                trackRef.current.style.transition = TRACK_TRANSITION_IDLE;
            }
            transitionTimeoutRef.current = null;
        }, TRACK_TRANSITION_TIMEOUT);
    }, []);

    const handleStart = useCallback((clientX: number) => {
        setIsDragging(true);
        startXRef.current = clientX;
        currentXRef.current = clientX;
        if (trackRef.current) {
            trackRef.current.style.transition = TRACK_TRANSITION_DRAG;
        }
    }, []);

    const handleMove = useCallback(
        (clientX: number) => {
            if (!isDragging) return;
            currentXRef.current = clientX;
            const deltaX = clientX - startXRef.current;
            const offset = (isRTL ? -deltaX : deltaX) * 0.35;
            applyDragOffset(offset);
        },
        [applyDragOffset, isDragging, isRTL]
    );

    const handleEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        const deltaX = currentXRef.current - startXRef.current;
        const threshold = 50;

        if (Math.abs(deltaX) > threshold) {
            if (isRTL) {
                if (deltaX > 0) handleNext();
                else handlePrevious();
            } else {
                if (deltaX > 0) handlePrevious();
                else handleNext();
            }
        }

        resetDragOffset();
    }, [handleNext, handlePrevious, isDragging, isRTL, resetDragOffset]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                isRTL ? handleNext() : handlePrevious();
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                isRTL ? handlePrevious() : handleNext();
            }
        },
        [handlePrevious, handleNext, isRTL]
    );

    useEffect(() => {
        const observersSnapshot = cardObserversRef.current;
        const trackSnapshot = trackRef.current;
        const heightsSnapshot = cardHeightsRef.current;
        return () => {
            observersSnapshot.forEach((observer) => observer.disconnect());
            observersSnapshot.clear();
            heightsSnapshot.clear();
            if (transitionTimeoutRef.current) {
                window.clearTimeout(transitionTimeoutRef.current);
                transitionTimeoutRef.current = null;
            }
            if (trackSnapshot) {
                trackSnapshot.style.transition = TRACK_TRANSITION_IDLE;
                trackSnapshot.style.transform = "";
            }
        };
    }, []);

    // Generate initials from name
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const updateVisibleHeight = useCallback(
        (heights: Map<number, number>) => {
            if (!testimonialCount) {
                setMaxVisibleHeight(null);
                return;
            }

            const visibleIndices = new Set<number>();
            visibleIndices.add(currentIndex);
            if (testimonialCount > 1) {
                visibleIndices.add(
                    (currentIndex - 1 + testimonialCount) % testimonialCount
                );
                visibleIndices.add((currentIndex + 1) % testimonialCount);
            }

            let tallest = 0;
            heights.forEach((height) => {
                if (height && height > tallest) {
                    tallest = height;
                }
            });

            if (!tallest) {
                visibleIndices.forEach((idx) => {
                    const height = heights.get(idx);
                    if (height && height > tallest) {
                        tallest = height;
                    }
                });
            }

            setMaxVisibleHeight(tallest > 0 ? tallest : null);
        },
        [currentIndex, testimonialCount]
    );

    useEffect(() => {
        updateVisibleHeight(cardHeightsRef.current);
    }, [currentIndex, testimonialCount, updateVisibleHeight]);

    const handleCardRef = useCallback(
        (index: number, node: HTMLElement | null) => {
            const existingObserver = cardObserversRef.current.get(index);
            if (existingObserver) {
                existingObserver.disconnect();
                cardObserversRef.current.delete(index);
            }
            if (!node) {
                cardHeightsRef.current.delete(index);
                updateVisibleHeight(cardHeightsRef.current);
                return;
            }

            const measure = () => {
                const rect = node.getBoundingClientRect();
                if (rect.height) {
                    cardHeightsRef.current.set(index, Math.ceil(rect.height));
                    updateVisibleHeight(cardHeightsRef.current);
                }
            };

            if (typeof window !== "undefined" && "ResizeObserver" in window) {
                const observer = new ResizeObserver((entries) => {
                    const entry = entries[0];
                    if (entry) {
                        cardHeightsRef.current.set(
                            index,
                            Math.ceil(entry.contentRect.height)
                        );
                        updateVisibleHeight(cardHeightsRef.current);
                    }
                });
                observer.observe(node);
                cardObserversRef.current.set(index, observer);
            }

            measure();
        },
        [updateVisibleHeight]
    );

    // Render testimonial card
    const renderTestimonialCard = (
        testimonial: LocalizedTestimonial,
        index: number
    ) => {
        const layout = getLayout({
            index,
            currentIndex,
            count: testimonialCount,
        });

        if (!layout.visible) {
            return null;
        }

        const quoteLineHeight = isRTL ? 1.75 : 1.6;
        const initials = getInitials(testimonial.name);
        const isActive = index === currentIndex;

        return (
            <article
                key={testimonial.id}
                className={layout.className}
                style={layout.style}
                role="group"
                aria-roledescription="testimonial"
                aria-label={`Testimonial from ${testimonial.name}`}
                ref={(node) => {
                    if (layout.visible) {
                        handleCardRef(index, node);
                    }
                }}
            >
                <div
                    className="relative grid h-full w-full rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 bg-white"
                    style={{
                        border: "1px solid rgba(42, 214, 202, 0.12)",
                        boxShadow:
                            "0 16px 32px rgba(3, 35, 32, 0.1), 0 4px 12px rgba(3, 35, 32, 0.06)",
                        minHeight:
                            maxVisibleHeight != null
                                ? `${maxVisibleHeight}px`
                                : undefined,

                        alignItems: "stretch",
                    }}
                >
                    {/* Decorative quote marks in corners */}
                    <div className="absolute top-8 left-8 opacity-[0.06] pointer-events-none">
                        <svg
                            width="40"
                            height="30"
                            viewBox="0 0 48 36"
                            fill="currentColor"
                            className="text-[#2AD6CA]"
                        >
                            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z" />
                        </svg>
                    </div>

                    <div className="absolute bottom-8 right-8 opacity-[0.06] pointer-events-none rotate-180">
                        <svg
                            width="40"
                            height="30"
                            viewBox="0 0 48 36"
                            fill="currentColor"
                            className="text-[#2AD6CA]"
                        >
                            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z" />
                        </svg>
                    </div>

                    <div className="relative grid h-full w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-6 px-6 py-10 md:gap-8 md:px-10 md:py-14 lg:px-12 lg:py-16">
                        {/* Avatar with initials */}
                        <div className="flex items-start justify-center">
                            {testimonial.image ? (
                                <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#2AD6CA]/20 shadow-sm md:h-20 md:w-20">
                                    <Image
                                        src={testimonial.image}
                                        alt={`Portrait of ${testimonial.name}`}
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                        priority={index === currentIndex}
                                    />
                                </div>
                            ) : (
                                <div
                                    className="flex h-14 w-14 items-center justify-center rounded-full text-[#2AD6CA] md:h-16 md:w-16"
                                    style={{ background: "#E9F9F7" }}
                                >
                                    <span className="text-base font-semibold md:text-lg">
                                        {initials}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Quote */}
                        <div className="flex items-center justify-center">
                            <blockquote
                                className="w-full max-w-full px-2 text-center"
                                dir={isRTL ? "rtl" : "ltr"}
                            >
                                <p
                                    className="text-quote mb-0 text-center text-[#0E2D2A] text-[1.03rem] md:text-[1.35rem] lg:text-[1.45rem] xl:text-[1.55rem] whitespace-pre-line"
                                    style={{ lineHeight: quoteLineHeight }}
                                >
                                    {testimonial.quote}
                                </p>
                            </blockquote>
                        </div>

                        {/* Attribution */}
                        <footer className="flex flex-col items-center text-center">
                            <div className="mx-auto mb-6 h-px w-12 bg-[#2AD6CA] md:mb-5" />
                            <cite className="not-italic">
                                <div className="heading-3 mb-1 text-[#0E2D2A] md:mb-2 md:text-[1.35rem] lg:text-[1.45rem]">
                                    {testimonial.name}
                                </div>
                                {testimonial.role && (
                                    <div className="text-sm font-normal text-[#4E716D] md:text-[0.85rem] md:font-light lg:text-[0.95rem]">
                                        {testimonial.role}
                                    </div>
                                )}
                            </cite>
                        </footer>
                    </div>
                </div>
            </article>
        );
    };

    if (!testimonials.length) {
        return null;
    }

    const showArrows = testimonialCount > 1;
    const showDots = testimonialCount > 1;
    const verticalBuffer = isMobile ? 96 : 120;
    const fallbackHeight = isMobile ? 540 : 700;
    const containerHeight =
        maxVisibleHeight != null
            ? maxVisibleHeight + verticalBuffer
            : fallbackHeight;

    return (
        <Section
            id="testimonials"
            className="relative overflow-hidden bg-gradient-to-b "
            data-analytics-section="Testimonials"
        >
            <Container>
                <div
                    className="text-center space-y-10 md:space-y-8 lg:space-y-9 relative z-10"
                    role="region"
                    aria-label="Customer testimonials"
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    {/* Section header */}
                    <div className="space-y-3 md:space-y-4">
                        <h2 className="text-section-title text-[#0E2D2A]">
                            {sectionTitle}
                        </h2>
                        <div className="w-12 h-0.5 bg-[#2AD6CA] mx-auto" />
                    </div>

                    {/* Carousel Container */}
                    <div className="relative w-full max-w-[1400px] mx-auto">
                        {/* Carousel Track */}
                        <div
                            ref={trackRef}
                            className="relative flex justify-center items-center overflow-visible pt-10 pb-8 md:pt-8 md:pb-8"
                            onMouseDown={(e) => handleStart(e.clientX)}
                            onMouseMove={(e) => {
                                if (isDragging) {
                                    e.preventDefault();
                                    handleMove(e.clientX);
                                }
                            }}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                            onTouchStart={(e) => {
                                handleStart(e.touches[0].clientX);
                            }}
                            onTouchMove={(e) => {
                                if (isDragging) {
                                    e.preventDefault();
                                    handleMove(e.touches[0].clientX);
                                }
                            }}
                            onTouchEnd={handleEnd}
                            onTouchCancel={handleEnd}
                            style={{
                                cursor: isDragging ? "grabbing" : "grab",
                                height: `${containerHeight}px`,
                                transition: "height 240ms ease-out",
                            }}
                        >
                            {testimonials.map((testimonial, index) =>
                                renderTestimonialCard(testimonial, index)
                            )}
                        </div>

                        {/* Navigation Arrows */}
                        {showArrows && (
                            <>
                                <button
                                    onClick={
                                        isRTL ? handleNext : handlePrevious
                                    }
                                    disabled={testimonialCount <= 1}
                                    className="absolute left-8 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/60 bg-white/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1/2 hover:border-[#2AD6CA]/30 hover:bg-white hover:text-[#2AD6CA] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 disabled:cursor-not-allowed disabled:opacity-30 md:flex w-12 h-12 text-[#4E716D]"
                                    aria-label={
                                        isRTL
                                            ? "الشهادة التالية"
                                            : "Previous testimonial"
                                    }
                                >
                                    <svg
                                        className={`w-4 h-4 `}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>

                                <button
                                    onClick={
                                        isRTL ? handlePrevious : handleNext
                                    }
                                    disabled={testimonialCount <= 1}
                                    className="absolute right-8 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/60 bg-white/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1/2 hover:border-[#2AD6CA]/30 hover:bg-white hover:text-[#2AD6CA] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 disabled:cursor-not-allowed disabled:opacity-30 md:flex w-12 h-12 text-[#4E716D]"
                                    aria-label={
                                        isRTL
                                            ? "الشهادة السابقة"
                                            : "Next testimonial"
                                    }
                                >
                                    <svg
                                        className={`w-4 h-4 `}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Navigation Dots */}
                        {showDots && (
                            <div
                                className="flex justify-center items-center gap-2 pt-16 md:pt-14"
                                role="tablist"
                                aria-label="Testimonial navigation"
                            >
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleDotClick(index)}
                                        className={`
                      w-2 h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50
                      ${
                          index === currentIndex
                              ? "bg-[#2AD6CA] scale-150"
                              : "bg-[#D7E8E6] hover:bg-[#2AD6CA]/50 hover:scale-125"
                      }
                    `}
                                        aria-label={`Go to testimonial ${
                                            index + 1
                                        }`}
                                        aria-selected={index === currentIndex}
                                        role="tab"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Live region for screen readers */}
                    <div
                        className="sr-only"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        Testimonial {currentIndex + 1} of {testimonialCount}:{" "}
                        {testimonials[currentIndex]?.name}
                    </div>
                </div>
            </Container>
        </Section>
    );
};
