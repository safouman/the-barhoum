import { useState, useEffect } from "react";
import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomeTestimonials: HomeThemeDefinition["Testimonials"] = ({ 
  testimonials, 
  ui,
  locale
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const sectionTitle = ui.testimonials;
  const isRtl = locale === "ar";

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length, isPaused]);

  // Resume auto-play after user interaction
  useEffect(() => {
    if (userInteracted) {
      const timeout = setTimeout(() => {
        setIsAutoPlaying(true);
        setUserInteracted(false);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [userInteracted]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsAutoPlaying(false);
    }
  }, []);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setUserInteracted(true);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setUserInteracted(true);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false);
    setUserInteracted(true);
    setCurrentIndex(index);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    }
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!testimonials.length) {
    return (
      <Section id="testimonials" className="bg-background">
        <Container>
          <div className="text-center py-16">
            <p className="text-subtle">No testimonials available.</p>
          </div>
        </Container>
      </Section>
    );
  }

  const currentTestimonial = testimonials[currentIndex];
  const prevIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
  const nextIndex = (currentIndex + 1) % testimonials.length;

  return (
    <Section id="testimonials" className="bg-background relative overflow-hidden">
      {/* Background gradient band */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2AD6CA]/[0.02] to-transparent" />
      </div>

      <Container>
        <div 
          className="text-center space-y-12 relative z-10"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Section Header */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium tracking-[0.2em] uppercase text-text/80">
              {sectionTitle}
            </h2>
            <div className="w-16 h-px bg-[#2AD6CA] mx-auto" />
          </div>

          {/* Testimonials Container */}
          <div className="relative max-w-4xl mx-auto">
            {/* Neighbor cards (decorative depth) */}
            {testimonials.length > 1 && (
              <>
                {/* Previous card */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 pointer-events-none hidden lg:block">
                  <div className="w-80 transform scale-[0.92] opacity-[0.12] blur-[1px]">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                      <div className="h-20 bg-gray-100 rounded" />
                    </div>
                  </div>
                </div>

                {/* Next card */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 pointer-events-none hidden lg:block">
                  <div className="w-80 transform scale-[0.92] opacity-[0.12] blur-[1px]">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                      <div className="h-20 bg-gray-100 rounded" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Main testimonial card */}
            <div className="relative">
              <div 
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-[0_18px_36px_rgba(0,0,0,0.12)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 max-w-3xl mx-auto"
                role="region"
                aria-live="polite"
                aria-label={`Testimonial ${currentIndex + 1} of ${testimonials.length}`}
              >
                {/* Decorative quote mark watermark */}
                <div className={clsx(
                  "absolute top-6 opacity-[0.07] pointer-events-none",
                  isRtl ? "right-6" : "left-6"
                )}>
                  <svg width="48" height="36" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
                    <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0ZM25.2 36V20.4C25.2 9.12 30.24 3.36 40.32 2.16L42 6.24C36.48 7.2 33.6 10.32 33.36 15.36H42V36H25.2Z"/>
                  </svg>
                </div>

                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2AD6CA]/20 to-[#2AD6CA]/40 border-2 border-[#2AD6CA]/30 flex items-center justify-center">
                    <span className="text-[#2AD6CA] font-semibold text-lg">
                      {getInitials(currentTestimonial.name)}
                    </span>
                  </div>
                </div>

                {/* Content with fade transition */}
                <div 
                  key={currentIndex}
                  className="space-y-6 animate-[fadeInScale_300ms_ease-out]"
                >
                  {/* Quote */}
                  <blockquote className="text-xl md:text-2xl leading-[1.7] text-gray-800 font-light italic max-w-2xl mx-auto">
                    "{currentTestimonial.quote}"
                  </blockquote>

                  {/* Attribution */}
                  <footer className="space-y-1">
                    <cite className="not-italic font-semibold text-gray-900 text-lg block">
                      {currentTestimonial.name}
                    </cite>
                    <p className="text-[#7A7A7A] text-sm">
                      {currentTestimonial.role}
                    </p>
                  </footer>
                </div>
              </div>
            </div>

            {/* Navigation arrows */}
            {testimonials.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-[#2AD6CA]/10 transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50"
                  aria-label="Previous testimonial"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={handleNext}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-[#2AD6CA]/10 transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50"
                  aria-label="Next testimonial"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Navigation dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={clsx(
                    "rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50",
                    index === currentIndex
                      ? "bg-[#2AD6CA] w-2.5 h-2.5"
                      : "bg-gray-400/30 hover:bg-gray-400/50 w-2 h-2"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </Container>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Section>
  );
};