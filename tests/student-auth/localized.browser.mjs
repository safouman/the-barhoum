// Run against an isolated localhost fixture with the real account components.
import assert from "node:assert/strict";
import { studentCopy } from "../../lib/student-copy.ts";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.STUDENT_TEST_ORIGIN ?? "http://127.0.0.1:4541";
assert.match(origin, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/);
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "chrome" });
try {
  for (const locale of ["ar", "en", "fr"]) {
    const context = await browser.newContext({ viewport: { width: Number(process.env.STUDENT_TEST_WIDTH ?? 390), height: 844 } });
    const page = await context.newPage();
    const copy = studentCopy[locale];
    const calls = [];
    let signedIn = false;
    const student = { id: 72, name: "QA Student", email: "qa@example.test", city: null, ageRange: null, hasPassword: true, hasGoogle: false };
    await page.route("**/api/student-auth/**", route => {
      const request = route.request();
      const path = new URL(request.url()).pathname.slice("/api/student-auth/".length);
      const body = request.postDataJSON();
      calls.push({ path, body, method: request.method() });
      if (path === "login") {
        assert.deepEqual(Object.keys(body).sort(), ["email", "password"]);
        if (body.password !== "test-password-12") {
          return route.fulfill({ status: 401, json: { error: { code: "INVALID_CREDENTIALS", message: "raw-private-fixture" } } });
        }
        assert.equal(body.email, student.email);
        signedIn = true;
      }
      if (path === "me" && !signedIn) return route.fulfill({ status: 401, json: { error: { code: "UNAUTHENTICATED" } } });
      if (path === "profile") {
        assert.equal(request.method(), "PATCH");
        assert.deepEqual(Object.keys(body).sort(), ["ageRange", "city", "name"]);
        Object.assign(student, body);
      }
      if (path === "logout") {
        assert.deepEqual(body, {});
        signedIn = false;
      }
      return route.fulfill({ json: path === "me" || path === "profile" || path === "login" ? { student } : { ok: true } });
    });

    await page.goto(origin + "/register?lang=" + locale);
    await page.getByRole("heading", { name: copy.pages.register.title, exact: true }).waitFor();
    await page.getByLabel(copy.email, { exact: true }).fill(student.email);
    await page.getByRole("button", { name: copy.sendVerification, exact: true }).click();
    await page.getByRole("status").filter({ hasText: copy.verificationSent }).waitFor();
    assert.deepEqual(calls.at(-1), { path: "register", body: { email: student.email }, method: "POST" });

    const fragmentToken = "synthetic-token-qa";
    await page.goto(origin + "/verify-email?lang=" + locale + "#token=" + fragmentToken);
    await page.getByLabel(copy.fullName, { exact: true }).fill(student.name);
    await page.getByLabel(copy.newPassword, { exact: true }).fill("test-password-12");
    assert.equal(await page.evaluate(() => location.hash), "");
    assert.ok(!(await page.content()).includes(fragmentToken));
    await page.getByRole("button", { name: copy.finishRegistration, exact: true }).click();
    await page.getByRole("status").filter({ hasText: copy.verified }).waitFor();
    assert.deepEqual(calls.at(-1).body, { token: fragmentToken, name: student.name, password: "test-password-12" });

    await page.goto(origin + "/login?lang=" + locale + "&returnTo=%2F%2Funtrusted.example");
    assert.match(await page.getByRole("link", { name: copy.google, exact: true }).getAttribute("href"), /returnTo=%2Fmy-learning/);
    await page.goto(origin + "/login?lang=" + locale + "&returnTo=%2Faccount");
    assert.match(await page.getByRole("link", { name: copy.google, exact: true }).getAttribute("href"), /returnTo=%2Faccount/);
    await page.getByLabel(copy.email, { exact: true }).fill(student.email);
    await page.getByLabel(copy.password, { exact: true }).fill("incorrect-password");
    await page.getByRole("button", { name: copy.signIn, exact: true }).click();
    await page.getByRole("alert").filter({ hasText: copy.errors.INVALID_CREDENTIALS }).waitFor();
    assert.ok(!(await page.locator("main").innerText()).includes("raw-private-fixture"));
    await page.getByLabel(copy.password, { exact: true }).fill("test-password-12");
    await page.getByRole("button", { name: copy.signIn, exact: true }).click();
    await page.waitForURL(origin + "/account");
    await page.getByRole("heading", { name: copy.profile, exact: true }).waitFor();
    await page.getByLabel(copy.fullName, { exact: true }).fill("Updated QA");
    await page.getByLabel(copy.city, { exact: true }).fill("");
    await page.getByLabel(copy.age, { exact: true }).selectOption("25-34");
    await page.getByRole("button", { name: copy.saveProfile, exact: true }).click();
    await page.getByRole("status").filter({ hasText: copy.profileSaved }).waitFor();
    assert.deepEqual(calls.findLast(call => call.path === "profile").body, { name: "Updated QA", city: null, ageRange: "25-34" });
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
    assert.equal(await page.locator("html").getAttribute("dir"), locale === "ar" ? "rtl" : "ltr");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.doesNotMatch(await page.locator("main").innerText(), /[٠-٩۰-۹]/);
    await page.getByLabel(copy.newEmail, { exact: true }).fill("new@example.test");
    await page.getByRole("button", { name: copy.sendConfirmation, exact: true }).click();
    await page.getByRole("status").filter({ hasText: copy.changeEmailSent }).waitFor();
    assert.deepEqual(calls.findLast(call => call.path === "email-change").body, { email: "new@example.test" });
    await page.getByRole("button", { name: copy.signOut, exact: true }).click();
    await page.waitForURL(origin + "/login");
    await page.goto(origin + "/forgot-password?lang=" + locale);
    await page.getByLabel(copy.email, { exact: true }).fill(student.email);
    await page.getByRole("button", { name: copy.sendReset, exact: true }).click();
    await page.getByRole("status").filter({ hasText: copy.resetSent }).waitFor();
    assert.deepEqual(calls.at(-1), { path: "forgot-password", body: { email: student.email }, method: "POST" });
    await page.goto(origin + "/reset-password?lang=" + locale + "#token=reset-synthetic");
    await page.getByLabel(copy.newPassword, { exact: true }).fill("another-password-12");
    await page.getByRole("button", { name: copy.savePassword, exact: true }).click();
    await page.getByRole("status").filter({ hasText: copy.passwordSaved }).waitFor();
    assert.deepEqual(calls.at(-1).body, { token: "reset-synthetic", password: "another-password-12" });
    await page.goto(origin + "/confirm-email?lang=" + locale + "#token=email-synthetic");
    await page.getByRole("button", { name: copy.confirmEmail, exact: true }).click();
    await page.getByRole("status").filter({ hasText: copy.emailSaved }).waitFor();
    assert.deepEqual(calls.at(-1).body, { token: "email-synthetic" });
    console.log("Passed localized registration, fragment verification, safe login return, profile, email change, recovery and sign-out:", locale);
    await context.close();
  }
} finally {
  await browser.close();
}
