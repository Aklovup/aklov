import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { readProjects } from './project-content.mjs';
const project = readProjects().find((item) => item.slug === 'impex-automotive');
const homepage = project.media.find((item) => item.id === 'impex-homepage');
const bytes = readFileSync(new URL('../public' + homepage.url, import.meta.url));
assert.match(bytes.subarray(0, 6).toString(), /^GIF8[79]a$/);
const width = bytes.readUInt16LE(6), height = bytes.readUInt16LE(8);
console.log('Uploaded Impex GIF dimensions:', width, height, 'bytes:', bytes.length);
assert.equal(project.cover.url, homepage.url);
assert.equal(project.cover.width, width, 'Cover width must match uploaded GIF.');
assert.equal(project.cover.height, height, 'Cover height must match uploaded GIF.');
assert.equal(homepage.width, width);
assert.equal(homepage.height, height);
assert.equal(project.media.filter((item) => item.url).length, 1);
const base = 'http://127.0.0.1:4331';
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4331'], { stdio: 'inherit' });
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + '/work/')).ok) break; } catch {}
    if (i === 99) throw new Error('Preview not ready.');
    await new Promise((r) => setTimeout(r, 100));
  }
  const response = await fetch(base + homepage.url);
  assert.ok(response.ok);
  assert.match(response.headers.get('content-type'), /image\/gif/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes, 'Pages build changed the source GIF.');
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(base + '/work/');
  const card = page.locator('[data-project="impex-automotive"]');
  assert.equal(await card.locator('.media-placeholder').count(), 0);
  await card.scrollIntoViewIfNeeded();
  await card.locator('[data-gif-still]').waitFor({ state: 'visible' });
  assert.equal(await card.locator('[data-playing-gif]').count(), 0, 'GIF played automatically.');
  assert.equal(await card.locator('[data-gif-toggle]').innerText(), 'Play GIF');
  assert.deepEqual(await card.locator('[data-gif-still]').evaluate((canvas) => [canvas.width, canvas.height]), [width, height]);
  const initialFrame = await card.locator('[data-gif-still]').evaluate((canvas) => canvas.toDataURL());
  await page.waitForTimeout(250);
  assert.equal(await card.locator('[data-gif-still]').evaluate((canvas) => canvas.toDataURL()), initialFrame, 'Initial frame was moving.');
  assert.equal(await page.locator('dialog').isVisible(), false, 'GIF control opened the popup.');
  mkdirSync('artifacts/impex-review', { recursive: true });
  for (const [name, viewportWidth] of [['desktop', 1440], ['mobile', 390], ['narrow-mobile', 320]]) {
    await page.setViewportSize({ width: viewportWidth, height: 1000 });
    const box = await card.locator('[data-gif-still]').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= viewportWidth + 1, 'GIF exceeds viewport at ' + viewportWidth + 'px: ' + JSON.stringify(box));
    await card.screenshot({ path: 'artifacts/impex-review/card-' + name + '.png' });
  }
  await card.getByRole('button', { name: 'Play GIF', exact: true }).click();
  await card.locator('[data-playing-gif]').evaluate((img) => img.decode());
  await card.getByRole('button', { name: 'Pause GIF', exact: true }).click();
  await card.locator('[data-gif-still]').waitFor({ state: 'visible' });
  assert.equal(await card.locator('[data-playing-gif]').count(), 0);
  assert.ok(await card.locator('[data-gif-still]').evaluate((canvas) => canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)));
  await card.getByRole('button', { name: 'Play GIF', exact: true }).click();
  await card.locator('[data-playing-gif]').evaluate((img) => img.decode());
  assert.equal(await card.locator('[data-gif-still]').count(), 0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await card.locator('[data-project-open]').click();
  const dialog = page.locator('dialog');
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await dialog.locator('[data-media-id="impex-homepage"]').count(), 1);
  assert.equal(await dialog.locator('.pending-media li').count(), 2);
  await dialog.locator('[data-gif-still]').waitFor({ state: 'visible' });
  assert.equal(await dialog.locator('[data-playing-gif]').count(), 0, 'Popup GIF played automatically.');
  assert.equal(await dialog.locator('[data-gif-toggle]').innerText(), 'Play GIF');
  await dialog.getByRole('button', { name: 'Play GIF', exact: true }).click();
  await dialog.locator('[data-playing-gif]').evaluate((img) => img.decode());
  assert.equal(await dialog.locator('[data-playing-gif]').evaluate((img) => img.naturalWidth), width);
  await dialog.screenshot({ path: 'artifacts/impex-review/popup-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.screenshot({ path: 'artifacts/impex-review/popup-mobile.png' });
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base + '/work/');
  await card.scrollIntoViewIfNeeded();
  await card.locator('[data-gif-still]').waitFor({ state: 'visible' });
  assert.equal(await card.locator('[data-playing-gif]').count(), 0);
  console.log('Passed: original local GIF bytes/MIME/dimensions, shared card/popup source, visible and stable initial frame without autoplay, explicit play/pause, reduced-motion still frame, responsive fit and two remaining pending media items.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
