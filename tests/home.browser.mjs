import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { readProjects } from './project-content.mjs';

const base = 'http://127.0.0.1:4338';
const output = 'artifacts/home-review';
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4338'], { stdio: 'inherit' });
const report = [];
let browser;
try {
  await mkdir(output, { recursive: true });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    if (i === 99) throw new Error('Homepage preview not ready.');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  const animatedRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().endsWith('.gif')) animatedRequests.push(request.url()); });
  const projects = readProjects();
  for (const width of [320,390,640,768,1000,1001,1440,1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.hero .portrait, .hero .panel, .dark .arc, .caps').count(), 0);
    const order = await page.locator('main > section').evaluateAll(items => items.map(el => el.id || el.querySelector('h1')?.id));
    assert.deepEqual(order, ['hero-title','selected-work','solutions','approach','contact']);
    const headingLines = page.locator('h1 > span');
    for (const line of await headingLines.all()) {
      const box = await line.boundingBox();
      const range = await line.evaluate(el => { const r = document.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect(); return {left:b.left,right:b.right}; });
      assert(box && range.left >= 0 && range.right <= width + 1, 'Headline cropped at ' + width + ': ' + JSON.stringify(range));
    }
    const hero = page.locator('.hero');
    const copy = await hero.locator('.hero-copy').boundingBox();
    const joint = await hero.locator('.hero-joint').boundingBox();
    if (width > 640) assert(joint.x >= copy.x + copy.width, 'Graphic overlaps copy at ' + width);
    else assert(joint.y >= (await hero.locator('.hero-actions').boundingBox()).y, 'Mobile graphic precedes the actions');
    assert.equal(await hero.locator('svg').getAttribute('aria-hidden'), 'true');
    assert.equal(await hero.locator('.btn-gold').getAttribute('href'), '/contact/');
    await hero.locator('.text-link').click();
    await page.waitForURL('**/#selected-work');
    assert.equal(await page.locator('.selected-project').count(), 3);
    for (const slug of ['impex-automotive','divine-health-black-onyx','vera-skincare-concept']) {
      const project = projects.find(item => item.slug === slug);
      const article = page.locator('.selected-project', { has: page.locator('#selected-' + slug) });
      assert.equal(await article.locator('.project-summary > p').innerText(), project.description);
      assert.equal(await article.locator('.project-type').innerText(), project.projectType);
      assert.equal(await article.locator('.project-link').getAttribute('href'), '/work/?project=' + slug);
      await article.scrollIntoViewIfNeeded();
      const image = article.locator('img');
      await image.evaluate(img => img.decode());
      assert.deepEqual(await image.evaluate(img => [getComputedStyle(img).objectFit,getComputedStyle(img).objectPosition]), ['cover','50% 0%']);
    }
    assert.equal(animatedRequests.length, 0, 'Animated media downloaded without Play');
    assert.equal(await page.locator('.service-list > a').count(), 5);
    assert.equal(await page.locator('.principle').count(), 3);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow at ' + width);
    await page.keyboard.press('Tab');
    await hero.locator('.btn-gold').focus();
    assert.equal(await hero.locator('.btn-gold').evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
    if ([390,768,1440].includes(width)) {
      await page.evaluate(() => scrollTo(0,0));
      await page.screenshot({ path: `${output}/home-${width}.png`, fullPage: true });
      await hero.screenshot({ path: `${output}/hero-${width}.png` });
      await page.locator('#selected-work').screenshot({ path: `${output}/selected-work-${width}.png` });
    }
    report.push({ width, overflow:false, headlineUnclipped:true, projects:3, contentPreserved:true, stillPreviews:true });
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base);
  const lead = page.locator('.lead-project');
  await lead.getByRole('button', {name:'Play GIF',exact:true}).click();
  await lead.locator('[data-playing-gif]').evaluate(img => img.decode());
  await lead.getByRole('button', {name:'Pause GIF',exact:true}).click();
  await lead.locator('[data-gif-still]').waitFor({state:'visible'});
  for (const slug of ['impex-automotive','divine-health-black-onyx','vera-skincare-concept']) {
    await page.goto(base);
    await page.locator('.selected-project a.project-link[href$="' + slug + '"]').click();
    await page.waitForURL('**/work/?project=' + slug);
    const dialog = page.locator('#project-dialog');
    await dialog.waitFor({state:'visible'});
    assert.equal(await dialog.locator('#project-dialog-title').innerText(), projects.find(p => p.slug === slug).title);
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base);
  assert.equal(await page.locator('[data-playing-gif]').count(),0);
  assert.equal(await page.locator('.hero-joint').evaluate(el => getComputedStyle(el).animationName),'none');
  assert.deepEqual(errors,[]);
  console.log('Passed: eight homepage widths, headline bounds, no overlap, exact portfolio copy, static previews, explicit GIF playback, keyboard focus, project deep links, reduced motion.');
} finally {
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
  await browser?.close();
  server.kill('SIGTERM');
}
