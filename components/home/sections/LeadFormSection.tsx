"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";
import { useLocale } from "@/providers/locale-provider";

export const HomeLeadForm: HomeThemeDefinition["LeadForm"] = ({
  selectedCategory,
  selectedPackage,
  ui,
}) => {
  const { locale } = useLocale();
  const initialStep = useMemo(
    () =>
      locale === "ar"
        ? { title: "المعطيات الأساسية", helper: "خلينا نتعارف عليك أكثر", index: 0 }
        : { title: "Basic info", helper: "Tell us who you are.", index: 0 },
    [locale]
  );

  const [activeStep, setActiveStep] = useState<{ title: string; helper: string; index: number }>(initialStep);

  const guidanceTitle = locale === "ar" ? "المعطيات الأساسية" : "Basic info";
  const guidanceParagraph =
    locale === "ar"
      ? "باش نبداو ببعض المعطيات الأساسية باش نجهزوا جلستك الأولى بوضوح. شارك اللي صحيح بالنسبة ليك، ما ثماش إجابات مثالية. كل ما تكون صريح أكثر، كل ما يكون المسار أسهل عليك."
      : "We’ll start with a few basics so we can prepare for your first session with clarity. Share what’s true for you—no perfect answers needed. The more accurate you are here, the smoother your journey will be.";

  const panelTitle = activeStep.index === 0 ? guidanceTitle : activeStep.title;
  const panelCopy = activeStep.index === 0 ? guidanceParagraph : activeStep.helper;

  return (
    <Section id="lead-form" title={ui.form.title} className="border-t border-border/60 bg-background">
      <Container className="space-y-16">
        <div className="text-center text-text">
          <p className="text-[clamp(2.1rem,4vw,2.6rem)] font-heading font-semibold">{ui.form.title}</p>
        </div>

        <div className="grid gap-14 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
          <div className="order-1 flex flex-col gap-8 rounded-[24px] border border-border/35 bg-background/60 px-6 py-8 text-text shadow-[0_22px_48px_-28px_rgba(15,23,42,0.35)] lg:sticky lg:top-32">
            <div className="space-y-4 text-start">
              <p className="text-[clamp(2rem,3vw,2.45rem)] font-heading font-semibold text-text">{panelTitle}</p>
              <p className="text-base leading-relaxed text-subtle/85">{panelCopy}</p>
            </div>
            <div className="space-y-3 rounded-[18px] border border-border/40 bg-white/85 px-5 py-5 text-sm text-subtle/80">
              <div className="text-xs uppercase tracking-[0.24em] text-subtle/70">
                {locale === "ar" ? "ملخص الباقة" : "Pack summary"}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-subtle/80">
                  {ui.form.category}: <span className="font-medium text-text/75">{selectedCategory ?? "-"}</span>
                </p>
                <p className="text-sm text-subtle/80">
                  {ui.form.package}: <span className="font-medium text-text/75">{selectedPackage ?? "-"}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="order-2">
            <LeadForm
              labels={ui.form}
              selectedCategory={selectedCategory}
              selectedPackage={selectedPackage}
              variant="modern"
              showInternalHeader
              onStepChange={({ index, step: stepMeta }) => {
                setActiveStep({ title: stepMeta.title, helper: stepMeta.helper, index });
              }}
            />
          </div>
        </div>
      </Container>
    </Section>
  );
};
