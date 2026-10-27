import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = 'http://127.0.0.1:4338';
const output = 'artifacts/continuity-review';
mkdirSync(output, {recursive:true});
const server = spawn('npm', ['run','preview','--','--host','127.0.0.1','--port','4338'], {stdio:'inherit'});
let browser;
try {
  for (let i=0;i<100;i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    if (i===99) throw Error('Preview did not start');
    await new Promise(r=>setTimeout(r,100));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.addInitScript(() => {
    window.revealEvents=[];
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(...args) {
      if(this.hasAttribute('data-reveal')) window.revealEvents.push({tag:this.tagName,text:this.textContent.trim().slice(0,50)});
      return animate.apply(this,args);
    };
  });
  const routes=[['/','.sv-head h2'],['/solutions/','.sol > .wrap'],['/about/','.approach-closing'],['/contact/','.closing-note p']];
  for(const [route,selector] of routes) {
    await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('h1').evaluate(el=>el.getAnimations().length),0,'Initial headline remains immediate');
    const target=page.locator(selector).first();
    const before=await target.evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,offset:el.offsetTop,height:document.documentElement.scrollHeight}));
    await page.evaluate(top=>scrollTo({top:top-innerHeight*.7,behavior:'instant'}),before.top);
    await page.waitForFunction(selector=>document.querySelector(selector).getAnimations().some(a=>a.id==='editorial-reveal'),selector);
    await target.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));
    assert.equal(await target.evaluate(el=>getComputedStyle(el).opacity),'1');
    assert.equal(await target.evaluate(el=>el.offsetTop),before.offset,'Reveal cannot reflow the document');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),before.height);
  }

  // The same content can arrive again when scrolling back; jitter at the edge cannot restart it.
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  const heading=page.locator('.sv-head h2');
  const position=await heading.evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,height:el.offsetHeight}));
  await page.evaluate(p=>scrollTo({top:p.top-innerHeight*.65,behavior:'instant'}),position);
  await page.waitForFunction(()=>window.revealEvents.some(e=>e.text.startsWith('Make the moving')));
  await page.waitForTimeout(750);
  await page.evaluate(p=>scrollTo({top:p.top+p.height+140,behavior:'instant'}),position);
  await page.waitForTimeout(100);
  await page.evaluate(p=>scrollTo({top:p.top-innerHeight*.35,behavior:'instant'}),position);
  await page.waitForFunction(()=>window.revealEvents.filter(e=>e.text.startsWith('Make the moving')).length===2);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await heading.evaluate(el=>el.getAnimations().length),0,'Preference changes immediately settle active reveals');

  const reduced=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});
  const still=await reduced.newPage();
  for(const [route] of routes) {
    await still.goto(base+route);await still.evaluate(()=>document.fonts.ready);
    for(const target of await still.locator('[data-reveal]').all()) {
      await target.scrollIntoViewIfNeeded();
      assert.equal(await target.evaluate(el=>el.getAnimations().length),0);
      assert.equal(await target.evaluate(el=>getComputedStyle(el).opacity),'1');
    }
    assert(await still.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await still.screenshot({path:output+'/'+(route==='/'?'home':route.split('/')[1])+'-mobile.png',fullPage:true});
  }
  await still.goto(base+'/solutions/');await still.evaluate(()=>document.fonts.ready);
  const firstService=await still.locator('#website').evaluate(el=>el.getBoundingClientRect().top+scrollY);
  assert(firstService<2500,'The compact bridge must bring mobile services forward: '+firstService);
  assert.equal(await still.locator('.intro .sols-head').count(),1,'The photo supports the shared introductory spread');
  await still.goto(base+'/about/');await still.evaluate(()=>document.fonts.ready);
  await still.locator('.experience-proof img').scrollIntoViewIfNeeded();
  assert(await still.locator('.experience-proof img').evaluate(img=>img.complete&&img.naturalWidth>0));
  assert((await still.locator('.intro-profile p').first().innerText()).startsWith("I'm Loveth Akpochimora"));
  await still.setViewportSize({width:1920,height:1000});
  const axes=await still.evaluate(()=>{
    const left=selector=>document.querySelector(selector).getBoundingClientRect().left;
    return {hero:left('.identity-first'),body:left('.biography .section-heading')};
  });
  assert(Math.abs(axes.hero-axes.body)<1,'About body and hero share a wide-screen outer axis');

  for(const [route,selector] of [['/about/','.experience'],['/solutions/','.intro']]) {
    await still.goto(base+route);await still.evaluate(()=>document.fonts.ready);
    await still.locator(selector).scrollIntoViewIfNeeded();
    await still.screenshot({path:output+'/'+route.split('/')[1]+'-spread.png'});
    const capture=await sharp(await still.screenshot()).resize({width:960}).jpeg({quality:58}).toBuffer();
    console.log('VISUAL_CONTINUITY_'+route.split('/')[1].toUpperCase()+':'+capture.toString('base64'));
  }
  await reduced.close();
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const fallback=await noJS.newPage();
  for(const [route] of routes) {
    await fallback.goto(base+route);
    assert.deepEqual(await fallback.locator('[data-reveal]').evaluateAll(items=>items.filter(el=>getComputedStyle(el).opacity!=='1'||getComputedStyle(el).visibility==='hidden'||el.hidden).map(el=>el.tagName)),[],route+' no-JS content must remain visible');
  }
  await noJS.close();
  await page.goto(base+'/work/');
  assert.equal(await page.locator('[data-showroom] [data-reveal], form [data-reveal]').count(),0,'Do not compete with the immersive scene or form controls');
  assert.deepEqual(errors,[]);
  console.log('Passed: real scroll reveals in four pages, upward re-entry, no reflow, dynamic reduced motion, no-JS visibility, compact Solutions bridge and wide About alignment.');
} finally { await browser?.close();server.kill('SIGTERM'); }
