import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomeTestimonials: HomeThemeDefinition["Testimonials"] = ({ testimonials, ui }) => (
  <Section title={ui.testimonials} className="bg-surface">
    <Container className="space-y-8">
      {testimonials.map((testimonial) => (
        <article key={testimonial.id} className="mx-auto max-w-3xl text-center space-y-4">
          <blockquote className="text-quote italic text-text">
            &quot;{testimonial.quote}&quot;
          </blockquote>
          <footer className="space-y-1">
            <cite className="text-base font-medium text-text not-italic">
              {testimonial.name}
            </cite>
            <p className="text-sm text-subtle font-light">
              {testimonial.role}
            </p>
          </footer>
        </article>
      ))}
    </Container>
  </Section>
);
