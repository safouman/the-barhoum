"use client";

import { Container } from "./Container";
import { Button } from "./Button";
import type { CvData, Locale, UIStrings } from "@/lib/content";
import { useLocale } from "@/providers/locale-provider";

interface CvViewProps {
  cv: CvData;
  ui: Record<Locale, UIStrings>;
}

export function CvView({ cv, ui }: CvViewProps) {
  const { locale } = useLocale();
  const strings = ui[locale];

  return (
    <div className="py-[clamp(var(--space-lg),16vh,var(--space-xl))]">
      <Container className="space-y-lg">
        <h1 className="text-3xl font-heading">{strings.cv.title}</h1>
        <div className="grid gap-3 text-lg text-subtle">
          {cv.summary.map((item, index) => (
            <p key={index}>{item[locale]}</p>
          ))}
        </div>
        <div className="space-y-lg">
          {cv.sections.map((section) => (
            <section key={section.id} className="space-y-sm">
              <h2 className="text-2xl font-heading">{section.title[locale]}</h2>
              <div className="space-y-sm">
                {section.items.map((entry) => (
                  <article
                    key={entry.id}
                    className="grid gap-2 rounded-md border border-border bg-surface p-sm"
                  >
                    <div className="flex flex-wrap items-baseline gap-2 text-sm text-subtle">
                      <span className="text-lg font-bold text-text">{entry.title[locale]}</span>
                      {entry.subtitle && <span>{entry.subtitle[locale]}</span>}
                      {entry.period && <span>{entry.period[locale]}</span>}
                    </div>
                    <ul className="grid list-disc gap-1 pl-5 text-sm text-subtle">
                      {entry.bullets[locale].map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div>
          <Button href={cv.pdf} target="_blank" rel="noopener noreferrer">
            {strings.cv.download}
          </Button>
        </div>
      </Container>
    </div>
  );
}
