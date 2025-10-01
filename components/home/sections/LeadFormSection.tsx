"use client";

import clsx from "classnames";
import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";
import { useLocale } from "@/providers/locale-provider";

export const HomeLeadForm: HomeThemeDefinition["LeadForm"] = ({
    selectedCategory,
    selectedPackage,
    packSummary,
    ui,
}) => {
    const { locale } = useLocale();
    const isRtl = locale === "ar";
    const initialStep = useMemo(
        () =>
            locale === "ar"
                ? {
                      title: "المعطيات الأساسية",
                      helper: "خلينا نتعارف عليك أكثر",
                      index: 0,
                  }
                : {
                      title: "Basic info",
                      helper: "Tell us who you are.",
                      index: 0,
                  },
        [locale]
    );

    const [activeStep, setActiveStep] = useState<{
        title: string;
        helper: string;
        index: number;
    }>(initialStep);

    const guidanceTitle = locale === "ar" ? "المعطيات الأساسية" : "Basic info";
    const guidanceParagraph =
        locale === "ar"
            ? "باش نبداو ببعض المعطيات الأساسية باش نجهزوا جلستك الأولى بوضوح. شارك اللي صحيح بالنسبة ليك، ما ثماش إجابات مثالية. كل ما تكون صريح أكثر، كل ما يكون المسار أسهل عليك."
            : "We’ll start with a few basics so we can prepare for your first session with clarity. Share what’s true for you—no perfect answers needed. The more accurate you are here, the smoother your journey will be.";

    const panelTitle =
        activeStep.index === 0 ? guidanceTitle : activeStep.title;
    const panelCopy =
        activeStep.index === 0 ? guidanceParagraph : activeStep.helper;
    const chipLabel =
        locale === "ar"
            ? `الخطوة ${activeStep.index + 1} من 3`
            : `Step ${activeStep.index + 1} of 3`;
    const panelParagraphs = panelCopy
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    return (
        <Section
            id="lead-form"
            title={ui.form.title}
            className="border-t border-border/60 bg-background"
        >
            <Container className="space-y-16">
                <div className="text-center text-text">
                    <p className="text-[clamp(2.1rem,4vw,2.6rem)] font-heading font-semibold">
                        {ui.form.title}
                    </p>
                </div>

                <div className="grid gap-10 md:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] md:items-start">
                    <div
                        className={clsx(
                            "relative order-1 w-full overflow-hidden rounded-[24px] border border-border/30 bg-white px-5 py-4 text-text shadow-[0_24px_64px_rgba(15,23,42,0.08)]",
                            "md:max-w-[360px] md:px-7 md:py-7",
                            "md:sticky md:top-28",
                            isRtl ? "text-right" : "text-left"
                        )}
                    >
                        <span
                            className="absolute inset-x-0 top-0 h-[3px] bg-primary"
                            aria-hidden="true"
                        />
                        <div className="flex flex-col gap-5">
                            <span
                                className={clsx(
                                    "inline-flex w-fit items-center rounded-full bg-subtle/15 px-3 py-1 text-[0.75rem] font-medium text-subtle/70",
                                    !isRtl && "uppercase tracking-[0.12em]"
                                )}
                            >
                                {chipLabel}
                            </span>
                            <p className="text-[clamp(2.1rem,3vw,2.6rem)] font-heading font-semibold text-text">
                                {panelTitle}
                            </p>
                            <div className="space-y-[10px] text-base leading-[1.65] text-subtle/85">
                                {panelParagraphs.length > 0 ? (
                                    panelParagraphs.map((paragraph, index) => (
                                        <p
                                            key={`${index}-${paragraph.slice(
                                                0,
                                                8
                                            )}`}
                                            className="m-0"
                                        >
                                            {paragraph}
                                        </p>
                                    ))
                                ) : (
                                    <p className="m-0">{panelCopy}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="order-2">
                        <LeadForm
                            labels={ui.form}
                            selectedCategory={selectedCategory}
                            selectedPackage={selectedPackage}
                            packSummary={packSummary}
                            variant="modern"
                            showInternalHeader
                            onStepChange={({ index, step: stepMeta }) => {
                                setActiveStep({
                                    title: stepMeta.title,
                                    helper: stepMeta.helper,
                                    index,
                                });
                            }}
                        />
                    </div>
                </div>
            </Container>
        </Section>
    );
};
