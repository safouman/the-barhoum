import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { Locale } from "@/lib/content";
import styles from "./Packages.module.css";

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

const BASE_PACKS: Record<Locale, Pack[]> = {
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
      priceTotal: 1_120,
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
      priceTotal: 1_120,
      pricePerSession: 224,
      duration: "5 × 75–90 دقيقة",
    },
  ],
};

const PACKS: PacksByCategory = {
  individuals: { en: BASE_PACKS.en, ar: BASE_PACKS.ar },
  couples: { en: BASE_PACKS.en, ar: BASE_PACKS.ar },
  organizations: { en: BASE_PACKS.en, ar: BASE_PACKS.ar },
};

const ACCENT_COPY = {
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
      tabIndex={selected ? 0 : -1}
      onKeyDown={(event) => {
        const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
        const backward = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
        if (event.key === "ArrowDown" || event.key === forward) {
          event.preventDefault();
          onKeyStep("next");
        }
        if (event.key === "ArrowUp" || event.key === backward) {
          event.preventDefault();
          onKeyStep("prev");
        }
        if (event.key === "Home") {
          event.preventDefault();
          onKeyStep("prev");
        }
        if (event.key === "End") {
          event.preventDefault();
          onKeyStep("next");
        }
      }}
      className={clsx(styles.option, selected && styles.optionSelected)}
      dir={direction}
      aria-label={`${formatSessionsLabel(pack.sessions, locale)} · ${formatCurrency(pack.priceTotal, locale)}`}
    >
      <div className={styles.optionContent}>
        <div className={styles.optionMeta}>
          <span className={styles.optionSessions}>{formatSessionsLabel(pack.sessions, locale)}</span>
          <span className={styles.optionSubtitle}>{pack.subtitle}</span>
        </div>
        <div className={styles.optionPrice}>
          <span>{formatCurrency(pack.priceTotal, locale)}</span>
          <span>
            {formatCurrency(pack.pricePerSession, locale)} / {locale === "ar" ? "جلسة" : "session"}
          </span>
        </div>
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const packs = useMemo(() => {
    if (!category) return [];
    return PACKS[category]?.[locale] ?? BASE_PACKS[locale];
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

  if (!category || packs.length === 0) return null;

  const selectedPack = packs[selectedIndex];
  const accentCopy = ACCENT_COPY[locale] ?? ACCENT_COPY.en;

  const totalPriceDisplay = selectedPack ? formatCurrency(selectedPack.priceTotal, locale) : "";
  const perSessionDisplay = selectedPack ? formatCurrency(selectedPack.pricePerSession, locale) : "";
  const sessionTerm = locale === "ar" ? "جلسة" : "session";
  const totalPriceAriaLabel = selectedPack
    ? locale === "ar"
      ? `إجمالي السعر ${totalPriceDisplay}`
      : `Total price ${totalPriceDisplay}`
    : undefined;
  const continueAriaLabel = selectedPack
    ? locale === "ar"
      ? `${accentCopy.button} مع ${formatSessionsLabel(selectedPack.sessions, locale)} - الإجمالي ${totalPriceDisplay}`
      : `${accentCopy.button} with ${formatSessionsLabel(selectedPack.sessions, locale).toLowerCase()} - total ${totalPriceDisplay}`
    : undefined;

  return (
    <Section title={locale === "ar" ? "الباقات" : "Packs"} className="bg-background">
      <Container>
        <div className="mb-10 text-center text-xs uppercase tracking-[0.4em] text-subtle">
          {locale === "ar" ? "اختر وتيرة التقدم" : "Choose your pace"}
        </div>
        <div className={clsx(styles.wrap, direction === "rtl" && styles.wrapRtl)}>
          <div
            role="radiogroup"
            aria-label={locale === "ar" ? "اختر الباقة" : "Select a pack"}
            className={styles.selector}
          >
            <div className={styles.list}>
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
                    if (selectedIndex === index && el) {
                      el.tabIndex = 0;
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {selectedPack && (
            <aside
              className={styles.details}
              aria-live="polite"
            >
              <div className={styles.detailsCard}>
                <div
                  className={clsx(styles.detailsContent, direction === "rtl" ? styles.detailsContentRtl : "")}
                  key={`${selectedPack.sessions}-${category}-${locale}`}
                >
                  <div className={styles.detailsHeader}>
                    <h3>{selectedPack.title}</h3>
                    <p className={styles.detailsMeta}>{selectedPack.duration}</p>
                  </div>
                  <div className={styles.detailsPricing}>
                    <span
                      className={styles.detailsPriceTotal}
                      aria-label={totalPriceAriaLabel}
                    >
                      {totalPriceDisplay}
                    </span>
                    <span className={styles.detailsPricePer}>
                      {perSessionDisplay} / {sessionTerm}
                    </span>
                  </div>
                  <ul className={styles.detailsBullets}>
                    {selectedPack.bullets.map((bullet) => (
                      <li key={bullet}>
                        <span aria-hidden className={styles.detailsBulletDot} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.detailsFooter}>
                    <span className={styles.detailsSummary}>
                      {formatSessionsLabel(selectedPack.sessions, locale)} · {totalPriceDisplay}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (category) {
                          onContinue?.({ category, sessions: selectedPack.sessions, priceTotal: selectedPack.priceTotal });
                        }
                      }}
                      className={styles.detailsButton}
                      aria-label={continueAriaLabel}
                    >
                      {accentCopy.button}
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </Container>
    </Section>
  );
}
