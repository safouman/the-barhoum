import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomePackages: HomeThemeDefinition["Packages"] = ({
  packages,
  activePackageId,
  onSelect,
  ui,
}) => {
  const selectedPackage = packages.find((pkg) => pkg.id === activePackageId) ?? packages[0];

  return (
    <Section title={ui.packages} className="bg-surface">
      <Container className="grid gap-[clamp(var(--space-sm),5vw,var(--space-lg))] lg:grid-cols-[1.2fr,0.8fr]">
        <div className="grid gap-4">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg.id)}
              aria-pressed={activePackageId === pkg.id}
              className={clsx(
                "surface-panel grid items-center gap-3 px-6 py-5 text-start transition",
                activePackageId === pkg.id && "border-accent shadow-sm"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-base font-semibold text-text">{pkg.title}</span>
                <span className="text-label">{pkg.priceLabel}</span>
              </div>
              <p className="text-sm text-subtle line-clamp-2">{pkg.features[0]}</p>
            </button>
          ))}
        </div>
        {selectedPackage && (
          <aside className="surface-muted sticky top-32 grid gap-4 p-8">
            <span className="text-smallcaps">{ui.packages}</span>
            <h3 className="text-3xl font-heading font-semibold text-text">{selectedPackage.title}</h3>
            <span className="text-xl font-semibold text-accent">{selectedPackage.priceLabel}</span>
            <ul className="grid gap-2 text-sm text-subtle">
              {selectedPackage.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-6 rounded-full bg-accent/40" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </Container>
    </Section>
  );
};
