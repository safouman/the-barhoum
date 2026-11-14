# Approved redesign implementation contract

Baseline 90ba774, feat/course-platform. The owner authorized Development-only implementation on 2026-11-14. First owner gate is homepage/hero visual acceptance before completing the wider redesign.

## Authority and shared design

Sources are the locked Brand Website Design System, supplied 1280x720 desktop and 720x1280 mobile JPEGs, and two-page locked Brand Course Team Brief EN. Preserve public/images/logo.png byte-for-byte and its full wordmark. Do not render an alternate wordmark. Exact palette is #006B6B, #00B5A6, #F9F6F2, #EDE8E3, #1A1A1A. Playfair Display regular/bold/italic is for Latin display headings; Inter for body, buttons and navigation; existing Noto Naskh Arabic for Arabic. Font rules supersede the serif UI text in JPEGs.

styles/brand/tokens.css freezes --brand-primary, --brand-accent, --brand-background, --brand-surface, --brand-text, --brand-display, --brand-body, --brand-arabic. Coordinator owns tokens, layouts, font loading, global styles, shared Button and Container, and final integration. Scope initial styles under .brand-experience. Payload stays outside this scope.

Hero heading is “Human Intelligence” then “for Your Professional Evolution.” with “for Your” black italic and “Professional Evolution.” primary italic. Copy is “Develop your emotional intelligence, strengthen your communication, understand people and organizational dynamics, and turn your professional potential into meaningful influence.” CTA is “Explore the Program”. Follow JPEG composition, proportion and responsive line wrapping. Reproduce only supplied curves and dividers. No stock/generative imagery.

## Locale contract

Extend existing Locale in lib/content.ts to ar | en | fr and existing provider, cookie barhoum_locale and lang query. No new framework or locale URL prefixes. Locale SSR, provider and navigation must agree. Draft Arabic and French copy stays explicitly identified for owner review in docs/brand-translation-review.md.

Agent C owns lib/brand-copy.ts, exporting brandCopy[locale] with these fields:
nav: program, organizations, resources, about, coaching, courses, entry, library, account, menu, close, language, skip.
hero: title, lead, emphasis, description, action.
pages: program, organizations, resources, about (each title, intro).
Default: en is available for visual reference using ?lang=en; preserve existing default Arabic unless owner changes it.
Auth-return and token parameters must survive switching. Use locale-aware server and client strings, Arabic RTL, English/French LTR, Latin digits. Authored course content is not auto-translated. Checkout and return remain English LTR.

## Ownership and first checkpoint

A / feat/redesign-public: components/brand/** except copy; app/(site)/page.tsx; app/(site)/coaching/page.tsx; archive old page as components/legacy/CoachingPage.tsx. Own isolated BrandHeader and BrandHero with CSS modules. Header consumes locale, signedIn and brandCopy, account links reuse safeReturnTo. CTA /program must resolve in checkpoint; initial program page may render exact six approved modules and placeholder disclosure. Do not edit existing SiteHeader, shared Button, layouts, tokens or locale files. Build only homepage/hero/coaching and minimal program destination before owner visual review. Wider public pages follow later.

B / feat/redesign-student: components/learning/**, components/student-auth/**, app/(student)/**/page.tsx, app/(site)/courses/**/page.tsx. First checkpoint is implementation inventory and locale plumbing preparation, plus representative course/catalog styling in own branch only; wider UI rollout and integration wait for hero acceptance. Do not modify APIs, entitlement/progress/readers, shared files, payment or English checkout/return behavior, public SiteHeader or root layouts.

C / feat/redesign-locales: lib/content.ts, lib/i18n.ts, lib/i18n.server.ts, config/localization.ts, providers/locale-provider.tsx, components/LangSwitch.tsx, lib/brand-copy.ts, data/** locale/schema additions, content/** locale additions, config/seo.ts, lib/seo.ts, localization tests and docs/brand-translation-review.md. Extend locale model and supply brand dictionary, compile existing Record<Locale> structures or coordinate files owned A/B rather than editing them. Do not alter marketing facts or existing prices. No public page implementation.

Coordinator owns integration, shared component conflicts and generic Record<Locale> updates outside owned files, fixtures, headers/layout wiring, fonts, migration decisions, verification and Preview. Every agent starts from this committed contract, tests and commits in its worktree; no merge by agents.

## Content and preservation

Reuse approved EN brief narrative. Six regular 60-minute modules in exact order:
1. Understand Yourself to Act Better
2. Decode Organizational Dynamics
3. Communicate with Intelligence
4. Master Your Presence in Meetings
5. Manage Pressure & Difficult Relationships
6. Build Your Professional Growth Plan
Placeholder lessons/videos must be labeled. Premium offers inactive. Preserve student/order/ownership/progress records and source course IDs. Coordinator creates fixture after hero gate before full acceptance.

Preserve coaching form/payment behavior under /coaching. Legacy homepage source is recoverable, no competing indexed homepage. Old homepage anchors require compatibility mapping; root fragments cannot be server-redirected, handle locally if needed while preserving query/hash. No Production config/deploy, live payment or paid service change.

## Acceptance

Screenshot exact supplied desktop/mobile dimensions, plus 320/390/1440 and Arabic/French text. Compare spacing, title wraps, logo, curves, fonts, nav and CTA. Screenshot capture excludes cookie banner only by explicit rejected-consent test cookie, keeping real consent behavior intact. Verify keyboard menu/Escape/focus, account returns, EN/AR/FR reload/switch and bidi digits. Preserve course/security/commerce/progress tests. Lint/types/build and relevant tests before integration. Early screenshots come from isolated local build; deploy integrated Development Preview only after coordinator review.
