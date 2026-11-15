import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const latin = JSON.parse(await readFile(new URL("../../public/fonts/brand-latin/source.json", import.meta.url)));
for (const face of latin.faces) {
  assert.match(face.localURL, /^\/fonts\/brand-latin\/[a-z0-9-]+\.woff2$/);
  const bytes = await readFile(new URL("../../public" + face.localURL, import.meta.url));
  assert.equal(bytes.subarray(0, 4).toString(), "wOF2");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), face.hash);
}
const arabic = JSON.parse(await readFile(new URL("../../lib/fonts/tajawal-source.json", import.meta.url)));
assert.deepEqual(arabic.faces.map(face => face.weight), [400, 500, 700, 800]);
for (const face of arabic.faces) {
  const bytes = await readFile(new URL("../../lib/fonts/" + face.file, import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), face.sha256);
}
console.log("PASS pinned Latin binaries and four Tajawal weights match recorded SHA-256 sources.");
