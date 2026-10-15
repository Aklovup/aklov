import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const out = 'artifacts/concept-sites';
await mkdir(out, { recursive: true });
const audit = JSON.parse(await readFile('concepts/audit.json', 'utf8'));
const server = createServer(async (req, res) => {
  try {
    const [name, ...parts] = new URL(req.url, 'http://localhost').pathname.slice(1).split('/');
    const file = resolve('concepts', name, 'public', parts.join('/') || 'index.html');
    assert(file.startsWith(resolve('concepts', name, 'public') + '/'));
    const data = await readFile(file);
    res.setHeader('Content-Type', ({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[extname(file)] || 'application/octet-stream');res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(4322, '127.0.0.1', r));
const browser = await chromium.launch();
const report = { assets: [], layouts: [], interactions: [], errors: [] };
try {
  const urls = [...new Set(audit.flatMap(a => [...a.externalImages, ...a.fontStylesheets]))];
  // Test the supplied URLs without replacing imagery or assuming availability.
  report.assets = await Promise.all(urls.map(async url => {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(30000) });const bytes = (await r.arrayBuffer()).byteLength; return { url, status:r.status, type:r.headers.get('content-type'), bytes }; }
    catch(e) { return {url, error:e.message}; }
  }));
  for (const site of audit) {
    for (const width of [1440, 768, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height:900 } });
      page.on('pageerror', e => report.errors.push(`${site.concept}/${width}: ${e.message}`));
      const base = process.env.CONCEPT_LIVE === '1' ? `https://aklov-${site.concept}.pages.dev` : `http://127.0.0.1:4322/${site.concept}`;
      // Root-absolute static paths are served from the correct concept locally.
      if (process.env.CONCEPT_LIVE !== '1') await page.route('http://127.0.0.1:4322/demo.*', async route => {
        const path = new URL(route.request().url()).pathname;
        const data = await readFile(`concepts/${site.concept}/public${path}`);
        await route.fulfill({ body:data,contentType:path.endsWith('.css')?'text/css':'text/javascript' });
      });
      const response = await page.goto(`${base}/`, { waitUntil:'networkidle', timeout:60000 });
      assert.equal(response.status(),200);
      await page.evaluate(async () => { for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,30));} });
      await page.waitForTimeout(2000);
      const layout = await page.evaluate(() => ({ width:innerWidth, scrollWidth:document.documentElement.scrollWidth, brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src), badAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>a.hash && !document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a=>a.outerHTML), heading:document.querySelector('h1').textContent, fonts:document.fonts.status }));
      report.layouts.push({ site:site.concept,...layout });
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({ path:`${out}/${site.concept}-${width}.png`, fullPage:true });
      const control = page.locator('[data-demo-action]').first();
      await control.click();assert(await page.locator('dialog').evaluate(d=>d.open));
      await page.keyboard.press('Escape');assert(!(await page.locator('dialog').evaluate(d=>d.open)));
      assert(await control.evaluate(c=>c===document.activeElement));
      if(site.concept==='vera-skincare') {
        await page.locator('.nl__input').fill('demo@example.invalid');
        const requests=[];page.on('request',r=>{if(r.method()==='POST')requests.push(r.url());});
        await page.locator('.nl__submit').click();assert(await page.locator('dialog').evaluate(d=>d.open));assert.equal(requests.length,0);
        await page.keyboard.press('Escape');
      }
      report.interactions.push({site:site.concept,width,dialogEscapeAndFocus:true});
      await page.close();
    }
  }
} catch(e) {report.errors.push(e.stack);}
finally { await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)); await browser.close();server.close(); }
console.log(JSON.stringify(report,null,2));
assert.equal(report.errors.length,0);
assert(report.layouts.every(l=>l.scrollWidth<=l.width+1),'Horizontal overflow');
assert(report.layouts.every(l=>l.badAnchors.length===0),'Broken section anchors');
assert(report.layouts.every(l=>l.brokenImages.length===0),'Unavailable source images');
assert(report.assets.every(a=>a.status===200),'Unavailable external dependency');
