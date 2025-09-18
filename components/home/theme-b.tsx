import clsx from "classnames";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "./types";

const Hero: HomeThemeDefinition["Hero"] = ({ hero, locale, media }) => (
  <section className="relative overflow-hidden bg-background text-text">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(41,214,199,0.12),_transparent_70%)]" aria-hidden />
    <Container className="relative grid min-h-[60vh] place-content-center gap-8 py-[clamp(var(--space-lg),16vh,var(--space-xl))] text-center">
      <span className="text-xs uppercase tracking-[0.45em] text-subtle">{hero.cta[locale]}</span>
      <h1 className="font-heading text-[clamp(2.8rem,6vw,4rem)] leading-[1.05]">{hero.title[locale]}</h1>
      <p className="mx-auto max-w-3xl text-[clamp(1.05rem,2.3vw,1.45rem)] text-subtle">{hero.subtitle[locale]}</p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button href="#categories">{hero.cta[locale]}</Button>
        {media.videos[0] && (
          <Button
            href={`https://www.youtube.com/watch?v=${media.videos[0].id}`}
            variant="ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            {media.videos[0].title[locale]}
          </Button>
        )}
      </div>
    </Container>
  </section>
);

const Categories: HomeThemeDefinition["Categories"] = ({ categories, activeCategory, onSelect, ui }) => (
  <Section id="categories" title={ui.categories} className="bg-background">
    <Container>
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-pressed={activeCategory === category.id}
            className={clsx(
              "flex flex-col justify-between gap-5 rounded-[20px] border border-border bg-surface/90 px-8 py-10 text-start transition",
              activeCategory === category.id ? "border-accent bg-surface" : "hover:border-accent/40"
            )}
          >
            <header className="space-y-3">
              <span className="text-xs uppercase tracking-[0.4em] text-subtle/80">{ui.categories}</span>
              <h3 className="font-heading text-2xl leading-[1.2] text-text">{category.label}</h3>
            </header>
            <p className="text-[clamp(1.05rem,2vw,1.2rem)] text-subtle/90">{category.description}</p>
          </button>
        ))}
      </div>
    </Container>
  </Section>
);

const Packages: HomeThemeDefinition["Packages"] = ({ packages, activePackageId, onSelect, ui }) => {
  const selectedPackage = packages.find((pkg) => pkg.id === activePackageId) ?? packages[0];

  return (
    <Section title={ui.packages} className="bg-surface">
      <Container className="grid gap-[clamp(var(--space-sm),5vw,var(--space-lg))] lg:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-4">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg.id)}
              aria-pressed={activePackageId === pkg.id}
              className={clsx(
                "grid items-center gap-3 rounded-[20px] border border-transparent bg-background px-6 py-5 text-start transition hover:border-border",
                activePackageId === pkg.id && "border-accent shadow-sm"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-base font-semibold text-text">{pkg.title}</span>
                <span className="text-sm text-subtle">{pkg.priceLabel}</span>
              </div>
              <p className="text-sm text-subtle line-clamp-2">{pkg.features[0]}</p>
            </button>
          ))}
        </div>
        {selectedPackage && (
          <aside className="sticky top-32 grid gap-4 rounded-[22px] border border-border bg-background p-8 shadow-sm">
            <span className="text-xs uppercase tracking-[0.45em] text-subtle/80">{ui.packages}</span>
            <h3 className="text-3xl font-heading text-text">{selectedPackage.title}</h3>
            <span className="text-xl font-semibold text-accent">{selectedPackage.priceLabel}</span>
            <ul className="grid gap-2 text-sm text-subtle">
              {selectedPackage.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-6 rounded-full bg-accent/40" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </Container>
    </Section>
  );
};

const Testimonials: HomeThemeDefinition["Testimonials"] = ({ testimonials, ui }) => (
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

const LeadFormSection: HomeThemeDefinition["LeadForm"] = ({ selectedCategory, selectedPackage, ui }) => (
  <Section id="lead-form" title={ui.form.title} className="border-t border-border/60 bg-surface">
    <Container className="grid gap-10 lg:grid-cols-[1fr,1fr]">
      <div className="space-y-5 text-text">
        <h3 className="text-3xl font-heading">{ui.form.title}</h3>
        <div className="flex flex-wrap gap-2 text-sm text-subtle">
          <span>
            {ui.form.category}: <strong className="text-text">{selectedCategory ?? "-"}</strong>
          </span>
          <span>
            {ui.form.package}: <strong className="text-text">{selectedPackage ?? "-"}</strong>
          </span>
        </div>
        <p className="text-sm text-subtle/80">{ui.media.videos}</p>
      </div>
      <LeadForm labels={ui.form} selectedCategory={selectedCategory} selectedPackage={selectedPackage} variant="modern" />
    </Container>
  </Section>
);

export const themeB: HomeThemeDefinition = {
  Hero,
  Categories,
  Packages,
  Testimonials,
  LeadForm: LeadFormSection,
};
