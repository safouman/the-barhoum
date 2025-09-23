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
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);

  const sectionTitle = ui.testimonials;

  // Auto-rotation with intersection observer
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1 || isPaused || isDragging) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length, isPaused, isDragging]);

  // Intersection observer for auto-play
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsPaused(true);
        } else {
          setIsPaused(false);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsAutoPlaying(false);
    }
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [testimonials.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [testimonials.length]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
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

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

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
      <Section id="testimonials" className="bg-gradient-to-b from-gray-50/30 via-white to-gray-50/30">
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
      ref={sectionRef}
    >
      <Container>
        <div 
          className="text-center space-y-12 relative z-10"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
              className="relative overflow-hidden"
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
                  transform: `translateX(calc(-${currentIndex * 100}% + ${currentIndex * 0}px))`,
                  width: `${testimonials.length * 100}%`
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
                      className="flex-shrink-0 px-4 flex justify-center"
                      style={{ width: `${100 / testimonials.length}%` }}
                      role="tabpanel"
                      aria-label={`Testimonial ${index + 1} of ${testimonials.length}`}
                    >
                      <article
                        className={`
                          relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10
                          transition-all duration-500 ease-out
                          ${isActive 
                            ? 'shadow-[0_8px_24px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] scale-100 opacity-100 z-10' 
                            : isVisible 
                              ? 'shadow-[0_4px_12px_rgba(0,0,0,0.04)] scale-95 opacity-60 hover:scale-[0.97] hover:opacity-75 cursor-pointer z-5'
                              : 'scale-90 opacity-0 pointer-events-none'
                          }
                        `}
                        style={{
                          width: '100%',
                          maxWidth: isActive ? '580px' : '460px',
                          height: '420px',
                          minHeight: '420px'
                        }}
                        onClick={() => !isActive && handleDotClick(index)}
                      >
                        {/* Teal accent line */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-px bg-[#2AD6CA]/40" />

                        {/* Decorative quote mark */}
                        <div className="absolute top-6 left-6 opacity-[0.08] pointer-events-none">
                          <svg width="48" height="36" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
                            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0ZM25.2 36V20.4C25.2 9.12 30.24 3.36 40.32 2.16L42 6.24C36.48 7.2 33.6 10.32 33.36 15.36H42V36H25.2Z"/>
                          </svg>
                        </div>

                        <div className="flex flex-col items-center text-center h-full justify-between py-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 rounded-full bg-[#2AD6CA]/10 border-2 border-[#2AD6CA]/20 flex items-center justify-center shadow-sm">
                              <span className="text-[#2AD6CA] font-bold text-lg">
                                {testimonial.initials || getInitials(testimonial.name)}
                              </span>
                            </div>
                          </div>

                          {/* Quote */}
                          <div className="flex-1 flex items-center justify-center px-2">
                            <blockquote className="text-xl md:text-2xl leading-[1.5] text-gray-900 font-medium max-w-md">
                              <span className="text-[#2AD6CA]/50 text-lg font-serif">"</span>
                              {truncateQuote(testimonial.quote)}
                              <span className="text-[#2AD6CA]/50 text-lg font-serif">"</span>
                            </blockquote>
                          </div>

                          {/* Attribution */}
                          <footer className="flex-shrink-0 space-y-1">
                            <cite className="not-italic font-semibold text-gray-900 text-base block">
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
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-gray-300 bg-white/90 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-white transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20"
                  aria-label="Previous testimonial"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={handleNext}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-gray-300 bg-white/90 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-white transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20"
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