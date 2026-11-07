// Run a local Next dev server first. Playwright is installed separately:
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs BROWSER_CHANNEL=chrome node tests/phase5-commerce.browser.mjs
// This creates and removes a temporary local-only route for the presentation fixture.
import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.COMMERCE_TEST_ORIGIN ?? "http://127.0.0.1:4337";
assert.match(origin, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/);

const id = "b3792e25-6acd-41e0-9e15-54ce186436dd";
const coursePath = "/courses/attention-and-practice";
const returnPath = "/checkout/return?orderId=" + id;
const fixtureRoute = new URL("../app/(student)/commerce-browser-test/", import.meta.url);
await mkdir(fixtureRoute);
let browser;
try {
  await writeFile(new URL("page.tsx", fixtureRoute), 'export { default } from "../../../tests/phase5-commerce.fixture";\n', { flag: "wx" });
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL });

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, isMobile: viewport.width === 390, hasTouch: viewport.width === 390 });
    const page = await context.newPage();
    const width = viewport.width;
    const text = async (message) => page.getByText(message, { exact: false }).first().waitFor({ state: "visible" });
    const button = (name) => page.getByRole("button", { name, exact: true });
    const link = (name) => page.getByRole("link", { name, exact: true });
    const fixture = (view) => page.goto(origin + "/commerce-browser-test?view=" + view);
    const screenshot = async (name) => {
      if (process.env.COMMERCE_TEST_SCREENSHOTS) {
        await page.screenshot({ path: join(process.env.COMMERCE_TEST_SCREENSHOTS, name + "-" + width + ".png"), fullPage: true });
      }
    };
    const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), await page.evaluate(() => innerWidth));

    const attempts = [];
    let checkoutMode = "unavailable";
    let orderMode = "processing";
    let reads = 0;
    let refreshes = 0;
    let hostedRedirects = 0;

    await page.route("**/api/student-auth/me", (route) => route.fulfill({ json: {
      student: { id: 9, name: "Test Student", email: "student@example.test", city: null, ageRange: null, hasPassword: true, hasGoogle: false },
    } }));
    await page.route("https://checkout.stripe.com/**", (route) => {
      hostedRedirects += 1;
      return route.fulfill({ status: 302, headers: { location: origin + returnPath } });
    });
    await page.route("**/api/course-commerce/**", (route) => {
      const request = route.request();
      const url = new URL(request.url());
      assert.equal(url.origin, origin);
      if (url.pathname.endsWith("/checkout")) {
        assert.equal(request.method(), "POST");
        const body = request.postDataJSON();
        assert.deepEqual(Object.keys(body), ["offerId"]);
        attempts.push(body.offerId);
        if (checkoutMode === "unavailable") return route.fulfill({ status: 503, json: { error: { code: "UNAVAILABLE", message: "Raw backend detail" } } });
        if (checkoutMode === "owned") return route.fulfill({ status: 409, json: { error: { code: "ALREADY_OWNED" } } });
        if (checkoutMode === "auth") return route.fulfill({ status: 401, json: {} });
        const checkoutUrl = checkoutMode === "unsafe" ? "https://checkout.stripe.com.example.test/c/pay/fake" : "https://checkout.stripe.com/c/pay/fake";
        return route.fulfill({ json: { checkoutUrl, orderId: id } });
      }
      assert.match(url.pathname, new RegExp("/orders/" + id + "(/refresh)?$"));
      if (url.pathname.endsWith("/refresh")) {
        assert.equal(request.method(), "POST");
        refreshes += 1;
        orderMode = "fulfilled";
      } else {
        assert.equal(request.method(), "GET");
        reads += 1;
      }
      if (orderMode === "login") return route.fulfill({ status: 401, json: { error: { code: "UNAUTHENTICATED" } } });
      if (orderMode === "missing") return route.fulfill({ status: 404, json: { error: { code: "NOT_FOUND" } } });
      if (orderMode === "unavailable") return route.fulfill({ status: 503, json: { error: { code: "UNAVAILABLE" } } });
      return route.fulfill({ json: { orderId: id, status: orderMode, courseSlug: "attention-and-practice" } });
    });

    await fixture("visitor");
    await text("USD 149.00");
    await text("2 regular lessons included");
    assert.equal(await link("Sign in to purchase").getAttribute("href"), "/login?returnTo=%2Fcourses%2Fattention-and-practice");
    assert.equal(await link("Watch free preview").getAttribute("href"), coursePath + "/lessons/1");
    assert.equal(await button("Buy upgrade").count(), 0);
    assert.deepEqual(attempts, []);
    await noOverflow();
    await screenshot("visitor-course");

    await fixture("buyer");
    await button("Buy course").click();
    await text("Checkout couldn’t open");
    assert.equal(await page.getByText("Raw backend detail").count(), 0);
    checkoutMode = "unsafe";
    await button("Buy course").click();
    await text("Checkout couldn’t open");
    assert.equal(hostedRedirects, 0);
    checkoutMode = "owned";
    await button("Buy course").click();
    await text("You already have access");
    checkoutMode = "auth";
    await button("Buy course").click();
    await text("Sign in to continue to checkout");
    assert.equal(await link("Sign in").getAttribute("href"), "/login?returnTo=%2Fcourses%2Fattention-and-practice");
    checkoutMode = "ok";
    await button("Buy course").click();
    await page.waitForURL(origin + returnPath);
    await text("Payment is processing");
    assert.equal(await link("Go to course").count(), 0);
    await noOverflow();
    await screenshot("processing");
    const previousReads = reads;
    await page.waitForTimeout(3_500);
    assert.ok(reads > previousReads, "Pending status should poll");
    await button("Check payment status").click();
    await text("Your order is complete");
    assert.equal(await link("Go to course").getAttribute("href"), coursePath);
    assert.equal(hostedRedirects, 1);
    assert.equal(refreshes, 1);
    assert.deepEqual(attempts, [17, 17, 17, 17, 17]);

    await fixture("owner");
    assert.equal(await link("Continue Learning").getAttribute("href"), coursePath + "/lessons/2");
    assert.equal(await button("Buy course").count(), 0);
    await text("USD 45.00");
    await noOverflow();
    await screenshot("owner-course");
    await button("Buy upgrade").click();
    await page.waitForURL(origin + returnPath);
    await text("Your order is complete");
    assert.equal(attempts.at(-1), 18);
    assert.equal(hostedRedirects, 2);

    await fixture("upgraded");
    await text("Module owned");
    assert.equal(await button("Buy upgrade").count(), 0);
    await fixture("owned-learning");
    const owned = page.getByRole("list", { name: "Owned courses" });
    assert.equal(await owned.getByRole("link").getAttribute("href"), coursePath);
    await noOverflow();
    await screenshot("owned-learning");
    await fixture("empty-learning");
    await text("Your courses will appear here");
    assert.equal(await link("Browse Courses").getAttribute("href"), "/courses");

    for (const [status, heading] of [
      ["open", "Checking your payment"], ["failed", "Your order didn’t complete"],
      ["expired", "This checkout has expired"], ["support_required", "This order needs review"],
      ["login", "Sign in with the account you used at checkout"], ["missing", "We couldn’t find this order for your account"],
      ["unavailable", "We couldn’t check your order right now"],
    ]) {
      orderMode = status;
      await page.goto(origin + returnPath);
      await text(heading);
      if (status === "login") {
        assert.equal(new URL(await link("Sign in").getAttribute("href"), origin).searchParams.get("returnTo"), returnPath);
      }
      if (status === "support_required") assert.equal(await link("Contact support").getAttribute("href"), "/#lead-form");
      if (status !== "fulfilled") assert.equal(await link("Go to course").count(), 0);
    }
    const beforeInvalid = reads;
    await page.goto(origin + "/checkout/return?orderId=invalid");
    await text("This order link is missing or invalid.");
    assert.equal(reads, beforeInvalid);

    await context.close();
    console.log("PASS purchasing and order-status UI at", width + "px");
  }
} finally {
  await browser?.close();
  await rm(fixtureRoute, { recursive: true });
}
