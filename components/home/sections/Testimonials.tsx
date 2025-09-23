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
  const [isVisible, setIsVisible] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);

  const isRTL = locale === "ar";
  const testimonialCount = testimonials.length;
  const showNavigation = testimonialCount > 1;
  const showPeeks = testimonialCount > 1;
  const enableInfiniteLoop = testimonialCount >= 3;

  // Intersection Observer for auto-play pause when out of viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePrevious = useCallback(() => {
    if (!showNavigation) return;
    setCurrentIndex((prev) => {
      if (enableInfiniteLoop) {
        return (prev - 1 + testimonialCount) % testimonialCount;
      }
      return prev > 0 ? prev - 1 : testimonialCount - 1;
    });
  }, [showNavigation, testimonialCount, enableInfiniteLoop]);

  const handleNext = useCallback(() => {
    if (!showNavigation) return;
    setCurrentIndex((prev) => {
      if (enableInfiniteLoop) {
        return (prev + 1) % testimonialCount;
      }
      return prev < testimonialCount - 1 ? prev + 1 : 0;
    });
  }, [showNavigation, testimonialCount, enableInfiniteLoop]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Touch/mouse drag handlers
  const handleStart = useCallback((clientX: number) => {
    if (!showNavigation) return;
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
  }, [showNavigation]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !showNavigation) return;
    currentXRef.current = clientX;
  }, [isDragging, showNavigation]);

  const handleEnd = useCallback(() => {
    if (!isDragging || !showNavigation) return;
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
  }, [isDragging, handlePrevious, handleNext, showNavigation]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!showNavigation) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      isRTL ? handleNext() : handlePrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      isRTL ? handlePrevious() : handleNext();
    }
  }, [handlePrevious, handleNext, showNavigation, isRTL]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateQuote = (quote: string, maxLength: number = 280) => {
    if (quote.length <= maxLength) return quote;
    const truncated = quote.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength) + '…';
  };

  const getPeekTestimonial = (offset: number) => {
    if (!enableInfiniteLoop && testimonialCount === 2) {
      // For 2 items, duplicate the other item for peek effect
      return testimonials[offset === -1 ? 1 : 0];
    }
    const index = (currentIndex + offset + testimonialCount) % testimonialCount;
    return testimonials[index];
  };

  const renderTestimonialCard = (testimonial: any, position: 'center' | 'peek-left' | 'peek-right') => {
    const isCenter = position === 'center';
    const isPeek = position.startsWith('peek');
    
    return (
      <article
        key={`${testimonial.id}-${position}`}
        className={`
          flex-shrink-0 transition-all duration-350 ease-out
          ${isCenter ? 'scale-100 opacity-100 z-10' : 'scale-96 opacity-70 z-0'}
          ${isPeek ? 'pointer-events-none' : ''}
        `}
        style={{
          width: isCenter ? 'min(720px, 90vw)' : 'min(600px, 75vw)',
          maxWidth: isCenter ? '780px' : '660px',
        }}
        role="group"
        aria-roledescription="slide"
        aria-label={`Testimonial ${currentIndex + 1} of ${testimonialCount}`}
      >
        <div
          className={`
            relative bg-white rounded-lg p-8 mx-3 min-h-[420px] flex flex-col justify-between
            transition-all duration-350 ease-out
            ${isCenter 
              ? 'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12),0_6px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5' 
              : 'shadow-[0_4px_16px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)]'
            }
          `}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-[#2AD6CA]/40 rounded-full" />

          {/* Subtle quote watermarks */}
          <div className="absolute top-6 left-6 opacity-[0.04] pointer-events-none">
            <svg width="32" height="24" viewBox="0 0 48 36" fill="currentColor" className="text-gray-600">
              <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
            </svg>
          </div>

          <div className="absolute bottom-6 right-6 opacity-[0.04] pointer-events-none rotate-180">
            <svg width="32" height="24" viewBox="0 0 48 36" fill="currentColor" className="text-gray-600">
              <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
            </svg>
          </div>

          <div className="flex flex-col items-center text-center h-full justify-between py-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-[#2AD6CA]/25 flex items-center justify-center shadow-sm">
                <span className="text-gray-800 font-semibold text-lg">
                  {testimonial.initials || getInitials(testimonial.name)}
                </span>
              </div>
            </div>

            {/* Quote */}
            <div className="flex-1 flex items-center justify-center px-4">
              <blockquote 
                className={`
                  text-2xl md:text-3xl leading-[1.5] text-gray-900 font-medium max-w-lg
                  ${isRTL ? 'text-right font-base' : 'text-center'}
                `}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <span className="text-gray-400 text-xl mr-1">"</span>
                {truncateQuote(testimonial.quote)}
                <span className="text-gray-400 text-xl ml-1">"</span>
              </blockquote>
            </div>

            {/* Attribution */}
            <footer className="flex-shrink-0 space-y-1">
              <cite className="not-italic font-semibold text-gray-900 text-lg block">
                {testimonial.name}
              </cite>
              {testimonial.role && (
                <p className="text-gray-600 text-sm font-normal">
                  {testimonial.role}
                </p>
              )}
            </footer>
          </div>
        </div>
      </article>
    );
  };

  if (!testimonials.length) {
    return (
      <Section 
        id="testimonials" 
        className="bg-gradient-to-b from-white via-gray-50/30 to-white"
        ref={sectionRef}
      >
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
      className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/30 to-white"
      ref={sectionRef}
      role="region"
      aria-label="Testimonials"
    >
      <Container>
        <div 
          className="text-center space-y-12 relative z-10"
          onKeyDown={handleKeyDown}
          tabIndex={showNavigation ? 0 : -1}
        >
          {/* Section Header */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-gray-700">
              {ui.testimonials}
            </h2>
            <div className="flex justify-center">
              <div className="w-12 h-px bg-[#2AD6CA]/40" />
            </div>
          </div>

          {/* Testimonials Display */}
          <div className="relative max-w-[1200px] mx-auto">
            {/* Single testimonial */}
            {testimonialCount === 1 && (
              <div className="flex justify-center px-4">
                {renderTestimonialCard(testimonials[0], 'center')}
              </div>
            )}

            {/* Multiple testimonials with peek effect */}
            {testimonialCount > 1 && (
              <div className="relative">
                {/* Carousel Track */}
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
                  style={{ cursor: isDragging ? 'grabbing' : showNavigation ? 'grab' : 'default' }}
                >
                  <div className="flex items-center justify-center">
                    {/* Left peek (hidden on mobile) */}
                    {showPeeks && (
                      <div className="hidden md:block flex-shrink-0" style={{ width: '10%' }}>
                        {renderTestimonialCard(getPeekTestimonial(-1), 'peek-left')}
                      </div>
                    )}

                    {/* Center card */}
                    <div className="flex-shrink-0 flex justify-center" style={{ width: showPeeks ? '80%' : '100%' }}>
                      {renderTestimonialCard(testimonials[currentIndex], 'center')}
                    </div>

                    {/* Right peek (hidden on mobile) */}
                    {showPeeks && (
                      <div className="hidden md:block flex-shrink-0" style={{ width: '10%' }}>
                        {renderTestimonialCard(getPeekTestimonial(1), 'peek-right')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {showNavigation && (
                  <>
                    <button
                      onClick={isRTL ? handleNext : handlePrevious}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA] hover:bg-white transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20 shadow-sm"
                      aria-label={isRTL ? "Next testimonial" : "Previous testimonial"}
                      disabled={!enableInfiniteLoop && currentIndex === 0}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      onClick={isRTL ? handlePrevious : handleNext}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA] hover:bg-white transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20 shadow-sm"
                      aria-label={isRTL ? "Previous testimonial" : "Next testimonial"}
                      disabled={!enableInfiniteLoop && currentIndex === testimonialCount - 1}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Navigation Dots */}
                {showNavigation && (
                  <div className="flex justify-center items-center gap-2 pt-8">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`
                          w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50
                          ${index === currentIndex
                            ? 'bg-[#2AD6CA] scale-125'
                            : 'bg-gray-300/60 hover:bg-gray-400/80 hover:scale-110'
                          }
                        `}
                        aria-label={`Go to testimonial ${index + 1}`}
                        aria-current={index === currentIndex ? "true" : "false"}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live region for screen readers */}
          {showNavigation && (
            <div 
              className="sr-only" 
              aria-live="polite" 
              aria-atomic="true"
            >
              Testimonial {currentIndex + 1} of {testimonialCount}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
};