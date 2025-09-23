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

  const isRTL = locale === "ar";
  const testimonialCount = testimonials.length;
  const useCarousel = testimonialCount > 3;
  const useGrid = testimonialCount <= 3 && testimonialCount > 1;
  const useSingle = testimonialCount === 1;

  const handlePrevious = useCallback(() => {
    if (!useCarousel) return;
    setCurrentIndex((prev) => (prev - 1 + testimonialCount) % testimonialCount);
  }, [useCarousel, testimonialCount]);

  const handleNext = useCallback(() => {
    if (!useCarousel) return;
    setCurrentIndex((prev) => (prev + 1) % testimonialCount);
  }, [useCarousel, testimonialCount]);

  const handleDotClick = useCallback((index: number) => {
    if (!useCarousel) return;
    setCurrentIndex(index);
  }, [useCarousel]);

  // Touch/mouse drag handlers for carousel
  const handleStart = useCallback((clientX: number) => {
    if (!useCarousel) return;
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
  }, [useCarousel]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !useCarousel) return;
    currentXRef.current = clientX;
  }, [isDragging, useCarousel]);

  const handleEnd = useCallback(() => {
    if (!isDragging || !useCarousel) return;
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
  }, [isDragging, handlePrevious, handleNext, useCarousel]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!useCarousel) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
    }
  }, [handlePrevious, handleNext, useCarousel]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const truncateText = (text: string, maxLength: number = 280) => {
    if (text.length <= maxLength) return text;
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength) + '…';
  };

  const renderTestimonialCard = (testimonial: any, index: number, position: 'center' | 'peek-left' | 'peek-right' | 'grid' | 'single' = 'center') => {
    const isCenter = position === 'center' || position === 'single';
    const isPeek = position.startsWith('peek');
    const isGrid = position === 'grid';
    
    return (
      <article
        key={`${testimonial.id}-${index}`}
        className={`
          relative bg-white rounded-2xl transition-all duration-300 ease-out
          ${isCenter ? 'scale-100 opacity-100 z-10' : ''}
          ${isPeek ? 'scale-95 opacity-75 z-0' : ''}
          ${isGrid || position === 'single' ? 'scale-100 opacity-100' : ''}
          ${!isPeek ? 'hover:shadow-[0_12px_32px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] hover:-translate-y-1' : ''}
        `}
        style={{
          minHeight: '420px',
          width: useCarousel 
            ? (isCenter ? 'min(680px, 85vw)' : 'min(580px, 75vw)')
            : '100%',
          maxWidth: useCarousel ? undefined : '480px',
          boxShadow: isCenter || isGrid || position === 'single'
            ? '0 8px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)'
            : '0 4px 16px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)'
        }}
        role="group"
        aria-roledescription="testimonial"
        aria-label={`Testimonial from ${testimonial.name}`}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-[#2AD6CA]/40 rounded-full" />

        {/* Background quotation mark */}
        <div className="absolute top-8 left-8 opacity-[0.04] pointer-events-none">
          <svg width="48" height="36" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
          </svg>
        </div>

        {/* Bottom closing quote */}
        <div className="absolute bottom-8 right-8 opacity-[0.04] pointer-events-none rotate-180">
          <svg width="24" height="18" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
          </svg>
        </div>

        <div className="flex flex-col items-center text-center h-full justify-between p-8 pt-12">
          {/* Avatar */}
          <div className="flex-shrink-0 mb-6">
            <div className="w-14 h-14 rounded-full bg-[#2AD6CA]/10 border-2 border-[#2AD6CA]/25 flex items-center justify-center">
              <span className="text-[#2AD6CA] font-semibold text-base">
                {getInitials(testimonial.name)}
              </span>
            </div>
          </div>

          {/* Quote */}
          <div className="flex-1 flex items-center justify-center px-2">
            <blockquote 
              className={`
                text-2xl md:text-3xl leading-[1.5] text-gray-900 font-medium max-w-lg
                ${isRTL ? 'text-right font-base' : 'text-center'}
              `}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <span className="text-gray-400/70 text-xl mr-1">"</span>
              {truncateText(testimonial.quote)}
              <span className="text-gray-400/70 text-xl ml-1">"</span>
            </blockquote>
          </div>

          {/* Attribution */}
          <footer className="flex-shrink-0 space-y-1 mt-6">
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
      </article>
    );
  };

  if (!testimonials.length) {
    return null;
  }

  return (
    <Section 
      id="testimonials" 
      className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/20 to-white"
      role="region"
      aria-label="Customer testimonials"
    >
      <Container>
        <div 
          className="text-center space-y-12 relative z-10"
          onKeyDown={handleKeyDown}
          tabIndex={useCarousel ? 0 : -1}
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

          {/* Single testimonial */}
          {useSingle && (
            <div className="flex justify-center">
              {renderTestimonialCard(testimonials[0], 0, 'single')}
            </div>
          )}

          {/* Grid layout for 2-3 testimonials */}
          {useGrid && (
            <div className="grid gap-8 justify-center items-start max-w-6xl mx-auto" style={{
              gridTemplateColumns: testimonialCount === 2 
                ? 'repeat(2, minmax(0, 480px))' 
                : 'repeat(auto-fit, minmax(320px, 480px))'
            }}>
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.id} className="flex justify-center">
                  {renderTestimonialCard(testimonial, index, 'grid')}
                </div>
              ))}
            </div>
          )}

          {/* Carousel for 4+ testimonials */}
          {useCarousel && (
            <div className="relative max-w-[1200px] mx-auto">
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
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <div className="flex items-center justify-center gap-4">
                  {/* Left peek */}
                  <div className="hidden lg:block flex-shrink-0">
                    {renderTestimonialCard(
                      testimonials[(currentIndex - 1 + testimonialCount) % testimonialCount], 
                      (currentIndex - 1 + testimonialCount) % testimonialCount, 
                      'peek-left'
                    )}
                  </div>

                  {/* Center card */}
                  <div className="flex-shrink-0 flex justify-center">
                    {renderTestimonialCard(testimonials[currentIndex], currentIndex, 'center')}
                  </div>

                  {/* Right peek */}
                  <div className="hidden lg:block flex-shrink-0">
                    {renderTestimonialCard(
                      testimonials[(currentIndex + 1) % testimonialCount], 
                      (currentIndex + 1) % testimonialCount, 
                      'peek-right'
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA] hover:bg-white hover:scale-105 transition-all duration-200 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20 shadow-sm"
                aria-label="Previous testimonial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA] hover:bg-white hover:scale-105 transition-all duration-200 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20 shadow-sm"
                aria-label="Next testimonial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Navigation Dots */}
              <div className="flex justify-center items-center gap-2 pt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50
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
            </div>
          )}

          {/* Live region for screen readers */}
          {useCarousel && (
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