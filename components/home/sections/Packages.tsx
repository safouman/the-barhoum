import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { Locale } from "@/lib/content";

type CategoryKey = "individuals" | "couples" | "organizations";
type PackSessions = 1 | 3 | 5;

type Pack = {
  sessions: PackSessions;
  title: string;
  subtitle: string;
  bullets: string[];
  priceTotal: number;
  pricePerSession: number;
  duration: string;
};

type PacksByCategory = Record<CategoryKey, Record<Locale, Pack[]>>;

const PACKS: PacksByCategory = {
  individuals: { en: [], ar: [] },
  organizations: { en: [], ar: [] },
  couples: {
    en: [
      {
        sessions: 1,
        title: "Shared language sprint",
        subtitle: "Focused discovery",
        bullets: ["One shared practice", "Joint recommendation", "Light follow-up"],
        priceTotal: 260,
        pricePerSession: 260,
        duration: "75–90 minutes",
      },
      {
        sessions: 3,
        title: "Renewed dialogue rhythm",
        subtitle: "Grow the conversation",
        bullets: ["Short rituals between sessions", "Shared next step", "Gentle accountability"],
        priceTotal: 720,
        pricePerSession: 240,
        duration: "3 × 75–90 minutes",
      },
      {
        sessions: 5,
        title: "Sustained safe space",
        subtitle: "Keep the cadence",
        bullets: ["Between-session voice/text", "Light follow-up practice", "Deeper integration"],
        priceTotal: 1120,
        pricePerSession: 224,
        duration: "5 × 75–90 minutes",
      },
    ],
    ar: [
      {
        sessions: 1,
        title: "لغة مشتركة سريعة",
        subtitle: "جلسة تعريف سريع",
        bullets: ["تمرين واحد مشترك", "توصية مشتركة", "متابعة خفيفة"],
        priceTotal: 260,
        pricePerSession: 260,
        duration: "75–90 دقيقة",
      },
      {
        sessions: 3,
        title: "إيقاع حوار متجدد",
        subtitle: "تناغم متصاعد",
        bullets: ["تمارين قصيرة بين الجلسات", "خطوة مشتركة", "متابعة لطيفة"],
        priceTotal: 720,
        pricePerSession: 240,
        duration: "3 × 75–90 دقيقة",
      },
      {
        sessions: 5,
        title: "مساحة آمنة مستمرة",
        subtitle: "عمق وثقة",
        bullets: ["دعم بين الجلسات (صوت/نص)", "تمرين متابعة خفيف", "تكامل أعمق"],
        priceTotal: 1120,
        pricePerSession: 224,
        duration: "5 × 75–90 دقيقة",
      },
    ],
  },
};

const ACCENT_LABEL = {
  en: { ready: "Ready to proceed", button: "Continue", overview: "Pack overview" },
  ar: { ready: "جاهز للمواصلة", button: "استمرار", overview: "نبذة عن الباقة" },
};

function formatCurrency(amount: number, locale: Locale, currency: "EUR" | "USD" = "EUR") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSessionsLabel(sessions: PackSessions, locale: Locale) {
  if (locale === "ar") {
    if (sessions === 1) return "جلسة واحدة";
    if (sessions === 3) return "ثلاث جلسات";
    return "خمس جلسات";
  }
  return `${sessions} Session${sessions > 1 ? "s" : ""}`;
}

interface PackBarProps {
  direction: "ltr" | "rtl";
  locale: Locale;
  pack: Pack;
  selected: boolean;
  onSelect: () => void;
  onKeyStep: (direction: "prev" | "next") => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}

function PackBar({ direction, locale, pack, selected, onSelect, onKeyStep, buttonRef }: PackBarProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onKeyDown={(event) => {
        const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
        const backward = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
        if (event.key === forward || event.key === "ArrowDown") {
          event.preventDefault();
          onKeyStep("next");
        }
        if (event.key === backward || event.key === "ArrowUp") {
          event.preventDefault();
          onKeyStep("prev");
        }
      }}
      className={clsx(
        "group relative flex w-full items-center justify-between gap-6 rounded-[18px] border border-white/80 bg-white px-8 py-6 text-left shadow-[0_12px_28px_-18px_rgba(15,23,42,0.35)] transition duration-200 ease-out",
        "hover:-translate-y-[2px] hover:border-primary/35 hover:shadow-[0_18px_36px_-20px_rgba(15,23,42,0.45)]",
        selected && "border-primary bg-primary/10 shadow-[0_22px_45px_-18px_rgba(15,23,42,0.5)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[4px] focus-visible:outline-primary/60"
      )}
      dir={direction}
      aria-label={`${formatSessionsLabel(pack.sessions, locale)} · ${formatCurrency(pack.priceTotal, locale)}`}
    >
      <span
        className={clsx(
          "pointer-events-none absolute top-4 h-4 w-4 text-primary transition-transform",
          direction === "rtl" ? "left-4" : "right-4",
          selected ? "scale-100" : "scale-0"
        )}
        aria-hidden
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path d="M3 8.5 6.2 12l6.1-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="flex min-w-[200px] flex-col gap-1 text-subtle/80">
        <span
          className={clsx(
            "font-heading text-[1.65rem] font-semibold tracking-tight transition-colors",
            selected ? "text-primary" : "text-text",
            "group-hover:text-primary"
          )}
        >
          {formatSessionsLabel(pack.sessions, locale)}
        </span>
        <span className="text-sm text-subtle/70 line-clamp-1">{pack.subtitle}</span>
      </div>
      <div className="flex flex-col items-end gap-1 text-right text-subtle/75 rtl:items-start rtl:text-left">
        <span className="text-lg font-semibold text-text/90">
          {formatCurrency(pack.priceTotal, locale)}
        </span>
        <span className="text-xs uppercase tracking-[0.3em] text-subtle/65">
          {formatCurrency(pack.pricePerSession, locale)} / {locale === "ar" ? "جلسة" : "session"}
        </span>
      </div>
    </button>
  );
}

interface PacksSectionProps {
  locale: Locale;
  direction: "ltr" | "rtl";
  category?: CategoryKey;
  onSelect?: (pack: { category: CategoryKey; sessions: PackSessions; priceTotal: number }) => void;
  onContinue?: (pack: { category: CategoryKey; sessions: PackSessions; priceTotal: number }) => void;
}

export function PacksSection({ locale, direction, category, onSelect, onContinue }: PacksSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const packs = useMemo(() => {
    if (!category) return [];
    return PACKS[category]?.[locale] ?? PACKS.individuals[locale];
  }, [category, locale]);

  useEffect(() => {
    if (!category || !packs.length) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex(0);
    cardRefs.current = [];
    const pack = packs[0];
    onSelectRef.current?.({ category, sessions: pack.sessions, priceTotal: pack.priceTotal });
  }, [category, packs]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    if (category) {
      const pack = packs[index];
      onSelectRef.current?.({ category, sessions: pack.sessions, priceTotal: pack.priceTotal });
    }
  };

  const moveSelection = (currentIndex: number, step: "prev" | "next") => {
    if (!packs.length) return;
    const delta = step === "next" ? 1 : -1;
    const next = (currentIndex + delta + packs.length) % packs.length;
    handleSelect(next);
    cardRefs.current[next]?.focus({ preventScroll: true });
  };

  const selectedPack = packs[selectedIndex];

  if (!category || packs.length === 0) return null;

  const accentCopy = ACCENT_LABEL[locale] ?? ACCENT_LABEL.en;

  return (
    <Section title={locale === "ar" ? "الباقات" : "Packs"} className="bg-background">
      <Container>
        <div className="mb-10 text-center text-xs uppercase tracking-[0.4em] text-subtle">
          {locale === "ar" ? "اختر وتيرة التقدم" : "Choose your pace"}
        </div>
        <div className={clsx(
          "flex flex-col gap-8 xl:flex-row xl:items-start",
          direction === "rtl" ? "xl:flex-row-reverse" : "xl:flex-row"
        )}
        >
          <div
            role="radiogroup"
            aria-label={locale === "ar" ? "اختر الباقة" : "Select a pack"}
            className="flex flex-col gap-4 xl:flex-[0.55]"
          >
            {packs.map((pack, index) => (
              <PackBar
                key={`${category}-${pack.sessions}`}
                direction={direction}
                locale={locale}
                pack={pack}
                selected={selectedIndex === index}
                onSelect={() => handleSelect(index)}
                onKeyStep={(step) => moveSelection(index, step)}
                buttonRef={(el) => {
                  cardRefs.current[index] = el;
                }}
              />
            ))}
          </div>
          {selectedPack && (
            <aside className="flex h-full flex-1 flex-col gap-5 rounded-[24px] border border-white/75 bg-white px-10 py-12 text-left shadow-[0_24px_48px_-28px_rgba(15,23,42,0.5)] rtl:text-right">
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-[0.3em] text-subtle/70">
                  {accentCopy.overview}
                </span>
                <h3 className="font-heading text-[1.95rem] font-semibold text-text/90">
                  {selectedPack.title}
                </h3>
                <span className="text-sm text-subtle/75">{selectedPack.duration}</span>
                <div className="flex items-center gap-3 text-subtle/80">
                  <span className="text-lg font-semibold text-text/90">
                    {formatCurrency(selectedPack.priceTotal, locale)}
                  </span>
                  <span className="text-xs uppercase tracking-[0.3em] text-subtle/65">
                    {formatCurrency(selectedPack.pricePerSession, locale)} / {locale === "ar" ? "جلسة" : "session"}
                  </span>
                </div>
              </div>
              <ul className="grid gap-2 text-sm text-subtle/85">
                {selectedPack.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-[6px] h-[6px] w-[6px] rounded-full bg-primary/40" aria-hidden />
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col items-end gap-2 text-right rtl:items-start rtl:text-left">
                <span className="text-xs uppercase tracking-[0.3em] text-subtle/70">
                  {formatSessionsLabel(selectedPack.sessions, locale)} · {formatCurrency(selectedPack.priceTotal, locale)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (category && selectedPack) {
                      onContinue?.({ category, sessions: selectedPack.sessions, priceTotal: selectedPack.priceTotal });
                    }
                  }}
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_20px_rgba(51,210,197,0.35)] transition hover:shadow-[0_16px_24px_rgba(51,210,197,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                >
                  {accentCopy.button}
                </button>
              </div>
            </aside>
          )}
        </div>
      </Container>
    </Section>
  );
}
