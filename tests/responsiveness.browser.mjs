import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import sharp from 'sharp';

const base='http://127.0.0.1:4342',out='artifacts/responsiveness';
const audit=process.env.RESPONSIVE_AUDIT==='1';
const routes=[['home','/'],['solutions','/solutions/'],['about','/about/'],['contact','/contact/']];
const screens=[{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:640,height:360},{width:641,height:900},{width:768,height:1024},{width:820,height:1180},{width:844,height:390},{width:1000,height:768},{width:1001,height:768},{width:1024,height:768},{width:1440,height:1000}];
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4342'],{stdio:'inherit'});
const report={layouts:[],interactions:[],issues:[]};let browser,submissions=0;
const record=(condition,message)=>{if(!condition)report.issues.push(message);};
async function open(page,path){await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);}
async function capture(page,label){const file=`${out}/${label}.png`;await page.screenshot({path:file,fullPage:true});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));const b=await sharp(await page.screenshot()).resize({width:Math.min(720,page.viewportSize().width)}).jpeg({quality:55}).toBuffer();console.log(`RESPONSIVE_VISUAL_${label}:${b.toString('base64')}`);}
try{
 await mkdir(out,{recursive:true});for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();
 const context=await browser.newContext({viewport:screens[0],isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
 // Exercise local layout without generating contact submissions or using live captcha tokens.
 await context.route('https://web3forms.com/client/script.js',route=>route.fulfill({contentType:'application/javascript',body:`const widget=document.querySelector('.h-captcha');if(widget){widget.textContent='Spam check — layout fixture';widget.style.cssText='width:164px;height:144px;border:1px solid #77766f;padding:12px;font-size:12px';}`}));
 await context.route('https://api.web3forms.com/**',route=>{submissions++;return route.abort();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [name,path] of routes){
  await open(page,path);const approved=await page.locator('main').textContent();
  for(const screen of screens){
   await page.setViewportSize(screen);await page.evaluate(()=>new Promise(requestAnimationFrame));
   const metrics=await page.evaluate(()=>{
    const visible=e=>e.getClientRects().length&&!e.closest('[hidden],[aria-hidden="true"],.honey');
    const label=e=>e.id||e.className||e.tagName;
    const bounds=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    for(let node;node=walker.nextNode();){const e=node.parentElement;if(!node.textContent.trim()||!visible(e)||e.closest('script,style,svg,iframe'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width&&r.height&&(r.left < -2||r.right>innerWidth+2)){bounds.push({element:label(e),text:node.textContent.trim().slice(0,90),left:r.left,right:r.right});break;}}
    const controls=[...document.querySelectorAll('a[href],button:not(:disabled),input:not([type="hidden"]),select,textarea')].filter(visible).filter(e=>!e.closest('p:not(.project-type),.honey')||e.matches('.email-shortcut,.direct-links a')).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent.trim().slice(0,65),tag:e.tagName,height:r.height,width:r.width,left:r.left,right:r.right};});
    const small=controls.filter(e=>e.height<43.5||e.width<23.5);
    const outside=controls.filter(e=>e.left<-.5||e.right>innerWidth+.5);
    const pairs=[['.hero-copy-block','.hero-joint'],['.hero-introduction','.hero-art'],['.hero-heading','.hero-portrait'],['.hero-opening','.hero-portrait'],['.contact-introduction','.form-column'],['.direct-contact','.form-column'],['.biography .section-heading','.biography-copy']];
    const overlap=pairs.flatMap(([a,b])=>{const one=document.querySelector(a),two=document.querySelector(b);if(!one||!two||!visible(one)||!visible(two))return [];const r=one.getBoundingClientRect(),s=two.getBoundingClientRect();return Math.min(r.right,s.right)-Math.max(r.left,s.left)>2&&Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>2?[{a,b}]:[];});
    const form=[...document.querySelectorAll('.field input,.field textarea,.field select')].map(e=>({name:e.name,size:parseFloat(getComputedStyle(e).fontSize),width:e.clientWidth}));
    return {width:innerWidth,height:innerHeight,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,textOverflow:bounds,smallControls:small,outsideControls:outside,overlap,form};
   });
   report.layouts.push({name,...metrics});
   record(!metrics.pageOverflow,`${name} ${screen.width}×${screen.height}: page overflow`);
   for(const issue of metrics.textOverflow)record(false,`${name} ${screen.width}: clipped text ${JSON.stringify(issue)}`);
   for(const issue of metrics.smallControls)record(false,`${name} ${screen.width}: small target ${JSON.stringify(issue)}`);
   record(!metrics.outsideControls.length,`${name} ${screen.width}: controls outside viewport ${JSON.stringify(metrics.outsideControls)}`);
   record(!metrics.overlap.length,`${name} ${screen.width}: overlapping composition ${JSON.stringify(metrics.overlap)}`);
   record(metrics.form.every(f=>f.size>=16&&f.width>=120),`${name} ${screen.width}: form readability`);
   if(screen.width===390||screen.width===768){await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('img')].map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));});await capture(page,`${name}_${screen.width}`);}
  }
  assert.equal((await page.locator('main').textContent()).replace(/\s+/g,' ').trim(),approved.replace(/\s+/g,' ').trim(),`${name}: content changed with viewport size`);
  // Native touch menu and navigation in a short phone viewport.
  await page.setViewportSize({width:390,height:360});await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  const menu=page.locator('.menu-toggle');await menu.tap();assert.equal(await menu.getAttribute('aria-expanded'),'true');
  for(const link of await page.locator('#site-nav a').all()){await link.scrollIntoViewIfNeeded();assert.ok(await link.evaluate(e=>{const r=e.getBoundingClientRect(),at=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e===at||e.contains(at);}),'Menu link must remain reachable on short screens');}
  await menu.tap();assert.equal(await menu.getAttribute('aria-expanded'),'false');
  report.interactions.push(`${name}: short-screen native menu and all navigation targets`);
 }
 await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log('RESPONSIVENESS_LAYOUT_REPORT:'+JSON.stringify(report));
 // Ordinary phone interactions also survive orientation changes.
 await page.setViewportSize({width:390,height:844});await open(page,'/');
 await page.locator('.hero-actions .text-link').tap();await page.waitForURL('**/#selected-work');assert.ok(await page.locator('#selected-work-title').isVisible());
 await page.setViewportSize({width:844,height:390});await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('.selected-project').count(),3);
 await open(page,'/solutions/');for(const link of await page.locator('.idx-row').all()){await link.tap();const href=await link.getAttribute('href');await page.waitForURL('**/'+href);const rect=await page.locator(href).boundingBox();assert.ok(rect.y>=-2&&rect.y<page.viewportSize().height,'Service anchor should bring its section into view');}
 await open(page,'/contact/');await page.locator('#inquiry-name').fill('Layout review');await page.locator('#inquiry-email').fill('review@example.com');await page.locator('#inquiry-message').fill('Local responsiveness check only; do not send.');
 for(const viewport of [{width:390,height:420},{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(viewport);await page.locator('#inquiry-message').focus();await page.locator('#inquiry-message').scrollIntoViewIfNeeded();assert.equal(await page.locator('#inquiry-name').inputValue(),'Layout review');assert.equal(await page.locator('#inquiry-email').inputValue(),'review@example.com');assert.equal(await page.locator('#inquiry-message').inputValue(),'Local responsiveness check only; do not send.');}
 assert.equal(submissions,0,'Responsiveness review must not send contact submissions');
 report.interactions.push('Home selected-work touch link; Solutions service anchors; contact field values/focus across height and orientation changes; no contact submission');
 await open(page,'/');await page.emulateMedia({reducedMotion:'no-preference'});const sky=page.locator('[data-hero-sky]');await page.locator('[data-sky-toggle]').tap();assert.equal(await sky.getAttribute('data-paused'),'true');await page.locator('[data-sky-toggle]').tap();assert.equal(await sky.getAttribute('data-paused'),'false');
 report.interactions.push('Native phone starfield pause and resume');assert.deepEqual(errors,[]);await context.close();
 await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log('RESPONSIVENESS_REPORT:'+JSON.stringify(report));
 if(!audit)assert.deepEqual(report.issues,[],'Responsive layout and touch target audit');
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();server.kill('SIGTERM');}
