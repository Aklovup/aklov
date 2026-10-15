import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { readProjects } from './project-content.mjs';

const base = 'http://127.0.0.1:4321';
const output = 'artifacts/work-review';
const counts = { all: 10, websites: 5, 'customer-systems': 2, automation: 5, applications: 2, integrations: 7 };
const projects = readProjects();
// Astro applies smart typography; quotation-mark formatting does not alter copy.
const normalize = (value) => value.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
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
  assert.equal(await page.locator('.media-placeholder').count(), projects.filter((project) => !project.cover.url).length);
  assert.equal(await page.locator('.project-media img, .project-media video, .project-media canvas[data-gif-still]').count(), projects.filter((project) => project.cover.url).length);
  assert.equal(await page.locator('[data-project] a[target="_blank"]').count(), projects.filter(p => p.externalUrl).length + projects.filter(p => p.projectType === 'Independent Concept' && p.externalLinks?.length).length);
  assert.equal(await page.locator('[data-project-open]').count(), 10);
  assert.equal(await page.locator('dialog').count(), 1);
  assert.equal(await page.locator('dialog').isVisible(), false);
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
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  assert.ok(await keyboardButton.evaluate((el) => el === document.activeElement));
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

  // All project bodies must match the approved source, without missing paragraphs.
  await page.goto(base + '/work/?source=review#projects');
  await checkFilter(page, 'all', 10);
  const dialog = page.getByRole('dialog');
  const close = dialog.locator('[data-dialog-close]');
  for (const project of projects) {
    const trigger = page.locator('[data-project-open="' + project.slug + '"]');
    await trigger.click();
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.locator('h2').innerText(), project.title);
    assert.equal(await dialog.locator('.detail-headline').innerText(), project.headline);
    assert.equal(await dialog.locator('.detail-introduction').innerText(), project.description);
    assert.equal(normalize(await dialog.locator('.case-study-copy').innerText()), normalize(project.body.replace(/^### /gm, '')));
    assert.equal(new URL(page.url()).searchParams.get('project'), project.slug);
    assert.equal(new URL(page.url()).searchParams.get('source'), 'review');
    assert.equal(new URL(page.url()).hash, '#projects');
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    assert.equal(await dialog.locator('img, video, canvas[data-gif-still]').count(), project.media.filter((item) => item.url).length, 'Missing media created an empty or broken element.');
    if (project.slug === 'moving-company-crm' || project.media.some((item) => item.url)) assert.equal(await dialog.locator('.media-placeholder').count(), 0);
    else assert.equal(await dialog.locator('.media-placeholder').count(), 1);
    assert.equal(await dialog.locator('.detail-type').innerText(), project.projectType);
    assert.equal(await dialog.locator('.external-links a').count(), (project.externalUrl ? 1 : 0) + (project.externalLinks?.length || 0));
    if (project.projectType === 'Independent Concept') {
      const demoLink = page.locator(`[data-project="${project.slug}"] .card-footer a`);
      assert.equal(normalize(await demoLink.innerText()), 'View live demo ↗');
      assert.equal(await demoLink.getAttribute('href'), project.externalLinks[0].url);
      assert.equal(await demoLink.getAttribute('target'), '_blank');
      assert.equal(await dialog.locator('.external-links a').getAttribute('href'), project.externalLinks[0].url);
      assert.equal(await dialog.locator('.detail-type').innerText(), 'Independent Concept');
    }
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog').open && !document.querySelector('[data-dialog-content]').children.length && !new URL(location.href).searchParams.has('project'));
    await page.waitForFunction((slug) => document.activeElement?.getAttribute('data-project-open') === slug, project.slug);
    assert.ok(await trigger.evaluate((el) => el === document.activeElement), 'Focus was not restored to the project card control.');
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '');
  }

  // Card clicks, keyboard activation, focus boundaries, backdrop and scroll behavior.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('[data-project="divine-health-black-onyx"] h2').click();
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await dialog.locator('h2').innerText(), 'Divine Health & Wellness / Black Onyx');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await dialog.locator('.inspect-link').count(), 0);
  assert.ok(await dialog.locator('.external-links a').last().evaluate((el) => el === document.activeElement), 'Focus must wrap to the final available website link.');
  await page.keyboard.press('Tab');
  assert.ok(await close.evaluate((el) => el === document.activeElement));
  await dialog.locator('h2').click();
  assert.ok(await dialog.isVisible(), 'Clicking dialog content closed it.');
  await page.screenshot({ path: output + '/project-desktop.png' });
  await dialog.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  assert.ok(await dialog.evaluate((el) => el.scrollTop > 0));
  const closeBox = await close.boundingBox();
  assert.ok(closeBox.y >= 0 && closeBox.y < 1000, 'Close control disappeared during long-content scrolling.');
  await page.mouse.click(5, 5);
  await page.waitForFunction(() => !document.querySelector('dialog').open && !new URL(location.href).searchParams.has('project'));

  for (const width of [320, 390, 640, 768, 1000, 1440, 1920]) {
    await page.setViewportSize({ width, height: 844 });
    const trigger = page.locator('[data-project-open="impex-automotive"]');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1), false, 'Popup overflow at width ' + width);
    if (width <= 640) {
      const box = await dialog.boundingBox();
      assert.equal(Math.round(box.width), width);
      assert.equal(Math.round(box.height), 844);
    }
    if (width === 390) await page.screenshot({ path: output + '/project-mobile.png' });
    await close.click();
    await page.waitForFunction(() => !document.querySelector('dialog').open && !new URL(location.href).searchParams.has('project'));
  }

  // Back/Forward reconstructs the modal as well as the existing category filter.
  await page.goto(base + '/work/?category=applications&source=review');
  await checkFilter(page, 'applications', 2);
  await page.locator('[data-project-open="impex-automotive"]').click();
  await page.goBack();
  await dialog.waitFor({ state: 'hidden' });
  await checkFilter(page, 'applications', 2);
  await page.goForward();
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await dialog.locator('h2').innerText(), 'Impex Automotive');
  await close.click();
  await page.waitForFunction(() => !document.querySelector('dialog').open && !new URL(location.href).searchParams.has('project'));
  await checkFilter(page, 'applications', 2);

  // Direct links can show a project outside the selected category; both parameters are retained.
  await page.goto(base + '/work/?category=websites&project=impex-automotive');
  await dialog.waitFor({ state: 'visible' });
  await checkFilter(page, 'websites', 5);
  await close.click();
  await page.waitForFunction(() => !document.querySelector('dialog').open && !new URL(location.href).searchParams.has('project'));
  await checkFilter(page, 'websites', 5);
  await page.goto(base + '/work/?category=websites&project=unknown');
  await checkFilter(page, 'websites', 5);
  assert.equal(await dialog.isVisible(), false);
  for (const project of projects.filter((item) => item.aliases.length)) {
    await page.goto(base + '/work/?project=' + project.aliases[0]);
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.locator('h2').innerText(), project.title);
  }
  await page.goto(base + '/work/?project=vera-skincare-concept');
  await dialog.waitFor({ state: 'visible' });
  await page.screenshot({ path: output + '/concept-desktop.png' });

  assert.deepEqual(errors, []);

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(base + '/work/');
  assert.equal(await noJsPage.locator('[data-project]:visible').count(), 10);
  assert.equal(await noJsPage.locator('[data-filters]:visible').count(), 0);
  assert.ok(await noJsPage.locator('.no-script').isVisible());
  for (const project of projects.filter((item) => item.cover.url && item.cover.type === 'gif')) {
    const mediaLink = noJsPage.locator(`[data-project="${project.slug}"] noscript a`);
    assert.ok(await mediaLink.isVisible());
    assert.equal(await mediaLink.getAttribute('href'), project.cover.url);
  }
  assert.equal(await noJsPage.locator('[data-project-open]:visible').count(), 0);
  await noJs.close();
  await context.close();
  console.log('Passed: all ten complete project bodies, project/category URLs and aliases, Back/Forward, card and keyboard activation, dismissal, focus boundaries/restoration, background scroll locking, long-content scrolling, media placeholders, external links, no-JS fallback and seven viewport widths.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
