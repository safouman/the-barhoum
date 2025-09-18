import clsx from "classnames";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "./types";

const Hero: HomeThemeDefinition["Hero"] = ({ hero, locale, media }) => (
  <section className="border-b border-border/60 bg-surface">
    <Container className="grid min-h-[55vh] place-content-center gap-6 py-[clamp(var(--space-lg),14vh,var(--space-xl))] text-center">
      <span className="text-xs uppercase tracking-[0.35em] text-subtle">{hero.cta[locale]}</span>
      <h1 className="font-heading text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.1] text-text">
        {hero.title[locale]}
      </h1>
      <p className="mx-auto max-w-2xl text-[clamp(1rem,2.2vw,1.35rem)] text-subtle">{hero.subtitle[locale]}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button href="#lead-form">{hero.cta[locale]}</Button>
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
      <div className="grid divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-surface text-sm shadow-sm sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-pressed={activeCategory === category.id}
            className={clsx(
              "flex flex-col justify-between gap-3 px-6 py-8 text-start transition hover:bg-background",
              activeCategory === category.id && "bg-background"
            )}
          >
            <header className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-subtle">{ui.categories}</span>
              <h3 className="text-lg font-bold text-text">{category.label}</h3>
            </header>
            <p className="text-subtle">{category.description}</p>
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
      <Container className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-4">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg.id)}
              aria-pressed={activePackageId === pkg.id}
              className={clsx(
                "grid items-center gap-3 rounded-[18px] border border-transparent bg-background px-5 py-4 text-start transition hover:border-border",
                activePackageId === pkg.id && "border-accent/60 shadow-sm"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-base font-semibold text-text">{pkg.title}</span>
                <span className="text-sm text-subtle">{pkg.priceLabel}</span>
              </div>
              <p className="text-sm text-subtle line-clamp-2">
                {pkg.features[0]}
              </p>
            </button>
          ))}
        </div>
        {selectedPackage && (
          <aside className="sticky top-28 grid gap-4 rounded-[18px] border border-border bg-background p-6 shadow-sm">
            <span className="text-xs uppercase tracking-[0.35em] text-subtle">{ui.packages}</span>
            <h3 className="text-2xl font-heading text-text">{selectedPackage.title}</h3>
            <span className="text-lg font-semibold text-accent">{selectedPackage.priceLabel}</span>
            <ul className="grid gap-2 text-sm text-subtle">
              {selectedPackage.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
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
    <Container className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((testimonial) => (
        <article key={testimonial.id} className="grid gap-3 rounded-[18px] border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
              {testimonial.name.at(0)}
            </span>
            <div className="text-xs uppercase tracking-[0.3em] text-subtle">
              {testimonial.role}
            </div>
          </div>
          <p className="text-sm text-text/90">&quot;{testimonial.quote}&quot;</p>
          <span className="text-sm font-semibold text-text">{testimonial.name}</span>
        </article>
      ))}
    </Container>
  </Section>
);

const LeadFormSection: HomeThemeDefinition["LeadForm"] = ({ selectedCategory, selectedPackage, ui }) => (
  <Section id="lead-form" className="border-t border-border/60 bg-surface">
    <Container className="grid gap-10 lg:grid-cols-[1fr,1fr]">
      <div className="space-y-4">
        <h3 className="text-3xl font-heading text-text">{ui.form.title}</h3>
        <div className="flex flex-wrap gap-2 text-sm text-subtle">
          <span>
            {ui.form.category}: <strong className="text-text">{selectedCategory ?? "-"}</strong>
          </span>
          <span>
            {ui.form.package}: <strong className="text-text">{selectedPackage ?? "-"}</strong>
          </span>
        </div>
        <div className="grid gap-3 text-sm text-subtle">
          <p>{ui.media.videos}</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-3 py-1">{ui.media.pdfs}</span>
            <span className="rounded-full border border-border px-3 py-1">{ui.packages}</span>
          </div>
        </div>
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
