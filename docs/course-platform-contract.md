# Barhoum course platform contract

Phase 1 foundation is at `3b181ae`. Keep Next.js, Payload Admin, Neon, and Vercel. Develop and integrate on `feat/course-platform`. Production releases and database changes require separate approval.

## Roadmap

1. Foundation
2. Course Management
3. Video & Learning Frontend
4. Authentication
5. Commerce & Entitlements
6. Progress & Operations
7. Production Readiness

The parallel assignments cover Phase 2 and the initial Phase 3 learning interface. Finish video provider integration during Phase 3. Preserve the existing bilingual marketing site, inquiry flow, and Stripe integration.

## Payload content

- **Courses** have a unique route slug, title, description, and cover. All four are required to publish. Instructor, estimated duration, learning outcomes, difficulty, and category are optional. Each course is authored in one language. There is no required language field.
- **Modules** have a stable record ID, immutable owning course, title, and `regular` or `premium` classification. **Parts** are titled rows owned by a Structured course.
- **Lessons** have a stable record ID, immutable owning course, title, optional description, free-preview flag, and ordered Payload Blocks. A lesson can contain any combination of formatted text, one or more video references per video block, and downloadable files or external links per resource block. Blocks can repeat and be reordered. Duplicating a lesson creates a distinct record with independently editable blocks and no automatic placement.
- **Instructors** are reusable profiles with name and optional biography and image. They stay internal in the MVP.

A course chooses exactly one curriculum shape. Simple is an ordered list of lesson references. Modular is an ordered list of module placements with ordered lesson references. Structured is an ordered list of parts, each with ordered module placements and lesson references. A part or module can be the only one at its level. Array order is the source of truth. A Simple course can add a premium module by converting to Modular or Structured.

Validate on the server that every placement belongs to the course, active placements follow the selected shape, and lesson and module references are unique within the curriculum. During conversion, preserve the referenced records and IDs. Save the replacement curriculum in a course draft and publish it as one update. When publishing, persist only the active structure. Protect referenced records from hard deletion through the CMS. Unpublishing and removing placements preserve records and future progress identity.

**Known Admin issue.** Structure conversion requires reselecting existing placements. If a newly added nested lesson or module row has no editable selector, save the draft, reload, expand the row, and select the existing record. Publish the course only after checking placement and order. This workflow is accepted for the MVP.

Use Payload's built-in drafts for courses and lessons. An editor may publish an edit directly or save a draft. Live reads use the published course curriculum and published lessons placed in it. Unpublishing a course hides the whole curriculum. Unpublishing a lesson hides that lesson without deleting it. A published course can contain draft lessons that only editors see. Verify create, reorder, and conversion flows through standard Payload Admin first. Report awkward or impractical flows with steps to reproduce before proposing custom UI.

## Media and access

- Published course covers use public storage. Use separate cover and lesson-file collections. Treat a cover uploaded to a public store as publicly accessible to anyone with its URL. Only upload approved public cover assets there and expose cover URLs in the learner catalog only for published courses.
- Vercel Preview uses a dedicated public Blob store for course cover uploads. Existing approved HTTPS URLs and app-owned image paths remain supported. Hosted lesson file delivery is disabled.
- Vercel Blob is selected for public course covers. Inspection of the published `@payloadcms/storage-vercel-blob@3.93.0` package confirms a matching Payload peer and a public-only adapter. Vercel Blob itself supports private stores with authenticated reads via its SDK. Evaluate a small private SDK-backed integration or a supported private Payload adapter before provisioning lesson file storage. Never put protected lesson files in the public store. Verify unauthorized reads and downloads fail before enabling them. If private delivery is unavailable, keep protected file delivery disabled and report the remaining acceptance gap.
- Vimeo is the selected provider. Store the provider and video reference in Payload. The first rollout serves Vimeo embeds only for published, placed free lessons. For a future paid lesson, the app could check entitlements before returning an embed, while Vimeo Embed only and domain restrictions could limit where that embed plays. These restrictions do not validate individual purchases or issue playback grants tied to the student. Bring acceptance of that trade-off back for business approval before implementing paid Vimeo playback. Use only approved demonstration media in development and Preview.
- Raw CMS reads and writes are admin-only. A server-only learner reader verifies course publication, published curriculum membership, lesson publication, and access before returning lesson content. Free previews can appear anywhere in a published curriculum, including in premium modules. Locked lesson responses contain summary and navigation only. They omit lesson blocks, file locations, and playback references. Download and playback endpoints must repeat the access check. Reject unsafe link protocols and keep protected responses out of shared caches.

[Payload Blocks](https://payloadcms.com/docs/fields/blocks) · [Payload drafts](https://payloadcms.com/docs/versions/drafts) · [Published Blob adapter](https://registry.npmjs.org/@payloadcms/storage-vercel-blob/-/storage-vercel-blob-3.93.0.tgz) · [Vercel private Blob](https://vercel.com/docs/vercel-blob/private-storage)

## Learner interface

| Route | Server response |
| --- | --- |
| `/courses` | Published course summaries with `slug`, `title`, `description`, and `cover` containing `url` and `alt`. |
| `/courses/[courseSlug]` | Summary, applicable optional public metadata, and an ordered curriculum tagged `simple`, `modular`, or `structured`. |
| `/courses/[courseSlug]/lessons/[lessonId]` | Course identity, lesson summary, ordered navigation, and blocks only when access is allowed. Unknown, unpublished, and misplaced lessons return 404. |

A lesson summary has a stable string `id`, `title`, optional `description`, and `access` equal to `free`, `locked`, or `unlocked`. Omit the description from locked summaries until it is explicitly classified as public metadata. A module placement has `id`, `title`, `classification`, and ordered `lessons`. A part has a row `id`, `title`, and ordered `modules`. Simple returns `lessons`, Modular returns `modules`, and Structured returns `parts`. Convert database IDs to strings at the server boundary.

Blocks retain array order. Use `type: "text"` with formatted content, `type: "video"` with ordered videos, or `type: "resources"` with ordered links and downloads. Each block has an `id`. Delivery data contains only server-approved playback or download URLs. Agent B can exercise all access states with explicitly selected development fixtures. Fixtures must never authorize real content or be reachable in production. The production reader supplies free or locked access during this phase.

## Future commerce

Default bundles grant base-course access for their included courses. Premium modules are included only through explicit module grants. Products live separately from curriculum and can later declare a set of course grants with `courseId`, `baseAccess`, and `premiumModuleIds`. Regular content additions are included with base access. Premium additions require a matching grant. Preserve lifetime one-time access, incremental upgrades, refunds, disputes, and manual grants or revocations for the commerce design. Keep Stripe Checkout and server-side purchase eligibility for the later commerce phase. Tunisian purchasing remains unavailable at launch. Tax, jurisdiction, and refund policy remain open. Student authentication, entitlement enforcement, progress, and commerce implementation are deferred.

## Parallel assignments and handoff

Both branches start at the commit that introduces this contract. Use separate Git worktrees. Each agent reports its commit, checks, limitations, and handoff details to the coordinator. Agents request contract and shared dependency changes through the coordinator. The coordinator reviews and integrates one branch at a time.

### Agent A — Payload backend

Own `payload/`, `payload.config.ts`, the Payload admin import map, generated Payload types, and `migrations/`. Implement the collections, curriculum validation, ownership, drafts, and block editing. Generate and inspect the migration without applying it to the shared database. Prefer a disposable Neon branch with its own credentials to verify migrations and representative records. If unavailable, report the missing validation for the coordinator. Exercise standard Admin editing and conversion, verify lesson IDs survive, and confirm duplicated lessons are independent. Report storage constraints and any provisioning or dependency needs before making changes outside the worktree.

### Agent B — Learning frontend

Own `app/(site)/courses/` and `components/learning/`, including isolated fixtures. Use the shared learner shapes and the site's existing design tokens, components, and responsive conventions. Build catalog, detail, lesson rendering, and navigation for all three structures. Exercise text, video, resources, and the three access states with demo data. Leave Payload collections, migrations, shared dependencies, and the real content reader to their owners. Database credentials are unnecessary for this workstream.

### Coordinator — Shared and integrated work

Own this contract, shared types in `lib/learning/contracts.ts`, the server reader and asset delivery, shared dependency changes, preview configuration, and integration. The coordinator alone applies reviewed migrations to shared Neon development. Keep schema push disabled and use the unpooled URL for migrations. Local Development and Preview share one database, so coordinate deployment and migration timing and review compatibility with the currently running preview. A disposable branch is for validation only.

## Acceptance

- Verify representative Simple, Modular, and Structured courses can be edited and published in Payload Admin. Test reordering and conversion while retaining lesson IDs.
- Verify the real learner catalog, detail and lesson navigation. Test unpublished courses and lessons, a free preview in a premium module, locked payloads without private assets, and ordered text, video and resource rendering. Record any provider-specific verification that remains.
- Verify responsive navigation, public covers and authorized downloads when storage is enabled. Run lint, type checking, and production build, then check the protected Vercel Preview and existing marketing routes. Document integration limitations with actual test results.
