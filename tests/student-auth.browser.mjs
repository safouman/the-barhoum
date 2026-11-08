// Start Next locally, then run with Node and Playwright installed separately:
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs BROWSER_CHANNEL=chrome node tests/student-auth.browser.mjs
import assert from "node:assert/strict";
import { join } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.STUDENT_TEST_ORIGIN ?? "http://127.0.0.1:4331";
assert.match(origin, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/);

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL });
const expectedStudent = {
  id: 72, name: "Demo Student", email: "student@example.test", city: null,
  ageRange: null, hasPassword: true, hasGoogle: false,
};

const errors = {
  INVALID_CREDENTIALS: 401, UNAUTHENTICATED: 401, REAUTH_REQUIRED: 403,
  INVALID_TOKEN: 400, RATE_LIMITED: 429,
};

function button(page, name) {
  return page.getByRole("button", { name, exact: true });
}

async function installFixture(page) {
  const calls = [];
  const student = { ...expectedStudent };
  let signedIn = false;
  let fresh = false;
  let googleMode = "google-canceled";
  const valid = new Set(["register-test", "google-test", "reset-test", "email-test"]);

  await page.route("**/api/student-auth/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    assert.equal(url.origin, origin);
    const path = url.pathname.slice("/api/student-auth/".length);
    const body = request.postDataJSON();
    calls.push({ path, body, method: request.method() });
    if (process.env.STUDENT_TEST_DEBUG) console.log("fixture", request.method(), path);
    const ok = (data = { ok: true }, status = 200) => route.fulfill({ json: data, status, headers: { "Cache-Control": "no-store" } });
    const error = (code) => route.fulfill({ json: { error: { code, message: "Raw fixture text" } }, status: errors[code] });
    const redirect = (location) => route.fulfill({ status: 302, headers: { location } });

    switch (path) {
      case "register":
      case "resend-verification":
      case "forgot-password":
        assert.deepEqual(Object.keys(body), ["email"]);
        return body.email === "rate@example.test" ? error("RATE_LIMITED") : ok(undefined, 202);
      case "verify":
        if (!valid.delete(body.token)) return error("INVALID_TOKEN");
        assert.deepEqual(Object.keys(body).sort(), body.token === "google-test" ? ["name", "token"] : ["name", "password", "token"]);
        return ok();
      case "reset-password":
        assert.deepEqual(Object.keys(body).sort(), ["password", "token"]);
        if (!valid.delete(body.token)) return error("INVALID_TOKEN");
        signedIn = false;
        student.hasPassword = true;
        return ok();
      case "login":
        assert.deepEqual(Object.keys(body).sort(), ["email", "password"]);
        if (body.password !== "a-valid-password") return error("INVALID_CREDENTIALS");
        signedIn = true;
        fresh = true;
        return ok({ student });
      case "me":
        return signedIn ? ok({ student }) : error("UNAUTHENTICATED");
      case "profile":
        assert.equal(request.method(), "PATCH");
        assert.deepEqual(Object.keys(body).sort(), ["ageRange", "city", "name"]);
        if (!signedIn) return error("UNAUTHENTICATED");
        Object.assign(student, body);
        return ok({ student });
      case "email-change":
        assert.deepEqual(Object.keys(body), ["email"]);
        return fresh ? ok(undefined, 202) : error("REAUTH_REQUIRED");
      case "email-change/confirm":
        assert.deepEqual(Object.keys(body), ["token"]);
        if (!valid.delete(body.token)) return error("INVALID_TOKEN");
        signedIn = false;
        return ok();
      case "logout":
        assert.deepEqual(body, {});
        signedIn = false;
        return ok();
      case "google/start":
        if (url.searchParams.get("intent") === "reauth") {
          fresh = true;
          return redirect("/account");
        }
        if (url.searchParams.get("intent") === "link") {
          if (!fresh) return redirect("/account?status=reauth-required");
          student.hasGoogle = true;
          signedIn = false;
          return redirect("/login?status=google-linked");
        }
        if (googleMode === "signup") return redirect("/verify-email?status=check-inbox");
        if (googleMode === "signed-in") {
          signedIn = true;
          student.hasGoogle = true;
          student.hasPassword = false;
          return redirect("/my-learning");
        }
        return redirect("/login?status=" + googleMode);
      default:
        assert.fail("Unexpected student API path: " + path);
    }
  });

  return {
    calls,
    expireFreshness() { fresh = false; },
    setGoogleMode(mode) { googleMode = mode; },
  };
}

async function expectText(page, text) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: 12000 });
  } catch (error) {
    console.error("Expected UI text was missing at", new URL(page.url()).pathname, "\n", await page.locator("main").innerText());
    throw error;
  }
}

async function snapshot(page, name, width) {
  if (!process.env.STUDENT_TEST_SCREENSHOTS) return;
  await page.screenshot({ path: join(process.env.STUDENT_TEST_SCREENSHOTS, name + "-" + width + ".png"), fullPage: true });
}

async function email(page, address = "student@example.test") {
  await page.getByRole("textbox", { name: /^(Email address|البريد الإلكتروني)$/ }).fill(address);
}

async function login(page, password = "a-valid-password") {
  await email(page);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await button(page, "تسجيل الدخول").click();
}

async function fragmentPage(page, path, token) {
  await page.goto("about:blank");
  const response = await page.goto(origin + path + "#token=" + token);
  assert.ok(response);
  assert.equal(response.headers()["referrer-policy"] ?? await page.locator('meta[name="referrer"]').getAttribute("content"), "no-referrer");
  assert.ok(!response.url().includes(token));
  await page.waitForFunction(() => location.hash === "");
  assert.ok(!(await page.content()).includes(token), "Token must stay out of HTML and RSC data");
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width === 390, hasTouch: viewport.width === 390 });
  const page = await context.newPage();
  const fixture = await installFixture(page);

  await page.goto(origin + "/register");
  await snapshot(page, "register", viewport.width);
  await email(page);
  await button(page, "إرسال رابط التحقق").click();
  await expectText(page, "إذا كان التسجيل بهذا البريد ممكنًا");
  await email(page, "already-registered@example.test");
  await button(page, "إرسال رابط التحقق").click();
  await expectText(page, "إذا كان التسجيل بهذا البريد ممكنًا");
  await page.getByRole("link", { name: "اطلب رابط تحقق جديدًا" }).click();
  await button(page, "Resend verification email").waitFor();
  await email(page);
  await button(page, "Resend verification email").click();
  await expectText(page, "If a verification link can be sent");
  await email(page, "rate@example.test");
  await button(page, "Resend verification email").click();
  await expectText(page, "Too many attempts");
  assert.equal(await page.getByText("Raw fixture text").count(), 0);

  await fragmentPage(page, "/verify-email", "register-test");
  await page.getByLabel("Full name").fill("Demo Student");
  await page.getByLabel("New password").fill("a-valid-password");
  await button(page, "Finish registration").click();
  await expectText(page, "Your email is verified");
  await fragmentPage(page, "/verify-email", "register-test");
  await page.getByLabel("Full name").fill("Demo Student");
  await page.getByLabel("New password").fill("a-valid-password");
  await button(page, "Finish registration").click();
  await expectText(page, "invalid, expired, or already used");
  await button(page, "Request another verification link").click();
  await button(page, "Resend verification email").waitFor();

  await page.goto(origin + "/login?returnTo=" + encodeURIComponent("//example.test"));
  assert.match(await page.getByRole("link", { name: /Continue with Google|المتابعة باستخدام Google/ }).getAttribute("href"), /returnTo=%2Fmy-learning/);
  await login(page, "incorrect-password");
  await expectText(page, "البريد الإلكتروني أو كلمة المرور غير صحيحة");
  await page.getByRole("link", { name: /Continue with Google|المتابعة باستخدام Google/ }).click();
  await expectText(page, "أُلغي تسجيل الدخول عبر Google");
  fixture.setGoogleMode("google-link-required");
  await page.getByRole("link", { name: /Continue with Google|المتابعة باستخدام Google/ }).click();
  await expectText(page, "سجّل الدخول إلى حسابك أولًا");
  fixture.setGoogleMode("signup");
  await page.getByRole("link", { name: /Continue with Google|المتابعة باستخدام Google/ }).click();
  await expectText(page, "Check your inbox for the link");
  await fragmentPage(page, "/verify-email?method=google", "google-test");
  assert.equal(await page.getByLabel("New password").count(), 0);
  await page.getByLabel("Full name").fill("Demo Google Student");
  await button(page, "Finish registration").click();
  await expectText(page, "Your email is verified");

  await page.goto(origin + "/account");
  await expectText(page, "Sign in to view your student account.");
  await page.getByRole("main").getByRole("link", { name: "Sign in", exact: true }).click();
  await login(page);
  await page.waitForURL(origin + "/account");
  await expectText(page, "student@example.test");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), await page.evaluate(() => innerWidth));
  await snapshot(page, "account", viewport.width);
  await page.getByLabel("Full name").fill("New Student");
  await page.getByLabel("City (optional)").fill("Tunis");
  await page.getByLabel("Age range (optional)").selectOption("25-34");
  await button(page, "Save profile").click();
  await expectText(page, "Your profile was saved");
  await page.getByLabel("City (optional)").fill("");
  await page.getByLabel("Age range (optional)").selectOption("");
  await button(page, "Save profile").click();
  await expectText(page, "Your profile was saved");
  assert.deepEqual(fixture.calls.filter(({ path }) => path === "profile").at(-1).body, { name: "New Student", city: null, ageRange: null });

  fixture.expireFreshness();
  await page.getByLabel("New email address").fill("new@example.test");
  await button(page, "Send confirmation link").click();
  await expectText(page, "Confirm your identity");
  await page.getByRole("link", { name: "Sign in again with your password" }).click();
  await login(page);
  await page.waitForURL(origin + "/account");
  await page.getByLabel("New email address").fill("new@example.test");
  await button(page, "Send confirmation link").click();
  await expectText(page, "If this address can be used");
  await fragmentPage(page, "/confirm-email", "email-test");
  await button(page, "Confirm new email").click();
  await expectText(page, "Sign in using your new email address");

  await page.goto(origin + "/login");
  await login(page);
  await page.waitForURL(origin + "/my-learning");
  await page.getByRole("main").getByRole("link", { name: /Sign in|تسجيل الدخول|دخول \/ تسجيل/ }).waitFor();
  await page.goto(origin + "/account");
  await page.getByRole("link", { name: "Link Google account" }).click();
  await expectText(page, "تم ربط حساب Google. سجّل الدخول مجددًا");
  fixture.setGoogleMode("signed-in");
  await page.getByRole("link", { name: /Continue with Google|المتابعة باستخدام Google/ }).click();
  await page.waitForURL(origin + "/my-learning");
  // The simulated authentication API does not create a real server session.
  await page.goto(origin + "/account");
  await expectText(page, "Profile");
  fixture.expireFreshness();
  await page.getByLabel("New email address").fill("new@example.test");
  await button(page, "Send confirmation link").click();
  await page.getByRole("link", { name: /Continue with Google|المتابعة باستخدام Google/ }).click();
  await page.getByRole("link", { name: "Set a password using email" }).click();
  await email(page);
  await button(page, "Send reset link").click();
  await expectText(page, "If a reset link can be sent");
  await fragmentPage(page, "/reset-password", "reset-test");
  await page.getByLabel("New password").fill("another-valid-password");
  await button(page, "Save new password").click();
  await expectText(page, "your other sessions were signed out");
  await page.goto(origin + "/login");
  await login(page);
  await page.waitForURL(origin + "/my-learning");
  await page.goto(origin + "/account");
  await button(page, "تسجيل الخروج").click();
  await page.waitForURL(origin + "/login");
  await page.goto(origin + "/my-learning");
  await page.getByRole("main").getByRole("link", { name: /Sign in|تسجيل الدخول|دخول \/ تسجيل/ }).waitFor();
  await context.close();
  console.log("PASS student account and recovery UI at", viewport.width + "px");
}

await browser.close();
