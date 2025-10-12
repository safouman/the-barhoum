"use client";

import clsx from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    setActiveStep(initialStep);
  }, [initialStep]);

  const formatTemplate = useCallback(
    (template: string, current: number, total: number) =>
      template.replace("{current}", `${current}`).replace("{total}", `${total}`),
    []
  );

  const panelTitle = activeStep.index === 0 ? localeCopy.guidance.title : activeStep.title;
  const panelCopy = activeStep.index === 0 ? localeCopy.guidance.paragraph : activeStep.helper;
  const chipLabel = formatTemplate(localeCopy.chipLabelTemplate, activeStep.index + 1, totalSteps);
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
            <span className="absolute inset-x-0 top-0 h-[3px] bg-primary" aria-hidden="true" />
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
                    <p key={`${index}-${paragraph.slice(0, 8)}`} className="m-0">
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
              copy={copy}
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
