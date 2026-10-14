import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const files = readdirSync('public/images', { recursive: true }).filter((p) => /\.(png|gif)$/i.test(p));
const metadata = files.map((file) => {
  const bytes = readFileSync('public/images/' + file);
  const gif = /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString());
  return { url: '/images/' + file, width: gif ? bytes.readUInt16LE(6) : bytes.readUInt32BE(16), height: gif ? bytes.readUInt16LE(8) : bytes.readUInt32BE(20), type: gif ? 'gif' : 'image', bytes: bytes.length };
});
console.log('ASSET_METADATA', JSON.stringify(metadata));
mkdirSync('artifacts/media-review', { recursive: true });
writeFileSync('artifacts/media-review/metadata.json', JSON.stringify(metadata, null, 2));
const base = 'http://127.0.0.1:4332';
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4332'], { stdio: 'inherit' });
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + '/work/')).ok) break; } catch {}
    if (i === 99) throw new Error('Preview not ready.');
    await new Promise(r => setTimeout(r, 100));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  for (const item of metadata) {
    const response = await page.goto(base + item.url);
    assert.ok(response.ok(), item.url);
    const image = page.locator('img');
    await image.evaluate(img => img.decode());
    assert.deepEqual(await image.evaluate(img => [img.naturalWidth, img.naturalHeight]), [item.width, item.height]);
    await page.screenshot({path: 'artifacts/media-review/' + item.url.split('/').pop() + '.png', fullPage: true});
  }
} finally { await browser?.close(); server.kill('SIGTERM'); }
