import Image from "next/image";
import { useMemo, useState } from "react";
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
        <section className="theme-c-hero relative isolate overflow-hidden bg-[#ffffff] text-[#101010]">
            <Container className="theme-c-hero__container relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-10 py-[clamp(6rem,18vh,8.5rem)] text-center">
                <LogoMark />
                <div className="theme-c-hero__content mt-14 space-y-8">
                    <span className="text-[clamp(0.85rem,1.2vw,0.95rem)] font-medium uppercase tracking-[0.18em] text-[#999999]">
                        {hero.cta[locale]}
                    </span>
                    <h1 className="font-[var(--font-playfair)] text-[clamp(2.8rem,6.5vw,4.8rem)] font-semibold tracking-[-0.015em] text-[#101010]">
                        {hero.title[locale]}
                    </h1>
                    <p
                        className={clsx(
                            "mx-auto max-w-[62ch] text-[clamp(1.18rem,2.3vw,1.45rem)] leading-[1.78] text-[#333333]",
                            isRTL
                                ? "font-[var(--font-cairo)]"
                                : "font-[var(--font-inter)]"
                        )}
                    >
                        {hero.subtitle[locale]}
                    </p>
                </div>
                <div className="theme-c-hero__actions mt-12 flex flex-wrap items-center justify-center gap-6">
                    <Button
                        href="#categories"
                        className="theme-c-hero__btn-primary px-8 py-[0.95rem] text-sm uppercase"
                    >
                        {hero.cta[locale]}
                    </Button>
                    <Button
                        href="#media"
                        variant="ghost"
                        className="theme-c-hero__btn-secondary px-8 py-[0.95rem] text-sm uppercase"
                    >
                        {locale === "ar" ? "اكتشف المنهج" : "View Approach"}
                    </Button>
                </div>
            </Container>
        </section>
    );
};

const About: HomeThemeDefinition["About"] = ({ locale, media }) => {
  const isRTL = locale === "ar";
  const title = isRTL ? "شكونو ابراهيم بن عبد الله" : "Who is Barhoum?";
  const intro = isRTL
    ? "لوريم إيبسوم فقرة تمهيدية تعرّف بإبراهيم كقائد إنساني ومدرب فني يصنع توازناً بين الرؤية العملية والإلهام الهادئ. يقدم مساحة للتأمل والعمل ويقود القرارات بثقة متواضعة." 
    : "Barhoum is a calm force—coach, artist, and strategist—guiding leaders to act with empathy and conviction. He carves out reflective space, frames clarity, and moves teams with quietly confident direction.";

  const pdfs = media.pdfs.length
    ? media.pdfs
    : Array.from({ length: 4 }, (_, index) => ({
        url: "#",
        label: { en: `Portfolio note ${index + 1}`, ar: `مذكرة تعريفية ${index + 1}` },
      }));

  const video = media.videos[0];

  return (
    <Section title={title} className="bg-[#ffffff]">
      <Container className={clsx("grid gap-12", "lg:grid-cols-[minmax(0,60ch)_minmax(0,1fr)]", isRTL && "text-right") }>
        <div className="space-y-8">
          <p
            className={clsx(
              "text-[clamp(1.18rem,2.2vw,1.45rem)] leading-[1.82] text-[#2d2d2d]",
              isRTL ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"
            )}
          >
            {intro}
          </p>
          <ul className={clsx("space-y-3 text-sm", isRTL ? "pr-4" : "pl-4") }>
            {pdfs.slice(0, 5).map((pdf, index) => (
              <li key={pdf.url ?? index} className="flex items-center gap-3 text-[#1a1a1a]">
                <span aria-hidden className="text-[#939393]">•</span>
                <a
                  href={pdf.url}
                  className="border-b border-[rgba(0,0,0,0.12)] pb-1 transition hover:border-[#000] hover:text-[#000]"
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
            <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,_rgba(0,0,0,0.04),_transparent_70%)]" aria-hidden />
            <div className="relative w-full max-w-[560px]">
              <VideoEmbed videoId={video.id} title={video.title[locale]} />
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  );
};

function LogoMark() {
    return (
        <div className="theme-c-hero__logo relative flex h-40 w-40 items-center justify-center">
            <div
                className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(0,0,0,0.06),_rgba(255,255,255,0)_70%)]"
                aria-hidden
            />
            <Image
                src="/images/logo.png"
                alt="Barhoum monogram"
                width={720}
                height={720}
                className="relative h-40 w-auto opacity-50"
                priority
            />
        </div>
    );
}

const Categories: HomeThemeDefinition["Categories"] = ({
    categories,
    activeCategory,
    onSelect,
    ui,
}) => (
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
                        <h3 className="text-lg font-semibold text-text">
                            {category.label}
                        </h3>
                        <p className="max-w-prose text-sm text-subtle">
                            {category.description}
                        </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle/10 text-sm text-subtle">
                        {ui.categories}
                    </span>
                </button>
            ))}
        </Container>
    </Section>
);

const Packages: HomeThemeDefinition["Packages"] = ({
    packages,
    activePackageId,
    onSelect,
    ui,
}) => (
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
                        <span className="text-xl font-heading text-text">
                            {pkg.title}
                        </span>
                        <span className="rounded-full bg-accent/15 px-4 py-1 text-sm font-semibold text-accent">
                            {pkg.priceLabel}
                        </span>
                    </div>
                    <ul className="grid gap-1.5 text-sm text-subtle">
                        {pkg.features.map((feature) => (
                            <li
                                key={feature}
                                className="flex items-center gap-2"
                            >
                                <span
                                    className="h-2 w-2 rounded-full bg-subtle"
                                    aria-hidden
                                />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </button>
            ))}
        </Container>
    </Section>
);

const Testimonials: HomeThemeDefinition["Testimonials"] = ({
    testimonials,
    ui,
}) => {
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
        () =>
            testimonials.map((item, idx) => ({
                id: item.id,
                active: idx === index,
            })),
        [testimonials, index]
    );

    return (
        <Section title={ui.testimonials} className="bg-surface">
            <Container className="grid gap-6">
                {current && (
                    <article className="grid gap-5 rounded-[28px] border border-border bg-background p-8 text-center shadow-sm">
                        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-accent/20 text-3xl font-semibold text-accent">
                            <span className="flex h-full items-center justify-center">
                                {current.name.at(0)}
                            </span>
                        </div>
                        <p className="text-[clamp(1.15rem,2.4vw,1.6rem)] font-heading leading-relaxed text-text">
                            &quot;{current.quote}&quot;
                        </p>
                        <div className="text-sm text-subtle">
                            <div className="font-semibold text-text">
                                {current.name}
                            </div>
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

const LeadFormSection: HomeThemeDefinition["LeadForm"] = ({
    selectedCategory,
    selectedPackage,
    ui,
}) => (
    <Section
        id="lead-form"
        title={
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-subtle">
                {ui.form.title}
            </span>
        }
        className="bg-background"
    >
        <Container className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <div className="space-y-4 text-center lg:text-start text-text">
                <h3 className="text-3xl font-heading">{ui.form.title}</h3>
                <p className="text-sm text-subtle">
                    {ui.form.category}: {selectedCategory ?? "-"} ·{" "}
                    {ui.form.package}: {selectedPackage ?? "-"}
                </p>
                <p className="text-sm text-subtle/80">{ui.media.videos}</p>
            </div>
            <LeadForm
                labels={ui.form}
                selectedCategory={selectedCategory}
                selectedPackage={selectedPackage}
                variant="warm"
            />
        </Container>
    </Section>
);

export const themeC: HomeThemeDefinition = {
  Hero,
  About,
  Categories,
  Packages,
  Testimonials,
  LeadForm: LeadFormSection,
};
