import clsx from "classnames";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "./types";

const Hero: HomeThemeDefinition["Hero"] = ({ hero, locale, media }) => {
  const primaryVideo = media.videos[0];

  return (
    <section className="relative isolate overflow-hidden bg-background text-text">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(41,214,199,0.18),_transparent_60%)]" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(165,156,145,0.16),_transparent_70%)]" aria-hidden />
      <Container className="relative grid min-h-[78vh] items-center gap-[clamp(var(--space-md),6vw,var(--space-xl))] py-[clamp(var(--space-lg),18vh,var(--space-xl)*1.15)] lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-[clamp(var(--space-sm),4vw,var(--space-md))]">
          <p className="text-[0.75rem] uppercase tracking-[0.5em] text-subtle/70">{hero.cta[locale]}</p>
          <h1 className="font-heading text-[clamp(3rem,6.5vw,4.8rem)] leading-[1.05]">{hero.title[locale]}</h1>
          <p className="max-w-xl text-[clamp(1.05rem,2vw,1.4rem)] text-subtle">{hero.subtitle[locale]}</p>
          <Button href="#lead-form">{hero.cta[locale]}</Button>
        </div>
        {primaryVideo ? (
          <div className="relative flex flex-col gap-5 rounded-[30px] border border-border/60 bg-surface/90 p-lg shadow-md backdrop-blur">
            <span className="text-[0.7rem] uppercase tracking-[0.4em] text-subtle/80">{primaryVideo.title[locale]}</span>
            <VideoEmbed videoId={primaryVideo.id} title={primaryVideo.title[locale]} />
            {media.pdfs.length > 0 && (
              <div className="flex flex-wrap gap-3 text-[0.7rem] uppercase tracking-[0.35em] text-subtle/70">
                {media.pdfs.map((pdf) => (
                  <span key={pdf.url} className="rounded-full border border-border/40 px-4 py-2">
                    {pdf.label[locale]}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Container>
    </section>
  );
};

const Categories: HomeThemeDefinition["Categories"] = ({ categories, activeCategory, onSelect, ui }) => (
  <Section id="categories" title={ui.categories} className="bg-gradient-to-b from-transparent via-[rgba(165,156,145,0.08)] to-transparent">
    <Container>
      <div className="grid gap-[clamp(var(--space-sm),5vw,var(--space-lg))] md:grid-cols-2">
        {categories.map((category, index) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-pressed={activeCategory === category.id}
            className={clsx(
              "group relative grid min-h-[240px] gap-5 overflow-hidden rounded-[28px] border border-border/60 bg-surface/80 p-[clamp(var(--space-sm),3vw,var(--space-md))] text-start shadow-sm transition",
              index % 2 === 0
                ? "before:absolute before:-inset-1 before:bg-[radial-gradient(circle,_rgba(41,214,199,0.14),_transparent_70%)] before:opacity-0 before:transition before:content-[''] group-hover:before:opacity-100"
                : "before:absolute before:-inset-1 before:bg-[radial-gradient(circle,_rgba(165,156,145,0.12),_transparent_70%)] before:opacity-0 before:transition before:content-[''] group-hover:before:opacity-100",
              activeCategory === category.id && "border-accent/80 shadow-md"
            )}
          >
            <div className="relative z-10 space-y-3">
              <span className="text-[0.7rem] uppercase tracking-[0.35em] text-subtle/70">{ui.categories}</span>
              <span className="font-heading text-[clamp(2rem,4vw,2.6rem)] leading-[1.15]">{category.label}</span>
              <p className="max-w-prose text-[clamp(1.05rem,2vw,1.25rem)] text-subtle/85">{category.description}</p>
            </div>
          </button>
        ))}
      </div>
    </Container>
  </Section>
);

const Packages: HomeThemeDefinition["Packages"] = ({ packages, activePackageId, onSelect, ui }) => (
  <Section title={ui.packages} className="bg-gradient-to-b from-transparent via-[rgba(41,214,199,0.08)] to-transparent">
    <Container className="grid gap-[clamp(var(--space-sm),4vw,var(--space-lg))] lg:grid-cols-2">
      {packages.length === 0 ? (
        <div className="col-span-full rounded-[24px] border border-border/60 bg-surface/70 px-8 py-10 text-center text-sm text-subtle">
          {ui.categories}
        </div>
      ) : (
        packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onSelect(pkg.id)}
            aria-pressed={activePackageId === pkg.id}
            className={clsx(
              "grid gap-5 rounded-[28px] border border-border/60 bg-surface/80 p-[clamp(var(--space-sm),3vw,var(--space-md))] text-left shadow-sm transition hover:-translate-y-1",
              activePackageId === pkg.id && "border-accent/80 shadow-md"
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <span className="font-heading text-[clamp(1.6rem,3vw,2.2rem)]">{pkg.title}</span>
              <span className="rounded-full border border-accent/60 px-5 py-2 text-xs uppercase tracking-[0.4em] text-accent">
                {pkg.priceLabel}
              </span>
            </div>
            <ul className="grid gap-2 text-sm text-subtle/90">
            {pkg.features.map((feature) => (
              <li key={feature} className="relative ps-5">
                <span className="absolute inset-y-0 start-0 my-auto h-2 w-2 rounded-full bg-accent" />
                {feature}
              </li>
            ))}
            </ul>
          </button>
        ))
      )}
    </Container>
  </Section>
);

const Testimonials: HomeThemeDefinition["Testimonials"] = ({ testimonials, ui }) => (
  <Section title={ui.testimonials} className="bg-[linear-gradient(120deg,_rgba(41,214,199,0.12),_transparent_60%)]">
    <Container className="space-y-[clamp(var(--space-sm),4vw,var(--space-lg))]">
      {testimonials.map((testimonial) => (
        <figure key={testimonial.id} className="mx-auto max-w-5xl text-center">
          <blockquote className="font-heading text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.5]">
            &quot;{testimonial.quote}&quot;
          </blockquote>
          <figcaption className="mt-6 text-sm uppercase tracking-[0.3em] text-subtle">
            {testimonial.name} · {testimonial.role}
          </figcaption>
        </figure>
      ))}
    </Container>
  </Section>
);

const LeadFormSection: HomeThemeDefinition["LeadForm"] = ({ selectedCategory, selectedPackage, ui }) => (
  <Section id="lead-form" title={ui.form.title} className="bg-gradient-to-br from-[rgba(43,43,43,0.95)] via-[rgba(52,52,52,0.88)] to-[rgba(43,43,43,0.95)]">
    <Container className="grid gap-[clamp(var(--space-sm),6vw,var(--space-lg))] lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
      <div className="space-y-4 text-text">
        <h3 className="font-heading text-[clamp(2.2rem,4vw,3.2rem)] leading-tight">
          {selectedCategory ?? ui.form.category}
        </h3>
        <p className="max-w-prose text-subtle/80">
          {ui.form.package}: {selectedPackage ?? "-"}
        </p>
        <div className="h-px w-24 bg-accent/60" />
        <p className="max-w-prose text-sm text-subtle/70">{ui.media.pdfs}</p>
      </div>
      <LeadForm labels={ui.form} selectedCategory={selectedCategory} selectedPackage={selectedPackage} variant="luxury" />
    </Container>
  </Section>
);

export const themeA: HomeThemeDefinition = {
  Hero,
  Categories,
  Packages,
  Testimonials,
  LeadForm: LeadFormSection,
};
