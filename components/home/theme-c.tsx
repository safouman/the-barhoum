import { useMemo, useState } from "react";
import clsx from "classnames";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import { PdfCard } from "@/components/PdfCard";
import type { HomeThemeDefinition } from "./types";

const Hero: HomeThemeDefinition["Hero"] = ({ hero, locale, media }) => (
  <section className="bg-background text-text">
    <Container className="grid gap-10 py-[clamp(var(--space-lg),16vh,var(--space-xl))] lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm text-subtle">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/30 text-sm font-semibold text-accent">
            {hero.title[locale].at(0)}
          </span>
          <span className="rounded-full bg-surface px-4 py-1 text-xs uppercase tracking-[0.35em] text-subtle/80">
            {hero.cta[locale]}
          </span>
        </div>
        <h1 className="font-heading text-[clamp(2.4rem,5.2vw,3.7rem)] leading-tight">{hero.title[locale]}</h1>
        <p className="max-w-xl text-[clamp(1.05rem,2vw,1.35rem)] text-subtle">{hero.subtitle[locale]}</p>
        <Button href="#lead-form">{hero.cta[locale]}</Button>
      </div>
      <div className="grid gap-4 rounded-[28px] border border-border bg-surface p-6 shadow-sm">
        <span className="text-xs uppercase tracking-[0.35em] text-subtle/80">{hero.cta[locale]}</span>
        {media.videos.length > 0 && (
          <VideoEmbed videoId={media.videos[0].id} title={media.videos[0].title[locale]} />
        )}
        <div className="flex flex-wrap gap-3">
          {media.pdfs.map((pdf) => (
            <PdfCard key={pdf.url} href={pdf.url} label={pdf.label[locale]} localeLabel={pdf.label[locale]} />
          ))}
        </div>
      </div>
    </Container>
  </section>
);

const Categories: HomeThemeDefinition["Categories"] = ({ categories, activeCategory, onSelect, ui }) => (
  <Section id="categories" title={ui.categories} className="bg-surface">
    <Container className="grid gap-3">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          aria-pressed={activeCategory === category.id}
          className={clsx(
            "flex items-center justify-between gap-4 rounded-[24px] border border-transparent bg-background px-6 py-5 text-start shadow-sm transition",
            activeCategory === category.id
              ? "border-accent/70 shadow-md"
              : "hover:border-border"
          )}
        >
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-text">{category.label}</h3>
            <p className="max-w-prose text-sm text-subtle">{category.description}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle/10 text-sm text-subtle">
            {ui.categories}
          </span>
        </button>
      ))}
    </Container>
  </Section>
);

const Packages: HomeThemeDefinition["Packages"] = ({ packages, activePackageId, onSelect, ui }) => (
  <Section title={ui.packages} className="bg-background">
    <Container className="grid gap-4 md:grid-cols-2">
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          type="button"
          onClick={() => onSelect(pkg.id)}
          aria-pressed={activePackageId === pkg.id}
          className={clsx(
            "grid gap-3 rounded-[26px] border border-border bg-surface p-6 text-start shadow-sm transition hover:-translate-y-0.5",
            activePackageId === pkg.id && "border-accent shadow-md"
          )}
        >
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-xl font-heading text-text">{pkg.title}</span>
            <span className="rounded-full bg-accent/15 px-4 py-1 text-sm font-semibold text-accent">{pkg.priceLabel}</span>
          </div>
          <ul className="grid gap-1.5 text-sm text-subtle">
            {pkg.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-subtle" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </button>
      ))}
    </Container>
  </Section>
);

const Testimonials: HomeThemeDefinition["Testimonials"] = ({ testimonials, ui }) => {
  const [index, setIndex] = useState(0);
  const count = testimonials.length;
  const current = testimonials[index] ?? testimonials[0];

  const goTo = (direction: -1 | 1) => {
    setIndex((prev) => {
      if (!count) return prev;
      const next = (prev + direction + count) % count;
      return next;
    });
  };

  const indicators = useMemo(
    () => testimonials.map((item, idx) => ({ id: item.id, active: idx === index })),
    [testimonials, index]
  );

  return (
    <Section title={ui.testimonials} className="bg-surface">
      <Container className="grid gap-6">
        {current && (
          <article className="grid gap-5 rounded-[28px] border border-border bg-background p-8 text-center shadow-sm">
            <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-accent/20 text-3xl font-semibold text-accent">
              <span className="flex h-full items-center justify-center">{current.name.at(0)}</span>
            </div>
            <p className="text-[clamp(1.15rem,2.4vw,1.6rem)] font-heading leading-relaxed text-text">&quot;{current.quote}&quot;</p>
            <div className="text-sm text-subtle">
              <div className="font-semibold text-text">{current.name}</div>
              <div>{current.role}</div>
            </div>
          </article>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {indicators.map((dot) => (
              <span
                key={dot.id}
                className={clsx(
                  "h-2.5 w-2.5 rounded-full bg-border transition",
                  dot.active && "w-8 rounded-full bg-accent"
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-accent shadow-sm"
              aria-label="Previous"
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-accent shadow-sm"
              aria-label="Next"
            >
              &gt;
            </button>
          </div>
        </div>
      </Container>
    </Section>
  );
};

const LeadFormSection: HomeThemeDefinition["LeadForm"] = ({ selectedCategory, selectedPackage, ui }) => (
  <Section
    id="lead-form"
    title={<span className="text-xs font-semibold uppercase tracking-[0.4em] text-subtle">{ui.form.title}</span>}
    className="bg-background"
  >
    <Container className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
      <div className="space-y-4 text-center lg:text-start text-text">
        <h3 className="text-3xl font-heading">{ui.form.title}</h3>
        <p className="text-sm text-subtle">
          {ui.form.category}: {selectedCategory ?? "-"} · {ui.form.package}: {selectedPackage ?? "-"}
        </p>
        <p className="text-sm text-subtle/80">{ui.media.videos}</p>
      </div>
      <LeadForm labels={ui.form} selectedCategory={selectedCategory} selectedPackage={selectedPackage} variant="warm" />
    </Container>
  </Section>
);

export const themeC: HomeThemeDefinition = {
  Hero,
  Categories,
  Packages,
  Testimonials,
  LeadForm: LeadFormSection,
};
