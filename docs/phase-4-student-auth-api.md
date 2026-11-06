# Phase 4 student API

This interface implements the Phase 4 contract at d8401cd. Student requests are same-origin, use the dedicated HTTP-only student cookie and never expose session tokens. JSON mutations use Content-Type application/json. Private responses are no-store. API errors use `{ error: { code: string, message: string } }`. Forms use the codes below for safe local copy.

| Method and path under /api/student-auth | Request | Success |
| --- | --- | --- |
| POST /register | `{ email }` | 202 `{ ok: true }`, generic response |
| POST /resend-verification | `{ email }` | 202 `{ ok: true }`, generic response |
| POST /verify | `{ token, name, password }` for password enrollment, or `{ token, name }` for Google enrollment | 200 `{ ok: true }`; direct user to login |
| POST /login | `{ email, password }` | 200 `{ student }` and student cookie |
| POST /forgot-password | `{ email }` | 202 `{ ok: true }`, generic response |
| POST /reset-password | `{ token, password }` | 200 `{ ok: true }`; require fresh sign-in |
| GET /me | Cookie | 200 `{ student }` or 401 |
| PATCH /profile | `{ name?, city?, ageRange? }` | 200 `{ student }` |
| POST /logout | `{}` | 200 `{ ok: true }` and cleared student cookie |
| POST /email-change | `{ email }` and fresh authentication | 202 `{ ok: true }`, generic response |
| POST /email-change/confirm | `{ token }` | 200 `{ ok: true }`; require fresh sign-in |
| GET /google/start | `intent=login\|link\|reauth` (default login), safe optional `returnTo` | Browser redirect to Google |
| GET /google/callback | OAuth state and code or error | Redirect to safe student route |

Student DTO is `{ id: number, name: string, email: string, city: string | null, ageRange: string | null, hasPassword: boolean, hasGoogle: boolean }`. Age range options are `under-18`, `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65+`. Use `null` to clear either optional field. No student ID is accepted in self-service URLs or bodies.

Use `INVALID_INPUT` (400), `INVALID_TOKEN` (400), `INVALID_CREDENTIALS` (401), `UNAUTHENTICATED` (401), `REAUTH_REQUIRED` (403), `RATE_LIMITED` (429) and `UNAVAILABLE` (503). For password reauthentication, resubmit the login form with the current email and password before retrying the sensitive action. Google reauthentication must prove the current student's already linked subject. Set a maximum five-minute freshness window and require an active session for initiating linking or email change.

Use /register, /login, /verify-email, /forgot-password, /reset-password, /account, /confirm-email, and /my-learning as the UI routes. Verification emails link to /verify-email#token=… or /verify-email?method=google#token=… for Google enrollment. Reset and email change links go to /reset-password#token=… and /confirm-email#token=…. Read and remove the fragment in the browser, then submit the token in the POST body so it stays out of request URLs. OAuth success defaults to /my-learning, successful linking goes to /login?status=google-linked, and failures return to /login or /account with safe status values `google-canceled`, `google-failed`, `google-link-required`, or `reauth-required`. Google enrollment awaiting inbox proof can use /verify-email?status=check-inbox. Never include raw OAuth errors or secrets in redirects. Limit allowed return paths to student and learning routes.

Frontend fixtures implement the same API shapes in isolated browser tests. Runtime auth calls the real API.
