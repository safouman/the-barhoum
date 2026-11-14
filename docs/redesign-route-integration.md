# Redesign route integration

## Navigation and source of truth

- Homepage / renders the approved brand hero.
- The Program /program issues a temporary server redirect to /courses/human-intelligence-for-your-professional-evolution, retaining the selected language.
- Courses /courses uses the existing published-course reader and existing Development-only technical-fixture filter.
- Program detail, curriculum, previews, prices, ownership, enrollment and progress all use the existing Payload-backed /courses/[courseSlug] implementation.
- Organizations /organizations, Resources /resources and About /about are implemented with grounded public content and real links.
- Coaching /coaching preserves the prior homepage components, inquiry form and training payments. Existing root fragments about, method, testimonials, categories, lead-form, experience, intro-video and mobile-packs map to their original coaching sections. Coaching is excluded from indexing during the redesign.
- Login /login, registration /register, account /account and library /my-learning retain existing endpoints and safe return behavior and share website chrome and locale context.
- Course lesson URLs stay /courses/[courseSlug]/lessons/[lessonId].
- Checkout return stays /checkout/return with English copy and LTR layout. It preserves the student's preferred locale cookie. Stripe course sessions explicitly request English.
- APIs, native Payload sessions, paid-content authorization, private file routes, progress and payment fulfillment retain their established implementations.

The static program curriculum page and its CSS were removed. The only hardcoded program pointer is its canonical slug, defined in lib/learning/main-program.ts. No parallel curriculum/pricing model or database migration was introduced.

## Development fixture

Payload course9, slug human-intelligence-for-your-professional-evolution, is published with six regular modules6–11 and six placeholder lessons21–26. Lesson21 is a free video preview, lesson22 is a paid test video. The original logo is the course cover. Planned duration is6 hours,60 min per module, stored in existing authored course/lesson fields. The schema has no dedicated module-duration field. Exact approved titles stay in the course curriculum. All six lessons identify placeholder content.

Base offer4 uses the existing Development Stripe Test Mode Price. There are no premium offers for this course. Existing students, orders, entitlements, completion, resume and achievement counts were unchanged by fixture creation. The Arabic showcase and all historical course IDs remain intact.

## Verification

- Full combined lint and TypeScript passed.
- Integrated production build passed.
- Thirteen locale, analytics privacy and progress-model tests passed.
- Existing auth integration suite passed with disposable database and mocked providers, covering signup, replay, profiles, session isolation, recovery, email change and Google/OIDC.
- Existing commerce suite passed with disposable database and mocked Stripe/Resend, including retries, concurrent orders, payment/refund/dispute recovery, alert behavior, geography, kill switch, repurchase and training isolation. The test now asserts English Stripe Checkout locale.
- Actual Development Payload content was read in browser tests through Program, course detail, catalog, free video and locked lesson routes.
- Combined320px account browser journeys passed in AR/EN/FR with synthetic auth API responses, including registration, token clearing, safe return, profiles, email change, recovery and signout.
- Combined route browser checks passed public/account route language and reflow, canonical redirect, real six-module curriculum, free/locked content separation, fixed-English return and preferred-language restoration, and legacy fragments. Order return used a synthetic intercepted order response.

Arabic/French interface copy is draft pending editorial review. Legacy coaching French text and some legal/SEO copy still use documented English fallback. New public resources exclude placeholder/example links. No live payment or actual student account was created for these tests. Hosted verification follows deployment of this reviewed Development integration.
