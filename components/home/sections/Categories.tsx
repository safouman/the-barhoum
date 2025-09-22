import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomeCategories: HomeThemeDefinition["Categories"] = ({
  categories,
  activeCategory,
  onSelect,
  ui,
}) => (
  <Section id="categories" title={ui.categories} className="bg-background">
    <Container>
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-pressed={activeCategory === category.id}
            className={clsx(
              "surface-panel flex flex-col justify-between gap-5 px-8 py-10 text-start transition",
              activeCategory === category.id ? "border-primary bg-surface" : "hover:border-primary/40"
            )}
          >
            <header className="space-y-3">
              <span className="text-smallcaps">{ui.categories}</span>
              <h3 className="font-heading text-xl font-semibold leading-[1.2] text-text md:text-2xl">{category.label}</h3>
            </header>
            <p className="text-[clamp(1.05rem,2vw,1.2rem)] text-subtle">{category.description}</p>
          </button>
        ))}
      </div>
    </Container>
  </Section>
);
