import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4321';
const output = 'artifacts/work-review';
const counts = { all: 10, websites: 5, 'customer-systems': 2, automation: 5, applications: 2, integrations: 6 };
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4321'], { stdio: 'inherit' });
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(base + '/work/')).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Astro preview did not become ready.');
}

async function checkFilter(page, filter, count) {
  await page.waitForFunction(({ filter, count }) =>
    document.querySelectorAll('[data-project]:not([hidden])').length === count
    && document.querySelector('[data-filter="' + filter + '"]').getAttribute('aria-pressed') === 'true',
  { filter, count });
  assert.equal(await page.locator('[data-filter][aria-pressed="true"]').count(), 1);
}

async function checkOverflow(page) {
  const overflow = await page.evaluate(() => [...document.querySelectorAll(
    '.work-intro .wrap, .intro-composition, .intro-note, .filters, .filters button, .project-card, .project-media, .card-copy, .nav'
  )].filter((el) => {
    if (!el.getClientRects().length) return false;
    const rect = el.getBoundingClientRect();
    return rect.left < -1 || rect.right > innerWidth + 1;
  }).map((el) => el.className));
  assert.deepEqual(overflow, [], 'Content overflows viewport: ' + overflow.join(', '));
}

try {
  await waitForServer();
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const [filter, count] of Object.entries(counts)) {
    await page.goto(base + '/work/' + (filter === 'all' ? '' : '?category=' + filter));
    await checkFilter(page, filter, count);
  }
  await page.goto(base + '/work/?category=unknown');
  await checkFilter(page, 'all', 10);
  await page.goto(base + '/work/?source=review#projects');
  await checkFilter(page, 'all', 10);
  await page.evaluate(() => { window.phaseOneMarker = 'same-document'; });
  for (const [filter, count] of Object.entries(counts)) {
    await page.locator('[data-filter="' + filter + '"]').click();
    await checkFilter(page, filter, count);
    assert.equal(await page.evaluate(() => window.phaseOneMarker), 'same-document', 'Filter reloaded the page.');
    assert.equal(new URL(page.url()).searchParams.get('source'), 'review');
    assert.equal(new URL(page.url()).hash, '#projects');
  }
  await page.locator('[data-filter="websites"]').click();
  await page.locator('[data-filter="customer-systems"]').click();
  await page.goBack();
  await checkFilter(page, 'websites', 5);
  await page.goForward();
  await checkFilter(page, 'customer-systems', 2);

  await page.locator('[data-filter="all"]').click();
  assert.equal(new URL(page.url()).searchParams.has('category'), false);
  assert.equal(await page.locator('[data-media-id]').count(), 10);
  assert.equal(await page.locator('.media-placeholder').count(), 10);
  assert.equal(await page.locator('.project-media img, .project-media video').count(), 0);
  assert.equal(await page.locator('[data-project] a[target="_blank"]').count(), 2);
  assert.equal(await page.locator('[data-project] button, dialog').count(), 0);
  for (const width of [320, 390, 640, 768, 1000, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await checkOverflow(page);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: output + '/work-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: output + '/work-mobile.png', fullPage: true });

  const keyboardButton = page.locator('[data-filter="applications"]');
  await keyboardButton.focus();
  assert.ok(await keyboardButton.evaluate((el) => el.matches(':focus-visible')));
  await page.keyboard.press('Enter');
  await checkFilter(page, 'applications', 2);
  await page.keyboard.press('Space');
  await checkFilter(page, 'applications', 2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await keyboardButton.evaluate((el) => getComputedStyle(el).transitionDuration), '0s');
  await page.locator('.menu-toggle').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
  await page.locator('#site-nav a[href="/work/"]').click();
  await checkFilter(page, 'all', 10);
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');

  await page.goto(base + '/solutions/');
  assert.equal(await page.locator('a[href^="/work/?category="]').count(), 5);
  await page.locator('a[href="/work/?category=automation"]').click();
  await checkFilter(page, 'automation', 5);
  await page.goto(base + '/');
  assert.equal(await page.locator('h1').innerText(), 'Better systems.\nBetter business.');
  assert.equal(await page.locator('.service').count(), 5);
  assert.deepEqual(errors, []);

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(base + '/work/');
  assert.equal(await noJsPage.locator('[data-project]:visible').count(), 10);
  assert.equal(await noJsPage.locator('[data-filters]:visible').count(), 0);
  assert.ok(await noJsPage.locator('noscript').isVisible());
  await noJs.close();
  await context.close();
  console.log('Passed: every category, direct URLs, browser history, no reload, keyboard controls, reduced motion, placeholders, navigation, no-JS fallback and seven viewport widths.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
