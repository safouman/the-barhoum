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
  const [isVisible, setIsVisible] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const autoPlayRef = useRef<NodeJS.Timeout>();
  const sectionRef = useRef<HTMLElement>(null);

  const isRTL = locale === "ar";
  const testimonialCount = testimonials.length;
  const hasMultipleItems = testimonialCount > 1;
  const showArrows = testimonialCount > 2;
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

  // Auto-play functionality
  useEffect(() => {
    if (!hasMultipleItems || !autoPlayEnabled || !isVisible) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (enableInfiniteLoop) {
          return (prev + 1) % testimonialCount;
        }
        return prev < testimonialCount - 1 ? prev + 1 : 0;
      });
    }, 6000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [hasMultipleItems, autoPlayEnabled, isVisible, testimonialCount, enableInfiniteLoop]);

  const handlePrevious = useCallback(() => {
    if (!hasMultipleItems) return;
    setCurrentIndex((prev) => {
      if (enableInfiniteLoop) {
        return (prev - 1 + testimonialCount) % testimonialCount;
      }
      return prev > 0 ? prev - 1 : testimonialCount - 1;
    });
  }, [hasMultipleItems, testimonialCount, enableInfiniteLoop]);

  const handleNext = useCallback(() => {
    if (!hasMultipleItems) return;
    setCurrentIndex((prev) => {
      if (enableInfiniteLoop) {
        return (prev + 1) % testimonialCount;
      }
      return prev < testimonialCount - 1 ? prev + 1 : 0;
    });
  }, [hasMultipleItems, testimonialCount, enableInfiniteLoop]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Touch/mouse drag handlers
  const handleStart = useCallback((clientX: number) => {
    if (!hasMultipleItems) return;
    setIsDragging(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
    setAutoPlayEnabled(false);
  }, [hasMultipleItems]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !hasMultipleItems) return;
    currentXRef.current = clientX;
  }, [isDragging, hasMultipleItems]);

  const handleEnd = useCallback(() => {
    if (!isDragging || !hasMultipleItems) return;
    setIsDragging(false);
    
    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      // In RTL, we still want left swipe to go to next item
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    
    setTimeout(() => setAutoPlayEnabled(true), 100);
  }, [isDragging, handlePrevious, handleNext, hasMultipleItems]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!hasMultipleItems) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      isRTL ? handleNext() : handlePrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      isRTL ? handlePrevious() : handleNext();
    }
  }, [handlePrevious, handleNext, hasMultipleItems, isRTL]);

  const handleMouseEnter = () => setAutoPlayEnabled(false);
  const handleMouseLeave = () => setAutoPlayEnabled(true);

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
    const wordsPerLine = isRTL ? 6 : 8;
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) return quote;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  // Determine layout based on screen size and testimonial count
  const getLayoutConfig = () => {
    if (testimonialCount === 1) {
      return { cardsToShow: 1, showPeek: false };
    }
    if (testimonialCount === 2) {
      return { cardsToShow: 2, showPeek: false };
    }
    return { cardsToShow: 3, showPeek: true };
  };

  const { cardsToShow, showPeek } = getLayoutConfig();

  const renderTestimonialCard = (testimonial: any, index: number, position: 'center' | 'side' | 'hidden') => {
    const isActive = position === 'center';
    const isVisible = position !== 'hidden';
    
    if (!isVisible) return null;

    return (
      <article
        key={testimonial.id}
        className={`
          flex-shrink-0 transition-all duration-300 ease-out
          ${position === 'center' ? 'scale-100 opacity-100' : 'scale-95 opacity-75'}
          ${hasMultipleItems && position === 'side' ? 'cursor-pointer hover:scale-[0.97] hover:opacity-85' : ''}
        `}
        style={{
          width: testimonialCount === 1 ? '100%' : 
                 testimonialCount === 2 ? '48%' : 
                 position === 'center' ? '400px' : '360px',
          maxWidth: testimonialCount === 1 ? '480px' : 'none',
        }}
        onClick={() => hasMultipleItems && position === 'side' && setCurrentIndex(index)}
        role="group"
        aria-roledescription="slide"
        aria-label={`Testimonial ${index + 1} of ${testimonialCount}`}
      >
        <div
          className={`
            relative bg-white rounded-2xl p-8 mx-3
            transition-all duration-300 ease-out min-h-[420px] flex flex-col justify-between
            ${isActive 
              ? 'shadow-[0_20px_40px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.12),0_12px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5' 
              : 'shadow-[0_8px_20px_rgba(0,0,0,0.04),0_3px_8px_rgba(0,0,0,0.03)]'
            }
          `}
        >
          {/* Teal accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-[#2AD6CA]/40 rounded-full" />

          {/* Decorative quote watermarks */}
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
              <blockquote 
                className="text-3xl md:text-4xl leading-[1.6] text-gray-900 font-semibold max-w-sm"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {truncateQuote(testimonial.quote)}
              </blockquote>
            </div>

            {/* Attribution */}
            <footer className="flex-shrink-0 space-y-1">
              <cite className="not-italic font-bold text-gray-900 text-2xl block">
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
        className="bg-gradient-to-b from-white via-gray-50/50 to-white"
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
      className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-white"
      ref={sectionRef}
      role="region"
      aria-label="Testimonials"
    >
      <Container>
        <div 
          className="text-center space-y-12 relative z-10"
          onKeyDown={handleKeyDown}
          tabIndex={hasMultipleItems ? 0 : -1}
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
            {/* Static layouts for 1-2 items */}
            {testimonialCount <= 2 && (
              <div className={`flex justify-center items-stretch gap-6 px-4 ${testimonialCount === 1 ? '' : 'md:gap-8'}`}>
                {testimonials.map((testimonial, index) => 
                  renderTestimonialCard(testimonial, index, 'center')
                )}
              </div>
            )}

            {/* Row layout for exactly 3 items */}
            {testimonialCount === 3 && (
              <div className="hidden lg:flex justify-center items-stretch gap-4 px-4">
                {testimonials.map((testimonial, index) => 
                  renderTestimonialCard(testimonial, index, index === 1 ? 'center' : 'side')
                )}
              </div>
            )}

            {/* Carousel for 3+ items on smaller screens or 4+ items */}
            {(testimonialCount >= 3) && (
              <div className={testimonialCount === 3 ? 'lg:hidden' : ''}>
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
                  style={{ cursor: isDragging ? 'grabbing' : hasMultipleItems ? 'grab' : 'default' }}
                >
                  <div 
                    className="flex transition-transform duration-300 ease-out justify-center items-center"
                    style={{
                      transform: `translateX(calc(-${currentIndex * (100 / cardsToShow)}% + ${currentIndex * 0}px))`,
                    }}
                  >
                    {testimonials.map((testimonial, index) => {
                      const isActive = index === currentIndex;
                      const isPrev = index === (currentIndex - 1 + testimonialCount) % testimonialCount;
                      const isNext = index === (currentIndex + 1) % testimonialCount;
                      const isVisible = cardsToShow === 1 ? isActive : (isActive || isPrev || isNext);

                      const position = isActive ? 'center' : isVisible ? 'side' : 'hidden';

                      return renderTestimonialCard(testimonial, index, position);
                    })}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {showArrows && (
                  <>
                    <button
                      onClick={isRTL ? handleNext : handlePrevious}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-gray-300/60 bg-white/80 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-white transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20"
                      aria-label={isRTL ? "Next testimonial" : "Previous testimonial"}
                      disabled={!enableInfiniteLoop && currentIndex === 0}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      onClick={isRTL ? handlePrevious : handleNext}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-gray-300/60 bg-white/80 backdrop-blur-sm hover:border-[#2AD6CA] hover:bg-white transition-all duration-300 flex items-center justify-center text-gray-500 hover:text-[#2AD6CA] focus:outline-none focus:ring-2 focus:ring-[#2AD6CA]/30 z-20"
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
                {hasMultipleItems && (
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
                        aria-current={index === currentIndex ? "true" : "false"}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live region for screen readers */}
          {hasMultipleItems && (
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