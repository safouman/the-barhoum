import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { Locale } from "@/lib/content";
import {
    formatPackCurrency,
    type CategoryKey,
    type IndividualProgramKey,
    type PackageId,
    type PackSessions,
} from "@/lib/commerce/packages";
import {
    createPackSelection,
    type PackSelection,
} from "@/lib/commerce/pack-selections";
import styles from "./Packages.module.css";

export type Pack = {
    programKey?: IndividualProgramKey | PackageId;
    sessions?: PackSessions;
    title: string;
    subtitle: string;
    bullets: string[];
    priceTotal: number;
    priceAmountMinor: number;
    currency: string;
    duration: string;
};

export type PacksByCategory = Record<CategoryKey, Record<Locale, Pack[]>>;

export type PacksCopy = {
    title: string;
    subtitle: string;
    eyebrow: string;
    selectAriaLabel: string;
    ready: string;
    button: string;
    overview: string;
    comingSoon: string;
};

interface PackBarProps {
    direction: "ltr" | "rtl";
    locale: Locale;
    pack: Pack;
    selected: boolean;
    onSelect: () => void;
    onKeyStep: (direction: "prev" | "next") => void;
    buttonRef: (el: HTMLButtonElement | null) => void;
}

function PackBar({
    direction,
    locale,
    pack,
    selected,
    onSelect,
    onKeyStep,
    buttonRef,
}: PackBarProps) {
    return (
        <button
            ref={buttonRef}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onSelect}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(event) => {
                const forward =
                    direction === "rtl" ? "ArrowLeft" : "ArrowRight";
                const backward =
                    direction === "rtl" ? "ArrowRight" : "ArrowLeft";
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
            aria-label={`${pack.title} · ${
                pack.duration
            } · ${formatPackCurrency(pack.priceTotal, locale, pack.currency)}`}
        >
            <div className={styles.optionContent}>
                <div className={styles.optionMeta}>
                    <span className={styles.optionSessions}>{pack.title}</span>
                    <span className={styles.optionSubtitle}>
                        {pack.duration}
                    </span>
                </div>
                <div className={styles.optionPrice}>
                    <span>
                        {formatPackCurrency(
                            pack.priceTotal,
                            locale,
                            pack.currency
                        )}
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
    packs: PacksByCategory;
    onSelect?: (pack: PackSelection) => void;
    onContinue?: (pack: PackSelection) => void;
    sectionId?: string;
    comingSoon?: boolean;
    copy: PacksCopy;
}

const TRANSITION_MS = 240;

export function PacksSection({
    locale,
    direction,
    category,
    packs: packsByCategory,
    onSelect,
    onContinue,
    sectionId,
    comingSoon = false,
    copy,
}: PacksSectionProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const onSelectRef = useRef(onSelect);
    const [renderMode, setRenderMode] = useState<"packs" | "comingSoon">(
        comingSoon ? "comingSoon" : "packs"
    );
    const [fadeOpacity, setFadeOpacity] = useState(1);

    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        const nextMode = comingSoon ? "comingSoon" : "packs";
        if (nextMode === renderMode) return;
        setFadeOpacity(0);
        const timeout = window.setTimeout(() => {
            setRenderMode(nextMode);
            window.requestAnimationFrame(() => {
                setFadeOpacity(1);
            });
        }, TRANSITION_MS);
        return () => window.clearTimeout(timeout);
    }, [comingSoon, renderMode]);

    const packs = useMemo(() => {
        if (!category) return [];
        return packsByCategory[category]?.[locale] ?? [];
    }, [category, locale, packsByCategory]);

    useEffect(() => {
        if (comingSoon) {
            setSelectedIndex(0);
            return;
        }
        if (!category || !packs.length) {
            setSelectedIndex(0);
            return;
        }
        setSelectedIndex(0);
        cardRefs.current = [];
        const pack = packs[0];
        const selection = createPackSelection({ category, pack });
        onSelectRef.current?.(selection);
    }, [category, packs, locale, comingSoon]);

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        if (!comingSoon && category) {
            const pack = packs[index];
            const selection = createPackSelection({ category, pack });
            onSelectRef.current?.(selection);
        }
    };

    const moveSelection = (currentIndex: number, step: "prev" | "next") => {
        if (comingSoon || !packs.length) return;
        const delta = step === "next" ? 1 : -1;
        const next = (currentIndex + delta + packs.length) % packs.length;
        handleSelect(next);
        cardRefs.current[next]?.focus({ preventScroll: true });
    };

    if (!category) return null;
    if (!comingSoon && packs.length === 0) return null;

    const selectedPack = packs[selectedIndex];
    const totalPriceDisplay = selectedPack
        ? formatPackCurrency(
              selectedPack.priceTotal,
              locale,
              selectedPack.currency
          )
        : "";
    const totalPriceAriaLabel = selectedPack
        ? locale === "ar"
            ? `إجمالي السعر ${totalPriceDisplay}`
            : `Total price ${totalPriceDisplay}`
        : undefined;
    const continueAriaLabel = selectedPack
        ? locale === "ar"
            ? `${copy.button} مع ${selectedPack.duration} - الإجمالي ${totalPriceDisplay}`
            : `${copy.button} with ${selectedPack.duration} - total ${totalPriceDisplay}`
        : undefined;

    const showMeAndMeHeader = category === "me_and_me" && !comingSoon;
    const sectionTitle = showMeAndMeHeader ? copy.title : undefined;
    const sectionSubtitle = showMeAndMeHeader ? copy.subtitle : undefined;
    const sectionTitleClassName = showMeAndMeHeader
        ? direction === "rtl"
            ? "font-medium"
            : "font-medium md:tracking-[0.2rem]"
        : undefined;

    return (
        <Section
            id={sectionId}
            title={sectionTitle}
            subtitle={sectionSubtitle}
            className="bg-background"
            titleClassName={sectionTitleClassName}
        >
            <Container>
                {renderMode === "comingSoon" && (
                    <div className="mb-10" aria-hidden />
                )}
                <div
                    style={{
                        opacity: fadeOpacity,
                        transition: `opacity ${TRANSITION_MS}ms ease`,
                    }}
                    className="relative"
                >
                    {renderMode === "packs" ? (
                        <div
                            className={clsx(
                                styles.wrap,
                                direction === "rtl" && styles.wrapRtl
                            )}
                        >
                            <div
                                role="radiogroup"
                                aria-label={copy.selectAriaLabel}
                                className={styles.selector}
                            >
                                <div className={styles.list}>
                                    {packs.map((pack, index) => (
                                        <PackBar
                                            key={`${category}-${pack.programKey ?? pack.duration}-${index}`}
                                            direction={direction}
                                            locale={locale}
                                            pack={pack}
                                            selected={selectedIndex === index}
                                            onSelect={() => handleSelect(index)}
                                            onKeyStep={(step) =>
                                                moveSelection(index, step)
                                            }
                                            buttonRef={(el) => {
                                                cardRefs.current[index] = el;
                                                if (
                                                    selectedIndex === index &&
                                                    el
                                                ) {
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
                                            className={clsx(
                                                styles.detailsContent,
                                                direction === "rtl"
                                                    ? styles.detailsContentRtl
                                                    : ""
                                            )}
                                            key={`${
                                                selectedPack.programKey ??
                                                selectedPack.duration
                                            }-${category}-${locale}`}
                                        >
                                            <div
                                                className={styles.detailsHeader}
                                            >
                                                <h3>{selectedPack.title}</h3>
                                            </div>
                                            <div
                                                className={
                                                    styles.detailsPricing
                                                }
                                            >
                                                <span
                                                    className={
                                                        styles.detailsPriceTotal
                                                    }
                                                    aria-label={
                                                        totalPriceAriaLabel
                                                    }
                                                >
                                                    {totalPriceDisplay}
                                                </span>
                                            </div>
                                            <ul
                                                className={
                                                    styles.detailsBullets
                                                }
                                            >
                                                {selectedPack.bullets.map(
                                                    (bullet, bulletIndex) => (
                                                        <li
                                                            key={`${selectedPack.programKey ?? selectedPack.title}-${bulletIndex}`}
                                                        >
                                                            <span
                                                                aria-hidden
                                                                className={
                                                                    styles.detailsBulletDot
                                                                }
                                                            />
                                                            <span>
                                                                {bullet}
                                                            </span>
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                            <div
                                                className={styles.detailsFooter}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            category &&
                                                            !comingSoon
                                                        ) {
                                                            const selection =
                                                                createPackSelection(
                                                                    {
                                                                        category,
                                                                        pack: selectedPack,
                                                                    }
                                                                );
                                                            onContinue?.(
                                                                selection
                                                            );
                                                        }
                                                    }}
                                                    className={
                                                        styles.detailsButton
                                                    }
                                                    aria-label={
                                                        continueAriaLabel
                                                    }
                                                >
                                                    {copy.button}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                            )}
                        </div>
                    ) : (
                        <div className="flex min-h-[360px] items-center justify-center">
                            <div
                                dir={locale === "ar" ? "rtl" : "ltr"}
                                className="flex w-full max-w-xl flex-col gap-6 rounded-xl border border-white/80 bg-white px-6 py-12 text-center text-lg leading-relaxed text-text shadow-[0_16px_32px_-24px_rgba(15,35,42,0.4)] md:rounded-[24px] md:px-12 md:py-14 md:text-xl md:leading-9 md:shadow-[0_24px_40px_-30px_rgba(15,35,42,0.45)]"
                            >
                                <p>{copy.comingSoon}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Container>
        </Section>
    );
}
