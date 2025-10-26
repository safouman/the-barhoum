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

## Environment configuration

Set secrets in `.env.local` (keep `.env` out of version control). Restart the dev server after updating values.

- **Core URLs & localization**
  - `NEXT_PUBLIC_SITE_URL` – canonical base URL used for metadata and oEmbed responses.
  - `NEXT_PUBLIC_LOCALIZATION_AVAILABLE_LOCALES`, `NEXT_PUBLIC_LOCALIZATION_DEFAULT_LOCALE`, `NEXT_PUBLIC_LOCALIZATION_ENABLED_LOCALES` – optional overrides for supported languages when you diverge from the defaults in `config/localization.ts`.
- **Analytics (GA4)**
  - `NEXT_PUBLIC_GA4_MEASUREMENT_ID` – exposed to the client; required for browser analytics and JSON-LD metrics.
  - `GA4_MEASUREMENT_ID` (optional) – server-side override; falls back to the public value.
  - `GA4_API_SECRET` – required when the lead/checkout automations send Measurement Protocol hits.
- **WhatsApp automations**
  - `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` – credentials for the Meta WhatsApp Cloud API (v22.0).
  - `WHATSAPP_ADMIN_PHONE`, `WHATSAPP_MANAGER_PHONE` – recipient numbers (E.164, with or without the `+`).
  - Optional template knobs when you have approved message templates:
    - Lead notifications: `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE`, `WHATSAPP_TEMPLATE_PARAMETER_NAMES`.
    - Payment notifications: `WHATSAPP_PAYMENT_TEMPLATE_NAME`, `WHATSAPP_PAYMENT_TEMPLATE_LANGUAGE`, `WHATSAPP_PAYMENT_TEMPLATE_PARAMETER_NAMES`.
    - If templates are omitted, the API falls back to plain-text alerts but still requires valid credentials.
- **Stripe billing**
  - `STRIPE_SECRET_KEY` – required for creating payment links and refreshing the program catalog.
  - `STRIPE_WEBHOOK_SECRET` – required to validate `app/api/stripe/webhook`; in development run `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` to obtain a test secret.
  - Map package IDs to Stripe prices in `lib/stripe/config.ts` and keep product metadata (`program_id`, `sessions`, `duration_label`, `source=barhoum_catalog`, `brand=Ibrahim Ben Abdallah`) aligned so catalog refreshes succeed.
- **Lead automation**
  - `GOOGLE_SCRIPT_URL`, `GOOGLE_SCRIPT_SECRET` – optional. When configured, lead submissions POST to your Apps Script endpoint before triggering WhatsApp notifications.

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

## AIEO refresh checklist

- Update `/ai-brief` copy with the latest positioning and offerings
- Regenerate `/data/coach.jsonld` (served dynamically) to reflect new testimonials or services
- Re-submit the sitemap in Google Search Console and verify crawl status
- Validate structured data via Google's Rich Results Test and monitor GA4 events (e.g., `ai_brief_view`)

## Where to update SEO & AIEO

- `config/seo.ts` – single source of truth for brand profile, domain canonicals, social links, and per-page metadata
- `lib/seo.ts` – helpers that consume the shared config (no copy changes here unless the merge logic evolves)
- `app/layout.tsx` – emits Organization/Person/Service/FAQ JSON-LD; reads from `config/seo.ts`
- `app/data/coach.jsonld/route.ts` – serves the machine-readable coach profile based on the same config
- `app/ai-brief/page.tsx` – AI knowledge brief content and GA4 tracking hook
- `app/sitemap.ts` & `app/robots.txt/route.ts` – sitemap/robots outputs derived from the central config
- `app/oembed/route.ts` – JSON/XML oEmbed endpoints generated from shared SEO data

## Where to update UI data

- `data/` directory – localized copy for hero, categories, testimonials, pricing, site navigation, etc.
- `content/` directory – Markdown sections (hero/about/method) consumed on the homepage
- `public/docs/`, `public/images/` – downloadable assets and imagery referenced in content JSON
- `components/home/*` – presentation components that render structured UI from the data layer
- `styles/`, `design/` – token and Tailwind configuration for visual updates
