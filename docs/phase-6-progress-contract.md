# Phase 6 Progress & Operations

Approved architecture and learning direction. Implementation starts after explicit launch authorization. The accepted implementation and protected Preview baseline is `d8b9f36` on `feat/course-platform`. Both worktrees branch from the commit containing this contract.

## Storage and transactions

| Table | Key | Stored fields |
| --- | --- | --- |
| `lesson_progress` | Student ID and lesson ID | Nullable `completed_at`, nullable `last_visited_at`, and `completion_revision` |
| `lesson_video_resume` | Student ID, lesson ID, and canonical Vimeo video ID | Position in seconds, revision, and server `updated_at` |
| `course_achievements` | Student ID and course ID | Immutable `first_completed_at` |

Use existing integer IDs and foreign keys. Keep Vimeo IDs as digit strings. Completion and resume revisions are independent and missing records have revision zero. Index for batch lookups by student and relevant lesson IDs. Use server timestamps. Reuse Neon, the existing transaction helper, student identity, and Phase 5 entitlement rules. Where mutations require both commerce locks, acquire the content publication lock before the student/course lock, consistent with checkout reservation. Validate the current session, publication, placement, entitlement and asset association within the write transaction. Reuse the effective ownership rules with a transaction-capable reader. Under simultaneous final-lesson completions, serialize before computing the base result and insert the unique achievement in the same transaction.

## API and shared view models

Use the existing route and JSON conventions. All progress writes are authenticated, same-origin, bounded, rate limited, and private/no-store. Route paths use the course slug for lookup and a stable integer lesson ID. Derive the student from the session. Reject user-supplied student IDs and unknown fields.

| Route | Request | Success response |
| --- | --- | --- |
| `POST /api/learning/progress/[courseSlug]/[lessonId]/visit` | Empty body | `{ lastVisitedAt }` |
| `PUT /api/learning/progress/[courseSlug]/[lessonId]/completion` | `{ completed, expectedRevision }` | `{ completion, courseProgress, nextUnfinishedLesson }` |
| `PUT /api/learning/progress/[courseSlug]/[lessonId]/resume` | `{ videoId, seconds, expectedRevision }` | `{ videoId, seconds, revision }` |

Shared fields use these shapes. `Completion` is `{ completed, completedAt, revision }`. `ProgressCount` is `{ completed, total, percent }`, with `percent: null` when total is zero and a non-100 percentage while any lesson remains. `CourseProgress` is `{ base, premiumModules, firstCompletedAt }`. Each premium entry includes `moduleId`, `title` and a `ProgressCount`. `LessonTarget` is `{ lessonId, title, href }`, or null when unavailable. My Learning receives owned course summaries plus `CourseProgress`, the current Continue target and its Start, Continue or Review state. Lesson pages receive progress, curriculum completion markers and resume positions through server view models. Progress payloads exclude embed URLs, privacy hashes, and PDF URLs.

Return 401 for missing session, 404 for unavailable or unauthorized lesson or video, 400 for invalid inputs, 409 for revision conflicts, 429 for rate limiting and 503 for temporary failure. Use `{ error: { code, message }, current? }` and include the latest authorized field state on conflict. An exact retry of the immediately previous write may acknowledge the saved value without advancing revision or granting another achievement. Never reapply a stale conflicting mutation automatically. Coalesce writes and keep conflict handling out of the normal UI. Display a retry or a discreet notice if a learner action still needs attention. Record visits only from an actually opened, authorized lesson. Deduplicate repeated visit writes during the same mount and avoid offline replay of old visit events.

## Progress and lifecycle

- Students explicitly complete or uncomplete any accessible lesson type. A genuine transition to complete can award the first course achievement when all currently eligible base lessons are complete. Curriculum shrinkage, reads, playback, and repeated writes do not award achievements. Keep the first achievement when lessons are added or a learner uncompletes a lesson.
- Count distinct published, placed base lessons, including eligible free previews. Count each effectively owned premium module separately. Exclude premium lessons from base progress. A zero-lesson scope has no percentage and earns no achievement.
- Signed-in students can save published free-preview progress before purchase. The saved progress carries forward after purchase. Anonymous previews are untracked. Progress does not grant access or add a course to My Learning.
- Reordering and moving within the same course preserve stable lesson IDs and progress. Current placement determines the denominator. Removing or unpublishing content excludes it from current totals and targets while keeping its records. Republishing the same ID can restore its contribution. Copies get new IDs. Permitted hard deletion removes lesson detail and resume rows. Course achievements survive lesson deletion and curriculum changes. An unpublished course is omitted from student navigation while its history is retained. Existing commerce lifecycle guards govern what can be unpublished or deleted.
- Refunds and suspensions preserve saved data while removing active ownership and protected access. Legitimate repurchase restores visibility of saved progress. My Learning uses currently owned published courses. Signed-in free previews remain available under the existing access rules.

## Continue Learning and playback

Resolve Continue on the server from the current published, accessible curriculum. For unfinished work, use the most recent accessible visit. Fall back to the first accessible unfinished lesson. Show Review when all accessible work is finished. After a successful Complete & Continue, select the next accessible unfinished lesson in order and wrap once. Distinguish base completion from unfinished work in owned premium modules. Previous and Next skip inaccessible lessons. All accessible lessons remain freely navigable.

Load the Vimeo Player SDK only for signed-in, authorized Vimeo lessons. Keep the existing embed and offer Resume at the saved timestamp on learner interaction. Suppress near-end positions and start finished videos from the beginning. Save meaningful movement roughly every 15 seconds and on pause, with a best-effort flush when leaving or hiding the page. Use revision checks and one in-flight save per video. A stale device refreshes its saved position before writing again, and backwards seeks remain valid. Replacing the canonical video ID starts fresh. Validate finite, nonnegative, bounded positions, and use real player duration for resume decisions. If the SDK or saving fails, keep playback, navigation and manual completion usable. No position grants entitlement or marks a lesson complete.

## Learner experience and Admin

Use an editorial course library and a quiet, content-first player. Preserve Barhoum typography, palette and imagery. Reuse Tailwind, Button, Container, course cards and curriculum primitives. Share one learning navigation component across the learner route groups. Keep the marketing site and Phase 5 purchase flow outside the design scope.

- My Learning emphasizes the most recently visited in-progress course and its next action. Show ownership, base count and percentage, purchased premium progress, and historical achievement as a separate status. Keep Browse Courses in the empty state.
- Keep the curriculum adjacent to the player on desktop and use a compact accessible disclosure on mobile. Give video, text, PDF and mixed content a consistent hierarchy. Make Complete & Continue prominent and expose Mark incomplete clearly. Use distinct completed, current and locked states, useful save feedback and accessible resources.
- Use one server-authorized, read-only view inside Payload Admin. Support paginated student lookup and course detail with base and purchased premium progress, first completion, entitlement status, and relevant order/refund status. Keep the raw Students collection hidden. Check the admins identity server-side. Minimize personal data and exclude payment details, tokens and raw events. Reuse learner progress calculations.

## Ownership and review gates

| Owner | Branch | Exclusive files or areas |
| --- | --- | --- |
| Agent A, Progress Backend | `feat/phase-6-progress-backend` | `lib/learning/progress/` except the shared contract, `app/api/learning/progress/`, the read-only Admin view under `payload/progress/`, backend and security tests under `tests/progress/` |
| Agent B, Learning UX & Frontend | `feat/phase-6-learning-ux` | Learning and My Learning route presentation, learner layout/navigation, `components/learning/`, learner-facing account shell changes as needed, Vimeo player client and learner browser tests |
| Coordinator | `feat/course-platform` | Shared DTO and fixture, migrations, Payload registration and import map, shared Payload reader and entitlement integration, design approval, integration and protected Preview verification |

Agent B builds against the frozen shared fixture and DTO while Agent A builds the real services. Route integration and any changes to a shared file go through the coordinator. Agents commit within their own branches. The coordinator reviews and merges.

Before final integration, review desktop and mobile screenshots of My Learning, the player and curriculum, video/text/PDF/mixed content, available and locked lessons, completion states, base and premium counts, and relevant empty states. Check 390 px and 1440 px plus narrow-device, keyboard, focus, contrast, touch target, overflow, and layout stability cases. Visual approval is required in addition to functional tests.

Test persistence, idempotency, revision conflicts, network failure, protected writes after revocation, repurchase, unauthorized identities and video IDs, no-history fallback, locked adjacency, all-finished review, counts, stable IDs, lifecycle changes and historical achievement. Confirm read-only Admin visibility, anonymous previews, authoring, authentication, and Phase 5 commerce regressions. Verify Vimeo resume on protected Preview in Chrome and Safari. Run lint, types, build, and migration apply/rollback against disposable data before the coordinator applies reviewed migrations to Preview development.

Phase 7 retains Vimeo paid-plan and domain protection, the refunded student's direct paid-lesson browser regression, Stripe webhook monitoring and reconciliation, Tunisia IP checkout restrictions, and production payments, environment, legal/tax and final launch checks. Phase 6 adds no new provider, payment feature, or production changes.
