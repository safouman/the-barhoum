// Read-only hosted/local typography checks. Specimens alter only the test tab's
// DOM; they are not product routes, account fixtures or server writes.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.TYPOGRAPHY_ORIGIN ?? "http://localhost:4147";
assert.match(origin, /^(?:http:\/\/(?:localhost|127\.0\.0\.1):\d+|https:\/\/dev\.ibrahimbenabdallah\.com)$/);
const output = process.env.TYPOGRAPHY_OUTPUT;
assert.ok(output, "Provide an evidence output directory");
await mkdir(output, { recursive: true });
const baseline = process.env.TYPOGRAPHY_BASELINE === "1";
const heroFocus = process.env.TYPOGRAPHY_FOCUS === "hero-auth";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "chrome" });
const results = [], fonts = [], inkMetrics = [];
try {
  for (const lang of baseline ? ["en", "fr"] : ["en", "fr", "ar"]) for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 1000 : 844 } });
    await context.addCookies([{ name: "barhoum_consent", value: "rejected", url: origin }]);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
    async function rendered(selector, expected) {
      const { root } = await cdp.send("DOM.getDocument");
      const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector });
      assert.ok(nodeId, selector);
      const result = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      let used = result.fonts.filter(font => font.glyphCount > 0);
      if (!used.length) {
        // Block containers can delegate all text to descendant render nodes.
        const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId, selector: "*" });
        const descendants = await Promise.all(nodeIds.map(id => cdp.send("CSS.getPlatformFontsForNode", { nodeId: id })));
        const unique = new Map();
        for (const font of descendants.flatMap(value => value.fonts)) {
          if (font.glyphCount > 0 && (!unique.has(font.postScriptName) || unique.get(font.postScriptName).glyphCount < font.glyphCount)) unique.set(font.postScriptName, font);
        }
        used = [...unique.values()];
      }
      assert.ok(used.length, "No rendered glyphs: " + selector);
      for (const name of expected) assert.ok(used.some(font => font.postScriptName.match(name)), JSON.stringify({ selector, expected: name.source, used }));
      if (!baseline) assert.ok(!used.some(font => /Noto|TimesNewRoman|Arial/.test(font.postScriptName)), "Unexpected fallback " + JSON.stringify(used));
      fonts.push({ path: new URL(page.url()).pathname, lang, width, selector, fonts: used });
      return used;
    }
    const routes = baseline ? ["/", "/resources"] : heroFocus ? ["/", "/login", "/register", "/verify-email"] : ["/", "/about", "/courses", "/courses/min-al-fikra-ila-al-ada", "/login", "/register", "/verify-email", "/courses/human-intelligence-for-your-professional-evolution/lessons/21", "/resources", "/coaching"];
    for (const route of routes) {
      const response = await page.goto(origin + route + "?lang=" + lang, { waitUntil: "domcontentloaded" });
      assert.equal(response.status(), 200, route);
      await page.evaluate(() => document.fonts.ready);
      await page.locator('header img').first().evaluate(image => image.decode());
      assert.equal(await page.locator("html").getAttribute("lang"), lang);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Reflow " + route + lang + width);
      if (route === "/") {
        await rendered("#brand-hero-title > span:first-child", baseline && lang === "ar" ? [/NotoNaskh/] : lang !== "ar" ? [/PlayfairDisplay/] : [/Tajawal-ExtraBold/]);
        if (!baseline && lang === "ar") {
          if (width < 1440) {
            const ink = await page.locator("#brand-hero-title > span:first-child").evaluate(element => {
              const style = getComputedStyle(element), context = document.createElement("canvas").getContext("2d");
              context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
              const measured = context.measureText(element.textContent);
              return { lineHeight: parseFloat(style.lineHeight), inkHeight: measured.actualBoundingBoxAscent + measured.actualBoundingBoxDescent };
            });
            assert.ok(ink.lineHeight >= ink.inkHeight, "Arabic hero ink exceeds line box");
            inkMetrics.push({ lang, width, ...ink });
            const phrases = await page.locator("#brand-hero-title > span:first-child, #brand-hero-title > span:last-child > span, #brand-hero-title em").evaluateAll(elements => elements.map(element => ({ text: element.textContent, height: element.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(element).lineHeight) })));
            assert.equal(phrases.length, 3);
            for (const phrase of phrases) assert.ok(phrase.height <= phrase.lineHeight + 1, "Arabic hero phrase wraps: " + phrase.text);
          }
          await rendered("#hero p", [/Tajawal-Regular/, /Inter/]);
          await rendered("#hero a span", [/Tajawal-Medium/]);
          if (width === 1440) await rendered("header nav a", [/Tajawal-Medium/]);
        }
      }
      if (!baseline && route === "/about" && lang === "ar") await rendered("main h1", [/Tajawal-Bold/]);
      if (!baseline && route === "/login" && lang === "ar") {
        await rendered('label[for="login-email"]', [/Tajawal-(?:Medium|Bold)/]);
        await rendered('main button[type="submit"]', [/Tajawal/]);
      }
      if (!baseline && route === "/courses/min-al-fikra-ila-al-ada") {
        await rendered("main h1 bdi", [/Tajawal-Bold/]);
        await rendered('main p[dir="auto"]', [/Tajawal-Regular/, /Inter/]);
        // Standard course curriculum: real Arabic part/module text on every locale.
        const arabicCurriculum = page.locator('main summary').filter({ hasText: /[\u0600-\u06ff]/ }).first();
        if (await arabicCurriculum.count()) {
          const selector = await arabicCurriculum.evaluate(element => {
            element.setAttribute("data-font-curriculum", "checked");
            return '[data-font-curriculum="checked"]';
          });
          await rendered(selector, [/Tajawal/]);
        }
      }
      if (!baseline && route.includes("/lessons/21")) await rendered("main h1 bdi", [/PlayfairDisplay/]);
      const name = route === "/" ? "home" : route.split("/").filter(Boolean).join("-");
      if (baseline || route === "/" || route === "/about" || route === "/login" || route === "/courses/min-al-fikra-ila-al-ada" || route === "/resources") {
        await page.screenshot({ path: join(output, `${name}-${lang}-${width}.png`), fullPage: true });
      }
      if (heroFocus && route === "/" && width < 1440) {
        const toggle = page.locator("header button");
        await toggle.press("Enter");
        assert.equal(await toggle.getAttribute("aria-expanded"), "true");
        const menuLink = page.locator('header nav:not([hidden]) a[href="/coaching"]');
        await menuLink.waitFor({ state: "visible" });
        await rendered('header nav:not([hidden]) a[href="/coaching"]', lang === "ar" ? [/Tajawal-Medium/] : [/Inter/]);
        assert.ok(await menuLink.evaluate(element => { const rect = element.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth; }));
        await page.screenshot({ path: join(output, `navigation-${lang}-${width}.png`), fullPage: true });
        await toggle.press("Escape");
        assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      }
      results.push({ route, lang, width, status: response.status(), reflow: true });
    }
    if (!baseline && width === 1440) {
      await page.goto(origin + "/?lang=" + lang);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => {
        const section = document.createElement("section");
        section.className = "font-probe";
        section.style.cssText = "padding:32px;max-width:960px;margin:auto;background:var(--brand-background);color:var(--brand-text)";
        section.innerHTML = `<p>Font verification specimen — not product content</p>
          <h1 style="font-family:var(--brand-hero);font-size:54px;line-height:1.4"><span id="probe-hero-ar">الذكاء الإنساني</span> <span id="probe-hero-latin">Human Intelligence</span></h1>
          <h2 style="font-family:var(--brand-display);font-size:32px;line-height:1.5"><span id="probe-heading-ar">تطوّرك المهني</span> <span id="probe-heading-latin">Évolution professionnelle</span></h2>
          <p id="probe-signature-mixed" style="font-family:var(--font-signature-arabic);font-size:20px">إبراهيم Ibrahim 2026</p>
          <p id="probe-raw-mixed" style="font-family:var(--brand-body);font-size:22px;line-height:1.8">تعلّم مع Ibrahim — progrès 2026 EUR 19.99</p>
          <p style="font-family:var(--brand-body);font-size:20px"><span id="probe-body-ar">ابدأ التعلّم وتابع تقدّمك</span> <span id="probe-body-latin">Ibrahim · progrès · 0123456789 · EUR 19.99 · qa@example.test · https://example.test</span></p>
          <h2 style="font-family:var(--brand-display);letter-spacing:-.035em"><span id="probe-tracked-ar" class="arabic-script-run">التعلّم</span> <span id="probe-tracked-latin">Professional</span></h2>
          <button id="probe-ui-ar" type="button" style="font-family:var(--brand-ui);font-weight:500;padding:16px">تابع التعلّم</button>
          <input id="probe-input-ar" aria-label="Arabic font input" value="التعلّم" style="font-family:var(--brand-ui);font-size:20px;width:180px">
          <input id="probe-input-latin" aria-label="Latin font input" value="qa@example.test" style="font-family:var(--brand-ui);font-size:20px;width:240px">`;
        document.querySelector("main").replaceChildren(section);
      });
      await page.evaluate(() => document.fonts.ready);
      await rendered("#probe-hero-ar", [/Tajawal-ExtraBold/]);
      await rendered("#probe-hero-latin", [/PlayfairDisplay/]);
      await rendered("#probe-heading-ar", [/Tajawal-Bold/]);
      await rendered("#probe-heading-latin", [/PlayfairDisplay/]);
      await rendered("#probe-body-ar", [/Tajawal-Regular/]);
      const latin = await rendered("#probe-body-latin", [/Inter/]);
      assert.ok(latin.every(font => !/Tajawal/.test(font.postScriptName)));
      await rendered("#probe-raw-mixed", [/Tajawal-Regular/, /Inter/]);
      await rendered("#probe-signature-mixed", [/Tajawal-Regular/, /Inter/]);
      await rendered("#probe-tracked-ar", [/Tajawal-Bold/]);
      assert.equal(await page.locator("#probe-tracked-ar").evaluate(element => getComputedStyle(element).letterSpacing), "normal");
      const latinTracking = await page.locator("#probe-tracked-latin").evaluate(element => getComputedStyle(element).letterSpacing);
      if (lang === "ar") assert.equal(latinTracking, "normal"); // Preserve the existing RTL tracking convention.
      else assert.notEqual(latinTracking, "normal");
      await rendered("#probe-ui-ar", [/Tajawal-Medium/]);
      await rendered("#probe-input-ar", [/Tajawal-Medium/]);
      await rendered("#probe-input-latin", [/Inter/]);
      await page.screenshot({ path: join(output, `specimen-${lang}-1440.png`), fullPage: true });
    }
    await context.close();
    console.log(JSON.stringify({ lang, width, passed: true }));
  }
} finally {
  await writeFile(join(output, "rendered-fonts.json"), JSON.stringify(fonts, null, 2));
  await writeFile(join(output, "ink-metrics.json"), JSON.stringify(inkMetrics, null, 2));
  await writeFile(join(output, "responsive-checks.json"), JSON.stringify(results, null, 2));
  await browser.close();
}
