import { useState, useEffect, useRef, useCallback } from "react";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomeTestimonials: HomeThemeDefinition["Testimonials"] = ({ 
  testimonials, 
  ui,
  locale
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const sectionTitle = ui.testimonials;

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
    }
  }, [handlePrevious, handleNext]);

  // Touch/mouse drag handlers
  const handleStart = useCallback((clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    currentXRef.current = clientX;
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
  }, [isDragging, handlePrevious, handleNext]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateQuote = (quote: string, maxLines: number = 4) => {
    const words = quote.split(' ');
    const wordsPerLine = 8; // Approximate
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) return quote;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  if (!testimonials.length) {
    return (
      <Section id="testimonials" className="bg-gradient-to-b from-gray-50/40 via-white/90 to-gray-50/40">
        <Container>
          <div className="text-center py-16">
            <p className="text-gray-500">No testimonials available.</p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section 
      id="testimonials" 
      className="relative overflow-hidden bg-gradient-to-b from-gray-50/40 via-white/90 to-gray-50/40"
    >
      <Container>
        <div 
          className="text-center space-y-12 relative z-10"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Testimonials carousel"
        >
          {/* Section Header */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-gray-700">
              {sectionTitle}
            </h2>
            <div className="flex justify-center">
              <div className="w-12 h-px bg-[#2AD6CA]/40" />
            </div>
          </div>

          {/* Carousel Container */}
          <div className="relative max-w-[1200px] mx-auto">
            {/* Track */}
            <div 
              ref={trackRef}
              className="relative overflow-hidden px-4 md:px-8"
              onMouseDown={(e) => handleStart(e.clientX)}
              onMouseMove={(e) => handleMove(e.clientX)}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={(e) => handleStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleMove(e.touches[0].clientX)}
              onTouchEnd={handleEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(calc(-${currentIndex * 100}% / ${testimonials.length} + ${currentIndex * 0}px))`,
                }}
                role="tablist"
                aria-label="Testimonials"
              >
                {testimonials.map((testimonial, index) => {
                  const isActive = index === currentIndex;
                  const isPrev = index === (currentIndex - 1 + testimonials.length) % testimonials.length;
                  const isNext = index === (currentIndex + 1) % testimonials.length;
                  const isVisible = isActive || isPrev || isNext;

                  return (
                    <div
                      key={testimonial.id}
                      className={`
                        flex-shrink-0 px-3 flex justify-center
                        ${testimonials.length === 1 ? 'w-full' : 'w-full sm:w-1/2 lg:w-1/3'}
                      `}
                      role="tabpanel"
                      aria-label={`Testimonial ${index + 1} of ${testimonials.length}`}
                    >
                      <article
                        className={`
                          relative bg-white/95 backdrop-blur-sm rounded-2xl p-8
                          transition-all duration-500 ease-out
                          ${isActive 
                            ? 'shadow-[0_12px_32px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] scale-102 opacity-100 z-10' 
                            : isVisible 
                              ? 'shadow-[0_6px_16px_rgba(0,0,0,0.04)] scale-96 opacity-75 hover:scale-98 hover:opacity-85 cursor-pointer z-5'
                              : 'scale-90 opacity-0 pointer-events-none'
                          }
                        `}
                        style={{
                          width: '100%',
                          maxWidth: isActive ? '400px' : '360px',
                          height: '420px',
                          minHeight: '420px'
                        }}
                        onClick={() => !isActive && handleDotClick(index)}
                      >
                        {/* Teal accent line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-[#2AD6CA]/40" />

                        {/* Opening quote mark */}
                        <div className="absolute top-6 left-6 opacity-[0.2] pointer-events-none">
                          <svg width="32" height="24" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
                            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
                          </svg>
                        </div>

                        {/* Closing quote mark */}
                        <div className="absolute bottom-20 right-6 opacity-[0.2] pointer-events-none rotate-180">
                          <svg width="32" height="24" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
                            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
                          </svg>
                        </div>

                        <div className="flex flex-col items-center text-center h-full justify-between py-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 rounded-full bg-[#2AD6CA]/10 border-2 border-[#2AD6CA]/30 flex items-center justify-center shadow-sm">
                              <span className="text-[#2AD6CA] font-bold text-lg">
                                {testimonial.initials || getInitials(testimonial.name)}
                              </span>
                            </div>
                          </div>

                          {/* Quote */}
                          <div className="flex-1 flex items-center justify-center px-2">
                            <blockquote className="text-xl md:text-2xl leading-[1.5] text-gray-900 font-semibold max-w-sm">
                              {truncateQuote(testimonial.quote)}
                            </blockquote>
                          </div>

                          {/* Attribution */}
                          <footer className="flex-shrink-0 space-y-1">
                            <cite className="not-italic font-bold text-gray-900 text-lg block">
                              {testimonial.name}
                            </cite>
                            {testimonial.role && (
                              <p className="text-gray-600 text-sm">
                                {testimonial.role}
                              </p>
                            )}
                          </footer>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Arrows */}
            {testimonials.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-gray-300/60 bg-white/80 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-white transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20"
                  aria-label="Previous testimonial"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-gray-300/60 bg-white/80 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-white transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20"
                  aria-label="Next testimonial"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Navigation Dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`
                    rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50
                    ${index === currentIndex
                      ? 'bg-[#2AD6CA] w-2 h-2'
                      : 'bg-gray-300/60 hover:bg-gray-400/80 w-1.5 h-1.5'
                    }
                  `}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Live region for screen readers */}
          <div 
            className="sr-only" 
            aria-live="polite" 
            aria-atomic="true"
          >
            Testimonial {currentIndex + 1} of {testimonials.length}
          </div>
        </div>
      </Container>
    </Section>
  );
};