"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomeTestimonials: HomeThemeDefinition["Testimonials"] = ({ testimonials, ui }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotation every 7 seconds
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (testimonials.length === 0) return null;

  return (
    <Section title={ui.testimonials} className="bg-surface">
      <Container>
        <div className="relative mx-auto max-w-4xl">
          {/* Carousel Container */}
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <article className="text-center space-y-6 py-8">
                    <blockquote className="text-[clamp(1.4rem,3vw,1.8rem)] leading-relaxed italic text-text font-light">
                      "{testimonial.quote}"
                    </blockquote>
                    <footer className="space-y-2">
                      <cite className="block text-lg font-semibold text-text not-italic">
                        {testimonial.name}
                      </cite>
                      <p className="text-sm text-subtle font-light">
                        {testimonial.role}
                      </p>
                    </footer>
                  </article>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-text hover:text-primary group"
                aria-label="Previous testimonial"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="group-hover:scale-110 transition-transform duration-200"
                >
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-text hover:text-primary group"
                aria-label="Next testimonial"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="group-hover:scale-110 transition-transform duration-200"
                >
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            </>
          )}

          {/* Navigation Dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center space-x-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-primary scale-125 shadow-sm"
                      : "bg-border hover:bg-primary/40 hover:scale-110"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Progress Indicator (subtle) */}
          {testimonials.length > 1 && isAutoPlaying && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-border/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/60 rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: `${((Date.now() % 7000) / 7000) * 100}%`,
                  animation: isAutoPlaying ? 'progress 7s linear infinite' : 'none'
                }}
              />
            </div>
          )}
        </div>
      </Container>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </Section>
  );
};