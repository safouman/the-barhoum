# Phase 4 student authentication contract

Phase 4 adds student accounts to the existing Next.js and Payload app on Neon. Administrators and students are separate Payload auth collections and may use the same email. Only an identity authenticated as an admin can administer the CMS, access draft and version records, or retrieve files through administrative endpoints. Published free previews and eligible downloads remain available anonymously. Student purchases, entitlements, progress, 2FA, avatar uploads and self-service deletion are deferred.

## Identity and sessions

- Give each student an immutable Payload ID. Use it for future purchases, entitlements and progress. Enforce unique normalized email (trim and lowercase) and unique non-null Google subject in PostgreSQL. Resolve competing claims in the database.
- Store required name and verified email, with optional city, age range and picture field. Display initials in Phase 4. Serve only allowlisted profile data and permit students to update only their own editable fields.
- Use native Payload password hashing, login, JWT validation and stored student sessions. Set a distinct host-only, HttpOnly, SameSite=Lax student cookie, with Secure on HTTPS and a fixed 14-day lifetime. Authenticate student routes from that cookie alone and check the returned collection. Keep the admin cookie independent. Disable generated student REST endpoints and keep student records out of Admin navigation. Scope any privileged Local API use to an explicit authenticated operation.
- Use native logout to revoke the current session. Revoke all student sessions on password recovery, verified email change or addition of a login method. Revalidate current identity and sensitive preconditions inside the mutation transaction. Never return Payload session tokens in JSON.

## Google OpenID Connect

Use openid-client v6 in a Node route handler, with authorization code, PKCE, state and nonce. Validate signature, issuer, audience, expiry and nonce. Use exact configured callback URLs and a stable protected Preview origin. Store Google subject as the login identifier. For new students, require app inbox verification when Google is not authoritative for the claimed email. An email collision requires signing into the existing account and explicitly linking Google after fresh authentication. Bind linking state to the student, current session and intent. Reject a subject already linked to a different student. Retain the subject across verified email changes.

Google and password logins use the same native session format. Isolate Google session issuance in one server module. The proof used Payload's exported signing helpers and the adapter's transaction handle to append a native session row and issue the matching JWT. The Payload session representation and transaction handle are version-coupled. Pin and test against the installed Payload version. Coordinate all student session writers and revokers using one PostgreSQL transaction lock per student and fresh reads under that lock. Recheck the authenticated or linked identity before writing. The local signed identity fixture tested the session handoff independently of Google Cloud setup. Run a real Google round trip on protected Preview before enabling Google sign-in.

## Registration, recovery and profile

- Password signup verifies inbox ownership before the inbox owner chooses a password. Use a hashed, short-lived challenge and consume it atomically with account creation. Payload 3.93.0 native verification has no expiry check and acts on an existing user, which does not cover this flow.
- Use the same small challenge store for new inbox verification and Google enrollment when additional inbox proof is required. Bind the token to its purpose, intended email and identity or enrollment context. GET displays the confirmation form. POST consumes the token, with retries and races producing at most one successful transition.
- Use native forgot-password and reset for verified students, including Google-only accounts setting their first password. If creation requires a password for a Google-only account, generate an undisclosed random one. Wrap recovery in generic responses, configurable token expiry and transaction locking. Revoke the replacement session created by native reset before completing the operation and require fresh sign-in. Prevent reset and verified email change from racing or reviving old credentials.
- An email change requires fresh authentication and proof of the new inbox. The old address remains active until commit. Check uniqueness again, revoke sessions and outstanding recovery tokens, and notify the old inbox.
- Use the official Payload Resend adapter, a verified sender domain, a configured link origin and environment-scoped credentials. Preview restricts delivery to an explicit allowlist. Use a test inbox locally. Avoid recording tokens or passwords in logs and disable click tracking on auth links.
- Apply persistent abuse limits by normalized account and IP, generic responses for registration, login and recovery, origin checks on browser mutations, and validated internal return paths. Use no-store for private responses. Manual privacy requests require verified identity and use the immutable student ID.
- Allow account creation without purchase. My Learning shows the empty state with Browse Courses. Phase 5 owns server-side checkout authentication and real ownership.

## Worktree ownership and interface

Agent A owns student collections, access control, `/api/student-auth`, server auth modules, email, OAuth and migrations. First implementation checkpoint reproduces the native session proof with the production-shaped adapter and tests before enabling auth on Preview. Provide a server-side student session reader and sanitized profile DTO. The coordinator reviews and applies migrations.

Agent B owns branded login, registration, verification, recovery, profile and My Learning pages, scoped components and browser tests. Start from fixtures using shared response shapes and preserve marketing and learning behavior. Treat generic submission, validation, expired link, sign-in required and rate-limited states as distinct UI states without exposing account existence. Use a normal browser redirect for Google.

The coordinator owns shared interfaces, integration and Preview verification. Freeze route names and request/response fixtures before integration. Agent A and B start from the same contract commit.

## Acceptance

- Exercise password signup, verification, reset, Google signup/sign-in and explicit linking in the browser. Verify profile updates and My Learning on desktop and mobile.
- Prove native JWT recognition for both login methods, current-session logout, all-session revocation and concurrent mixed sign-ins and revocation. Test expired and replayed tokens, case-normalized duplicate email and simultaneous claims, Google callback state/nonce and link hijacking, email-change/reset races, CSRF, open redirects, account enumeration and rate limits.
- Verify same-email Admin and Student sessions coexist in one browser. A student bearer token and cookie cannot access Admin CRUD, course administration, version history, custom endpoints or protected file bytes. Validate existing admin operations and anonymous published free previews, including eligible downloads.
- Run lint, type checks, isolated Neon migration tests and protected Vercel Preview checks. Keep production configuration outside this milestone.
