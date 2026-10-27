import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base='http://127.0.0.1:4346', output='artifacts/continuity-review';
mkdirSync(output,{recursive:true});
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4346'],{stdio:'inherit'});
let browser;
const text=string=>string.replace(/\s+/g,' ').trim();
const routes=[['/','.sv-head h2'],['/solutions/','#intro-title'],['/about/','#biography-title'],['/contact/','.closing-note p']];
const position=target=>target.evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,height:el.offsetHeight,text:el.textContent}));
const place=(page,top,fraction)=>page.evaluate(({top,fraction})=>scrollTo({top:top-innerHeight*fraction,behavior:'instant'}),{top,fraction});
try {
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}if(i===99)throw Error('Preview not ready');await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch();
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:output+'/motion-video',size:{width:960,height:720}}});
  await context.addInitScript(()=>{
    window.typeEvents=[];
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(...args){
      if(this.classList.contains('motion-ink'))window.typeEvents.push({heading:this.closest('[data-motion="type"]').textContent.trim(),top:this.parentElement.getBoundingClientRect().top,frames:args[0],options:args[1]});
      return animate.apply(this,args);
    };
  });
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const measurements=[];
  for(const [route,selector] of routes){
    await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);
    const target=page.locator(selector).first();
    await target.waitFor();await page.waitForFunction(s=>document.querySelector(s).dataset.motionState==='armed',selector);
    const before=await position(target);
    const height=await page.evaluate(()=>document.documentElement.scrollHeight);
    await place(page,before.top,.84);await page.waitForTimeout(220);
    assert.equal(await target.getAttribute('data-motion-state'),'armed','Do not perform an entrance in the bottom sliver of the viewport');
    assert.equal(await page.evaluate(()=>window.typeEvents.length),0);
    await place(page,before.top,.25);
    await page.waitForFunction(()=>window.typeEvents.length>0);
    const events=await page.evaluate(()=>window.typeEvents);
    assert(events.every(event=>event.top<=680),'Type starts after entering the reading area');
    assert(events.every(event=>event.options.duration>=1000&&event.frames.every(frame=>!('opacity'in frame))),'Crisp type unfolds without fading a column');
    assert.equal(await target.evaluate(el=>getComputedStyle(el).opacity),'1');
    assert.deepEqual(await page.locator('.reading-copy p,.intro-profile p,.intro-context p,.service h3,.service-body p,.project-copy').evaluateAll(items=>items.filter(el=>getComputedStyle(el).opacity!=='1'||getComputedStyle(el).translate!=='none').map(el=>el.className)),[],'Reading copy never fades or moves');
    await page.waitForFunction(s=>document.querySelector(s).dataset.motionState==='settled',selector);
    assert.equal(text(await target.textContent()),text(before.text));
    assert.equal((await position(target)).height,before.height);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),height);
    const count=await page.evaluate(()=>window.typeEvents.length);
    await place(page,before.top+before.height+180,0);await page.waitForTimeout(150);
    await place(page,before.top,.25);await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>window.typeEvents.length),count,'Returning to read cannot replay or blink');
    measurements.push({route,startsAt:Math.round(events[0].top),duration:events[0].options.duration,settledOnReturn:true});
  }
  // Capture actual intermediate frames, not only the final composition.
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  const heading=page.locator('.sv-head h2');await page.waitForFunction(()=>document.querySelector('.sv-head h2').dataset.motionState==='armed');
  const headingBox=await position(heading);
  await place(page,headingBox.top,.25);await page.waitForFunction(()=>window.typeEvents.some(e=>e.heading.startsWith('Make the moving')));
  const frames=[];
  for(const delay of [100,350,700]){
    await page.waitForTimeout(delay);
    const box=await heading.boundingBox();
    frames.push(await sharp(await page.screenshot({clip:{x:Math.max(0,box.x-8),y:Math.max(0,box.y-12),width:Math.min(1400,box.width+16),height:Math.min(600,box.height+24)}})).resize({width:480}).png().toBuffer());
  }
  const sizes=await Promise.all(frames.map(buffer=>sharp(buffer).metadata()));
  const strip=await sharp({create:{width:480,height:sizes.reduce((sum,s)=>sum+s.height,0),channels:3,background:'#f5f2ea'}}).composite(frames.map((input,i)=>({input,left:0,top:sizes.slice(0,i).reduce((sum,s)=>sum+s.height,0)}))).jpeg({quality:65}).toBuffer();
  console.log('VISUAL_MOTION_TYPE:'+strip.toString('base64'));

  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  const step=page.locator('.principle').first();await page.waitForFunction(()=>document.querySelector('.principle').hasAttribute('data-motion-ready'));
  const stepBox=await position(step);
  await place(page,stepBox.top,.65);await page.waitForTimeout(120);
  const middle=await step.evaluate(el=>Number(el.style.getPropertyValue('--motion-progress')));
  assert(middle>.15&&middle<.8,'Process structure draws over a reading distance');
  await place(page,stepBox.top,.4);await page.waitForTimeout(120);
  assert.equal(await step.evaluate(el=>Number(el.style.getPropertyValue('--motion-progress'))),1);
  await place(page,stepBox.top,.65);await page.waitForTimeout(120);
  assert.equal(await step.evaluate(el=>Number(el.style.getPropertyValue('--motion-progress'))),1,'Read structure stays drawn');
  assert.equal(await step.locator('h3').evaluate(el=>getComputedStyle(el).translate),'none');
  const service=page.locator('.service').first();await service.hover();await page.waitForTimeout(250);
  assert.equal(await service.locator('h3').evaluate(el=>getComputedStyle(el).transform),'matrix(1, 0, 0, 1, 5, 0)','Existing hover remains separate');
  assert.equal(await page.locator('.selected-project[data-motion],.project-display[data-motion],.project-copy[data-motion]').count(),0);

  await page.goto(base+'/solutions/');await page.evaluate(()=>document.fonts.ready);
  const photo=page.locator('.sols-figure');await page.waitForFunction(()=>document.querySelector('.sols-figure').hasAttribute('data-motion-ready'));
  const photoBox=await position(photo);
  await place(page,photoBox.top,.7);await page.waitForTimeout(120);
  const scale=await photo.locator('img').evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
  assert(scale>1&&scale<1.055,'Photograph settles inside a stationary frame');
  await place(page,photoBox.top,.19);
  await page.waitForFunction(()=>new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.sols-figure img')).transform).a===1);
  assert.equal(await photo.locator('img').evaluate(el=>new DOMMatrixReadOnly(getComputedStyle(el).transform).a),1);
  assert.equal(await photo.evaluate(el=>getComputedStyle(el).opacity),'1');
  const firstService=await page.locator('#website').evaluate(el=>el.getBoundingClientRect().top+scrollY);
  assert(firstService<2000,'Keep the tighter Solutions bridge');

  // Dynamic reduced motion immediately returns crisp, complete type.
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  const motionHeading=page.locator('.sv-head h2'), motionPosition=await position(motionHeading);
  await place(page,motionPosition.top,.25);await page.waitForFunction(()=>document.getAnimations().some(a=>a.id==='editorial-type'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>!document.getAnimations().some(a=>a.id==='editorial-type'));
  assert(await motionHeading.locator('.motion-ink').evaluateAll(items=>items.every(el=>getComputedStyle(el).translate==='none')));
  await context.close();

  // Splitting must retain exact native typography geometry and emphasis.
  const moving=await browser.newContext();const reduced=await browser.newContext({reducedMotion:'reduce'});
  const animated=await moving.newPage(), still=await reduced.newPage();
  for(const width of [390,1440,1920]){
    await animated.setViewportSize({width,height:1000});await still.setViewportSize({width,height:1000});
    for(const [route] of routes){
      await Promise.all([animated.goto(base+route),still.goto(base+route)]);
      await Promise.all([animated.evaluate(()=>document.fonts.ready),still.evaluate(()=>document.fonts.ready)]);
      const geometry=page=>page.locator('[data-motion="type"]').evaluateAll(items=>items.map(el=>({height:el.offsetHeight,width:el.offsetWidth,text:el.textContent})));
      assert.deepEqual(await geometry(animated),await geometry(still),'Typography layout changes at '+width+' on '+route);
      assert(await animated.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.equal(await still.locator('.motion-ink,[data-motion-ready]').count(),0,'Reduced motion retains native markup');
    }
  }
  await moving.close();await reduced.close();
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const fallback=await noJS.newPage();
  for(const [route] of routes){await fallback.goto(base+route);assert.equal(await fallback.locator('.motion-ink,[data-motion-ready]').count(),0);assert(await fallback.locator('[data-motion]').evaluateAll(items=>items.every(el=>getComputedStyle(el).opacity==='1'&&getComputedStyle(el).visibility==='visible')));}
  await noJS.close();assert.deepEqual(errors,[]);
  console.log('EDITORIAL_MOTION_MEASUREMENTS:'+JSON.stringify(measurements));
  console.log('Passed: reading-area line entrances, no opacity flashes or replay, stationary copy/gallery, scroll-drawn process, framed photograph, original hover, exact typography geometry, reduced motion and no-JS access.');
}finally{await browser?.close();server.kill('SIGTERM');}
