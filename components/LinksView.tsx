"use client";

import { Container } from "./Container";
import type { LinkItem, Locale, UIStrings } from "@/lib/content";
import { useLocale } from "@/providers/locale-provider";

interface LinksViewProps {
  links: LinkItem[];
  ui: Record<Locale, UIStrings>;
}

export function LinksView({ links, ui }: LinksViewProps) {
  const { locale } = useLocale();
  const strings = ui[locale];

  return (
    <div className="py-[clamp(var(--space-lg),18vh,var(--space-xl))]">
      <Container className="space-y-sm">
        <h1 className="text-3xl font-heading">{strings.links.title}</h1>
        <p className="text-subtle">{strings.links.description}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-sm pt-sm">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid gap-2 rounded-md border border-border bg-surface p-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm"
            >
              <span className="font-heading text-xl">{link.title[locale]}</span>
              <span className="text-sm text-subtle">{link.description[locale]}</span>
            </a>
          ))}
        </div>
      </Container>
    </div>
  );
}
