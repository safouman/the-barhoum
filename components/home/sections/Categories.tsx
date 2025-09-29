import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

export const HomeCategories: HomeThemeDefinition["Categories"] = ({
  categories,
  activeCategory,
  onSelect,
  ui,
}) => {
  const chooseAudienceCopy = (ui as { chooseAudience?: string }).chooseAudience;

  return (
    <Section id="categories" title={ui.categories} className="bg-background">
      <Container>
        <p className="mb-10 text-center text-xs uppercase tracking-[0.4em] text-subtle">
          {chooseAudienceCopy ?? "Choose who you're here for"}
        </p>
        <div className="grid gap-[clamp(2rem,3.5vw,3.5rem)] text-sm sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              aria-pressed={activeCategory === category.id}
              className={clsx(
                "group relative flex h-full flex-col gap-6 rounded-[24px] border border-white/80 bg-white px-12 py-14 text-start shadow-[0_24px_40px_-30px_rgba(15,35,42,0.45)] transition duration-200 ease-out",
                "hover:-translate-y-1.5 hover:border-primary/35 hover:shadow-[0_28px_55px_-26px_rgba(15,35,42,0.55)]",
                activeCategory === category.id && "border-primary shadow-[0_32px_60px_-26px_rgba(15,35,42,0.6)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-primary/60"
              )}
              aria-label={category.label}
            >
              <div className="space-y-4">
                <h3
                  className={clsx(
                    "font-heading text-[2rem] font-semibold tracking-tight transition-colors",
                    activeCategory === category.id ? "text-primary" : "text-text",
                    "group-hover:text-primary"
                  )}
                >
                  {category.label}
                </h3>
                <span className="block h-px w-16 bg-primary/15 transition-all group-hover:bg-primary/35" />
              </div>
              <p className="text-[0.98rem] leading-relaxed text-subtle/80 group-hover:text-text/85 line-clamp-2">
                {category.description}
              </p>
              <span
                className={clsx(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-b-[24px] bg-primary/0 transition-opacity",
                  activeCategory === category.id ? "bg-primary/60" : "group-hover:bg-primary/20"
                )}
              />
            </button>
          ))}
        </div>
      </Container>
    </Section>
  );
};
