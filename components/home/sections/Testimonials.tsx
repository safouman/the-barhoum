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
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  const sectionTitle = ui.testimonials;
  const testimonialCount = testimonials.length;

  // Determine layout mode based on testimonial count
  const layoutMode = testimonialCount <= 2 ? 'static' : testimonialCount === 3 ? 'row' : 'carousel';

  const handlePrevious = useCallback(() => {
    if (layoutMode !== 'carousel') return;
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length, layoutMode]);

  const handleNext = useCallback(() => {
    if (layoutMode !== 'carousel') return;
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length, layoutMode]);

  const handleDotClick = useCallback((index: number) => {
    if (layoutMode !== 'carousel') return;
    setCurrentIndex(index);
  }, [layoutMode]);

  // Auto-play functionality (disabled for non-carousel modes)
  useEffect(() => {
    if (layoutMode !== 'carousel' || !autoPlayEnabled) return;

    autoPlayRef.current = setInterval(() => {
      handleNext();
    }, 6000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [handleNext, autoPlayEnabled, layoutMode]);

  const handleMouseEnter = () => setAutoPlayEnabled(false);
  const handleMouseLeave = () => setAutoPlayEnabled(true);

  // Touch/mouse drag handlers
  const handleStart = useCallback((clientX: number) => {
    if (layoutMode !== 'carousel') return;
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
    setAutoPlayEnabled(false);
  }, [layoutMode]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || layoutMode !== 'carousel') return;
    currentXRef.current = clientX;
  }, [isDragging, layoutMode]);

  const handleEnd = useCallback(() => {
    if (!isDragging || layoutMode !== 'carousel') return;
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
    
    setAutoPlayEnabled(true);
  }, [isDragging, handlePrevious, handleNext, layoutMode]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (layoutMode !== 'carousel') return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
    }
  }, [handlePrevious, handleNext, layoutMode]);

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
    const wordsPerLine = 8;
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) return quote;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  if (!testimonials.length) {
    return (
      <Section id="testimonials" className="bg-gradient-to-b from-white via-gray-50/30 to-white">
        <Container>
          <div className="text-center py-16">
            <p className="text-gray-500">No testimonials available.</p>
          </div>
        </Container>
      </Section>
    );
  }

  const renderTestimonialCard = (testimonial: any, index: number, isActive: boolean = true, scale: number = 1, opacity: number = 1) => (
    <div
      key={testimonial.id}
      className={`
        flex-shrink-0 transition-all duration-500 ease-out
        ${layoutMode === 'carousel' ? 'cursor-pointer' : ''}
      `}
      style={{
        transform: `scale(${scale})`,
        opacity,
        width: layoutMode === 'static' ? '100%' : layoutMode === 'row' ? '33.333%' : '400px',
        maxWidth: layoutMode === 'static' ? '480px' : 'none',
      }}
      onClick={() => layoutMode === 'carousel' && !isActive && setCurrentIndex(index)}
    >
      <article
        className={`
          relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 mx-3
          transition-all duration-500 ease-out h-[420px] flex flex-col justify-between
          ${isActive 
            ? 'shadow-[0_20px_40px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]' 
            : 'shadow-[0_8px_20px_rgba(0,0,0,0.04),0_3px_8px_rgba(0,0,0,0.03)]'
          }
        `}
      >
        {/* Teal accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-[#2AD6CA]/40 rounded-full" />

        {/* Decorative quote watermark */}
        <div className="absolute top-6 left-6 opacity-[0.06] pointer-events-none">
          <svg width="48" height="36" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
          </svg>
        </div>

        <div className="absolute bottom-6 right-6 opacity-[0.06] pointer-events-none rotate-180">
          <svg width="48" height="36" viewBox="0 0 48 36" fill="currentColor" className="text-[#2AD6CA]">
            <path d="M0 36V20.4C0 9.12 5.04 3.36 15.12 2.16L16.8 6.24C11.28 7.2 8.4 10.32 8.16 15.36H16.8V36H0Z"/>
          </svg>
        </div>

        <div className="flex flex-col items-center text-center h-full justify-between py-2">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#2AD6CA]/8 border-2 border-[#2AD6CA]/25 flex items-center justify-center shadow-sm">
              <span className="text-[#2AD6CA] font-bold text-lg">
                {testimonial.initials || getInitials(testimonial.name)}
              </span>
            </div>
          </div>

          {/* Quote */}
          <div className="flex-1 flex items-center justify-center px-2">
            <blockquote className="text-2xl md:text-3xl leading-[1.6] text-gray-900 font-semibold max-w-sm">
              {truncateQuote(testimonial.quote)}
            </blockquote>
          </div>

          {/* Attribution */}
          <footer className="flex-shrink-0 space-y-1">
            <cite className="not-italic font-bold text-gray-900 text-lg block">
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
    </div>
  );

  return (
    <Section 
      id="testimonials" 
      className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/30 to-white"
    >
      <Container>
        <div 
          className="text-center space-y-12 relative z-10"
          onKeyDown={handleKeyDown}
          tabIndex={layoutMode === 'carousel' ? 0 : -1}
          role={layoutMode === 'carousel' ? "region" : undefined}
          aria-label={layoutMode === 'carousel' ? "Testimonials carousel" : undefined}
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

          {/* Testimonials Display */}
          <div className="relative max-w-[1200px] mx-auto">
            {layoutMode === 'static' && (
              <div className="flex justify-center">
                {testimonials.map((testimonial, index) => 
                  renderTestimonialCard(testimonial, index, true, 1, 1)
                )}
              </div>
            )}

            {layoutMode === 'row' && (
              <div className="flex justify-center items-stretch px-4">
                {testimonials.map((testimonial, index) => 
                  renderTestimonialCard(testimonial, index, true, 1, 1)
                )}
              </div>
            )}

            {layoutMode === 'carousel' && (
              <>
                {/* Carousel Track */}
                <div 
                  ref={trackRef}
                  className="relative overflow-hidden px-4 md:px-8"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
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
                    className="flex transition-transform duration-500 ease-out justify-center items-center"
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

                      if (!isVisible) return null;

                      const scale = isActive ? 1.02 : 0.96;
                      const opacity = isActive ? 1 : 0.75;

                      return renderTestimonialCard(testimonial, index, isActive, scale, opacity);
                    })}
                  </div>
                </div>

                {/* Navigation Arrows */}
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

                {/* Navigation Dots */}
                <div className="flex justify-center items-center gap-3 pt-8">
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
              </>
            )}
          </div>

          {/* Live region for screen readers */}
          {layoutMode === 'carousel' && (
            <div 
              className="sr-only" 
              aria-live="polite" 
              aria-atomic="true"
            >
              Testimonial {currentIndex + 1} of {testimonials.length}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
};