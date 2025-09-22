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

  const isRtl = locale === "ar";
  const sectionTitle = ui.testimonials;

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

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

  if (!testimonials.length) {
    return (
      <Section id="testimonials" className="bg-surface">
        <Container>
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <div className="w-12 h-0.5 bg-primary mx-auto"></div>
              <h2 className="text-section-title font-semibold text-text">
                {sectionTitle}
              </h2>
            </div>
            <p className="text-subtle">No testimonials available.</p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section id="testimonials" className="bg-surface">
      <Container>
        <div className="text-center space-y-12">
          {/* Section Header */}
          <div className="space-y-4">
            <div className="w-12 h-0.5 bg-primary mx-auto"></div>
            <h2 className="text-section-title font-semibold text-text">
              {sectionTitle}
            </h2>
          </div>

          {/* Carousel Container */}
          <div className="relative max-w-4xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
            {/* Navigation Arrows */}
            <button
              onClick={handlePrevious}
              className={clsx(
                "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-text hover:text-primary z-10",
                isRtl ? "right-0 translate-x-4" : "left-0 -translate-x-4"
              )}
              aria-label="Previous testimonial"
            >
              {isRtl ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>

            <button
              onClick={handleNext}
              className={clsx(
                "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-text hover:text-primary z-10",
                isRtl ? "left-0 -translate-x-4" : "right-0 translate-x-4"
              )}
              aria-label="Next testimonial"
            >
              {isRtl ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {/* Testimonials Slider */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ 
                  transform: isRtl 
                    ? `translateX(${currentIndex * 100}%)` 
                    : `translateX(-${currentIndex * 100}%)`
                }}
              >
                {testimonials.map((testimonial, index) => {
                  console.log('Rendering testimonial:', testimonial);
                  console.log('Name value:', testimonial.name);
                  console.log('Quote value:', testimonial.quote);
                  console.log('Role value:', testimonial.role);
                  return (
                    <div
                      key={index}
                      className="w-full flex-shrink-0 px-8"
                    >
                      <div className="text-center space-y-6 py-8">
                        {/* Quote */}
                        <blockquote 
                          className={clsx(
                            "text-black leading-normal text-center text-xl"
                          )}
                        >
                          {testimonial.quote}
                        </blockquote>

                        {/* Attribution */}
                        <footer className="space-y-1">
                          <cite className="not-italic font-bold text-black text-base block">
                            {testimonial.name}
                          </cite>
                          <p className="text-sm text-gray-700 block">
                            {testimonial.role}
                          </p>
                        </footer>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Bar */}
            {isAutoPlaying && !userInteracted && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-progress"></div>
              </div>
            )}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center items-center gap-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={clsx(
                  "rounded-full transition-all duration-200 flex-shrink-0",
                  index === currentIndex
                    ? "bg-primary w-3 h-3"
                    : "bg-gray-300 hover:bg-gray-400 w-2 h-2"
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
};