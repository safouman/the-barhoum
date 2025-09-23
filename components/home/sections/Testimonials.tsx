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
  const autoPlayRef = useRef<NodeJS.Timeout>();

  const isRTL = locale === "ar";
  const testimonialCount = testimonials.length;

  // Tagline for trust building
  const tagline = isRTL 
    ? "موثوق من قبل القادة والفنانين والمنظمات حول العالم"
    : "Trusted by leaders, artists, and organizations worldwide";

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonialCount) % testimonialCount);
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
  const handleStart = useCallback((clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
    stopAutoPlay();
  }, [stopAutoPlay]);

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
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      isRTL ? handleNext() : handlePrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      isRTL ? handlePrevious() : handleNext();
    }
  }, [handlePrevious, handleNext, isRTL]);

  // Auto-play lifecycle
  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Render testimonial card with editorial styling
  const renderTestimonialCard = (testimonial: any, index: number) => {
    const isActive = index === currentIndex;
    
    return (
      <article
        key={testimonial.id}
        className={`
          relative bg-white transition-all duration-500 ease-out flex-shrink-0
          ${isActive ? 'scale-100 opacity-100 z-10' : 'scale-95 opacity-70 z-0'}
          shadow-[0_12px_40px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)]
          hover:shadow-[0_16px_48px_rgba(0,0,0,0.12),0_6px_20px_rgba(0,0,0,0.06)]
          hover:scale-[1.02] hover:-translate-y-1
        `}
        style={{
          minHeight: '480px',
          width: 'min(640px, 90vw)',
          maxWidth: '680px',
          borderRadius: '16px'
        }}
        role="group"
        aria-roledescription="testimonial"
        aria-label={`Testimonial from ${testimonial.name}`}
      >
        {/* Subtle top accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-[#2AD6CA]/30 to-transparent" />

        {/* Background quotation mark - very subtle */}
        <div className="absolute top-8 left-8 opacity-[0.03] pointer-events-none">
          <svg width="80" height="60" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
          </svg>
        </div>

        <div className="flex flex-col h-full justify-between p-10 pt-12">
          {/* Avatar and opening */}
          <div className="flex-shrink-0 mb-8">
            <div className="w-14 h-14 rounded-full bg-[#2AD6CA]/5 border border-[#2AD6CA]/15 flex items-center justify-center mb-6 mx-auto">
              <span className="text-[#2AD6CA] font-semibold text-base">
                {getInitials(testimonial.name)}
              </span>
            </div>
            
            {/* Subtle separator */}
            <div className="w-8 h-px bg-[#2AD6CA]/20 mx-auto mb-6" />
          </div>

          {/* Quote - Editorial style with serif emphasis */}
          <div className="flex-1 flex items-center justify-center">
            <blockquote 
              className={`
                relative text-center max-w-lg
                ${isRTL ? 'text-right font-heading' : 'text-center'}
              `}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Opening quote */}
              <span className="absolute -top-4 -left-2 text-4xl text-[#2AD6CA]/20 font-serif leading-none">"</span>
              
              {/* Main quote text - Large, impactful serif */}
              <p className={`
                font-heading text-2xl md:text-3xl leading-[1.4] text-gray-900 font-semibold mb-0
                ${isRTL ? 'text-section-title' : ''}
              `}>
                {testimonial.quote}
              </p>
              
              {/* Closing quote */}
              <span className="absolute -bottom-4 -right-2 text-4xl text-[#2AD6CA]/20 font-serif leading-none">"</span>
            </blockquote>
          </div>

          {/* Attribution - Clean sans-serif */}
          <footer className="flex-shrink-0 text-center mt-8 pt-6 border-t border-gray-100/60">
            <cite className="not-italic">
              <div className="font-base font-semibold text-gray-900 text-lg mb-1">
                {testimonial.name}
              </div>
              {testimonial.role && (
                <div className="font-base text-gray-600 text-sm font-normal">
                  {testimonial.role}
                </div>
              )}
            </cite>
          </footer>
        </div>
      </article>
    );
  };

  if (!testimonials.length) {
    return null;
  }

  // Single testimonial - no controls
  if (testimonialCount === 1) {
    return (
      <Section 
        id="testimonials" 
        className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/20 to-white"
        role="region"
        aria-label="Customer testimonials"
      >
        <Container>
          <div className="text-center space-y-12">
            {/* Trust-building tagline */}
            <div className="space-y-6">
              <p className={`
                text-sm font-medium tracking-[0.15em] uppercase text-gray-600/80
                ${isRTL ? 'font-heading' : 'font-base'}
              `}>
                {tagline}
              </p>
              <div className="flex justify-center">
                <div className="w-16 h-px bg-[#2AD6CA]/30" />
              </div>
            </div>

            {/* Single testimonial */}
            <div className="flex justify-center">
              {renderTestimonialCard(testimonials[0], 0)}
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // Multiple testimonials - premium carousel
  return (
    <Section 
      id="testimonials" 
      className="relative bg-gradient-to-b from-white via-gray-50/20 to-white overflow-hidden"
      role="region"
      aria-label="Customer testimonials"
    >
      <Container>
        <div 
          className="text-center space-y-12 relative z-10"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          onMouseEnter={stopAutoPlay}
          onMouseLeave={startAutoPlay}
        >
          {/* Trust-building tagline */}
          <div className="space-y-6">
            <p className={`
              text-sm font-medium tracking-[0.15em] uppercase text-gray-600/80
              ${isRTL ? 'font-heading' : 'font-base'}
            `}>
              {tagline}
            </p>
            <div className="flex justify-center">
              <div className="w-16 h-px bg-[#2AD6CA]/30" />
            </div>
          </div>

          {/* Carousel Container */}
          <div className="relative max-w-[1000px] mx-auto">
            {/* Carousel Track */}
            <div 
              ref={trackRef}
              className="relative px-4 md:px-8 overflow-hidden"
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
                  transform: `translateX(calc(-${currentIndex * 100}% + ${currentIndex * 24}px))`,
                  gap: '24px'
                }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={testimonial.id} className="flex justify-center" style={{ minWidth: '100%' }}>
                    {renderTestimonialCard(testimonial, index)}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={isRTL ? handleNext : handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA]/40 hover:bg-white hover:scale-105 transition-all duration-200 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20 shadow-lg"
              aria-label={isRTL ? "Next testimonial" : "Previous testimonial"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={isRTL ? handlePrevious : handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA]/40 hover:bg-white hover:scale-105 transition-all duration-200 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20 shadow-lg"
              aria-label={isRTL ? "Previous testimonial" : "Next testimonial"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Navigation Dots */}
            <div 
              className="flex justify-center items-center gap-3 pt-10"
              role="tablist"
              aria-label="Testimonial navigation"
            >
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50
                    ${index === currentIndex
                      ? 'bg-[#2AD6CA] scale-125 shadow-sm'
                      : 'bg-gray-300/60 hover:bg-gray-400/80 hover:scale-110'
                    }
                  `}
                  aria-label={`Go to testimonial ${index + 1}`}
                  aria-selected={index === currentIndex}
                  role="tab"
                />
              ))}
            </div>
          </div>

          {/* Live region for screen readers */}
          <div 
            className="sr-only" 
            aria-live="polite" 
            aria-atomic="true"
          >
            Testimonial {currentIndex + 1} of {testimonialCount}: {testimonials[currentIndex]?.name}
          </div>
        </div>
      </Container>
    </Section>
  );
};