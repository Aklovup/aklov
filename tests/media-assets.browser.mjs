import assert from 'node:assert/strict';
import sharp from 'sharp';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { readProjects } from './project-content.mjs';
import { profile } from '../src/data/about.ts';
const files = readdirSync('public/images', { recursive: true }).filter((p) => !p.startsWith('generated/') && /\.(png|gif|jpe?g)$/i.test(p));
const metadata = await Promise.all(files.map(async (file) => {
  const bytes = readFileSync('public/images/' + file);
  const info = await sharp(bytes, { animated: false }).metadata();
  return { url: '/images/' + file, width: info.width, height: info.pageHeight || info.height, type: info.format === 'gif' ? 'gif' : 'image', bytes: bytes.length };
}));
const projects = readProjects();
const indexed = new Map(metadata.map(item => [item.url, item]));
for (const project of projects) {
  for (const item of [project.cover, ...project.media].filter(item => item.url)) {
    const actual = indexed.get(item.url);
    assert.ok(actual, 'Missing local file: ' + item.url);
    assert.deepEqual([item.width, item.height, item.type], [actual.width, actual.height, actual.type], item.id);
    assert.ok(item.alt.trim(), item.id);
  }
}
assert.equal(projects.find(p => p.slug === 'xans-operations-portal').media.length, 4);
assert.equal(projects.flatMap(p => p.media).filter(item => item.url).length, 17);
assert.ok(indexed.size >= 17);
assert.ok(indexed.has(profile.portrait.src));
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
  await page.goto(base + '/work/');
  for (const project of projects.filter(p => p.cover.url)) {
    const card = page.locator('[data-project="' + project.slug + '"]');
    await card.scrollIntoViewIfNeeded();
    const media = card.locator(project.cover.type === 'gif' ? '[data-gif-poster]' : '.project-media > img');
    await media.waitFor({state:'visible'});
    assert.deepEqual(await media.evaluate(el => [getComputedStyle(el).objectFit, getComputedStyle(el).objectPosition]), ['cover','50% 0%']);
    for (const width of [1440,390]) {
      await page.setViewportSize({width,height:1000});
      await card.screenshot({path:'artifacts/media-review/card-' + project.slug + '-' + width + '.png'});
    }
  }
  for (const project of projects.filter(p => p.cover.url)) {
    await page.goto(base + '/work/?project=' + project.slug);
    const dialog = page.locator('dialog');
    await dialog.waitFor({state: 'visible'});
    assert.equal(await dialog.locator('.media-item').count(), project.media.filter(item => item.url).length);
    for (const item of project.media.filter(item => item.url)) {
      const figure = dialog.locator('[data-media-id="' + item.id + '"]');
      await figure.scrollIntoViewIfNeeded();
      if (item.type === 'gif') {
        await figure.locator('[data-gif-poster]').waitFor({state: 'visible'});
        assert.equal(await figure.locator('[data-playing-gif]').count(), 0);
        assert.equal(await figure.locator('[data-gif-poster]').evaluate(el => getComputedStyle(el).objectFit), 'contain');
        await figure.getByRole('button', {name:'Play GIF',exact:true}).click();
        await figure.locator('[data-playing-gif]').evaluate(img => img.decode());
        await figure.getByRole('button', {name:'Pause GIF',exact:true}).click();
        await figure.locator('canvas[data-gif-still]').waitFor({state:'visible'});
      } else {
        await figure.locator('img').evaluate(img => img.decode());
        assert.equal(await figure.locator('img').evaluate(el => getComputedStyle(el).objectFit), 'contain');
      }
    }
    for (const width of [1440,390]) {
      await page.setViewportSize({width,height:1000});
      await dialog.locator('.detail-layout').scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), project.slug);
      await dialog.screenshot({path:'artifacts/media-review/' + project.slug + '-' + width + '.png'});
    }
    await page.keyboard.press('Escape');
  }
  await page.goto(base + '/about/');
  const portrait = page.locator('[data-about-portrait] img');
  await portrait.evaluate(img => img.decode());
  assert.ok((await portrait.getAttribute('src')).startsWith('/images/portraits/'));
  for (const width of [1440,1001,1000,768,390,320]) {
    await page.setViewportSize({width,height:1000});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'About at ' + width);
    const frame = page.locator('.portrait-frame');
    assert.equal(await frame.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(216, 189, 120)');
    assert.equal(await portrait.evaluate(el => getComputedStyle(el).maskImage), 'none');
    const name = page.locator('.portrait-frame .portrait-name');
    const frameBox = await frame.boundingBox(), nameBox = await name.boundingBox();
    assert.ok(nameBox.x >= frameBox.x && nameBox.x + nameBox.width <= frameBox.x + frameBox.width + 1);
    assert.ok(nameBox.y >= frameBox.y && nameBox.y + nameBox.height <= frameBox.y + frameBox.height + 1);
    const fillContour = await page.locator('.signature-fill').getAttribute('d');
    const edgeContour = await page.locator('.signature-edge').getAttribute('d');
    assert.ok(fillContour.startsWith(edgeContour), 'Gold edge must follow the same continuous ivory contour.');
    if (width === 1440 || width === 390) await page.screenshot({path:'artifacts/media-review/about-' + width + '.png'});
  }
  console.log('Passed: uploaded GIF/PNG/JPEG files, exact dimensions/types, 17 project media items, XANS four-item gallery, paused GIF playback, About portrait and responsive media.');
} finally { await browser?.close(); server.kill('SIGTERM'); }

