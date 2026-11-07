# Barhoum Phase 7 implementation contract

Start from the coordinator's frozen security and contract commit, descended from
`c08a23d` on `feat/course-platform`. Phases 1–6 remain the development baseline.
This contract authorizes preparation only. Agent implementation, Production staging,
and live sales each have their own approval. Launch with one real main course and
optional premium modules while preserving support for multiple courses.

## Agent A — Website and student navigation

Branch `feat/phase-7-navigation`. Own `components/SiteHeader*`,
`components/learning/LearningNavigation.tsx`, `components/learning/StudentFrame.tsx`,
the site and student root layouts, and navigation-focused tests. Use one shared
header across those route groups. Keep Payload Admin separate. Preserve brand,
marketing content, landing anchors, and player layout. Resolve student identity
on the server from the native student session, with private request-scoped
rendering wherever account links are personalized. Never expose an admin session
as a student. Keep request failures from breaking the public site.

Anonymous visitors see Courses and Login/Register. Signed-in students see Courses,
My Learning and Account. Preserve existing locale/direction and active states.
Mobile navigation must be keyboard and touch usable, expose its expanded state,
close after navigation and on Escape, and restore focus to its toggle when dismissed.
Validate that there is one primary header and no horizontal overflow. Exercise
homepage → catalog → free lesson → sign in → return, plus checkout return, My
Learning, Account, sign-out and legacy marketing/training links on desktop and mobile.

## Agent B — Geographic eligibility and commerce operations

Branch `feat/phase-7-commerce-operations`. Own `app/api/course-commerce/**`,
`lib/commerce/course-payments/**`, a narrow server-side purchase eligibility
adapter for the course detail route, and commerce tests. Own the course offer
presentation where needed for the geographic and disabled-sales states.
Do not modify shared headers, authentication, player code, or legacy training
Stripe paths. Coordinate any scheduler configuration or schema need before editing.

- Add a server-controlled Tunisia restriction enabled for launch. Use the trusted
  Vercel IP country signal in hosted requests, never billing/card country or
  client-supplied country. Verify behavior behind Vercel and document missing
  country behavior. No VPN detection. Development and protected Preview can
  disable the restriction for Stripe Test Mode. No browser-controlled bypass.
- Show Coming soon for Tunisian visitors while leaving browsing and free previews
  available. Enforce the same decision at Checkout creation, before creating an
  order or contacting Stripe. Existing owners retain access wherever they are.
  Honor the existing course checkout kill switch independently of geography.
- Reuse the canonical Stripe reconciliation function for recovery. Reconcile
  stale pending orders and detect missed refund/dispute events for previously
  fulfilled orders. Define bounded batches, durable resumable coverage,
  overlap/idempotency, provider rate limits and retry behavior. Preserve the
  existing admin-only manual recovery path. Do not suppress signed webhook
  processing when new checkouts are disabled.
- Use the smallest reliable scheduling and alert path supported by the target
  Vercel plan. Protect machine invocation with a dedicated secret and reject
  student, anonymous and invalid machine requests. Emit sanitized operational
  signals for stale paid orders, repeated delivery or reconciliation failures,
  and manual intervention. Document how the operator receives, verifies, and
  resolves an alert. No passwords, session/reset tokens, Stripe credentials,
  signatures, request bodies or full Stripe responses in logs.
- Test Tunisia/non-Tunisia and disabled flags, spoofed input, retained ownership,
  missed payment and missed refund/dispute recovery, duplicate/concurrent events,
  bounded retries, operator authorization, and unchanged training payment behavior.

## Coordinator ownership and integration

Both agents commit in their own worktrees from the same frozen baseline. Neither
merges into `feat/course-platform`. Coordinator owns shared interfaces,
configuration, migrations, reviews, integration, protected Preview deployment
after approval, and sign-off. If a migration is needed, coordinator reviews it
and tests it on disposable data first. Integration should keep the training
checkout/webhook and course checkout/webhook separate. Avoid shared edits or
unexpected business changes. Neither agent changes Production or activates sales.

## Release sequence and blocking gates

1. Review and integrate both branches. Pass lint, generated Next route types,
   build and regression suites. Verify Preview purchase, webhook and refund
   reconciliation, refunded-student direct lesson/embed/PDF/progress denial,
   and free previews. Exercise the full mobile and desktop customer journey
   through completion and Vimeo resume with real content.
2. Establish environment isolation. Verify Vimeo eligible plan and domain
   restrictions for authorized Preview and Production, reject an unrelated HTTPS
   domain, and verify unpaid application responses omit protected embeds. Confirm
   authorized PDF access and denial after revocation. Verify production Google
   callback and consent settings, Resend sender/DNS and credential scope, Admin
   restrictions and credential redaction through Vercel and external log/analytics
   settings. Keep native Payload password handling.
3. Validate Neon Production migrations and rehearse backup restore on a separate
   target. Record the backup/restore runbook, operator and rollback plan. Verify
   one real main course, free lessons, cover, downloads and optional modules.
   Obtain qualified legal/tax review and approve terms, privacy, refunds, support
   contact and receipts. Verify live Stripe account, offer/price mapping, webhook
   signature and URL, return origin, and course/training isolation.
4. With explicit release approval, stage Production with course checkout disabled
   and run smoke checks. Confirm the kill switch on the UI and direct checkout
   requests. No public sale at this step.
5. After separate live-sales approval, enable only the course checkout flag,
   confirm Tunisia enforcement and recovery/monitoring, then perform the approved
   live acceptance. If an incident occurs, disable new course checkouts first,
   keep fulfillment/refund processing available, and follow the reviewed
   deployment/database rollback plan.

Before either Production step, recheck the dependency advisory feed and hosted
Admin/editor and Blob/PDF paths. Track any remaining lower-severity advisories
against actual exposure and the upstream compatibility requirements.

## Security baseline evidence and follow-up

The fresh npm audit before patching returned 1 critical, 14 high, 18 moderate,
and 10 low affected package entries. After patching: 0 critical, 0 high, 21
moderate, and 10 low across all dependencies. The production-only scan reports
0 critical, 0 high, 8 moderate, and 10 low. Counts include dependency chains
reported by npm, not necessarily distinct vulnerabilities.

- DOMPurify is reachable through Monaco in the Payload Admin bundle. No direct
  public application sanitizer call or exploit was established. Pin DOMPurify
  3.4.17 under Monaco. Verify Admin editor rendering on the hosted candidate.
- Happy DOM is pulled in by Lexical's headless DOM API. No anonymous HTML execution
  route using that API was found. The 21.0.4 override crosses Lexical's declared
  major range and passed a headless DOM smoke check. Remove the override when
  Payload/Lexical adopt a patched version.
- Upgrade Vercel OIDC to 4.0.7 and Zod to 4.6.7. The exposed app path is private
  PDF Blob access and request validation. The flagged OIDC dependency was its
  CLI configuration path. The targeted Blob override crosses the SDK's declared
  OIDC range. Node token retrieval and local authorized PDF checks passed.
  Verify hosted private Blob upload/read/delete with the production credential
  mode on the release candidate. Review the override when Blob supports OIDC 4.
- Preact can enter the analytics bundle, so patch it. The remaining high findings
  involved build/tooling chains for browser targets, source maps and file patterns.
  Patch available compatible versions. Residual glob and minimatch reports are
  moderate, with no request-controlled glob pattern identified. Review other
  residual entries, especially Payload's query parsing path, on the release
  candidate. Avoid audit-force downgrades or unreviewed major overrides.
- Local student and administrator fixtures verified Payload PBKDF2-SHA256 hashes,
  student password replacement after reset, fixture-password absence in student
  auth responses and local server logs, and Student/Admin route, cookie, draft,
  version, preference, and file access isolation. Production observability is a
  separate redaction gate. Provision the initial Admin securely and verify that
  first-registration cannot be used by the public before exposure.
