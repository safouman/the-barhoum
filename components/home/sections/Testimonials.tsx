import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomeTestimonials: HomeThemeDefinition["Testimonials"] = ({ testimonials, ui }) => (
  <Section title={ui.testimonials} className="bg-background">
    <Container className="space-y-[clamp(var(--space-sm),4vw,var(--space-lg))]">
      {testimonials.map((testimonial) => (
        <article key={testimonial.id} className="mx-auto max-w-4xl text-center">
          <p className="text-quote">
            &quot;{testimonial.quote}&quot;
          </p>
          <div className="mt-6 text-smallcaps">
            {testimonial.name} · {testimonial.role}
          </div>
        </article>
      ))}
    </Container>
  </Section>
);
