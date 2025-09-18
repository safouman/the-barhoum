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
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-black via-[#1a1714] to-[#2e251d]">
      <div className="absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(199,167,100,0.35),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(20,19,18,0.6),_transparent_60%)]" />
      </div>
      <Container className="relative grid min-h-[82vh] items-center gap-[clamp(var(--space-md),6vw,var(--space-xl))] py-[clamp(var(--space-lg),18vh,var(--space-xl)*1.3)] lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-[clamp(var(--space-sm),4vw,var(--space-md))]">
          <p className="text-[0.75rem] uppercase tracking-[0.6em] text-subtle/70">{hero.cta[locale]}</p>
          <h1 className="font-heading text-[clamp(2.8rem,6vw,4.6rem)] leading-[1.1] text-text">
            {hero.title[locale]}
          </h1>
          <div className="max-w-xl text-[clamp(1.05rem,2vw,1.4rem)] text-subtle">
            <p>{hero.subtitle[locale]}</p>
          </div>
          <div>
            <Button href="#lead-form">{hero.cta[locale]}</Button>
          </div>
        </div>
        {primaryVideo ? (
          <div className="relative flex flex-col gap-4 rounded-[36px] border border-accent/30 bg-black/70 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
            <div className="text-sm uppercase tracking-[0.4em] text-subtle">
              {primaryVideo.title[locale]}
            </div>
            <VideoEmbed videoId={primaryVideo.id} title={primaryVideo.title[locale]} />
            {media.pdfs.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-subtle">
                {media.pdfs.map((pdf) => (
                  <span key={pdf.url} className="rounded-full border border-border/40 px-4 py-2 text-subtle/80">
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
  <Section id="categories" title={ui.categories} className="bg-gradient-to-b from-transparent via-black/10 to-transparent">
    <Container>
      <div className="grid gap-[clamp(var(--space-sm),5vw,var(--space-lg))] md:grid-cols-2">
        {categories.map((category, index) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-pressed={activeCategory === category.id}
            className={clsx(
              "group relative grid min-h-[220px] gap-4 overflow-hidden rounded-[32px] border border-border/40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_70%)] p-[clamp(var(--space-sm),3vw,var(--space-md))] text-start shadow-[0_24px_60px_rgba(0,0,0,0.18)] transition",
              index % 2 === 0 ? "before:absolute before:-inset-1 before:bg-[radial-gradient(circle,_rgba(199,167,100,0.18),_transparent_70%)] before:opacity-0 before:transition before:content-[''] group-hover:before:opacity-100" : "",
              activeCategory === category.id && "border-accent/80 shadow-[0_28px_70px_rgba(199,167,100,0.15)]"
            )}
          >
            <div className="relative z-10 space-y-3">
              <span className="text-xs uppercase tracking-[0.4em] text-subtle/70">{ui.categories}</span>
              <span className="font-heading text-[clamp(1.8rem,4vw,2.4rem)] leading-tight">{category.label}</span>
              <p className="max-w-prose text-subtle/90">{category.description}</p>
            </div>
          </button>
        ))}
      </div>
    </Container>
  </Section>
);

const Packages: HomeThemeDefinition["Packages"] = ({ packages, activePackageId, onSelect, ui }) => (
  <Section title={ui.packages} subtitle={ui.media.pdfs} className="bg-gradient-to-b from-transparent via-black/10 to-transparent">
    <Container className="grid gap-[clamp(var(--space-sm),4vw,var(--space-lg))] lg:grid-cols-2">
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          type="button"
          onClick={() => onSelect(pkg.id)}
          aria-pressed={activePackageId === pkg.id}
          className={clsx(
            "grid gap-4 rounded-[32px] border border-border/50 bg-background/30 p-[clamp(var(--space-sm),3vw,var(--space-md))] text-left shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition hover:-translate-y-1",
            activePackageId === pkg.id && "border-accent/80 shadow-[0_28px_70px_rgba(199,167,100,0.18)]"
          )}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <span className="font-heading text-[clamp(1.6rem,3vw,2.1rem)]">{pkg.title}</span>
            <span className="rounded-full border border-accent/50 px-5 py-2 text-sm uppercase tracking-[0.3em] text-accent">
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
          <span className="text-xs uppercase tracking-[0.3em] text-subtle/60">{ui.packages}</span>
        </button>
      ))}
    </Container>
  </Section>
);

const Testimonials: HomeThemeDefinition["Testimonials"] = ({ testimonials, ui }) => (
  <Section title={ui.testimonials} className="bg-[linear-gradient(120deg,_rgba(199,167,100,0.08),_transparent)]">
    <Container className="grid gap-[clamp(var(--space-sm),4vw,var(--space-lg))]">
      {testimonials.map((testimonial, index) => (
        <figure
          key={testimonial.id}
          className={clsx(
            "max-w-3xl justify-self-stretch rounded-[28px] border border-border/40 bg-background/60 p-[clamp(var(--space-sm),3vw,var(--space-md))] shadow-[0_24px_60px_rgba(0,0,0,0.24)]",
            index % 2 === 0 ? "justify-self-start" : "justify-self-end"
          )}
        >
          <blockquote className="text-[clamp(1.2rem,2.6vw,1.6rem)] leading-[var(--leading-relaxed)] text-subtle">
            &quot;{testimonial.quote}&quot;
          </blockquote>
          <figcaption className="mt-4 flex flex-wrap items-center gap-3 text-sm text-subtle/80">
            <span className="rounded-full bg-accent/20 px-4 py-1 text-accent">{testimonial.name}</span>
            <span>{testimonial.role}</span>
          </figcaption>
        </figure>
      ))}
    </Container>
  </Section>
);

const LeadFormSection: HomeThemeDefinition["LeadForm"] = ({ selectedCategory, selectedPackage, ui }) => (
  <Section id="lead-form" className="bg-gradient-to-br from-black/40 via-[#1a1714]/80 to-black/40">
    <Container className="grid gap-[clamp(var(--space-sm),6vw,var(--space-lg))] lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-subtle/70">{ui.form.title}</p>
        <h3 className="font-heading text-[clamp(2rem,4vw,3rem)] leading-tight">
          {selectedCategory ?? ui.form.category}
        </h3>
        <p className="max-w-prose text-subtle/80">
          {ui.form.package}: {selectedPackage ?? "-"}
        </p>
        <div className="h-px w-24 bg-accent/60" />
        <p className="max-w-prose text-sm text-subtle/70">
          {ui.media.pdfs}
        </p>
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
