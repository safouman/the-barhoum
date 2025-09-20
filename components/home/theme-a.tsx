import Image from "next/image";
import clsx from "classnames";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "./types";

const Hero: HomeThemeDefinition["Hero"] = ({ hero, locale }) => {
    return (
        <section className="relative isolate text-text">
            <div className="absolute inset-0 bg-[#050606]" aria-hidden />
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(41,214,199,0.12)_0%,_rgba(5,6,6,0)_42vw)]"
                aria-hidden
            />
            <Container className="relative flex min-h-[80vh] flex-col items-center justify-center py-[clamp(7rem,20vh,8.5rem)] text-center">
                {/* <span className="mb-12 block text-[clamp(0.875rem,1.3vw,1rem)] font-medium uppercase tracking-[0.18em] text-[#9fa7a3]">
                    {hero.cta[locale]}
                </span> */}
                <LogoMark />
                <div className="mt-48 space-y-8">
                    <h1 className="font-heading text-[clamp(2.5rem,6vw,4.75rem)] font-semibold tracking-[-0.012em] text-[#e7e9e8]">
                        {locale === "ar"
                            ? "ابراهيم بن عبد الله"
                            : "Ibrahim ben Abdallah"}
                    </h1>
                    <p className="mx-auto max-w-[58ch] font-sans text-[clamp(1.125rem,2.1vw,1.25rem)] leading-[1.68] text-[#c9cfcc]">
                        {locale === "ar"
                            ? "أرافق القادة والمديرين التنفيذيين في قراراتهم المصيرية، أساعدهم على رؤية الصورة الكاملة والتصرف بثبات دون أن يفقدوا إنسانيتهم. ننسج معاً إستراتيجية واضحة، نبني عليها نظام عمل متوازن، ونصنع مساحة للبوح والتقويم الصادق. في كل جلسة نتقدّم خطوة واعية نحو أهداف ملموسة، مع الإبقاء على الجذور الأخلاقية والروح العملية."
                            : "I stand with founders and executives in the moments that define them, translating complexity into decisive clarity without losing the human center. Together we craft pragmatic strategy, install rhythms that hold, and create a quiet place for candid reflection. Each engagement moves with deliberate pace—bold enough to change the game, grounded enough to honor the person behind the title."}
                    </p>
                </div>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
                    <Button
                        href="#categories"
                        className="lux-hero-btn lux-hero-btn--primary px-8 py-[1rem] text-base"
                    >
                        {locale === "ar"
                            ? "ابدأ المحادثة"
                            : "Begin Consultation"}
                    </Button>
                    <Button
                        href="#media"
                        variant="ghost"
                        className="lux-hero-btn lux-hero-btn--ghost px-8 py-[1rem] text-base"
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
    ? "لوريم إيبسوم نص تجريبي يصف حضور إبراهيم كمدرب وفنان يزاوج الثقة بالهدوء، ويرسم مساحات للقيادة الواعية بلمسة إنسانية." +
        " في كل تعاون يوفّر إطاراً عملياً، يحمي أصالة الصوت الداخلي، ويصوغ قرارات تشبه أصحابها." +
        " يعمل ببطء محسوب، ويوسّع مساحة النظر بعيداً عن ردود الفعل العاجلة." 
    : "Barhoum stands as a grounded coach, strategist, and artist who brings calm clarity into high-stakes rooms." +
        " Each engagement balances decisive structure with space to listen inward." +
        " He guides teams and leaders toward choices that feel both ambitious and humane.";
  const pdfs = media.pdfs.length
    ? media.pdfs
    : Array.from({ length: 4 }, (_, index) => ({
        url: "#",
        label: { en: `Placeholder dossier ${index + 1}`, ar: `ملف تعريفي ${index + 1}` },
      }));
  const video = media.videos[0];

  return (
    <Section title={title} className="bg-transparent">
      <Container className={clsx("grid gap-12", "lg:grid-cols-[minmax(0,60ch)_minmax(0,1fr)]", isRTL && "text-right") }>
        <div className="space-y-8">
          <p className="text-[clamp(1.15rem,2.2vw,1.4rem)] leading-[1.85] text-[#cbcfd0]">
            {intro}
          </p>
          <ul className={clsx("space-y-4 text-sm", isRTL ? "pr-4" : "pl-4", "list-none") }>
            {pdfs.map((pdf, index) => (
              <li key={pdf.url ?? index} className="flex items-center gap-3 text-[#e7e9e8]">
                <span aria-hidden className="text-accent">
                  •
                </span>
                <a
                  href={pdf.url}
                  className="border-b border-[rgba(231,233,232,0.3)] pb-1 text-sm transition hover:border-accent hover:text-accent"
                  rel="noopener noreferrer"
                >
                  {pdf.label[locale] ?? pdf.label.en}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {video ? (
          <div className="mx-auto w-full max-w-[560px]">
            <VideoEmbed videoId={video.id} title={video.title[locale]} />
          </div>
        ) : null}
      </Container>
    </Section>
  );
};

function LogoMark() {
    return (
        <div className="relative flex h-40 w-40 items-center justify-center">
            <div
                className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(41,214,199,0.24),_transparent_68%)] blur-[120px]"
                aria-hidden
            />
            <Image
                src="/images/logo.png"
                alt="Barhoum monogram"
                width={156}
                height={180}
                className="relative h-54 w-auto drop-shadow-[0_14px_38px_rgba(4,6,6,0.45)] mt-8 mb-8"
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
    <Section id="categories" title={ui.categories} className="bg-transparent">
        <Container>
            <div className="grid gap-[clamp(var(--space-sm),5vw,var(--space-lg))] md:grid-cols-2">
                {categories.map((category, index) => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() => onSelect(category.id)}
                        aria-pressed={activeCategory === category.id}
                        className={clsx(
                            "group relative grid min-h-[240px] gap-5 overflow-hidden rounded-[14px] border border-border/40 bg-surface/70 p-[clamp(var(--space-sm),3vw,var(--space-md))] text-start transition",
                            index % 2 === 0
                                ? "before:absolute before:-inset-1 before:bg-[radial-gradient(circle,_rgba(41,214,199,0.14),_transparent_70%)] before:opacity-0 before:transition before:content-[''] group-hover:before:opacity-100"
                                : "before:absolute before:-inset-1 before:bg-[radial-gradient(circle,_rgba(165,156,145,0.12),_transparent_70%)] before:opacity-0 before:transition before:content-[''] group-hover:before:opacity-100",
                            activeCategory === category.id &&
                                "border-accent/70 bg-surface/90"
                        )}
                    >
                        <div className="relative z-10 space-y-3">
                            <span className="text-[0.7rem] uppercase tracking-[0.35em] text-subtle/70">
                                {ui.categories}
                            </span>
                            <span className="font-heading text-[clamp(2rem,4vw,2.6rem)] leading-[1.15]">
                                {category.label}
                            </span>
                            <p className="max-w-prose text-[clamp(1.05rem,2vw,1.25rem)] text-subtle/85">
                                {category.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </Container>
    </Section>
);

const Packages: HomeThemeDefinition["Packages"] = ({
    packages,
    activePackageId,
    onSelect,
    ui,
}) => (
    <Section title={ui.packages} className="bg-transparent">
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
                            "grid gap-5 rounded-[16px] border border-border/40 bg-surface/70 p-[clamp(var(--space-sm),3vw,var(--space-md))] text-left transition hover:-translate-y-1",
                            activePackageId === pkg.id &&
                                "border-accent/70 bg-surface/90"
                        )}
                    >
                        <div className="flex flex-wrap items-baseline justify-between gap-4">
                            <span className="font-heading text-[clamp(1.6rem,3vw,2.2rem)]">
                                {pkg.title}
                            </span>
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

const Testimonials: HomeThemeDefinition["Testimonials"] = ({
    testimonials,
    ui,
}) => (
    <Section title={ui.testimonials} className="bg-transparent">
        <Container className="space-y-[clamp(var(--space-sm),4vw,var(--space-lg))]">
            {testimonials.map((testimonial) => (
                <figure
                    key={testimonial.id}
                    className="mx-auto max-w-5xl text-center"
                >
                    <blockquote className="font-heading text-[clamp(1.8rem,3.4vw,2.4rem)] leading-[1.6] tracking-[-0.01em] text-text/95">
                        &quot;{testimonial.quote}&quot;
                    </blockquote>
                    <figcaption className="mt-6 text-sm uppercase tracking-[0.28em] text-subtle/80">
                        {testimonial.name} · {testimonial.role}
                    </figcaption>
                </figure>
            ))}
        </Container>
    </Section>
);

const LeadFormSection: HomeThemeDefinition["LeadForm"] = ({
    selectedCategory,
    selectedPackage,
    ui,
}) => (
    <Section id="lead-form" title={ui.form.title} className="bg-transparent">
        <Container className="grid gap-[clamp(var(--space-sm),6vw,var(--space-lg))] lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <div className="space-y-4 text-text">
                <h3 className="font-heading text-[clamp(2.2rem,4vw,3.2rem)] leading-tight">
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
            <LeadForm
                labels={ui.form}
                selectedCategory={selectedCategory}
                selectedPackage={selectedPackage}
                variant="luxury"
            />
        </Container>
    </Section>
);

export const themeA: HomeThemeDefinition = {
  Hero,
  About,
  Categories,
  Packages,
  Testimonials,
  LeadForm: LeadFormSection,
};
