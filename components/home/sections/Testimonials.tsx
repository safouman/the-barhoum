import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const Testimonials: HomeThemeDefinition["Testimonials"] = ({ testimonials, ui }) => (
  <Section title={ui.testimonials} className="bg-background">
    <Container className="space-y-[clamp(var(--space-sm),4vw,var(--space-lg))]">
      {testimonials.map((testimonial) => (
        <article key={testimonial.id} className="mx-auto max-w-4xl text-center">
          <p className="font-heading text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.5] text-text">
            &quot;{testimonial.quote}&quot;
          </p>
          <div className="mt-6 text-xs uppercase tracking-[0.4em] text-subtle">
            {testimonial.name} · {testimonial.role}
          </div>
        </article>
      ))}
    </Container>
  </Section>
);
