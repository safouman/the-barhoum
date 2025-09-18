# Barhoum Coaching – Iteration 1

A Next.js 14 (App Router) web experience for Barhoum’s personal coaching practice. The site reads all content from local JSON, supports Arabic (RTL) and English (LTR), and ships with three switchable design themes styled with Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

- Development server: http://localhost:3000
- Production build: `npm run build` then `npm start`
- Type check & lint: `npm run typecheck` / `npm run lint`

## Content & configuration

All editable content lives under `data/`:

- `home.json` – hero copy, videos, PDFs
- `categories.json`, `packages.json`, `testimonials.json`
- `cv.json`, `links.json`, `payments.json`
- `ui.ar.json`, `ui.en.json` – UI strings per locale

Documents (e.g. CV/PDF decks) belong in `public/docs/`.

Design tokens are defined in `design/tokens.ts`; update these to adjust color, typography, spacing, or radii for each theme. Tailwind pulls these values through CSS variables declared in `styles/globals.css` and configured in `tailwind.config.ts`.

## Runtime controls

- Language switch (Arabic/English) persists to cookies and query string `?lang=ar|en`.
- Theme switch (Luxury/Modern/Warm) persists to cookies and responds to `?theme=a|b|c`.
- Analytics wrapper logs key interaction events to the console in non-production builds (`lib/analytics.ts`).

## Project structure highlights

```
app/                 Route segments and layouts
components/          UI primitives & composed sections (Tailwind-powered)
components/home/    Theme-specific home layouts (Hero/Categories/Packages/Testimonials/Form)
lib/                 Zod-validated loaders, i18n helpers, analytics
providers/           Theme & locale context providers
styles/globals.css   Tailwind entrypoint + token plumbing
tailwind.config.ts   Utility extensions bound to design tokens
public/docs/         Downloadable assets
```

## Accessibility & RTL

- Semantic sections with focus-visible styling
- Direction (`dir`) toggles with locale and components rely on logical properties to avoid RTL breaks
- Forms provide explicit labels and keyboard-friendly controls

## Next steps

- Swap JSON placeholders with production content
- Plug analytics event wrapper into your provider of choice
- Refine visuals: add imagery, adjust grids, and expand the design system tokens
