// Read-only rendered audit of the established Solutions page; no inquiries sent.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import sharp from 'sharp';
const base = 'http://127.0.0.1:4333';
const output = 'artifacts/solutions-review';
mkdirSync(output, {recursive:true});
const server = spawn('npm', ['run','preview','--','--host','127.0.0.1','--port','4333'], {stdio:'inherit'});
let browser;
const report = {pageErrors:[],layouts:[],drawing:[],image:{},links:[],mobileMenu:{}};
try {
  for (let i=0;i<100;i++) {
    try {if ((await fetch(base+'/solutions/')).ok) break;} catch {}
    if (i===99) throw new Error('Preview not ready.');
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',error=>report.pageErrors.push(error.message));
  await page.goto(base+'/solutions/');
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('.sol').count(),5);
  assert.equal(await page.locator('.sol-list li').count(),30);
  assert.equal(await page.locator('.step').count(),4);
  assert.equal(await page.locator('.arc').count(),0);
  assert.equal(await page.locator('.sol-summary > .sol-top > h2').count(),5);
  assert.equal(await page.locator('.sol-list > h3').count(),5);
  assert.equal((await page.locator('#page-title').innerText()).replace(/\s+/g,' ').trim(),'Better ways to run, connect and grow your business.');
  assert.equal(await page.locator('.idx').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
  assert.equal(await page.locator('.service-catalogue').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(245, 242, 234)');
  assert.equal(await page.locator('.sol.is-dark, .sol.is-deep').count(),0);
  assert.equal(await page.locator('.approach').evaluate(el=>getComputedStyle(el).backgroundColor),await page.locator('.choose').evaluate(el=>getComputedStyle(el).backgroundColor));
  assert.equal(await page.locator('.choose').evaluate(el=>getComputedStyle(el).color),'rgb(21, 21, 21)');
  const drawing = page.locator('[data-solutions-drawing]');
  assert.equal(await drawing.count(),1);
  assert.equal(await drawing.getAttribute('aria-hidden'),'true');
  assert.equal(await page.locator('[data-solutions-tablet]').count(),0);
  assert.equal(await page.locator('.hero-surface').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(245, 242, 234)');
  assert.equal(await page.locator('.hero-introduction .hero-actions .btn-dark').getAttribute('href'),'/contact/');
  const destinations=['website','customer','workflow','applications','integrations'];
  assert.deepEqual(await page.locator('.idx-row').evaluateAll(items=>items.map(a=>a.getAttribute('href'))),destinations.map(id=>'#'+id));
  for(const id of destinations) {
    const link=page.locator('.idx-row[href="#'+id+'"]');
    await link.click();await page.waitForURL('**/solutions/#'+id);
    assert.ok(await page.locator('#'+id+'-title').isVisible());
    assert.ok((await link.boundingBox()).height>=44);
  }
  await page.keyboard.press('Tab');
  await page.locator('.idx-row').first().focus();
  assert.equal(await page.locator('.idx-row').first().evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  assert.equal(await page.locator('.idx-row').first().evaluate(el=>getComputedStyle(el).outlineColor),'rgb(21, 21, 21)');
  await page.locator('.idx-row').first().evaluate(el=>el.blur());
  report.links=await page.locator('.hero-actions a, .sol-actions a, .choose-cta a, .closing-act a').evaluateAll(links=>links.map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')})));
  assert.equal(report.links.filter(link => link.href === '/contact/').length, 8);
  for(const width of [320,390,640,641,768,1000,1001,1280,1440,1920]) {
    await page.setViewportSize({width,height:1000});
    for(const line of await page.locator('.hero h1 > span').all()) {
      const bounds=await line.evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);const b=r.getBoundingClientRect();return {left:b.left,right:b.right};});
      assert.ok(bounds.left>=-1&&bounds.right<=width+1,'Solutions headline clips at '+width+': '+JSON.stringify(bounds));
    }
    assert.ok(await page.locator('.hero h1 .l2').evaluate(el=>parseFloat(getComputedStyle(el).paddingLeft)>0),'Emphasised headline line must retain its editorial indentation');
    const layout = await page.evaluate(() => {
      const bounds = selector => { const b=document.querySelector(selector).getBoundingClientRect(); return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}; };
      return {title:bounds('#page-title'),intro:bounds('.hero-introduction'),actions:bounds('.hero-actions'),art:bounds('.hero-art'),index:bounds('.idx')};
    });
    assert(layout.art.x >= 0 && layout.art.right <= width, 'Systems drawing should fit at ' + width);
    assert(layout.actions.y >= layout.intro.y && layout.actions.bottom <= layout.intro.bottom + 1, 'Actions must remain grouped with the introduction');
    assert(layout.intro.y >= layout.title.bottom, 'Copy must follow the wide headline');
    if (width > 640) {
      assert(layout.art.x >= layout.intro.right, 'Drawing must not overlap the copy');
      assert(layout.index.y >= Math.max(layout.art.bottom,layout.intro.bottom)-1, 'Index must follow the composition');
    } else {
      assert(layout.index.y >= layout.intro.bottom, 'Mobile service links must follow the copy');
      assert(layout.art.y >= layout.index.bottom, 'Mobile navigation must precede the decorative drawing');
      assert.equal(await drawing.locator('.drawing-labels').isVisible(),false,'Do not shrink diagram labels into unreadable mobile text');
    }
    assert.equal(await drawing.locator('svg').evaluate(el=>el.getAnimations({subtree:true}).length),0,'The systems drawing must remain static');
    for (const service of await page.locator('.sol').all()) {
      // Measure both columns in one frame: anchor smooth-scrolling can otherwise
      // change the viewport offset between separate boundingBox calls.
      const { summary, details } = await service.evaluate(element => {
        const bounds = selector => {
          const box = element.querySelector(selector).getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        };
        return { summary: bounds('.sol-summary'), details: bounds('.sol-body') };
      });
      if (width > 640) {
        assert.ok(details.x >= summary.x + summary.width, 'Service columns overlap at ' + width);
        assert.ok(Math.abs(details.y - summary.y) < 1, 'Service rows lose their shared top alignment');
      } else assert.ok(details.y >= summary.y + summary.height, 'Service content overlaps at ' + width + ': ' + JSON.stringify({ summary, details }));
    }
    if (width > 1000) {
      const steps = await page.locator('.step').evaluateAll(items => items.map(el => el.getBoundingClientRect().top));
      assert.ok(steps.every(top => Math.abs(top - steps[0]) < 1), 'Solutions process should read as one horizontal sequence');
    }
    report.drawing.push({width,fullyVisible:true,actionsGrouped:true,static:true,mobileIndexFirst:width<=640});
    report.layouts.push(await page.evaluate(()=>({width:innerWidth,height:document.documentElement.scrollHeight,overflow:[...document.querySelectorAll('.hero h1,.idx,.sol-title,.sol-goal,.sol-actions a,.sol-list,.steps,.closing-grid,.choose h2,.choose-grid,.sol-summary,.sol-body,.nav,.foot-links')].filter(el=>{if(!el.getClientRects().length)return false;const b=el.getBoundingClientRect();return b.left < -1 || b.right > innerWidth+1 || el.scrollWidth > el.clientWidth+1;}).map(el=>({class:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth,text:el.textContent.trim().slice(0,90)}))})));
  }
  const image=page.locator('.sols-figure img');
  await image.scrollIntoViewIfNeeded();
  await image.evaluate(img=>img.decode()).catch(()=>{});
  report.image=await image.evaluate(img=>({src:img.src,loaded:img.complete&&img.naturalWidth>0,width:img.naturalWidth,height:img.naturalHeight,alt:img.alt,explicitDimensions:img.hasAttribute('width')&&img.hasAttribute('height')}));
  assert.ok(report.image.loaded && report.image.explicitDimensions);
  assert.ok(report.image.src.includes('/images/generated/solutions/'));

  for (const [label,width] of [['desktop',1440],['tablet',768],['mobile',390],['narrow',320]]) {
    await page.setViewportSize({width,height:1000});
    const frame = await page.locator('.sols-figure').boundingBox();
    const expectedRatio = width === 1440 ? .8 : width === 768 ? 4/3 : 1;
    assert.ok(Math.abs(frame.width/frame.height - expectedRatio) < .01, 'Solutions image composition changed at ' + width);
    await page.locator('.sols-head').screenshot({path:output+'/solutions-image-section-'+label+'.png'});
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:output+'/solutions-'+label+'.png',fullPage:true});
    await page.screenshot({path:output+'/solutions-hero-'+label+'.png'});
    await drawing.screenshot({path:output+'/solutions-drawing-'+label+'.png'});
    if(width===1440||width===390){const visual=await sharp(await page.screenshot()).resize({width:Math.min(width,960)}).jpeg({quality:65}).toBuffer();console.log('VISUAL_REVIEW_SOLUTIONS_'+width+':'+visual.toString('base64'));}
  }
  assert.ok(report.layouts.every(layout => layout.overflow.length === 0), JSON.stringify(report.layouts));
  await page.setViewportSize({width:390,height:844});
  const menu=page.locator('.menu-toggle');
  await menu.click();
  assert.equal(await menu.getAttribute('aria-expanded'),'true');
  await page.locator('#site-nav a[href="/work/"]').focus();
  await page.keyboard.press('Escape');
  report.mobileMenu.escapeCloses=(await menu.getAttribute('aria-expanded'))==='false';
  report.mobileMenu.escapeReturnsFocus=await menu.evaluate(el=>el===document.activeElement);
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const fallback=await noJS.newPage();
  await fallback.goto(base+'/solutions/');
  report.mobileMenu.noJSNavigationVisible=await fallback.locator('#site-nav').isVisible();
  assert.ok(report.mobileMenu.escapeReturnsFocus);
  assert.ok(report.mobileMenu.noJSNavigationVisible);
  await noJS.close();
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await drawing.locator('svg').evaluate(el=>el.getAnimations({subtree:true}).length),0);
  assert.deepEqual(report.pageErrors,[]);
  console.log('SOLUTIONS_AUDIT',JSON.stringify(report));
  writeFileSync(output+'/audit.json',JSON.stringify(report,null,2));
} finally {await browser?.close();server.kill('SIGTERM');}




