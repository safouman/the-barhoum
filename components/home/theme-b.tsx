import Image from "next/image";
import clsx from "classnames";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "./types";

const Hero: HomeThemeDefinition["Hero"] = ({ hero, locale }) => {
  const isRTL = locale === "ar";

  return (
    <section className="theme-b-hero relative isolate overflow-hidden bg-[#ffffff] text-[#0f0f0f]">
      <Container
        className={clsx(
          "theme-b-hero__container relative grid min-h-[calc(100dvh-80px)] items-center gap-[clamp(32px,6vw,64px)] py-[clamp(4rem,14vh,7rem)]",
          "md:grid-cols-[minmax(0,65ch)_minmax(0,1fr)]",
          isRTL ? "md:[direction:rtl]" : "md:[direction:ltr]"
        )}
      >
        <div
          className={clsx(
            "theme-b-hero__text relative z-10 flex max-w-[65ch] flex-col gap-10",
            isRTL ? "text-right" : "text-left"
          )}
        >
          <span className="text-[clamp(0.85rem,1.2vw,0.95rem)] font-medium uppercase tracking-[0.15em] text-[#888888]">
            {hero.cta[locale]}
          </span>
          <h1
            className={clsx(
              "text-[clamp(2.6rem,6.5vw,5.3rem)] font-semibold leading-[1.15] tracking-[-0.012em] text-[#0a0a0a]",
              isRTL ? "font-[var(--font-scheherazade)]" : "font-[var(--font-fraunces)]"
            )}
          >
            {hero.title[locale]}
          </h1>
          <p
            className={clsx(
              "max-w-[62ch] text-[clamp(1.18rem,2.4vw,1.45rem)] leading-[1.8] text-[#333333]",
              isRTL ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"
            )}
          >
            {hero.subtitle[locale]}
          </p>
          <div className={clsx("mt-10 flex flex-wrap items-center gap-6", isRTL ? "justify-end" : "justify-start")}
          >
            <Button href="#categories" className="theme-b-hero__btn-primary px-8 py-[0.95rem] text-sm uppercase">
              {hero.cta[locale]}
            </Button>
            <Button
              href="#media"
              variant="ghost"
              className="theme-b-hero__btn-secondary px-7 py-[0.9rem] text-sm uppercase"
            >
              {locale === "ar" ? "عرض المنهج" : "View Approach"}
            </Button>
          </div>
        </div>
        <div className="theme-b-hero__logo pointer-events-none relative w-full md:justify-self-end">
          <Image
            src="/images/logo.png"
            alt="Barhoum watermark"
            width={720}
            height={720}
            className="theme-b-hero__logo-image"
            priority
          />
        </div>
      </Container>
    </section>
  );
};

const About: HomeThemeDefinition["About"] = ({ locale, media }) => {
  const isRTL = locale === "ar";
  const title = isRTL ? "شكونو ابراهيم بن عبد الله" : "Who is Barhoum?";
  const intro = isRTL
    ? "لوريم إيبسوم نص تجريبي يصف إبراهيم كقائد ومدرب وفنان يمزج الدقة الاستراتيجية باللمسة الإنسانية. يقدم مساحة هادئة لالتقاط الأنفاس وإعادة ترتيب الإيقاع، ويقود مسارات عملية تظل وفية للذات."
    : "Barhoum is a grounded coach, strategist, and artist who blends decisive frameworks with empathic listening. He choreographs calm confidence, builds rituals that hold in high-stakes environments, and keeps the human story at the center of every transformation.";

  const pdfs = media.pdfs.length
    ? media.pdfs
    : Array.from({ length: 4 }, (_, index) => ({
        url: "#",
        label: { en: `Guided dossier ${index + 1}`, ar: `ملف موجه ${index + 1}` },
      }));

  const video = media.videos[0];

  return (
    <Section title={title} className="bg-background">
      <Container className={clsx("grid gap-12", "lg:grid-cols-[minmax(0,60ch)_minmax(0,1fr)]", isRTL && "text-right") }>
        <div className="space-y-8">
          <p
            className={clsx(
              "text-[clamp(1.15rem,2.1vw,1.35rem)] leading-[1.82] text-[#3b3b39]",
              isRTL ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"
            )}
          >
            {intro}
          </p>
          <ul className={clsx("space-y-3 text-sm", isRTL ? "pr-4" : "pl-4") }>
            {pdfs.slice(0, 5).map((pdf, index) => (
              <li key={pdf.url ?? index} className="flex items-center gap-3 text-[#1d1c1a]">
                <span aria-hidden className="text-[#8d8d88]">•</span>
                <a
                  href={pdf.url}
                  className="border-b border-[rgba(29,28,26,0.2)] pb-1 transition hover:border-[#000] hover:text-[#000]"
                  rel="noopener noreferrer"
                >
                  {pdf.label[locale] ?? pdf.label.en}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {video ? (
          <div className="relative isolate flex items-center justify-center">
            <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,_rgba(16,16,16,0.05),_transparent_70%)]" aria-hidden />
            <div className="relative w-full max-w-[560px]">
              <VideoEmbed videoId={video.id} title={video.title[locale]} />
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  );
};

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
  About,
  Categories,
  Packages,
  Testimonials,
  LeadForm: LeadFormSection,
};
