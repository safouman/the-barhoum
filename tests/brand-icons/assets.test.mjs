import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
const manifest = JSON.parse(await readFile(new URL('../../public/images/brand-icons/source.json', import.meta.url), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
test('All ten approved artwork files retain their extracted bytes and native dimensions', async () => {
  assert.equal(manifest.icons.length, 10);
  assert.equal(new Set(manifest.icons.map(icon => icon.name)).size, 10);
  for (const icon of manifest.icons) {
    const bytes = await readFile(new URL('../../public' + icon.src, import.meta.url));
    assert.equal(hash(bytes), icon.sha256, icon.name);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), icon.width);
    assert.equal(bytes.readUInt32BE(20), icon.height);
    assert.equal(icon.crop[2] - icon.crop[0], icon.width);
    assert.equal(icon.crop[3] - icon.crop[1], icon.height);
  }
});
