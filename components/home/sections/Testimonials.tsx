"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";
import { useTestimonialLayout } from "../hooks/useTestimonialLayout";

export const HomeTestimonials: HomeThemeDefinition["Testimonials"] = ({
    testimonials,
    meta,
    ui,
    locale,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    const autoPlayRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const { getLayout } = useTestimonialLayout();

    const isRTL = locale === "ar";
    const testimonialCount = testimonials.length;

    // Localized content
    const eyebrow = meta.eyebrow[locale];
    const sectionTitle = ui.testimonials;
    const ctaText = meta.cta[locale];

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

    // Auto-play functionality
    const startAutoPlay = useCallback(() => {
        if (testimonialCount <= 1) return;
        autoPlayRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonialCount);
        }, 6000);
    }, [testimonialCount]);

    const stopAutoPlay = useCallback(() => {
        if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
            autoPlayRef.current = undefined;
        }
    }, []);

    // Touch/drag handlers
    const handleStart = useCallback(
        (clientX: number) => {
            setIsDragging(true);
            startXRef.current = clientX;
            currentXRef.current = clientX;
            stopAutoPlay();
        },
        [stopAutoPlay]
    );

    const handleMove = useCallback(
        (clientX: number) => {
            if (!isDragging) return;
            currentXRef.current = clientX;
        },
        [isDragging]
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

        startAutoPlay();
    }, [isDragging, handlePrevious, handleNext, isRTL, startAutoPlay]);

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

    // Auto-play lifecycle
    useEffect(() => {
        startAutoPlay();
        return () => stopAutoPlay();
    }, [startAutoPlay, stopAutoPlay]);

    // Generate initials from name
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Render testimonial card
    const renderTestimonialCard = (testimonial: any, index: number) => {
        const layout = getLayout({
            index,
            currentIndex,
            count: testimonialCount,
        });

        if (!layout.visible) {
            return null;
        }

        return (
            <article
                key={testimonial.id}
                className={layout.className}
                style={layout.style}
                role="group"
                aria-roledescription="testimonial"
                aria-label={`Testimonial from ${testimonial.name}`}
            >
                <div
                    className="relative h-full rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 flex flex-col justify-center"
                    style={{
                        background: "white",
                        border: "1px solid rgba(42, 214, 202, 0.12)",
                        boxShadow:
                            "0 16px 32px rgba(3, 35, 32, 0.1), 0 4px 12px rgba(3, 35, 32, 0.06)",
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

                    <div className="relative h-full flex flex-col justify-center px-6 py-10 md:px-10 md:py-14 lg:px-12 lg:py-16">
                        {/* Avatar with initials */}
                        <div className="flex justify-center mb-6 md:mb-8">
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-[#2AD6CA] font-semibold text-base"
                                style={{ background: "#E9F9F7" }}
                            >
                                {getInitials(testimonial.name)}
                            </div>
                        </div>

                        {/* Quote */}
                        <div className="flex-1 flex items-center justify-center mb-6 md:mb-6">
                            <blockquote
                                className="text-center max-w-full px-2"
                                dir={isRTL ? "rtl" : "ltr"}
                            >
                                <p className="text-quote mb-0 text-center text-[#0E2D2A] md:text-[1.4rem] lg:text-[1.55rem] xl:text-[1.65rem] md:leading-relaxed">
                                    {testimonial.quote}
                                </p>
                            </blockquote>
                        </div>

                        {/* Attribution */}
                        <footer className="text-center">
                            <div className="w-12 h-px bg-[#2AD6CA] mx-auto mb-6 md:mb-5" />
                            <cite className="not-italic">
                                <div className="heading-3 text-[#0E2D2A] mb-1 md:mb-2 md:text-[1.35rem] lg:text-[1.45rem]">
                                    {testimonial.name}
                                </div>
                                {testimonial.role && (
                                    <div className="text-[#4E716D] text-sm font-normal md:font-light md:text-[0.85rem] lg:text-[0.95rem]">
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
                    onMouseEnter={stopAutoPlay}
                    onMouseLeave={startAutoPlay}
                >
                    {/* Section header */}
                    <div className="space-y-3 md:space-y-4">
                        <h2 className="text-section-title text-[#0E2D2A]">
                            {sectionTitle}
                        </h2>
                        <div className="w-12 h-0.5 bg-[#2AD6CA] mx-auto" />
                        <p className="text-eyebrow text-[#4E716D]">
                            {eyebrow}
                        </p>
                    </div>

                    {/* Carousel Container */}
                    <div className="relative w-full max-w-[1400px] mx-auto">
                        {/* Carousel Track */}
                        <div
                            ref={trackRef}
                            className="relative h-[520px] md:h-[540px] lg:h-[560px] overflow-visible flex justify-center items-center pt-10 pb-8 md:pt-6 md:pb-6"
                            onMouseDown={(e) => handleStart(e.clientX)}
                            onMouseMove={(e) => handleMove(e.clientX)}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                            onTouchStart={(e) =>
                                handleStart(e.touches[0].clientX)
                            }
                            onTouchMove={(e) =>
                                handleMove(e.touches[0].clientX)
                            }
                            onTouchEnd={handleEnd}
                            style={{ cursor: isDragging ? "grabbing" : "grab" }}
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
                                    className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA]/30 hover:shadow-lg hover:bg-white transition-all duration-200 flex items-center justify-center text-[#4E716D] hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-40 disabled:opacity-30 disabled:cursor-not-allowed"
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
                                    className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA]/30 hover:shadow-lg hover:bg-white transition-all duration-200 flex items-center justify-center text-[#4E716D] hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-40 disabled:opacity-30 disabled:cursor-not-allowed"
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
                                className="flex justify-center items-center gap-2 pt-24 md:pt-20"
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
