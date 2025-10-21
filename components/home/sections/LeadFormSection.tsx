"use client";

import clsx from "classnames";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Container } from "@/components/Container";
import type { LeadFormProps } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";
import { useLocale } from "@/providers/locale-provider";

const LeadForm = dynamic<LeadFormProps>(
    () =>
        import("@/components/LeadForm").then((mod) => ({
            default: mod.LeadForm,
        })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center p-12" aria-busy="true">
                <span className="text-subtle">Loading…</span>
            </div>
        ),
    }
);

export const HomeLeadForm: HomeThemeDefinition["LeadForm"] = ({
    selectedCategory,
    selectedPackage,
    packSummary,
    ui,
    copy,
}) => {
    const { locale } = useLocale();
    const isRtl = locale === "ar";
    const localeCopy = copy[locale];
    const totalSteps = localeCopy.steps.length;

    const initialStep = useMemo(
        () => ({
            title: localeCopy.steps[0]?.title ?? "",
            helper: localeCopy.steps[0]?.helper ?? "",
            index: 0,
        }),
        [localeCopy]
    );

    const [activeStep, setActiveStep] = useState<{
        title: string;
        helper: string;
        index: number;
    }>(initialStep);

    useEffect(() => {
        setActiveStep((previous) => {
            if (
                previous.index === initialStep.index &&
                previous.title === initialStep.title &&
                previous.helper === initialStep.helper
            ) {
                return previous;
            }
            return initialStep;
        });
    }, [initialStep]);

    const formatTemplate = useCallback(
        (template: string, current: number, total: number) =>
            template
                .replace("{current}", `${current}`)
                .replace("{total}", `${total}`),
        []
    );

    const panelTitle =
        activeStep.index === 0 ? localeCopy.guidance.title : activeStep.title;
    const panelCopy =
        activeStep.index === 0
            ? localeCopy.guidance.paragraph
            : activeStep.helper;
    const chipLabel = formatTemplate(
        localeCopy.chipLabelTemplate,
        activeStep.index + 1,
        totalSteps
    );
    const panelParagraphs = panelCopy
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    const handleStepChange = useCallback(
        ({
            index,
            step: stepMeta,
        }: {
            index: number;
            step: { title: string; helper: string };
        }) => {
            setActiveStep((previous) => {
                if (
                    previous.index === index &&
                    previous.title === stepMeta.title &&
                    previous.helper === stepMeta.helper
                ) {
                    return previous;
                }
                return {
                    title: stepMeta.title,
                    helper: stepMeta.helper,
                    index,
                };
            });
        },
        []
    );

    const [panelVisible, setPanelVisible] = useState(true);

    const handleSubmitted = useCallback(() => {
        setPanelVisible(false);
    }, []);

    const layoutClasses = useMemo(
        () =>
            clsx(
                "gap-10",
                panelVisible
                    ? "grid md:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] md:items-start"
                    : "grid md:grid-cols-1 md:items-center md:justify-items-center"
            ),
        [panelVisible]
    );

    return (
        <Section
            id="lead-form"
            className="border-t border-border/60 bg-background"
        >
            <Container className="space-y-12 md:space-y-16">
                <div className="px-3 text-center text-text sm:px-0">
                    <p data-lead-form-title className="heading-2 text-center">
                        {ui.form.title}
                    </p>
                </div>

                <div className={layoutClasses}>
                    {panelVisible && (
                        <div
                            className={clsx(
                                "relative order-1 w-full overflow-hidden rounded-[22px] border border-border/35 bg-white px-6 py-5 text-text shadow-[0_26px_48px_-22px_rgba(15,23,42,0.18)]",
                                "md:max-w-[360px] md:px-7 md:py-7",
                                "md:sticky md:top-28",
                                isRtl ? "text-right" : "text-left"
                            )}
                        >
                            <span
                                className="absolute inset-x-0 top-0 flex h-[3px] overflow-hidden rounded-t-[22px] bg-primary/12"
                                aria-hidden="true"
                            >
                                <span className="w-full bg-primary" />
                            </span>
                            <div className="flex flex-col gap-5">
                                <span
                                    className={clsx(
                                        "inline-flex w-fit items-center rounded-full bg-subtle/15 px-3 py-1 text-[0.75rem] font-medium text-subtle/70",
                                        !isRtl && "uppercase tracking-[0.12em]"
                                    )}
                                >
                                    {chipLabel}
                                </span>
                                <p className="heading-3 tracking-[0.02em] text-text">
                                    {panelTitle}
                                </p>
                                <div className="space-y-[10px] text-base text-subtle/85">
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
                    )}
                    <div className="order-2">
                        <LeadForm
                            labels={ui.form}
                            selectedCategory={selectedCategory}
                            selectedPackage={selectedPackage}
                            packSummary={packSummary}
                            variant="modern"
                            showInternalHeader
                            copy={copy}
                            onStepChange={handleStepChange}
                            onSubmitted={handleSubmitted}
                        />
                    </div>
                </div>
            </Container>
        </Section>
    );
};
