import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const base='http://127.0.0.1:4334', output='artifacts/site-polish-review';
mkdirSync(output,{recursive:true});
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4334'],{stdio:'inherit'});
let browser;
try {
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{} if(i===99)throw Error('Preview not ready');await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/','/solutions/','/work/','/about/','/contact/']) {
  await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://aklov.pages.dev'+route);
  assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'),await page.title());
  for(const width of [320,390,640,768,1000,1001,1440,1920]){
   await page.setViewportSize({width,height:1000});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow at '+width);
   if(width===390||width===1440){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:output+'/'+(route==='/'?'home':route.split('/')[1])+'-'+width+'.png',fullPage:true});}
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(base);
 const services=page.locator('.service-list > a');assert.equal(await services.count(),5);
 assert.deepEqual(await services.evaluateAll(items=>items.map(a=>a.getAttribute('href'))),['/solutions/#website','/solutions/#customer','/solutions/#workflow','/solutions/#applications','/solutions/#integrations']);
 for(let i=0;i<5;i++){const link=services.nth(i);await link.focus();assert.equal(await link.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');assert.equal(await link.evaluate(el=>getComputedStyle(el).outlineColor),i%2===0?'rgb(21, 21, 21)':'rgb(216, 189, 120)');}
 assert.equal(await page.locator('.hero-actions .btn-gold').getAttribute('href'),'/contact/');
 await services.first().click();await page.waitForURL('**/solutions/#website');assert.ok(await page.locator('#website-title').isVisible());
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/work/?project=impex-automotive');
 const dialog=page.locator('[data-project-dialog]');await dialog.waitFor({state:'visible'});
 const lead=dialog.locator('.detail-lead'),copy=dialog.locator('.detail-copy');
 assert.ok((await lead.boundingBox()).y < (await copy.boundingBox()).y,'Mobile project proof must precede case-study copy');
 assert.equal(await dialog.getByText('View full size',{exact:true}).count(),0);
 await page.keyboard.press('Escape');
 for(const route of ['/','/solutions/','/about/','/contact/']){await page.goto(base+route);const menu=page.locator('.menu-toggle');await menu.click();await page.locator('#site-nav a[href="/work/"]').focus();await page.keyboard.press('Escape');assert.ok(await menu.evaluate(el=>el===document.activeElement));}
 assert.equal((await fetch(base+'/favicon.svg')).status,200);assert.equal((await fetch(base+'/images/generated/social-preview.png')).status,200);
 const sitemap=await(await fetch(base+'/sitemap.xml')).text();assert.equal((sitemap.match(/<loc>/g)||[]).length,5);assert.ok((await(await fetch(base+'/robots.txt')).text()).includes('/sitemap.xml'));
 const manifest=JSON.parse(readFileSync('.cache/media-manifest.json','utf8'));
 const savings=Object.entries(manifest).map(([source,data])=>({source,previewBytes:data.variants[0].bytes,largestPreviewBytes:data.variants.at(-1).bytes}));
 writeFileSync(output+'/media-delivery.json',JSON.stringify(savings,null,2));
 assert.deepEqual(errors,[]);console.log('Passed: five-page responsive review, service and inquiry journeys, theme-aware focus, menu restoration, earlier project media, metadata and static delivery.');
} finally {await browser?.close();server.kill('SIGTERM');}

