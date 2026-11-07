// Run against a fresh, migrated local database and the isolated Phase 4 mail fixture.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";

const origin = process.env.STUDENT_AUTH_ORIGIN;
const database = new URL(process.env.DATABASE_URL_UNPOOLED);
assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
assert.equal(database.hostname, "127.0.0.1");
assert.match(database.pathname, /^\/barhoum_phase5_/);
assert.ok(process.env.STUDENT_TEST_MAILBOX);

const studentEmail = "paid-student@example.invalid";
const otherEmail = "unowned-student@example.invalid";
const password = "Course-Security-Test-Pass!";
const client = new pg.Client({ connectionString: database.href });
await client.connect();

function fixturePDF() {
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] >>",
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = objects.map((object, index) => {
        const offset = pdf.length;
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
        return offset;
    });
    const startXref = pdf.length;
    const entries = offsets.map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
    return pdf + `xref\n0 4\n0000000000 65535 f \n${entries}trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
}

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
    await expect(await auth("verify", { token, name: "Course Security Fixture", password }), 200);
    const login = await expect(await auth("login", { email, password }), 200);
    const cookie = login.headers.getSetCookie().find((value) => value.startsWith("barhoum-student=")).split(";")[0];
    const { student } = await (await expect(await request("/api/student-auth/me", { cookie }), 200)).json();
    return { cookie, id: student.id };
}

try {
    await expect(await request("/api/admins/first-register", { method: "POST", data: { email: studentEmail, password } }), 200);
    const login = await expect(await request("/api/admins/login", { method: "POST", data: { email: studentEmail, password } }), 200);
    const { token } = await login.json();
    const admin = (path, method, data) => request("/api/" + path, { method, data, token });
    const create = async (path, data) => (await (await expect(await admin(path, "POST", data), 201)).json()).doc;
    const owner = await enroll(studentEmail);
    const other = await enroll(otherEmail);
    const cover = await create("course-covers", { alt: "Fixture", publicURL: "/images/hero.jpeg" });
    const slug = "phase5-course-security-fixture";
    const course = await create("courses?draft=true", { title: "Security fixture", slug, description: "Fixture", cover: cover.id, structure: "modular" });
    const regular = await create("modules", { title: "Regular", course: course.id, classification: "regular", _status: "published" });
    const premium = await create("modules", { title: "Premium", course: course.id, classification: "premium", _status: "published" });

    async function upload(name) {
        const form = new FormData();
        form.set("_payload", "{}");
        form.set("file", new Blob([fixturePDF()], { type: "application/pdf" }), name);
        const response = await expect(await fetch(origin + "/api/lesson-files", {
            method: "POST", body: form, headers: { Authorization: "Bearer " + token },
        }), 201);
        return (await response.json()).doc;
    }
    const freeFile = await upload("phase5-free.pdf");
    const regularFile = await upload("phase5-regular.pdf");
    const premiumFile = await upload("phase5-premium.pdf");

    async function lesson(title, freePreview, file, reference) {
        return create("lessons", {
            title, course: course.id, freePreview, _status: "published",
            content: [
                { blockType: "video", videos: [{ title, provider: "vimeo", reference }] },
                { blockType: "resources", items: [{ blockType: "download", label: title + " file", file: file.id }] },
            ],
        });
    }
    const free = await lesson("Free", true, freeFile, "111110");
    const baseLesson = await lesson("Paid base", false, regularFile, "https://vimeo.com/111120/secretbasehash");
    const premiumLesson = await lesson("Paid premium", false, premiumFile, "https://vimeo.com/111130/secretpremiumhash");

    const modules = [
        { module: regular.id, lessons: [{ lesson: free.id }, { lesson: baseLesson.id }] },
        { module: premium.id, lessons: [{ lesson: premiumLesson.id }] },
    ];
    await expect(await admin("courses/" + course.id, "PATCH", { _status: "published", modules }), 200);
    const lessonPath = (doc) => "/courses/" + slug + "/lessons/" + doc.id;
    const filePath = (doc, file) => "/api/lesson-downloads/" + slug + "/" + doc.id + "/" + file.id;
    const readLesson = async (doc, session) => (await expect(await request(lessonPath(doc), { cookie: session?.cookie }), 200)).text();

    assert.match(await readLesson(free), /player\.vimeo\.com\/video\/111110/);
    assert.doesNotMatch(await readLesson(baseLesson), /111120|secretbasehash|Paid base file/);
    assert.doesNotMatch(await readLesson(premiumLesson, other), /111130|secretpremiumhash|Paid premium file/);
    const flight = await expect(await request(lessonPath(baseLesson), { headers: { RSC: "1" }, redirect: "follow" }), 200);
    assert.match(flight.headers.get("content-type"), /text\/x-component/);
    assert.doesNotMatch(await flight.text(), /111120|secretbasehash|Paid base file/);
    await expect(await request(filePath(free, freeFile)), 200);
    await expect(await request(filePath(baseLesson, regularFile)), 404);

    async function grant(moduleId) {
        const priceId = moduleId === null ? "price_base" : "price_module";
        const { rows: [offer] } = await client.query(
            "INSERT INTO course_offers(course_id,module_id,enabled,stripe_price_id) VALUES($1,$2,false,$3) RETURNING id",
            [course.id, moduleId, priceId],
        );
        const id = randomUUID();
        await client.query(`
            INSERT INTO course_orders
            (id, student_id, offer_id, course_id, module_id, stripe_account, livemode, stripe_price_id, amount_minor, currency, checkout_origin, cancel_course_slug, status)
            VALUES ($1,$2,$3,$4,$5,'acct_fixture',false,$6,1000,'eur',$7,$8,'fulfilled')
        `, [id, owner.id, offer.id, course.id, moduleId, priceId, origin, slug]);
        await client.query(`
            INSERT INTO course_entitlements (student_id, course_id, module_id, source_order_id, status)
            VALUES ($1,$2,$3,$4,'active')
        `, [owner.id, course.id, moduleId, id]);
        return id;
    }

    await grant(premium.id);
    assert.doesNotMatch(await readLesson(premiumLesson, owner), /secretpremiumhash/);
    await expect(await request(filePath(premiumLesson, premiumFile), { cookie: owner.cookie }), 404);
    const baseGrant = await grant(null);
    assert.match(await readLesson(baseLesson, owner), /secretbasehash/);
    assert.match(await readLesson(premiumLesson, owner), /secretpremiumhash/);
    const ownedPage = await expect(await request(lessonPath(premiumLesson), { cookie: owner.cookie }), 200);
    assert.match(ownedPage.headers.get("cache-control"), /no-store/);
    await client.query("UPDATE course_entitlements SET status='suspended' WHERE student_id=$1 AND module_id=$2", [owner.id, premium.id]);
    assert.match(await readLesson(baseLesson, owner), /secretbasehash/);
    assert.doesNotMatch(await readLesson(premiumLesson, owner), /secretpremiumhash/);
    await client.query("UPDATE course_entitlements SET status='active' WHERE student_id=$1 AND module_id=$2", [owner.id, premium.id]);
    assert.doesNotMatch(await readLesson(baseLesson, other), /secretbasehash/);
    const pdf = await expect(await request(filePath(baseLesson, regularFile), { cookie: owner.cookie }), 200);
    assert.equal(pdf.headers.get("cache-control"), "private, no-store");
    await expect(await request(filePath(baseLesson, premiumFile), { cookie: owner.cookie }), 404);
    await expect(await request(filePath(premiumLesson, premiumFile), { cookie: other.cookie }), 404);
    await expect(await request("/api/lesson-files/file/" + premiumFile.filename, { cookie: owner.cookie }), 403);
    await expect(await request("/api/lesson-files/file/" + premiumFile.filename, { token }), 200);
    const rawStudentJwt = owner.cookie.split("=")[1];
    await expect(await request("/api/lessons?depth=2", { token: rawStudentJwt }), 403);
    await expect(await request("/api/lessons/versions", { token: rawStudentJwt }), 403);

    await expect(await admin("courses/" + course.id + "?draft=true", "PATCH", { description: "New draft" }), 200);
    await expect(await admin("courses/" + course.id, "PATCH", { _status: "draft" }), 409);
    await expect(await admin("modules/" + premium.id, "PATCH", { classification: "regular", _status: "published" }), 409);
    await expect(await admin("lessons/" + baseLesson.id, "PATCH", { _status: "draft" }), 409);
    await expect(await admin("lessons/" + baseLesson.id, "PATCH", { _status: "published", freePreview: true }), 409);
    await expect(await admin("courses/" + course.id, "PATCH", { modules: modules.slice(0, 1), _status: "published" }), 409);
    await expect(await admin("lessons/" + free.id, "PATCH", {
        _status: "published",
        content: [{ blockType: "resources", items: [{ blockType: "download", label: "Shared paid asset", file: premiumFile.id }] }],
    }), 409);
    await expect(await admin("lessons/" + baseLesson.id, "PATCH", {
        _status: "published",
        content: [{ blockType: "resources", items: [{ blockType: "link", label: "Permanent external asset", url: "https://example.invalid/file" }] }],
    }), 409);
    await expect(await admin("courses/" + course.id, "PATCH", { modules: [...modules].reverse(), _status: "published" }), 200);

    await client.query("UPDATE course_entitlements SET status='revoked' WHERE source_order_id=$1", [baseGrant]);
    assert.doesNotMatch(await readLesson(premiumLesson, owner), /secretpremiumhash/);
    await expect(await request(filePath(premiumLesson, premiumFile), { cookie: owner.cookie }), 404);
    await client.query("UPDATE course_entitlements SET status='active' WHERE source_order_id=$1", [baseGrant]);
    await expect(await request(filePath(premiumLesson, premiumFile), { cookie: owner.cookie }), 200);

    await client.query("UPDATE lessons_blocks_download SET file_id=$1 WHERE _parent_id=$2", [premiumFile.id, free.id]);
    assert.doesNotMatch(await readLesson(free), new RegExp("lesson-downloads/" + slug + "/" + free.id + "/" + premiumFile.id));
    await expect(await request(filePath(free, premiumFile)), 404);
    console.log("Passed free/paid/premium delivery, scope isolation, revocation, lifecycle and historical attachment checks.");
} finally {
    await client.end();
}
