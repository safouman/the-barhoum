import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import type { HomeThemeDefinition } from "../types";

const ICONS: Record<string, React.ReactNode> = {
  individuals: (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/30">
      <span className="h-5 w-5 rounded-full bg-primary/25" />
    </span>
  ),
  couples: (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/30">
      <span className="relative h-5 w-5">
        <span className="absolute inset-y-0 left-0 w-3 rounded-full border border-primary/25 bg-primary/10" />
        <span className="absolute inset-y-0 right-0 w-3 rounded-full border border-primary/40 bg-primary/20" />
      </span>
    </span>
  ),
  organizations: (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/30">
      <span className="grid h-5 w-5 grid-cols-2 gap-[2px]">
        <span className="rounded bg-primary/20" />
        <span className="rounded bg-primary/10" />
        <span className="rounded bg-primary/10" />
        <span className="rounded bg-primary/30" />
      </span>
    </span>
  ),
};

export const HomeCategories: HomeThemeDefinition["Categories"] = ({
  categories,
  activeCategory,
  onSelect,
  ui,
}) => (
  <Section id="categories" title={ui.categories} className="bg-background">
    <Container>
      <p className="mb-10 text-center text-xs uppercase tracking-[0.4em] text-subtle">
        {ui.chooseAudience ?? "Choose who you're here for"}
      </p>
      <div className="grid gap-[clamp(2rem,3.5vw,3.5rem)] text-sm md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            aria-pressed={activeCategory === category.id}
            className={clsx(
              "group relative flex h-full flex-col gap-7 rounded-[32px] border border-primary/10 bg-white px-10 py-14 text-left shadow-[0_22px_48px_-30px_rgba(16,37,44,0.5)] transition duration-300 ease-out",
              "hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_26px_52px_-26px_rgba(16,37,44,0.55)]",
              activeCategory === category.id && "border-primary/60 shadow-[0_28px_60px_-28px_rgba(16,37,44,0.6)]"
            )}
          >
            <div className="space-y-5">
              <div className="transition-colors group-hover:text-primary">
                {ICONS[category.id] ?? (
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/20">
                    <span className="text-lg font-semibold text-primary">{category.label.charAt(0)}</span>
                  </span>
                )}
              </div>
              <h3
                className={clsx(
                  "font-heading text-[1.65rem] font-semibold tracking-tight transition-colors",
                  activeCategory === category.id ? "text-primary" : "text-text",
                  "group-hover:text-primary"
                )}
              >
                {category.label}
              </h3>
              <span className="block h-px w-14 bg-primary/15 transition-colors group-hover:bg-primary/35" />
            </div>
            <p className="text-[0.98rem] leading-relaxed text-subtle/90 group-hover:text-text/80">
              {category.description}
            </p>
            <span
              className={clsx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-b-[28px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity",
                activeCategory === category.id ? "opacity-100" : "group-hover:opacity-80"
              )}
            />
          </button>
        ))}
      </div>
    </Container>
  </Section>
);
