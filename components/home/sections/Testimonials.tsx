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

  // Trust-building tagline
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

  // Render testimonial card with immersive styling
  const renderTestimonialCard = (testimonial: any, index: number) => {
    const isActive = index === currentIndex;
    const isPrevious = index === (currentIndex - 1 + testimonialCount) % testimonialCount;
    const isNext = index === (currentIndex + 1) % testimonialCount;
    const isVisible = isActive || isPrevious || isNext;
    
    if (!isVisible) return null;

    let cardClasses = "absolute top-0 transition-all duration-500 ease-out";
    let cardStyles: React.CSSProperties = {
      width: 'min(580px, 85vw)',
      height: '480px',
    };

    if (isActive) {
      cardClasses += " z-20 scale-100 opacity-100";
      cardStyles.left = '50%';
      cardStyles.transform = 'translateX(-50%)';
    } else if (isPrevious) {
      cardClasses += " z-10 scale-95 opacity-60";
      cardStyles.left = isRTL ? '75%' : '5%';
    } else if (isNext) {
      cardClasses += " z-10 scale-95 opacity-60";
      cardStyles.left = isRTL ? '5%' : '75%';
    }
    
    return (
      <article
        key={testimonial.id}
        className={cardClasses}
        style={cardStyles}
        role="group"
        aria-roledescription="testimonial"
        aria-label={`Testimonial from ${testimonial.name}`}
      >
        <div 
          className="relative h-full rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fdfc 100%)',
            border: '1px solid rgba(42, 214, 202, 0.08)'
          }}
        >
          {/* Ambient background gradient overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 70% 30%, rgba(42, 214, 202, 0.03) 0%, transparent 50%)'
            }}
          />

          {/* Oversized watermark quotation mark */}
          <div className="absolute top-8 left-8 opacity-[0.04] pointer-events-none">
            <svg width="120" height="90" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
              <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
            </svg>
          </div>

          <div className="relative h-full flex flex-col justify-between p-10 pt-16">
            {/* Top accent line */}
            <div className="flex-shrink-0 mb-8">
              <div className="w-12 h-0.5 bg-[#2AD6CA] mx-auto mb-8" />
              
              {/* Avatar with initials */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2AD6CA]/10 to-[#2AD6CA]/5 border-2 border-[#2AD6CA]/20 flex items-center justify-center mx-auto">
                <span className="text-[#2AD6CA] font-bold text-lg">
                  {getInitials(testimonial.name)}
                </span>
              </div>
            </div>

            {/* Quote - Large, impactful */}
            <div className="flex-1 flex items-center justify-center">
              <blockquote 
                className={`
                  relative text-center max-w-md
                  ${isRTL ? 'text-right font-heading' : 'text-center'}
                `}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {/* Opening quote mark */}
                <span className="absolute -top-6 -left-3 text-5xl text-[#2AD6CA]/25 font-serif leading-none">"</span>
                
                {/* Main quote text - Editorial style */}
                <p className={`
                  font-heading text-2xl md:text-3xl leading-[1.5] text-gray-900 font-medium mb-0
                  ${isRTL ? 'text-section-title' : ''}
                `}>
                  {testimonial.quote}
                </p>
                
                {/* Closing quote mark */}
                <span className="absolute -bottom-6 -right-3 text-5xl text-[#2AD6CA]/25 font-serif leading-none">"</span>
              </blockquote>
            </div>

            {/* Attribution - Clean, authoritative */}
            <footer className="flex-shrink-0 text-center mt-8 pt-6">
              {/* Connecting dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-[#2AD6CA] mx-auto mb-4" />
              
              <cite className="not-italic">
                <div className="font-base font-bold text-gray-900 text-xl mb-2">
                  {testimonial.name}
                </div>
                {testimonial.role && (
                  <div className="font-base text-gray-600 text-sm font-normal italic">
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

  // Single testimonial - no controls
  if (testimonialCount === 1) {
    return (
      <Section 
        id="testimonials" 
        className="relative overflow-hidden"
        role="region"
        aria-label="Customer testimonials"
        style={{
          background: 'linear-gradient(135deg, #fafafa 0%, #f0fffe 100%)',
        }}
      >
        {/* Ambient background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(42, 214, 202, 0.1) 0%, transparent 70%)',
              filter: 'blur(40px)'
            }}
          />
          <div 
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, rgba(42, 214, 202, 0.08) 0%, transparent 70%)',
              filter: 'blur(60px)'
            }}
          />
        </div>

        <Container>
          <div className="text-center space-y-16">
            {/* Trust-building tagline */}
            <div className="space-y-6">
              <p className={`
                text-sm font-medium tracking-[0.15em] uppercase text-gray-600/80
                ${isRTL ? 'font-heading' : 'font-base'}
              `}>
                {tagline}
              </p>
              <div className="flex justify-center">
                <div className="w-16 h-px bg-[#2AD6CA]/40" />
              </div>
            </div>

            {/* Single testimonial */}
            <div className="relative h-[480px] flex justify-center">
              {renderTestimonialCard(testimonials[0], 0)}
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // Multiple testimonials - immersive carousel
  return (
    <Section 
      id="testimonials" 
      className="relative overflow-hidden"
      role="region"
      aria-label="Customer testimonials"
      style={{
        background: 'linear-gradient(135deg, #fafafa 0%, #f0fffe 100%)',
      }}
    >
      {/* Ambient background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(42, 214, 202, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)'
          }}
        />
        <div 
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(42, 214, 202, 0.08) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(ellipse, rgba(42, 214, 202, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      <Container>
        <div 
          className="text-center space-y-16 relative z-10"
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
              <div className="w-16 h-px bg-[#2AD6CA]/40" />
            </div>
          </div>

          {/* Carousel Container */}
          <div className="relative max-w-[1200px] mx-auto">
            {/* Carousel Track */}
            <div 
              ref={trackRef}
              className="relative h-[480px] overflow-visible"
              onMouseDown={(e) => handleStart(e.clientX)}
              onMouseMove={(e) => handleMove(e.clientX)}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={(e) => handleStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleMove(e.touches[0].clientX)}
              onTouchEnd={handleEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {testimonials.map((testimonial, index) => 
                renderTestimonialCard(testimonial, index)
              )}
            </div>

            {/* Navigation Arrows - Circular with subtle styling */}
            <button
              onClick={isRTL ? handleNext : handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA]/40 hover:bg-white hover:scale-110 transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-30 shadow-xl"
              aria-label={isRTL ? "Next testimonial" : "Previous testimonial"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={isRTL ? handlePrevious : handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-[#2AD6CA]/40 hover:bg-white hover:scale-110 transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-30 shadow-xl"
              aria-label={isRTL ? "Previous testimonial" : "Next testimonial"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Navigation Dots - Teal accented */}
            <div 
              className="flex justify-center items-center gap-3 pt-12"
              role="tablist"
              aria-label="Testimonial navigation"
            >
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`
                    w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/50
                    ${index === currentIndex
                      ? 'bg-[#2AD6CA] scale-125 shadow-sm'
                      : 'bg-gray-300/60 hover:bg-[#2AD6CA]/60 hover:scale-110'
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