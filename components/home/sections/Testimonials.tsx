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

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length, isPaused]);

  // Resume auto-play after user interaction
  useEffect(() => {
    if (userInteracted) {
      const timeout = setTimeout(() => {
        setIsAutoPlaying(true);
        setUserInteracted(false);
      }, 12000);

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

  return (
    <Section id="testimonials" className="relative overflow-hidden">
      {/* Subtle premium background treatment */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/40 via-white/60 to-gray-50/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(42,214,202,0.012)_0%,transparent_70%)]" />
      </div>

      <Container>
        <div 
          className="text-center space-y-16 relative z-10"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Premium Section Header */}
          <div className="space-y-6">
            <h2 className="text-sm font-semibold tracking-[0.25em] uppercase text-gray-700 letterspacing-wide">
              {sectionTitle}
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#2AD6CA]/60 to-transparent" />
            </div>
          </div>

          {/* Premium Testimonials Container */}
          <div className="relative max-w-5xl mx-auto">
            {/* Decorative neighbor cards for depth */}
            {testimonials.length > 1 && (
              <>
                {/* Previous card shadow */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 -translate-x-12 pointer-events-none hidden xl:block">
                  <div className="w-72 transform scale-[0.88] opacity-[0.08] blur-[2px] rotate-[-1deg]">
                    <div className="bg-white rounded-3xl p-10 shadow-2xl">
                      <div className="h-24 bg-gray-100 rounded-xl mb-4" />
                      <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
                    </div>
                  </div>
                </div>

                {/* Next card shadow */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 translate-x-12 pointer-events-none hidden xl:block">
                  <div className="w-72 transform scale-[0.88] opacity-[0.08] blur-[2px] rotate-[1deg]">
                    <div className="bg-white rounded-3xl p-10 shadow-2xl">
                      <div className="h-24 bg-gray-100 rounded-xl mb-4" />
                      <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Main Premium Testimonial Card */}
            <div className="relative">
              <div 
                className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 md:p-16 shadow-[0_24px_48px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_32px_64px_rgba(0,0,0,0.12),0_12px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 max-w-4xl mx-auto border border-gray-100/50"
                role="region"
                aria-live="polite"
                aria-label={`Testimonial ${currentIndex + 1} of ${testimonials.length}`}
              >
                {/* Subtle decorative quote mark */}
                <div className="absolute top-8 left-8 opacity-[0.025] pointer-events-none">
                  <svg width="56" height="42" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
                    <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0ZM25.2 36V20.4C25.2 9.12 30.24 3.36 40.32 2.16L42 6.24C36.48 7.2 33.6 10.32 33.36 15.36H42V36H25.2Z"/>
                  </svg>
                </div>

                {/* Subtle teal accent divider top */}
                <div className="flex justify-center mb-10">
                  <div className="w-10 h-px bg-gradient-to-r from-transparent via-[#2AD6CA]/40 to-transparent rounded-full" />
                </div>

                {/* Premium Avatar */}
                <div className="flex justify-center mb-10">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2AD6CA]/10 to-[#2AD6CA]/20 border-2 border-[#2AD6CA]/20 flex items-center justify-center shadow-lg shadow-[#2AD6CA]/10">
                      <span className="text-[#2AD6CA] font-bold text-xl tracking-wide">
                        {getInitials(currentTestimonial.name)}
                      </span>
                    </div>
                    {/* Subtle glow ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#2AD6CA]/5 to-transparent blur-sm" />
                  </div>
                </div>

                {/* Premium Content with smooth transitions */}
                <div 
                  key={currentIndex}
                  className="space-y-8 animate-[fadeInUp_400ms_ease-out]"
                >
                  {/* Large, Bold Quote with teal accents */}
                  <div className="relative">
                    <blockquote className="text-3xl md:text-4xl lg:text-5xl leading-[1.5] text-gray-900 font-semibold max-w-3xl mx-auto text-center">
                      <span className="text-[#2AD6CA]/50 text-3xl md:text-4xl font-serif leading-none">"</span>
                      {currentTestimonial.quote}
                      <span className="text-[#2AD6CA]/50 text-3xl md:text-4xl font-serif leading-none">"</span>
                    </blockquote>
                  </div>

                  {/* Subtle teal accent divider */}
                  <div className="flex justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#2AD6CA]/25" />
                      <div className="w-12 h-px bg-gradient-to-r from-[#2AD6CA]/30 via-[#2AD6CA]/50 to-[#2AD6CA]/30" />
                      <div className="w-2 h-2 rounded-full bg-[#2AD6CA]/25" />
                    </div>
                  </div>

                  {/* Premium Attribution */}
                  <footer className="space-y-3">
                    <cite className="not-italic font-bold text-gray-900 text-2xl block tracking-wide">
                      {currentTestimonial.name}
                    </cite>
                    <p className="text-[#7A7A7A] text-sm font-normal">
                      {currentTestimonial.role}
                    </p>
                  </footer>
                </div>

                {/* Bottom subtle teal accent */}
                <div className="flex justify-center mt-10">
                  <div className="w-6 h-px bg-gradient-to-r from-transparent via-[#2AD6CA]/40 to-transparent rounded-full" />
                </div>
              </div>
            </div>

            {/* Premium Navigation arrows */}
            {testimonials.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-gray-200 bg-white/90 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-[#2AD6CA]/5 hover:shadow-lg hover:shadow-[#2AD6CA]/20 transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 hover:scale-105"
                  aria-label="Previous testimonial"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={handleNext}
                  className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-gray-200 bg-white/90 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-[#2AD6CA]/5 hover:shadow-lg hover:shadow-[#2AD6CA]/20 transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 hover:scale-105"
                  aria-label="Next testimonial"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Premium Navigation dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={clsx(
                    "rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50 hover:scale-110",
                    index === currentIndex
                      ? "bg-[#2AD6CA] w-3 h-3 shadow-lg shadow-[#2AD6CA]/30"
                      : "bg-gray-300/60 hover:bg-gray-400/80 w-2.5 h-2.5"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </Container>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </Section>
  );
};