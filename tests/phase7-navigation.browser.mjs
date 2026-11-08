// Run against an isolated local Next server with the Phase 4 auth fixture seeded.
// Build with NEXT_PUBLIC_LOCALIZATION_ENABLED_LOCALES=true to exercise both locales.
// PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs BROWSER_CHANNEL=chrome node tests/phase7-navigation.browser.mjs
import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.STUDENT_AUTH_ORIGIN ?? "http://127.0.0.1:4398";
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL });
const fixtureCourse = "/courses/phase4-private-fixture";
const checkoutReturn = "/checkout/return?orderId=b3792e25-6acd-41e0-9e15-54ce186436dd";
const names = { courses: /^(Courses|الدورات)$/, entry: /^(Sign in \/ Register|دخول \/ تسجيل)$/, library: /^(My Learning|دروسي)$/, account: /^(Account|حسابي)$/ };

try {
    for (const width of [1440, 390, 320]) {
        const mobile = width < 768;
        const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: mobile, hasTouch: mobile });
        await context.addCookies([
            { name: "barhoum_locale", value: "en", url: origin },
            { name: "barhoum_consent", value: "rejected", url: origin },
        ]);
        const page = await context.newPage();
        const header = page.getByRole("banner");
        const navigation = header.getByRole("navigation", { name: /^(Primary|التنقل الرئيسي)$/ });
        const menu = header.getByRole("button", { name: /^(Menu|القائمة)$/ });
        const link = (name) => navigation.getByRole("link", { name, exact: true });

        async function assertPage(pathname) {
            await page.waitForURL((url) => url.pathname === pathname);
            await page.getByRole("main").waitFor();
            assert.equal(await header.count(), 1);
            assert.equal(await page.getByRole("navigation", { name: "Learning", exact: true }).count(), 0);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
            if (mobile) {
                await menu.waitFor();
                assert.equal(await menu.getAttribute("aria-expanded"), "false");
                assert.equal(await navigation.isVisible(), false);
            } else {
                assert.equal(await menu.isVisible(), false);
                await navigation.waitFor();
            }
        }

        async function showNavigation() {
            if (mobile && await menu.getAttribute("aria-expanded") === "false") await menu.click();
            await navigation.waitFor();
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        }

        async function selectLink(name, pathname) {
            await showNavigation();
            await link(name).click();
            await assertPage(pathname);
        }

        await page.goto(origin + "/");
        await assertPage("/");
        assert.equal(await page.locator("#hero").count(), 1);
        const category = page.locator("#categories").getByRole("button", { name: "Me & Work", exact: true });
        await category.click();
        assert.equal(await category.getAttribute("aria-pressed"), "true");
        await page.locator(mobile ? "#mobile-packs" : "#desktop-packs").waitFor();
        await page.locator('footer a[href="/privacy"]').click();
        await assertPage("/privacy");
        await header.locator('a[href="/"]').click();
        await assertPage("/");

        if (mobile) {
            await menu.focus();
            await page.keyboard.press("Enter");
            assert.equal(await menu.getAttribute("aria-expanded"), "true");
            assert.equal(await menu.getAttribute("aria-controls"), await navigation.getAttribute("id"));
            assert.ok((await menu.boundingBox()).height >= 44);
            await page.keyboard.press("Tab");
            assert.equal(await link(names.courses).evaluate((el) => el === document.activeElement), true);
            assert.equal(await link(names.courses).evaluate((el) => getComputedStyle(el).outlineStyle), "solid");
            await page.keyboard.press("Escape");
            assert.equal(await menu.getAttribute("aria-expanded"), "false");
            assert.equal(await menu.evaluate((el) => el === document.activeElement), true);
        }

        await showNavigation();
        await link(names.entry).waitFor();
        assert.equal(await link(names.entry).count(), 1);
        assert.equal(await navigation.locator('a[href^="/register"]').count(), 0);
        assert.equal(await link(names.library).count(), 0);
        await selectLink(names.courses, "/courses");
        await showNavigation();
        assert.equal(await link(names.courses).getAttribute("aria-current"), "page");

        await page.getByRole("link", { name: "Protected fixture", exact: false }).first().click();
        await assertPage(fixtureCourse);
        await showNavigation();
        assert.equal(await link(names.courses).getAttribute("aria-current"), "location");
        if (mobile) await menu.press("Escape");
        await page.getByRole("link", { name: /Watch free preview|شاهد الدرس المجاني/ }).first().click();
        await page.waitForURL((url) => url.pathname.startsWith(fixtureCourse + "/lessons/"));
        const freeLesson = new URL(page.url()).pathname;
        await assertPage(freeLesson);
        await page.getByRole("link", { name: "Fixture PDF", exact: false }).waitFor();

        await showNavigation();
        assert.equal(new URL(await link(names.entry).getAttribute("href"), origin).searchParams.get("returnTo"), freeLesson);
        await selectLink(names.entry, "/login");
        const registrationLink = page.getByRole("main").getByRole("link", { name: "إنشاء حساب", exact: true });
        assert.equal(new URL(await registrationLink.getAttribute("href"), origin).searchParams.get("returnTo"), freeLesson);
        await registrationLink.click();
        await assertPage("/register");
        await selectLink(names.entry, "/login");
        assert.equal(new URL(page.url()).searchParams.get("returnTo"), freeLesson);
        await page.getByRole("textbox", { name: "البريد الإلكتروني", exact: true }).fill("third-party@example.invalid");
        await page.getByLabel("كلمة المرور", { exact: true }).fill("Fixture-recovered-2026");
        await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
        await assertPage(freeLesson);
        await selectLink(names.library, "/my-learning");
        await showNavigation();
        assert.equal(await link(names.library).getAttribute("aria-current"), "page");
        assert.equal(await link(names.entry).count(), 0);
        await selectLink(names.account, "/account");
        await showNavigation();
        assert.equal(await link(names.account).getAttribute("aria-current"), "page");

        await page.goto(origin + checkoutReturn);
        await assertPage("/checkout/return");
        await selectLink(names.library, "/my-learning");
        await header.locator('a[href="/"]').click();
        await assertPage("/");
        await showNavigation();
        await link(names.account).waitFor();
        await selectLink(names.account, "/account");
        await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
        await assertPage("/login");
        await showNavigation();
        await link(names.entry).waitFor();
        assert.equal(await link(names.account).count(), 0);
        await page.goto(origin + checkoutReturn);
        await assertPage("/checkout/return");
        const orderSignIn = page.getByRole("main").getByRole("link", { name: "Sign in", exact: true });
        await orderSignIn.waitFor();
        assert.equal(new URL(await orderSignIn.getAttribute("href"), origin).searchParams.get("returnTo"), checkoutReturn);
        await selectLink(names.entry, "/login");
        assert.equal(new URL(page.url()).searchParams.get("returnTo"), checkoutReturn);
        await context.close();
    }

    const adminOnly = await browser.newContext({ locale: "en" });
    const adminResponse = await adminOnly.request.post(origin + "/api/admins/login", {
        data: { email: "student-fixture@example.invalid", password: "Fixture-password-2026" },
    });
    assert.equal(adminResponse.status(), 200);
    assert.ok((await adminOnly.cookies()).some(({ name }) => name === "payload-token"));
    const adminPage = await adminOnly.newPage();
    await adminPage.goto(origin + "/");
    const adminNav = adminPage.getByRole("navigation", { name: /^(Primary|التنقل الرئيسي)$/ });
    await adminNav.getByRole("link", { name: names.entry }).waitFor();
    assert.equal(await adminNav.getByRole("link", { name: names.account, exact: true }).count(), 0);
    await adminOnly.close();

    const rtl = await browser.newContext({ locale: "ar", viewport: { width: 320, height: 800 } });
    await rtl.addCookies([{ name: "barhoum_consent", value: "rejected", url: origin }]);
    const page = await rtl.newPage();
    await page.goto(origin + "/");
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    await page.getByRole("banner").getByRole("button", { name: "القائمة", exact: true }).click();
    const arabicNav = page.getByRole("navigation", { name: "التنقل الرئيسي" });
    await arabicNav.getByRole("link", { name: "الدورات", exact: true }).waitFor();
    await arabicNav.getByRole("link", { name: "دخول / تسجيل", exact: true }).waitFor();
    assert.equal(await arabicNav.locator('a[href^="/register"]').count(), 0);
    await rtl.close();
    console.log("Passed desktop and mobile homepage-to-learning navigation, keyboard access, RTL, checkout return, and live student sign-in/out.");
} finally {
    await browser.close();
}
