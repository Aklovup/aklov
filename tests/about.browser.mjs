import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { about, profile } from '../src/data/about.ts';
import { links } from '../src/data/links.ts';

const base = 'http://127.0.0.1:4321';
const output = 'artifacts/about-review';
const normalize = (text) => text.replace(/\s+/g, ' ').trim();
const expectedParagraphs = [
  about.introduction.paragraphs[4],
  about.introduction.paragraphs[3],
  ...about.introduction.paragraphs.slice(0, 3),
  ...about.biography.paragraphs,
  ...about.approach.paragraphs,
  about.approach.sequenceIntroduction,
  ...about.approach.stages.map((stage) => stage.description),
  about.approach.closing,
  ...about.work.paragraphs,
  ...about.together.paragraphs,
  about.closing.paragraph,
];
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4321'], { stdio: 'inherit' });
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(base + '/about/')).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Astro preview did not become ready.');
}

async function checkLayout(page, width) {
  await page.setViewportSize({ width, height: 1000 });
  await page.waitForFunction(() => Number(document.querySelector('[data-cellular-structures]')?.dataset.signalRoutes) > 0);
  const overflow = await page.evaluate(() => [...document.querySelectorAll(
    '.about-page .wrap, .about-page h1, .about-page h2, .about-page h3, [data-approved-copy], .portrait-frame, .stage-list li, .closing-actions a, .nav, .foot-links'
  )].filter((element) => {
    if (!element.getClientRects().length) return false;
    const box = element.getBoundingClientRect();
    return box.left < -1 || box.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1;
  }).map((element) => element.className || element.tagName));
  assert.deepEqual(overflow, [], 'Overflow at ' + width + 'px: ' + overflow.join(', '));
  // Measure paired columns atomically, independent of viewport scrolling.
  const layout = await page.evaluate(() => {
    const box = selector => {
      const b = document.querySelector(selector).getBoundingClientRect();
      return { x: b.x, y: b.y, right: b.right, bottom: b.bottom };
    };
    return { introduction: box('.approach-introduction'), sequence: box('.approach-sequence'),
      pairs: [['.biography .section-heading', '.biography-copy'], ['.experience-heading', '.experience-story'], ['.together .section-heading', '.together-story']].map(([heading, copy]) => ({ heading: box(heading), copy: box(copy) })) };
  });
  for (const { heading, copy } of layout.pairs) {
    if (width > 640) assert.ok(copy.x >= heading.right, 'Story should occupy the right column at ' + width);
    else assert.ok(copy.y >= heading.bottom, 'Mobile heading and story overlap at ' + width);
  }
  if (width > 1000) assert.ok(layout.sequence.x >= layout.introduction.right, 'Desktop stages must sit beside the narrative');
  else assert.ok(layout.sequence.y >= layout.introduction.bottom, 'Stacked stages must follow the narrative');
  const closingSize = await page.locator('.closing h2').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  assert.ok(closingSize <= 120, 'Closing headline exceeds the established range.');
  const secondary = page.locator('[data-about-work-secondary]');
  assert.equal(await secondary.evaluate(el => el.classList.contains('btn')), false, 'Secondary work link should remain quieter than the primary button.');
  const portrait = await page.locator('[data-about-portrait]').boundingBox();
  assert.ok(Math.abs(portrait.width / portrait.height - profile.portrait.width / profile.portrait.height) < .01, 'Portrait proportions must be preserved.');
  assert.ok(portrait.width <= 561, 'The original portrait must not be enlarged beyond the intended display size.');
  const face = {left:portrait.x+portrait.width*.34,right:portrait.x+portrait.width*.73,top:portrait.y+portrait.height*.04,bottom:portrait.y+portrait.height*.4};
  for(const line of await page.locator('h1 > span').all()) {
    const bounds=await line.evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);const b=r.getBoundingClientRect(),h=el.closest('h1').getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,edgeLeft:h.left,edgeRight:h.right};});
    assert(bounds.left>=bounds.edgeLeft-1&&bounds.right<=bounds.edgeRight+1, 'Name glyphs exceed the column at '+width+': '+JSON.stringify(bounds));
    assert.ok(bounds.right<=face.left||bounds.left>=face.right||bounds.bottom<=face.top||bounds.top>=face.bottom,'Name must not cover the face at '+width);
  }
  const plane=await page.locator('.hero-gold-plane').boundingBox();
  const surname=await page.locator('.identity-surname').boundingBox();
  assert.ok(plane.y+plane.height<=surname.y+1,'The gold plane must end before the ivory surname baseline.');
  const story=await page.locator('.profile-story').boundingBox();
  assert.ok(surname.y+surname.height<=story.y+1,'Surname must finish inside the hero.');
}

try {
  await waitForServer();
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base + '/about/');
  assert.equal(await page.title(), about.metadata.title);
  assert.equal(await page.locator('meta[name="description"]').getAttribute('content'), about.metadata.description);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(normalize(await page.locator('h1').innerText()), profile.name);
  assert.equal(normalize(await page.locator('.hero-principle').innerText()), about.introduction.headline);
  assert.deepEqual((await page.locator('.about-page h2').allInnerTexts()).map(normalize), [
    about.biography.heading, about.approach.heading, about.work.heading, about.together.heading, about.closing.headline,
  ]);
  assert.deepEqual((await page.locator('[data-approved-copy]').allInnerTexts()).map(normalize), expectedParagraphs.map(normalize));
  assert.equal(expectedParagraphs.length, 38);
  assert.equal(await page.locator('.intro-context [data-approved-copy]').first().innerText(), about.introduction.paragraphs[0]);
  assert.equal(await page.locator('.about-hero [data-approved-copy]').count(), 0);
  assert.equal(await page.locator('.intro-detail [data-approved-copy]').count(), 5);
  assert.equal(await page.locator('.together-story .reading-copy [data-approved-copy]').count(), 5);
  assert.deepEqual(await page.locator('.stage-list h3').allInnerTexts(), about.approach.stages.map((stage) => stage.title));
  assert.equal(await page.locator('.stage-list li').count(), 4);
  // The portrait appears once; only the meaningful process retains numbering.
  assert.equal(await page.locator('[data-about-portrait]').count(), 1);
  assert.equal(await page.locator('.section-number').count(), 0);
  assert.equal(await page.locator('.stage-list .stage-number').count(), 4);
  assert.equal(await page.locator('.stage-list li').first().evaluate(element => getComputedStyle(element).borderBottomStyle), 'solid');
  assert.equal(await page.locator('.approach-closing').innerText(), about.approach.closing);
  const storySurface = await page.locator('.profile-story').evaluate(element => getComputedStyle(element).backgroundColor);
  assert.equal(storySurface, 'rgb(245, 242, 234)');
  for (const chapter of ['.biography', '.approach', '.experience', '.together']) {
    assert.equal(await page.locator(chapter).evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0)');
    assert.equal(await page.locator(chapter + ' > .wrap').first().evaluate(element => getComputedStyle(element).borderTopStyle), chapter === '.approach' ? 'solid' : 'none');
  }
  assert.equal(await page.locator('.designation').innerText(), profile.designation);
  assert.equal(await page.locator('[data-about-portrait] figcaption, .portrait-frame, .portrait-name').count(), 0);
  assert.equal(await page.locator('.portrait-signature, .signature-panel').count(), 0);
  assert.equal(await page.locator('.portrait-fallback').count(), 0);
  const portraitImage = page.locator('[data-about-portrait] img');
  assert.equal(await portraitImage.getAttribute('src'), profile.portrait.src);
  await portraitImage.evaluate(img => img.decode());
  assert.ok(await portraitImage.evaluate(img => img.naturalWidth > 0));
  assert.equal(await page.locator('[data-about-contact]').getAttribute('href'), links.contact);
  assert.equal(await page.locator('[data-about-contact]').innerText(), about.closing.primaryCta);
  assert.equal(await page.locator('[data-about-work-link]').getAttribute('href'), links.workClients);
  assert.equal(await page.locator('[data-about-work-secondary]').getAttribute('href'), links.work);
  assert.equal(await page.locator('[data-about-work-link]').innerText(), about.work.cta);
  assert.equal(await page.locator('[data-about-work-secondary]').innerText(), about.closing.secondaryCta);
  assert.equal(await page.locator('#site-nav a[aria-current="page"]').getAttribute('href'), '/about/');
  assert.equal(await page.locator('.foot-links a[href="/about/"]').count(), 1);

  // Check rendered text contrast against its actual section background.
  const lowContrast = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    const rgba = (color) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const luminance = (rgb) => rgb.slice(0, 3).map((channel) => {
      const value = channel / 255;
      return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return [...document.querySelectorAll('[data-approved-copy], .about-page h1, .about-page h2, .about-page h3, .hero-principle, .hero-principle em, .section-heading h2 em, .approach-closing em, .stage-number, .designation, .portrait-name, .fallback-name, .about-page a')].flatMap((element) => {
      const style = getComputedStyle(element);
      let background = element;
      while (background && rgba(getComputedStyle(background).backgroundColor)[3] === 0) background = background.parentElement;
      const text = luminance(rgba(style.color));
      const backdrop = luminance(rgba(getComputedStyle(background || document.body).backgroundColor));
      const ratio = (Math.max(text, backdrop) + .05) / (Math.min(text, backdrop) + .05);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseFloat(style.fontWeight) >= 700);
      return ratio + .01 < (large ? 3 : 4.5) ? [{ text: element.textContent.slice(0, 70), ratio }] : [];
    });
  });
  assert.deepEqual(lowContrast, [], 'Text contrast failed: ' + JSON.stringify(lowContrast));

  for (const width of [320, 390, 640, 641, 768, 1000, 1001, 1280, 1440, 1920]) await checkLayout(page, width);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output + '/about-desktop.png', fullPage: true });
  await page.screenshot({ path: output + '/about-desktop-introduction.png', fullPage: false });
  console.log('VISUAL_REVIEW_ABOUT_1440:'+(await sharp(await page.screenshot()).resize({width:960}).jpeg({quality:65}).toBuffer()).toString('base64'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: output + '/about-mobile.png', fullPage: true });
  console.log('VISUAL_REVIEW_ABOUT_390:'+(await sharp(await page.screenshot()).jpeg({quality:65}).toBuffer()).toString('base64'));
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.screenshot({ path: output + '/about-tablet.png', fullPage: true });

  // Skip link and all newly introduced links are keyboard-operable and visibly focused.
  await page.goto(base + '/about/');
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('.skip-link').evaluate((element) => element === document.activeElement));
  await page.keyboard.press('Enter');
  assert.equal(new URL(page.url()).hash, '#main');
  for (const selector of ['[data-about-work-link]', '[data-about-contact]', '[data-about-work-secondary]']) {
    const link = page.locator(selector);
    await link.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.ok(await link.evaluate((element) => element === document.activeElement && element.matches(':focus-visible')));
    assert.equal(await link.evaluate((element) => getComputedStyle(element).outlineStyle), 'solid');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('[data-about-contact]').evaluate((element) => getComputedStyle(element).transitionDuration), '0s');

  const cells = page.locator('[data-cellular-structures]');
  assert.equal(await cells.getAttribute('aria-hidden'), 'true');
  assert.equal(await cells.evaluate(el => getComputedStyle(el).pointerEvents), 'none');
  assert.equal(await cells.evaluate(el => getComputedStyle(el).mixBlendMode), 'difference');
  assert.ok(await cells.locator('[data-cell-mesh]').evaluate(el => Number(getComputedStyle(el).opacity) <= .12), 'Cells must remain a faint background layer');
  const signal = cells.locator('[data-cell-signal]');
  assert.equal(await signal.count(),1,'Only one light may travel through the mesh');
  assert.equal(await cells.locator('[data-signal-core]').count(),1);
  await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(() => document.querySelector('[data-cellular-structures]').dataset.running === 'false');
  assert.ok(await cells.locator('svg').evaluate(svg => svg.animationsPaused()), 'Reduced motion freezes the cellular mesh');
  assert.equal(await signal.getAttribute('opacity'),'0','Reduced motion hides the travelling light');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => document.querySelector('[data-cellular-structures]').dataset.running === 'true');
  await page.waitForFunction(() => document.querySelector('[data-cell-signal]').getAttribute('opacity') === '1');
  const heroHeight = await page.locator('.about-hero').evaluate(el => el.offsetHeight);
  const sample = () => cells.locator('path').first().evaluate(path => {const p=path.getPointAtLength(path.getTotalLength()/2);return {x:p.x,y:p.y};});
  const before = await sample();
  const sampleSignal = () => signal.evaluate(el => {const m=el.transform.baseVal.consolidate().matrix;return {x:m.e,y:m.f};});
  const signalBefore = await sampleSignal();
  await page.waitForTimeout(600);
  const signalMiddle = await sampleSignal();
  await page.waitForTimeout(600);
  const signalAfter = await sampleSignal();
  const after = await sample();
  assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>.001,'Cell boundaries must actually deform');
  assert.ok(Math.hypot(signalMiddle.x-signalBefore.x,signalMiddle.y-signalBefore.y)+Math.hypot(signalAfter.x-signalMiddle.x,signalAfter.y-signalMiddle.y)>1,'The single light must visibly move');
  await page.waitForFunction(() => {const g=document.querySelector('[data-cell-signal]');return g.dataset.junction==='true'&&Number(g.querySelector('[data-signal-core]').getAttribute('fill-opacity'))>.9;},null,{timeout:30000});
  assert.ok(await signal.evaluate(el => {const path=el.ownerSVGElement.querySelector('[data-cell-edge="'+el.dataset.edge+'"]'),m=el.transform.baseVal.consolidate().matrix;return [0,path.getTotalLength()].some(length=>{const p=path.getPointAtLength(length);return Math.hypot(p.x-m.e,p.y-m.f)<.1;});}),'The brightening must occur at an actual junction');
  assert.equal(await page.locator('.about-hero').evaluate(el => el.offsetHeight),heroHeight,'Ambient movement must not shift the layout');
  await page.evaluate(() => scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
  await page.waitForFunction(() => document.querySelector('[data-cellular-structures]').dataset.running === 'false');
  const clock = await cells.locator('svg').evaluate(svg => svg.getCurrentTime());
  await page.waitForTimeout(200);
  assert.ok(Math.abs(await cells.locator('svg').evaluate(svg => svg.getCurrentTime())-clock)<.05,'The offscreen mesh timeline must stop');
  assert.equal(await signal.getAttribute('opacity'),'0','The offscreen travelling light must stop');
  console.log('Passed: faint cellular mesh, one moving light, actual-junction brightening, reduced-motion/offscreen suspension and no layout shift.');

  await page.locator('[data-about-work-link]').click();
  await page.waitForURL('**/work/?type=client');
  await page.waitForFunction(() => document.querySelectorAll('[data-project]:not([hidden])').length === 8 && document.querySelector('[data-group="client"]').getAttribute('aria-pressed') === 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  const toggle = page.locator('.menu-toggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await page.locator('#site-nav a[href="/about/"]').click();
  await page.waitForURL('**/about/');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#site-nav a[aria-current="page"]').getAttribute('href'), '/about/');
  for (const route of ['/', '/solutions/', '/work/']) {
    await page.goto(base + route);
    assert.equal(await page.locator('#site-nav a[href="/about/"]').count(), 1);
    assert.equal(await page.locator('.foot-links a[href="/about/"]').count(), 1);
  }
  assert.deepEqual(errors, []);
  await context.close();

  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(base + '/about/');
  assert.equal(await noJsPage.locator('[data-approved-copy]').count(), 38);
  assert.ok(await noJsPage.locator('[data-about-portrait] img').isVisible());
  await noJsPage.locator('[data-about-portrait] img').evaluate(img => img.decode());
  assert.equal(await noJsPage.locator('[data-cellular-structures]').getAttribute('data-running'),'false');
  assert.equal(await noJsPage.locator('[data-cell-signal]').getAttribute('opacity'),'0');
  assert.ok(await noJsPage.locator('[data-cellular-structures] animate').evaluateAll(items => items.length>0 && items.every(el => el.getAttribute('begin')==='indefinite')),'No-JS visitors receive the static cellular structure');
  await noJs.close();
  console.log('Passed: all 38 approved paragraphs, metadata, heading hierarchy, uploaded portrait, CTAs, navigation, keyboard focus, reduced motion, text contrast, no-JS rendering and ten viewport widths.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}




