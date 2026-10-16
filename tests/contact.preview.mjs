// Read-only verification of an actual Cloudflare deployment and its hCaptcha widget.
// Never solves or bypasses captcha, and never sends a live inquiry.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { inquiryDelivery, contact } from '../src/data/contact.ts';
const url = process.env.CONTACT_PREVIEW_URL || 'https://feat-editorial-homepage.aklov.pages.dev/contact/';
const expectedSha = process.env.CONTACT_PREVIEW_SHA || '';
const output = 'artifacts/contact-preview-review';
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  let apiRequests = 0;
  await context.route(inquiryDelivery.endpoint, (route) => { apiRequests++; return route.abort(); });
  const page = await context.newPage();
  let current = false;
  let deployedSha = '';
  for (let attempt = 0; attempt < 24; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const revision = page.locator('[data-contact-revision]');
      deployedSha = await revision.count() ? await revision.getAttribute('data-contact-revision') : '';
      if (response?.ok()
        && await page.locator(`[name="access_key"][value="${inquiryDelivery.accessKey}"]`).count()
        && (!expectedSha || deployedSha === expectedSha)) {
        current = true;
        break;
      }
    } catch {}
    if (attempt < 23) await new Promise(resolve => setTimeout(resolve, 5000));
  }
  assert.ok(current, 'The expected Contact deployment is not available: ' + expectedSha);
  assert.equal(await page.locator('[data-inquiry-form]').getAttribute('action'), inquiryDelivery.endpoint);
  await page.locator('.h-captcha iframe').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForFunction(() => typeof window.hcaptcha?.reset === 'function');
  assert.ok(await page.getByRole('button', { name: contact.submitLabel }).isDisabled());
  assert.equal(await page.locator('[aria-invalid="true"]').count(), 0);
  await mkdir(output, { recursive: true });
  for (const [label, width, height] of [['desktop',1440,1100],['tablet',768,1000],['mobile',390,844],['narrow',320,844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.h-captcha').scrollIntoViewIfNeeded();
    await page.frameLocator('.h-captcha iframe').getByRole('checkbox').waitFor({state:'visible'});
    await page.waitForTimeout(250); // Allow the third-party frame to repaint after viewport resizing.
    const box = await page.locator('.h-captcha iframe').boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= width, 'Live captcha overflow at ' + width);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Live page overflow at ' + width);
    await page.locator('.h-captcha').screenshot({path:output+'/captcha-'+label+'.png'});
    await page.screenshot({ path: output + '/contact-preview-' + label + '.png', fullPage: true });
  }
  // Inspect valid-form enablement without submitting or fabricating a captcha token.
  await page.locator('#inquiry-name').fill('Aklov preview inspection — no inquiry sent');
  await page.locator('#inquiry-email').fill('aklovup@gmail.com');
  await page.locator('#inquiry-message').fill('Read-only layout inspection; this form is not submitted.');
  assert.ok(await page.getByRole('button', { name: contact.submitLabel }).isEnabled());
  assert.equal(apiRequests, 0);
  await writeFile(output + '/verification.json', JSON.stringify({
    url, expectedSha, deployedSha, pageAvailable:true, endpoint:inquiryDelivery.endpoint,
    hcaptchaFrameLoaded:true, validFormEnabled:true, liveSubmissions:0,
    apiAcceptance:'not retested — no submission was made',
    inboxDelivery:'not retested — owner previously confirmed the working integration',
  }, null, 2));
  console.log('Verified current Contact deployment, real hCaptcha, clean initial state, valid-form enablement and desktop/tablet/mobile layout. No inquiry submitted.');
} finally {
  await browser?.close();
}
