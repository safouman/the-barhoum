import { Container } from "@/components/Container";
import { LeadForm } from "@/components/LeadForm";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const LeadFormSection: HomeThemeDefinition["LeadForm"] = ({
  selectedCategory,
  selectedPackage,
  ui,
}) => (
  <Section id="lead-form" title={ui.form.title} className="border-t border-border/60 bg-surface">
    <Container className="grid gap-10 lg:grid-cols-[1fr,1fr]">
      <div className="space-y-5 text-text">
        <h3 className="text-3xl font-heading">{ui.form.title}</h3>
        <div className="flex flex-wrap gap-2 text-sm text-subtle">
          <span>
            {ui.form.category}: <strong className="text-text">{selectedCategory ?? "-"}</strong>
          </span>
          <span>
            {ui.form.package}: <strong className="text-text">{selectedPackage ?? "-"}</strong>
          </span>
        </div>
        <p className="text-sm text-subtle/80">{ui.media.videos}</p>
      </div>
      <LeadForm
        labels={ui.form}
        selectedCategory={selectedCategory}
        selectedPackage={selectedPackage}
        variant="modern"
      />
    </Container>
  </Section>
);
