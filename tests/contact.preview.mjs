// Read-only verification of the real Cloudflare preview and hCaptcha widget.
// Never solves or bypasses captcha, and never sends a live inquiry.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { inquiryDelivery, contact } from '../src/data/contact.ts';
const url = 'https://feat-contact-page.aklov.pages.dev/contact/';
const output = 'artifacts/contact-preview-review';
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  let apiRequests = 0;
  await context.route(inquiryDelivery.endpoint, (route) => { apiRequests++; return route.abort(); });
  const page = await context.newPage();
  let current = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (response?.ok() && await page.locator(`[name="access_key"][value="${inquiryDelivery.accessKey}"]`).count()) { current = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  assert.ok(current, 'Updated preview is not available.');
  assert.equal(await page.locator('[data-inquiry-form]').getAttribute('action'), inquiryDelivery.endpoint);
  await page.locator('.h-captcha iframe').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForFunction(() => typeof window.hcaptcha?.reset === 'function');
  await page.locator('#inquiry-name').fill('Aklov preview inspection — no inquiry sent');
  await page.locator('#inquiry-email').fill('aklovup@gmail.com');
  await page.locator('#inquiry-message').fill('Read-only layout inspection; this form is not submitted.');
  assert.ok(await page.getByRole('button', { name: contact.submitLabel }).isEnabled());
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: output + '/contact-preview-desktop.png', fullPage: true });
  for (const [label, width, height] of [['tablet', 768, 1000], ['mobile', 390, 844], ['narrow', 320, 844]]) {
    await page.setViewportSize({ width, height });
    const box = await page.locator('.h-captcha iframe').boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= width, 'Live captcha overflow at ' + width);
    await page.screenshot({ path: output + '/contact-preview-' + label + '.png', fullPage: true });
  }
  assert.equal(apiRequests, 0);
  await writeFile(output + '/verification.json', JSON.stringify({ url, pageAvailable: true, endpoint: inquiryDelivery.endpoint, hcaptchaFrameLoaded: true, liveSubmissions: 0, apiAcceptance: 'not tested — requires a human-completed captcha', inboxDelivery: 'pending owner confirmation' }, null, 2));
  console.log('Verified real Cloudflare Contact preview, configured endpoint/key, live hCaptcha, valid-form enablement and responsive widget. No inquiry submitted; API acceptance requires a human-completed captcha.');
} finally {
  await browser?.close();
}
