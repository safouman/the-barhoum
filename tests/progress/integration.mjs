// Run against a fresh, migrated disposable test database and the isolated Phase 4 mail fixture.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";

const origin = process.env.STUDENT_AUTH_ORIGIN;
const database = new URL(process.env.DATABASE_URL_UNPOOLED);
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
assert.equal(database.hostname, "127.0.0.1");
assert.match(database.pathname, /^\/barhoum_phase6_/);
assert.ok(process.env.STUDENT_TEST_MAILBOX);

const studentEmail = "progress-owner@example.invalid";
const otherEmail = "progress-other@example.invalid";
const password = "Course-Progress-Test-Pass!";
const client = new pg.Client({ connectionString: database.href });
await client.connect();

async function request(path, { method = "GET", data, cookie, token, headers = {}, redirect = "manual" } = {}) {
    return fetch(origin + path, {
        method,
        headers: {
            ...(data === undefined ? {} : { "Content-Type": "application/json", Origin: origin }),
            ...(cookie ? { Cookie: cookie } : {}),
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...headers,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
        redirect,
    });
}

async function expect(response, status) {
    assert.equal(response.status, status, (await response.clone().text()).slice(0, 650));
    return response;
}

async function enroll(email) {
    const auth = (action, data) => request("/api/student-auth/" + action, { method: "POST", data });
    await expect(await auth("register", { email }), 202);
    let entry;
    for (let attempt = 0; attempt < 50 && !entry; attempt++) {
        const messages = (await readFile(process.env.STUDENT_TEST_MAILBOX, "utf8").catch(() => "")).trim();
        entry = messages.split("\n").filter(Boolean).map(JSON.parse).find((message) => message.to.includes(email));
        if (!entry) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(entry, "registration message reached the fixture mailbox");
    const url = new URL(entry.text.match(/https?:\/\/[^\s]+/)[0]);
    const token = new URLSearchParams(url.hash.slice(1)).get("token");
    await expect(await auth("verify", { token, name: "Progress Fixture", password }), 200);
    const login = await expect(await auth("login", { email, password }), 200);
    const cookie = login.headers.getSetCookie().find((value) => value.startsWith("barhoum-student=")).split(";")[0];
    const { student } = await (await expect(await request("/api/student-auth/me", { cookie }), 200)).json();
    return { cookie, id: student.id };
}

try {
    await expect(await request("/api/admins/first-register", { method: "POST", data: { email: studentEmail, password } }), 200);
    const adminLogin = await expect(await request("/api/admins/login", { method: "POST", data: { email: studentEmail, password } }), 200);
    const { token } = await adminLogin.json();
    const admin = (path, method, data) => request("/api/" + path, { method, data, token });
    const create = async (path, data) => (await (await expect(await admin(path, "POST", data), 201)).json()).doc;
    const owner = await enroll(studentEmail);
    const other = await enroll(otherEmail);
    const cover = await create("course-covers", { alt: "Fixture", publicURL: "/images/hero.jpeg" });
    const slug = "phase6-progress-fixture";
    const course = await create("courses?draft=true", { title: "Progress fixture", slug, description: "Fixture", cover: cover.id, structure: "modular" });
    const regular = await create("modules", { title: "Regular", course: course.id, classification: "regular", _status: "published" });
    const premium = await create("modules", { title: "Premium", course: course.id, classification: "premium", _status: "published" });

    const lesson = (title, freePreview, reference) => create("lessons", {
        title, course: course.id, freePreview, _status: "published",
        content: [{ blockType: "video", videos: [{ title, provider: "vimeo", reference }] }],
    });
    const free = await lesson("Free", true, "111110");
    const paid = await lesson("Paid base", false, "https://vimeo.com/111120/privatefixturehash");
    const paidSecond = await lesson("Paid second", false, "111121");
    const premiumLesson = await lesson("Paid premium", false, "111130");
    const regularLessons = [{ lesson: free.id }, { lesson: paid.id }, { lesson: paidSecond.id }];
    const modules = [
        { module: regular.id, lessons: regularLessons },
        { module: premium.id, lessons: [{ lesson: premiumLesson.id }] },
    ];
    const publish = (placements) => admin("courses/" + course.id, "PATCH", { _status: "published", modules: placements });
    await expect(await publish(modules), 200);

    const write = (doc, action, session, data, originOverride = origin) => request(
        `/api/learning/progress/${slug}/${doc.id}/${action}`,
        { method: action === "visit" ? "POST" : "PUT", data, cookie: session?.cookie, headers: { Origin: originOverride } },
    );
    const complete = (doc, session, completed, expectedRevision) => write(doc, "completion", session, { completed, expectedRevision });
    const responseJSON = async (response, status = 200) => (await expect(await response, status)).json();
    await expect(await write(free, "visit"), 401);
    await expect(await write(free, "visit", owner, undefined, "https://cross-origin.example.invalid"), 400);
    await expect(await write(free, "visit", owner, {}), 400);
    await expect(await write(free, "completion", owner, { completed: true, expectedRevision: 0, studentId: other.id }), 400);
    await expect(await write(free, "completion", owner, { completed: true, expectedRevision: 0, padding: " ".repeat(2000) }), 400);
    await expect(await complete(paid, owner, true, 0), 404);
    await expect(await write(paid, "resume", owner, { videoId: "111120", seconds: 15, expectedRevision: 0 }), 404);
    const visit = await expect(await write(free, "visit", owner), 200);
    assert.match(visit.headers.get("cache-control"), /private, no-store/);
    assert.ok((await visit.json()).lastVisitedAt);
    const preview = await responseJSON(complete(free, owner, true, 0));
    assert.equal(preview.completion.revision, 1);
    assert.deepEqual(preview.courseProgress.base, { completed: 1, total: 3, percent: 33 });
    assert.equal(preview.courseProgress.firstCompletedAt, null);
    assert.equal(preview.nextUnfinishedLesson, null);
    assert.equal((await responseJSON(complete(free, owner, true, 0))).completion.revision, 1);
    assert.equal((await responseJSON(complete(free, owner, false, 0), 409)).current.completed, true);

    async function grant(moduleId, status = "active") {
        const priceId = moduleId === null ? "price_base" : "price_module";
        await client.query(
            "INSERT INTO course_offers(course_id,module_id,enabled,stripe_price_id) VALUES($1,$2,false,$3) ON CONFLICT DO NOTHING",
            [course.id, moduleId, priceId],
        );
        const { rows: [offer] } = await client.query(
            "SELECT id FROM course_offers WHERE course_id=$1 AND module_id IS NOT DISTINCT FROM $2::integer",
            [course.id, moduleId],
        );
        const id = randomUUID();
        await client.query(`
            INSERT INTO course_orders
            (id, student_id, offer_id, course_id, module_id, stripe_account, livemode, stripe_price_id, amount_minor, currency, checkout_origin, cancel_course_slug, status)
            VALUES ($1,$2,$3,$4,$5,'acct_fixture',false,$6,1000,'eur',$7,$8,'fulfilled')
        `, [id, owner.id, offer.id, course.id, moduleId, priceId, origin, slug]);
        await client.query(`
            INSERT INTO course_entitlements (student_id, course_id, module_id, source_order_id, status)
            VALUES ($1,$2,$3,$4,$5)
        `, [owner.id, course.id, moduleId, id, status]);
        return id;
    }

    await grant(premium.id);
    await expect(await complete(premiumLesson, owner, true, 0), 404);
    const baseGrant = await grant(null);
    await expect(await complete(paid, other, true, 0), 404);
    const results = await Promise.all([
        responseJSON(complete(paid, owner, true, 0)),
        responseJSON(complete(paidSecond, owner, true, 0)),
    ]);
    assert.deepEqual(results.map(result => result.courseProgress.base.completed).sort(), [2, 3]);
    const finished = results.find(result => result.courseProgress.base.percent === 100);
    assert.ok(finished.courseProgress.firstCompletedAt);
    assert.equal(finished.nextUnfinishedLesson.lessonId, premiumLesson.id);
    assert.deepEqual(finished.courseProgress.premiumModules, [{ moduleId: premium.id, title: "Premium", progress: { completed: 0, total: 1, percent: 0 } }]);
    const premiumDone = await responseJSON(complete(premiumLesson, owner, true, 0));
    assert.equal(premiumDone.courseProgress.premiumModules[0].progress.percent, 100);
    assert.equal(premiumDone.nextUnfinishedLesson, null);
    assert.equal(JSON.stringify(premiumDone).includes("privatefixturehash"), false);

    const resume = (session, videoId, seconds, expectedRevision) => write(paid, "resume", session, { videoId, seconds, expectedRevision });
    await expect(await resume(owner, "111110", 15, 0), 404);
    await expect(await resume(owner, "111120", 86401, 0), 400);
    const resumeRace = await Promise.all([resume(owner, "111120", 15, 0), resume(owner, "111120", 20, 0)]);
    assert.deepEqual(resumeRace.map(response => response.status).sort(), [200, 409]);
    const saved = await resumeRace.find(response => response.status === 200).json();
    assert.equal(saved.revision, 1);
    assert.deepEqual((await resumeRace.find(response => response.status === 409).json()).current, saved);
    assert.deepEqual(await responseJSON(resume(owner, "111120", saved.seconds, 0)), saved);
    assert.deepEqual(await responseJSON(resume(owner, "111120", 2, 1)), { videoId: "111120", seconds: 2, revision: 2 });

    const added = await lesson("Added after achievement", false, "111131");
    await expect(await publish([{ module: regular.id, lessons: [...regularLessons, { lesson: added.id }] }, modules[1]]), 200);
    const updated = await responseJSON(complete(paid, owner, false, 1));
    assert.equal(updated.completion.revision, 2);
    assert.deepEqual(updated.courseProgress.base, { completed: 2, total: 4, percent: 50 });
    assert.equal(updated.courseProgress.firstCompletedAt, finished.courseProgress.firstCompletedAt);
    await expect(await admin("lessons/" + paid.id, "PATCH", {
        _status: "published",
        content: [{ blockType: "video", videos: [{ title: "Replacement", provider: "vimeo", reference: "111132" }] }],
    }), 200);
    await expect(await resume(owner, "111120", 5, 2), 404);
    assert.equal((await responseJSON(resume(owner, "111132", 5, 0))).revision, 1);

    await client.query("UPDATE course_entitlements SET status='revoked' WHERE source_order_id=$1", [baseGrant]);
    await expect(await complete(paid, owner, true, 2), 404);
    await expect(await resume(owner, "111132", 10, 1), 404);
    await expect(await write(premiumLesson, "visit", owner), 404);
    await expect(await write(free, "visit", owner), 200);
    await expect(await request(`/courses/${slug}/lessons/${free.id}`), 200);
    await grant(null);
    const restored = await responseJSON(complete(paid, owner, false, 2));
    assert.equal(restored.completion.revision, 2);
    assert.equal(restored.courseProgress.firstCompletedAt, finished.courseProgress.firstCompletedAt);
    assert.equal(restored.courseProgress.premiumModules[0].progress.percent, 100);
    assert.equal((await responseJSON(resume(owner, "111132", 10, 1))).revision, 2);

    const freeSlug = "phase6-free-lifecycle";
    const freeCourse = await create("courses?draft=true", {
        title: "Free lifecycle", slug: freeSlug, description: "Fixture", cover: cover.id, structure: "simple",
    });
    const freeLifecycleLesson = (title) => create("lessons", {
        title, course: freeCourse.id, freePreview: true, _status: "published",
        content: [{ blockType: "video", videos: [{ title, provider: "vimeo", reference: "111110" }] }],
    });
    const kept = await freeLifecycleLesson("Kept");
    const removed = await freeLifecycleLesson("Removed");
    const freePublish = lessons => admin("courses/" + freeCourse.id, "PATCH", {
        _status: "published", lessons: lessons.map(lesson => ({ lesson: lesson.id })),
    });
    const freeComplete = (doc, completed, expectedRevision) => responseJSON(request(
        `/api/learning/progress/${freeSlug}/${doc.id}/completion`,
        { method: "PUT", data: { completed, expectedRevision }, cookie: owner.cookie },
    ));
    await expect(await freePublish([kept, removed]), 200);
    assert.equal((await freeComplete(kept, true, 0)).nextUnfinishedLesson.lessonId, removed.id);
    await expect(await freePublish([kept]), 200);
    const shrink = await freeComplete(kept, true, 1);
    assert.equal(shrink.courseProgress.base.percent, 100);
    assert.equal(shrink.courseProgress.firstCompletedAt, null);
    await freeComplete(kept, false, 1);
    const earned = await freeComplete(kept, true, 2);
    assert.ok(earned.courseProgress.firstCompletedAt);
    await expect(await freePublish([removed, kept]), 200);
    const afterReorder = await freeComplete(kept, true, 3);
    assert.equal(afterReorder.nextUnfinishedLesson.lessonId, removed.id);
    assert.equal(afterReorder.courseProgress.base.percent, 50);
    await expect(await admin("lessons/" + kept.id, "PATCH", { _status: "draft" }), 200);
    assert.equal((await freeComplete(removed, false, 0)).courseProgress.base.total, 1);
    await expect(await admin("lessons/" + kept.id, "PATCH", { _status: "published" }), 200);
    assert.equal((await freeComplete(kept, true, 3)).completion.revision, 3);
    await expect(await admin("lessons/" + kept.id, "DELETE"), 409);
    await expect(await freePublish([removed]), 200);
    await expect(await admin("lessons/" + kept.id, "DELETE"), 200);
    const afterDelete = await freeComplete(removed, false, 0);
    assert.equal(afterDelete.courseProgress.firstCompletedAt, earned.courseProgress.firstCompletedAt);
    const deletedRows = await client.query("SELECT 1 FROM lesson_progress WHERE lesson_id=$1", [kept.id]);
    assert.equal(deletedRows.rowCount, 0);

    const { rows: [counts] } = await client.query(`
        SELECT (SELECT COUNT(*)::int FROM course_achievements WHERE student_id=$1 AND course_id=$2) AS achievements,
               (SELECT COUNT(*)::int FROM lesson_progress WHERE student_id=$3) AS other_student_rows
    `, [owner.id, course.id, other.id]);
    assert.deepEqual(counts, { achievements: 1, other_student_rows: 0 });
    if (process.env.TEST_PROGRESS_ADMIN === "1") {
        const adminCookie = adminLogin.headers.getSetCookie().find(value => value.startsWith("payload-token=")).split(";")[0];
        const progressAdmin = "/admin/student-progress";
        const detail = `${progressAdmin}?student=${owner.id}&course=${course.id}`;
        const search = `${progressAdmin}?q=${encodeURIComponent(otherEmail)}`;
        for (const cookie of [undefined, owner.cookie, `payload-token=${owner.cookie.split("=")[1]}`]) {
            const denied = await request(detail, { cookie });
            assert.ok([302, 303, 307, 308, 401, 403, 404].includes(denied.status), `Admin view unexpectedly returned ${denied.status}`);
            assert.doesNotMatch(await denied.text(), /Orders and access|Purchased premium modules/);
        }
        const adminList = await (await expect(await request(search, { cookie: adminCookie }), 200)).text();
        assert.match(adminList, /Student progress/);
        assert.match(adminList, /progress-other@example\.invalid/);
        assert.doesNotMatch(adminList, /progress-owner@example\.invalid/);
        const adminDetail = await (await expect(await request(detail, { cookie: `${adminCookie}; ${other.cookie}` }), 200)).text();
        assert.match(adminDetail, /Orders and access/);
        assert.match(adminDetail, /Purchased premium modules/);
        assert.doesNotMatch(adminDetail, /privatefixturehash|acct_fixture|price_base/);
        await expect(await write(paid, "visit", { cookie: adminCookie }), 401);
    }
    console.log("Passed progress persistence, replay, concurrent completion/resume, lifecycle, preview, revocation, repurchase and student isolation checks.");
} finally {
    await client.end();
}
