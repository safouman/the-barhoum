import assert from "node:assert/strict";
import { test } from "node:test";

import {
  analyticsLocation,
  analyticsVercelLocation,
  isAllowedPosthogEvent,
  sanitizeAnalyticsParams,
} from "../../lib/analytics/shared.ts";
import { hasAnalyticsConsent } from "../../lib/consent.ts";

const origin = "https://ibrahimbenabdallah.com";
const canary = "private-canary@example.test";

test("uses a public route template and removes URL queries, fragments and private routes", () => {
  assert.equal(
    analyticsLocation(`${origin}/courses/published-course/lessons/123?token=${canary}#session`),
    `${origin}/courses/[courseSlug]/lessons/[lessonId]`,
  );
  for (const path of ["/account", "/checkout/return?orderId=123", "/login", "/reset-password", "/api/lesson-downloads/test"]) {
    assert.equal(analyticsLocation(origin + path), undefined);
  }
  for (const host of ["https://dev.ibrahimbenabdallah.com", "https://example.vercel.app", "http://localhost:3000"]) {
    assert.equal(analyticsLocation(host + "/courses"), undefined);
  }
});

test("drops Vercel pageviews when an automatic referrer would expose private data", () => {
  for (const referrer of [`${origin}/?email=${canary}`, `${origin}/account`, `https://example.org/private/${canary}`]) {
    assert.equal(analyticsVercelLocation(origin + "/", referrer), undefined);
  }
  assert.equal(analyticsVercelLocation(origin + "/?utm_campaign=example", "https://example.org/"), origin + "/");
});

test("permits only analytics dimensions and explicit anonymous event names", () => {
  const value = sanitizeAnalyticsParams({
    course_key: "published-course",
    offer_category: "premium_module",
    locale: "ar",
    referrer: canary,
    page_title: canary,
    email: canary,
    recipient: canary,
    session_id: canary,
    form_country: canary,
    payment_intent: canary,
    error_reason: canary,
    utm_campaign: canary,
    $set: { email: canary },
    $current_url: canary,
  });
  assert.deepEqual(value, { course_key: "published-course", offer_category: "premium_module", locale: "ar" });
  assert.equal(isAllowedPosthogEvent("course_checkout_started"), true);
  for (const name of ["$identify", "$autocapture", "$exception", "$opt_in", "$pageleave"]) {
    assert.equal(isAllowedPosthogEvent(name), false);
  }
});

test("analytics requires an explicit accepted cookie and stops after revocation", () => {
  const previousDocument = globalThis.document;
  const previousToggle = process.env.NEXT_PUBLIC_DISABLE_CONSENT;
  process.env.NEXT_PUBLIC_DISABLE_CONSENT = "true";
  try {
    for (const [cookie, expected] of [
      ["", false],
      ["barhoum_consent=invalid", false],
      ["barhoum_consent=accepted", true],
      ["barhoum_consent=rejected", false],
    ]) {
      globalThis.document = { cookie };
      assert.equal(hasAnalyticsConsent(), expected);
    }
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousToggle === undefined) delete process.env.NEXT_PUBLIC_DISABLE_CONSENT;
    else process.env.NEXT_PUBLIC_DISABLE_CONSENT = previousToggle;
  }
});
