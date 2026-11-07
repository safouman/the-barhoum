# Phase 7 course commerce operations

## Configuration and verification

- `COURSE_COMMERCE_ENABLED=true` permits new course checkout. Set it to
  `false` when staging Production or pausing new sales. Signed course webhooks,
  order refresh, and reconciliation remain available for existing orders.
- Course pages and new checkout share one server-side rule. On Vercel the rule
  uses the [IP-derived country header](https://vercel.com/docs/headers/request-headers#x-vercel-ip-country).
  Tunisia shows **Coming soon** for enabled offers. Browsing, previews and
  entitlement checks are unaffected. A missing, malformed or unknown country
  disables checkout temporarily.
- `COURSE_COMMERCE_GEO_RESTRICTION=false` bypasses geography in local or Vercel
  Preview Stripe Test Mode. Local Test Mode is allowed by default. Vercel
  Production and live mode always enforce the restriction. Requests cannot
  opt out through an API field or a custom location header.
- Protected Preview acceptance needs both a real Tunisian and a non-Tunisian
  egress IP, with the override off. Check the course page and a direct checkout
  POST in both locations. Send a conflicting country header on the hosted
  request to confirm Vercel supplies the effective value. Then enable the
  Preview-only Test Mode override if needed for team testing.
- Provision a dedicated random `CRON_SECRET` for the target environment.
  `GET /api/course-commerce/reconcile/scheduled` requires it as a bearer token.
  The coordinator owns the Vercel cron registration. Vercel Cron runs against
  Production only, does not retry failed invocations, and supports a minimum
  cadence of once per day on Hobby. Test protected Preview by invoking the
  route manually with the scoped Preview secret and the project-approved
  protection bypass. An administrator can still reconcile one order using the
  existing authenticated `POST /api/course-commerce/reconcile` endpoint.
  [Vercel cron limits](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing) ·
  [Vercel cron operations](https://vercel.com/docs/schedules/cron-jobs/manage-cron-jobs)
- Configure `COURSE_COMMERCE_ALERT_TO` as the operator inbox in each environment
  where alerts are wanted. The job uses the existing `RESEND_API_KEY` and
  `STUDENT_AUTH_FROM_EMAIL` sender and submits at most one alert per environment
  per UTC day using [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
  Confirm inbox delivery on protected Preview. An unconfigured recipient or
  failed request is visible in the runtime log as `alertDelivery`. A failed
  request also returns 503. Alert contents and logs use aggregate counts only.

## Recovery behavior

The job uses canonical Stripe checkout, intent, refund and dispute data with
the same locking and entitlement rules as course webhooks. This recovers
missing grants and rechecks past fulfilled orders for refunds and disputes.
Recovery can overlap with webhooks and manual refresh. A row lease prevents
parallel scheduled workers from selecting the same order. Expired leases
resume after an interruption.

A run starts at most four batches of three orders and stops taking new work
after 25 seconds. Pending orders receive the first batch. Historical orders
and reversals receive the second batch, then the lanes alternate. Either
lane can use slots the other does not need. Claim order follows the oldest
due time within each lane. The scheduled Stripe client uses a four-second
timeout per request with no in-call retry. Per-order retry state is durable,
with an increasing delay capped at 24 hours. Healthy historical orders are
due again after 20 hours, so they are eligible for the next daily sweep.
A full day's capacity is 12 orders, with up to six slots per lane under
sustained load from both. Provider delays may reduce that capacity.
Hobby's daily schedule and timing window, plus any backlog, bound the speed
of this safety net. Webhooks remain the primary recovery channel.

After a creating order reaches 24 hours without a saved Stripe session,
the job can discover the original session. It reads one page of up to 25
sessions from a fixed window around reservation and preserves its cursor
between runs. It matches the Stripe mode, order reference and the course
marker before canonical verification. It does not create a replacement
session. An exhausted search marks a still-unresolved order for manual review.
[Stripe session listing](https://docs.stripe.com/api/checkout/sessions/list)

## Operator response

1. Open Vercel Runtime Logs for the affected environment. Search for
   `course_commerce_reconciliation` and check `checked`, `paidRecovered`,
   `reversalsObserved`, `paidPending`, `stalePending`, `manualReview`,
   `repeatedFailures`, `backlog` and `alertDelivery`. State changes can
   also reflect concurrent webhook delivery. Check Stripe before classifying
   a transition as an undelivered event. Missing cron runs require checking
   the Cron Jobs dashboard.
2. In Stripe Workbench, select the course webhook destination in the matching
   mode and check failed or pending deliveries around the log timestamp.
   Verified webhook processing errors emit
   `course_commerce_webhook_processing_failed` in Vercel and queue the same
   daily operator email after responding to Stripe. A delivery that
   never reaches the app is visible in Stripe. Use Workbench delivery history
   to distinguish transport/signature failures from recovery backlog.
   [Stripe webhook recovery](https://docs.stripe.com/events/manage-webhook-endpoints#process-undelivered-events)
3. Resolve the configuration or provider failure and resend the signed event
   from Workbench. If needed, an Admin can reconcile by order UUID. For
   ambiguous orders, use the matching Stripe checkout session ID after
   verifying the order reference, course marker, Stripe account and mode.
   Reconciliation verifies those associations and the captured amount
   before changing access.
4. Verify the order and entitlement status after recovery. If pending work
   remains or backlog repeats, run additional authorized batches. Increase
   the schedule frequency within the approved plan before relying on it
   for a larger order volume. For daily missed-webhook review, the
   designated operator checks the course destination's delivery history
   alongside the reconciliation alerts.
