import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { contact, inquiryDelivery } from '../src/data/contact.ts';
import { inquiryServices } from '../src/lib/inquiry.ts';
import { links } from '../src/data/links.ts';
const base = 'http://127.0.0.1:4321';
const output = 'artifacts/contact-review';
const normalize = (text) => text.replace(/\s+/g, ' ').trim();
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4321'], { stdio: 'inherit' });
let browser;
const fillValid = async (page) => {
  await page.getByLabel('Your name', { exact: false }).fill('Ada Example');
  await page.getByLabel('Email address', { exact: false }).fill('ada@example.com');
  await page.locator('#inquiry-message').fill('I would like to discuss a business website.');
};
// Captcha/API fixtures are isolated to tests. No real token is fabricated or sent.
async function protectTestContext(context) {
  await context.route('https://web3forms.com/client/script.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `const widget = document.querySelector('.h-captcha');
      widget.textContent = 'hCaptcha — isolated browser fixture';
      widget.style.cssText = 'width:164px;height:144px;border:1px solid #77766f;padding:16px;font-size:12px;';
      window.hcaptcha = {reset: () => { const token = document.querySelector('[name="h-captcha-response"]'); if(token)token.value=''; }};`,
  }));
  await context.route(inquiryDelivery.endpoint, (route) => route.abort());
}
async function deliveryFixture() {
  const context = await browser.newContext();
  await protectTestContext(context);
  const page = await context.newPage();
  await page.goto(base + '/contact/');
  return { context, page };
}
async function solveFixtureCaptcha(page) {
  await page.locator('[data-inquiry-form]').evaluate((form) => {
    let token = form.querySelector('[name="h-captcha-response"]');
    if (!token) { token = document.createElement('textarea'); token.name = 'h-captcha-response'; token.hidden = true; form.append(token); }
    token.value = 'isolated-test-token';
    window.aklovCaptchaVerified();
  });
}

try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + '/contact/')).ok) break; } catch {}
    if (i === 99) throw new Error('Preview did not start.');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await protectTestContext(context);
  const page = await context.newPage();
  const errors = [];
  let submissions = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (request.url() === inquiryDelivery.endpoint) submissions++; });
  await page.goto(base + '/contact/');
  assert.equal(await page.title(), contact.metadata.title);
  assert.equal(await page.locator('meta[name="description"]').getAttribute('content'), contact.metadata.description);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('.contact-page').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(216, 189, 120)');
  assert.equal(await page.locator('.contact-page h1 em').evaluate(el=>getComputedStyle(el).color),'rgb(21, 21, 21)');
  assert.equal(normalize(await page.locator('h1').innerText()), contact.headline);
  assert.equal(await page.locator('.kicker').innerText(), contact.eyebrow);
  assert.deepEqual((await page.locator('[data-approved-copy]').allInnerTexts()).map(normalize), [...contact.introduction, contact.direct.body, contact.closing]);
  assert.deepEqual(await page.locator('.contact-page h2').allInnerTexts(), [contact.formHeading, contact.direct.heading]);
  assert.deepEqual(await page.locator('#inquiry-service option:not([value=""])').allInnerTexts(), [...inquiryServices]);
  assert.equal(await page.locator('.direct-links a').first().getAttribute('href'), links.email);
  assert.equal(await page.locator('.direct-links a').last().getAttribute('href'), links.linkedin);
  assert.equal(await page.locator('.direct-links a').last().innerText(), contact.direct.linkedinLabel);
  assert.equal(await page.locator('[data-success] h3').textContent(), contact.success.heading);
  assert.equal(await page.locator('[data-success] p').textContent(), contact.success.body);
  assert.equal(await page.locator('[data-failure] h3').textContent(), contact.failure.heading);
  assert.equal(normalize(await page.locator('[data-failure] p').textContent()), contact.failure.body);
  assert.equal(await page.locator('[data-inquiry-form]').getAttribute('action'), inquiryDelivery.endpoint);
  assert.equal(await page.locator('[name="access_key"]').inputValue(), inquiryDelivery.accessKey);
  assert.ok(await page.getByRole('button', { name: contact.submitLabel }).isDisabled());
  assert.equal(await page.locator('#inquiry-availability').count(), 0);
  assert.equal(await page.locator('[name="botcheck"]').getAttribute('type'), 'checkbox');
  assert.ok(!(await page.locator('[name="botcheck"]').isVisible()));
  assert.ok(!(await page.locator('[data-success]').isVisible()));
  assert.ok(!(await page.locator('[data-failure]').isVisible()));
  assert.equal(submissions, 0, 'Loading the form made an API request.');
  // Check actual foreground/background contrast, including functional text.

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
    return [...document.querySelectorAll('[data-approved-copy], .contact-page h1, .contact-page h2, .contact-page label, .direct-links a, .availability, .field-note, .contact-page button')].flatMap((element) => {
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

  for (const width of [320, 390, 640, 760, 768, 1000, 1001, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1100 });
    assert.equal(await page.locator('[aria-invalid="true"]').count(), 0, 'Initial form should not show validation errors.');
    const overflow = await page.evaluate(() => [...document.querySelectorAll('.contact-page .wrap, .contact-page h1, .inquiry, .field, input, textarea, select, .direct-links, .contact-page button, .nav, .foot-links')].filter((element) => {
      if (!element.getClientRects().length || element.closest('.honey')) return false;
      const box = element.getBoundingClientRect();
      return box.left < -1 || box.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1;
    }).map((element) => element.id || element.className));
    assert.deepEqual(overflow, [], 'Overflow at ' + width + 'px');
    if (width <= 1000) {
      const intro = await page.locator('.contact-introduction').boundingBox();
      const form = await page.locator('.form-column').boundingBox();
      const direct = await page.locator('.direct-contact').boundingBox();
      assert.ok(intro.y + intro.height <= form.y && form.y + form.height <= direct.y);
      assert.ok(await page.locator('.email-shortcut').isVisible());
      assert.equal(await page.locator('.email-shortcut').getAttribute('href'), links.email);
    } else {
      assert.equal(await page.locator('.email-shortcut').isVisible(), false);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: output + '/contact-desktop.png', fullPage: true });
  console.log('VISUAL_REVIEW_CONTACT_1440:'+(await sharp(await page.screenshot()).resize({width:960}).jpeg({quality:65}).toBuffer()).toString('base64'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: output + '/contact-mobile.png', fullPage: true });
  console.log('VISUAL_REVIEW_CONTACT_390:'+(await sharp(await page.screenshot()).jpeg({quality:65}).toBuffer()).toString('base64'));
  assert((await page.locator('.form-column').boundingBox()).y < 700, 'The mobile form should begin in the opening viewport');
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.screenshot({ path: output + '/contact-tablet.png', fullPage: true });
  await page.goto(base + '/contact/');
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('.skip-link').evaluate((element) => document.activeElement === element));
  await page.keyboard.press('Enter');
  await page.locator('#inquiry-name').focus();
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('#inquiry-email').evaluate((element) => document.activeElement === element && element.matches(':focus-visible') && getComputedStyle(element).outlineStyle === 'solid'));
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('#inquiry-service').evaluate((element) => document.activeElement === element));
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('#inquiry-message').evaluate((element) => document.activeElement === element));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('#inquiry-name').evaluate((element) => getComputedStyle(element).transitionDuration), '0s');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.menu-toggle').click();
  assert.equal(await page.locator('#site-nav a[aria-current="page"]').getAttribute('href'), '/contact/');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
  for (const path of ['/', '/solutions/', '/work/', '/about/']) {
    await page.goto(base + path);
    assert.equal(await page.locator('#site-nav a').last().getAttribute('href'), '/contact/');
    assert.equal(await page.locator('.foot-links a').last().getAttribute('href'), '/contact/');
  }
  await page.goto(base + '/about/');
  assert.equal(await page.locator('[data-about-contact]').getAttribute('href'), '/contact/');
  await page.locator('[data-about-contact]').click();
  await page.waitForURL('**/contact/');
  assert.deepEqual(errors, []);
  await context.close();
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(base + '/contact/');
  assert.ok(await noJsPage.getByRole('button', { name: contact.submitLabel }).isDisabled());
  assert.equal(await noJsPage.locator('.direct-links a').first().getAttribute('href'), links.email);
  assert.ok(await noJsPage.locator('noscript').isVisible());
  await noJs.close();

  const validation = await deliveryFixture();
  let sentRequests = 0;
  validation.page.on('request', (request) => { if (request.url() === inquiryDelivery.endpoint) sentRequests++; });
  await validation.page.locator('[data-inquiry-form]').evaluate((form) => form.requestSubmit());
  assert.equal(await validation.page.locator('#inquiry-name').getAttribute('aria-invalid'), 'true');
  assert.ok(await validation.page.locator('#inquiry-name').evaluate((element) => document.activeElement === element));
  await validation.page.locator('#inquiry-name').fill('Ada');
  await validation.page.locator('#inquiry-email').fill('not-an-email');
  await validation.page.locator('#inquiry-message').fill('A project');
  await validation.page.locator('[data-inquiry-form]').evaluate((form) => form.requestSubmit());
  assert.equal(await validation.page.locator('#inquiry-email').getAttribute('aria-invalid'), 'true');
  assert.equal(sentRequests, 0);
  await validation.context.close();

  const pending = await deliveryFixture();
  let requests = 0;
  let release;
  const responseGate = new Promise((resolve) => { release = resolve; });
  await pending.page.route(inquiryDelivery.endpoint, async (route) => {
    requests++;
    assert.equal(route.request().method(), 'POST');
    const payload = route.request().postDataJSON();
    assert.equal(payload.name, 'Ada Example');
    assert.equal(payload.email, 'ada@example.com');
    assert.equal(payload.replyto, payload.email);
    assert.equal(payload.project_category, 'Website');
    assert.equal(payload.message, 'I would like to discuss a business website.');
    assert.equal(payload.access_key, inquiryDelivery.accessKey);
    assert.equal(payload.subject, inquiryDelivery.subject);
    assert.equal(payload.botcheck, false);
    assert.equal(payload['h-captcha-response'], 'isolated-test-token');
    assert.equal('service' in payload, false);
    assert.equal('website' in payload, false);
    await responseGate;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await fillValid(pending.page);
  await pending.page.locator('#inquiry-service').selectOption('Website');
  assert.ok(await pending.page.getByRole('button', { name: contact.submitLabel }).isEnabled());
  await pending.page.getByRole('button', { name: contact.submitLabel }).click();
  assert.ok(await pending.page.locator('[data-captcha-error]').isVisible());
  assert.equal(requests, 0, 'Missing captcha was submitted.');
  await solveFixtureCaptcha(pending.page);
  await pending.page.getByRole('button', { name: contact.submitLabel }).click();
  await pending.page.locator('[data-loading]').waitFor({ state: 'visible' });
  assert.ok(await pending.page.getByRole('button', { name: contact.submitLabel }).isDisabled());
  assert.ok(!(await pending.page.locator('[data-success]').isVisible()));
  await pending.page.locator('[data-inquiry-form]').evaluate((form) => { form.requestSubmit(); form.requestSubmit(); });
  assert.equal(requests, 1);
  release();
  await pending.page.locator('[data-success]').waitFor({ state: 'visible' });
  assert.ok(await pending.page.locator('[type="submit"]').isDisabled());
  assert.ok(await pending.page.locator('[data-inquiry-fields]').isHidden());
  assert.equal(await pending.page.locator('[data-contact-panel] h2').innerText(), contact.success.heading);
  assert.equal(await pending.page.locator('[data-success] p').innerText(), contact.success.body);
  assert.equal(await pending.page.locator('[data-feedback]').getAttribute('aria-labelledby'), 'inquiry-title');
  assert.equal(await pending.page.locator('[data-success] h3:visible').count(), 0);
  assert.equal(await pending.page.locator('#inquiry-message').inputValue(), '');
  assert.ok(await pending.page.locator('[data-feedback]').evaluate((element) => document.activeElement === element));
  await pending.page.setViewportSize({width:1440,height:1100});
  await pending.page.screenshot({path:output+'/contact-success-desktop.png',fullPage:true});
  await pending.page.setViewportSize({width:390,height:844});
  await pending.page.screenshot({path:output+'/contact-success-mobile.png',fullPage:true});
  await pending.context.close();

  const spam = await deliveryFixture();
  let spamRequests = 0;
  spam.page.on('request', (request) => { if (request.url() === inquiryDelivery.endpoint) spamRequests++; });
  await fillValid(spam.page);
  await spam.page.locator('[name="botcheck"]').evaluate((checkbox) => { checkbox.checked = true; });
  await spam.page.getByRole('button', { name: contact.submitLabel }).click();
  await spam.page.locator('[data-failure]').waitFor({ state: 'visible' });
  assert.equal(spamRequests, 0);
  assert.ok(!(await spam.page.locator('[data-success]').isVisible()));
  await spam.context.close();

  for (const failure of ['http-error', 'unconfirmed', 'malformed', 'network']) {
    const fixture = await deliveryFixture();
    await fixture.page.route(inquiryDelivery.endpoint, async (route) => {
      if (failure === 'network') return route.abort();
      await route.fulfill({ status: failure === 'http-error' ? 503 : 200, contentType: 'application/json', body: failure === 'malformed' ? 'invalid json' : JSON.stringify({ success: false }) });
    });
    await fillValid(fixture.page);
    await solveFixtureCaptcha(fixture.page);
    await fixture.page.getByRole('button', { name: contact.submitLabel }).click();
    await fixture.page.locator('[data-failure]').waitFor({ state: 'visible' });
    assert.ok(!(await fixture.page.locator('[data-success]').isVisible()));
    assert.ok(await fixture.page.locator('[data-inquiry-fields]').isVisible());
    assert.equal(await fixture.page.locator('#inquiry-title').innerText(), contact.formHeading);
    assert.ok(await fixture.page.getByRole('button', { name: contact.submitLabel }).isEnabled());
    assert.equal(await fixture.page.locator('#inquiry-message').inputValue(), 'I would like to discuss a business website.');
    if(failure === 'http-error') await fixture.page.screenshot({path:output+'/contact-failure.png',fullPage:true});
    await fixture.context.close();
  }
  console.log('Passed: approved copy/contact links; validation and valid-form enablement; Web3Forms field mapping and strict acceptance; captcha/honeypot behavior; loading, success, rejection, network/malformed failure, reset and duplicate prevention; keyboard/contrast/reduced motion/no-JS and ten widths. API/captcha fixtures only; no real email sent by CI.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

