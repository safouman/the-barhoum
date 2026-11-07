// Start local Next, then run with Playwright installed separately.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs BROWSER_CHANNEL=chrome node tests/phase6-learning.browser.mjs
import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const origin = process.env.LEARNING_TEST_ORIGIN ?? "http://127.0.0.1:4373";
assert.match(origin, /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/);
const paths = {
  lesson: new URL("../app/(site)/phase-6-lesson-browser-test/", import.meta.url),
  library: new URL("../app/(phase6-browser-test)/", import.meta.url),
};
const screenshotDir = process.env.LEARNING_TEST_SCREENSHOTS;
const mockPoster = (await readFile(new URL("../public/images/hero.jpeg", import.meta.url))).toString("base64");
const created = [];
let browser;

try {
  for (const path of Object.values(paths)) {
    await mkdir(path);
    created.push(path);
    const route = path === paths.library ? new URL("phase-6-library-browser-test/", path) : path;
    if (path === paths.library) {
      await mkdir(route);
      await writeFile(new URL("layout.tsx", path), `
        import { Inter } from "next/font/google";
        import { StudentFrame } from "@/components/learning/StudentFrame";
        import "../../styles/globals.css";
        const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });
        export default function FixtureLayout({ children }: { children: React.ReactNode }) {
          return <StudentFrame signedIn brandLabel="Rebirth" fontClassName={inter.variable}>{children}</StudentFrame>;
        }
      `, { flag: "wx" });
    }
    await writeFile(new URL("page.tsx", route), 'export { default } from "../../../tests/phase6-learning.fixture";\n', { flag: "wx" });
  }
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL });

  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, isMobile: width < 768, hasTouch: width < 768 });
    await context.addCookies([{ name: "barhoum_consent", value: "rejected", url: origin }]);
    const page = await context.newPage();
    const writes = [];
    let completionMode = "success";
    let resumeMode = "conflict";
    const fixture = (view) => page.goto(`${origin}/phase-6-${view === "library" || view === "empty" ? "library" : "lesson"}-browser-test?view=${view}`);
    const button = (name) => page.getByRole("button", { name, exact: true });
    const screenshot = async (name) => {
      if (screenshotDir && width !== 320) {
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
        await page.screenshot({ path: join(screenshotDir, `${name}-${width}.png`), fullPage: true });
      }
    };
    const assertNoOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), await page.evaluate(() => innerWidth));
    await page.route("**/api/learning/progress/**", (route) => {
      const request = route.request();
      const [lessonId, action] = new URL(request.url()).pathname.split("/").slice(-2);
      writes.push({ lessonId, action, data: request.postDataJSON() });
      if (action === "visit") {
        assert.equal(request.method(), "POST");
        return route.fulfill({ json: {} });
      }
      if (action === "resume") {
        const { expectedRevision, ...data } = request.postDataJSON();
        if (resumeMode === "conflict") {
          resumeMode = "success";
          return route.fulfill({ status: 409, json: { current: { videoId: "76979871", seconds: 53, revision: 2 } } });
        }
        return route.fulfill({ json: { ...data, revision: expectedRevision + 1 } });
      }
      const { completed, expectedRevision } = request.postDataJSON();
      assert.equal(request.method(), "PUT");
      if (completionMode === "unavailable") return route.fulfill({ status: 503, json: {} });
      if (completionMode === "conflict") return route.fulfill({ status: 409, json: { current: { completed: true, completedAt: "2026-11-07T15:00:00Z", revision: 3 } } });
      return route.fulfill({ json: {
        completion: { completed, completedAt: completed ? "2026-11-07T15:00:00Z" : null, revision: expectedRevision + 1 },
        nextUnfinishedLesson: completed ? { lessonId: 3, title: "Your daily practice worksheet", href: "/phase-6-lesson-browser-test?view=pdf" } : null,
      } });
    });

    if (!process.env.LEARNING_TEST_REAL_VIMEO) {
      // Stub Vimeo's iframe messaging protocol. Real playback is verified on Preview.
      await page.route("https://player.vimeo.com/video/**", (route) => route.fulfill({ contentType: "text/html", body: `
        <style>
          body{margin:0;background:#14312e url("data:image/jpeg;base64,${mockPoster}") center 42%/cover no-repeat;color:#fff;height:100vh;font:14px system-ui}
          .controls{position:absolute;inset:auto 0 0;background:linear-gradient(transparent,#081918 85%);display:flex;align-items:center;gap:12px;padding:28px 14px 12px}
          button{font:inherit;background:#17332f;color:white;border:1px solid #7e9692;border-radius:6px;padding:6px 13px;cursor:pointer}
          .line{height:3px;flex:1;background:#a9b4b2;border-radius:4px}
        </style>
        <div class="controls"><button type="button" aria-label="Play practice video" disabled onclick="playPractice()">▶</button><span>0:32</span><div class="line"></div><span>2:30</span></div>
        <script>
          const send = message => parent.postMessage(message, "*");
          addEventListener("load", () => send({ event: "ready" }));
          const emit = (event, seconds) => send({ event, data: { seconds, duration: 150 } });
          let played = false;
          function playPractice() {
            if (played) emit("pause", 42);
            else {
              emit("play", 0);
              emit("playing", 0);
            }
            played = true;
          }
          addEventListener("message", event => {
            const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
            if (data.method === "addEventListener" && data.value === "pause") document.querySelector("button").disabled = false;
            if (data.method === "getDuration") send({ method: "getDuration", value: 150 });
            else if (data.method === "getPaused") send({ method: "getPaused", value: true });
            else if (data.method === "setCurrentTime") {
              send({ method: "setCurrentTime", value: data.value });
              emit("pause", data.value + 1);
            } else send({ method: data.method, value: data.value });
          });
        </script>` }));
    }

    await fixture("library");
    const banner = page.getByRole("banner");
    if (width < 768) await banner.getByRole("button", { name: "Menu" }).click();
    await banner.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Account" }).waitFor();
    if (width < 768) await banner.getByRole("button", { name: "Menu" }).press("Escape");
    const owned = page.getByRole("list", { name: "Owned courses" });
    await owned.getByRole("progressbar", { name: "Course progress" }).first().waitFor();
    assert.equal(await owned.getByRole("progressbar", { name: "Advanced practice" }).getAttribute("aria-valuenow"), "0");
    await owned.getByText("Course completed", { exact: true }).waitFor();
    await assertNoOverflow();
    await screenshot("01-library");
    const visit = page.waitForResponse((response) => response.url().endsWith("/visit") && response.ok());
    await owned.getByRole("link", { name: "Continue learning" }).click();
    await visit;
    await page.getByRole("heading", { name: "Make room for focus" }).waitFor();
    await assertNoOverflow();
    if (process.env.LEARNING_TEST_REAL_VIMEO) await page.frameLocator("iframe[src*=vimeo]").getByRole("button", { name: /^play/i }).first().waitFor({ timeout: 15_000 });
    await screenshot("02-video-lesson");

    if (width !== 1440) {
      const disclosure = page.locator("summary").filter({ hasText: "Course curriculum" }).first();
      await disclosure.focus();
      assert.equal(await disclosure.evaluate((item) => item.matches(":focus-visible")), true);
      await disclosure.press("Enter");
      await page.getByRole("navigation", { name: "Course curriculum", exact: true }).getByRole("link", { name: /Begin with one small action/ }).waitFor();
      await screenshot("03-mobile-curriculum");
      await disclosure.press("Enter");
    }

    assert.equal(writes.filter(({ action }) => action === "visit").length, 1);
    if (!process.env.LEARNING_TEST_REAL_VIMEO) {
      const resume = button("Resume at 0:32");
      await resume.waitFor();
      const conflict = page.waitForResponse((response) => response.url().endsWith("/resume") && response.status() === 409);
      await resume.click();
      const frame = page.locator('iframe[src*="player.vimeo.com"]');
      await frame.waitFor();
      const resumeUrl = new URL(await frame.getAttribute("src"));
      assert.equal(resumeUrl.hash, "#t=32s");
      assert.equal(resumeUrl.searchParams.get("autoplay"), "1");
      assert.match(await frame.getAttribute("allow"), /autoplay/);
      const play = page.frameLocator("iframe").getByRole("button", { name: "Play practice video" });
      assert.equal(await play.evaluate(() => location.hash), "#t=32s");
      await play.click({ timeout: 8_000 });
      await conflict;
      assert.equal(writes.find(({ action }) => action === "resume")?.data.seconds, 33);
      const nextSave = page.waitForResponse((response) => response.url().endsWith("/resume") && response.ok());
      await page.frameLocator("iframe").getByRole("button", { name: "Play practice video" }).click();
      await nextSave;
      assert.deepEqual(writes.filter(({ action }) => action === "resume").map(({ data }) => data.expectedRevision), [1, 2]);
    }

    completionMode = "unavailable";
    await button("Complete & Continue").click();
    await page.getByRole("status").filter({ hasText: "Progress could not be saved" }).waitFor();
    completionMode = "success";
    await button("Complete & Continue").click();
    await page.waitForURL("**?view=pdf");
    await page.getByRole("link", { name: "Daily practice worksheet (PDF)" }).waitFor();
    assert.ok(await page.getByRole("link", { name: "Daily practice worksheet (PDF)" }).getAttribute("download") !== null);
    await assertNoOverflow();
    await screenshot("04-pdf-lesson");

    for (const view of ["text", "mixed", "locked", "free", "completed", "empty", "anonymous"]) {
      const freeWrites = writes.filter(({ lessonId }) => lessonId === "1").length;
      await fixture(view);
      await assertNoOverflow();
      if (view === "locked") {
        await page.getByRole("heading", { name: "This lesson is locked" }).waitFor();
        assert.equal(await page.locator("iframe[src*=vimeo]").count(), 0);
        assert.equal(await page.locator('a[href*="/api/lesson-downloads"]').count(), 0);
      }
      if (view === "anonymous") {
        await page.locator("iframe[src*=vimeo]").waitFor();
        assert.equal(await button("Complete & Continue").count(), 0);
      }
      if (view === "locked") assert.equal(writes.filter(({ lessonId }) => lessonId === "5").length, 0);
      if (view === "anonymous") assert.equal(writes.filter(({ lessonId }) => lessonId === "1").length, freeWrites);
      if (view === "free") {
        await button("Complete & Continue").waitFor();
        await page.waitForFunction(() => performance.getEntriesByType("resource").some(({ name }) => name.endsWith("/1/visit")));
      }
      if (view === "completed") await button("Mark incomplete").waitFor();
      if (view === "empty") await page.getByRole("link", { name: "Browse Courses" }).waitFor();
      await screenshot(`05-${view}`);
    }

    await fixture("completed");
    await button("Mark incomplete").click();
    await page.getByRole("status").filter({ hasText: "Lesson marked incomplete" }).waitFor();
    completionMode = "conflict";
    await button("Complete & Continue").click();
    await page.getByRole("status").filter({ hasText: "Your latest progress is shown" }).waitFor();
    await button("Mark incomplete").waitFor();
    await context.close();
    console.log(`Phase 6 learning presentation passed at ${width}px`);
  }
} finally {
  await browser?.close();
  await Promise.all(created.map((path) => rm(path, { recursive: true, force: true })));
}
