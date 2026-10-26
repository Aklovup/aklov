import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import sharp from 'sharp';
const base='http://127.0.0.1:4321',out='artifacts/showroom';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4321'],{stdio:'inherit'});
let browser;const report={checks:[],viewports:[]};
async function visual(file,label){const buffer=await sharp(file).resize({width:720,withoutEnlargement:true}).jpeg({quality:60}).toBuffer();console.log(`VISUAL_REVIEW_${label}:${buffer.toString('base64')}`);}
async function goto(page,path='/work/'){await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('[data-showroom][data-ready="true"][data-arrival="ready"]');}
async function view(page,value){await page.waitForFunction(v=>document.querySelector('[data-showroom]').dataset.view===v,value);}
async function ready(page){await page.waitForSelector('[data-showroom][data-room-ready="true"]');}
async function wheel(page,y,x=0){await page.mouse.move(20,340);await page.mouse.wheel(x,y);}
async function station(page,name){await page.locator('[data-showroom]').evaluate((r,name)=>r.dispatchEvent(new CustomEvent('aklov:room-station',{detail:name})),name);await ready(page);}
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/work/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 await mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:.7,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let release;const gate=new Promise(r=>release=r);await context.route('**/_astro/*.js',async route=>{await gate;await route.continue();});
 try{await page.goto(base+'/work/',{waitUntil:'commit'});await page.locator('[data-showroom-arrival]').waitFor({state:'visible'});assert.equal(await page.locator('.showroom-fallback').isVisible(),false);await page.screenshot({path:out+'/arrival.png'});}finally{release();}
 await page.waitForSelector('[data-showroom][data-arrival="ready"][data-ready="true"]');await context.unroute('**/_astro/*.js');await page.screenshot({path:out+'/neutral-showroom.png'});await visual(out+'/neutral-showroom.png','SHOWROOM');
 assert.equal(await page.locator('dialog').count(),0);assert.equal(await page.locator('[data-showroom-model]').count(),4);
 // Repeated vertical wheel events continue to travel instead of locking after the first gesture.
 for(const delta of [80,80,-80,-80]){const before=Number(await page.locator('[data-showroom]').getAttribute('data-camera-z'));await wheel(page,delta);await page.waitForFunction(before=>Number(document.querySelector('[data-showroom]').dataset.cameraZ)!==before,before);}
 // Turning and switching to touch must also work while paused midway along a wheel-driven showroom route.
 await wheel(page,80);const exteriorHeading=await page.locator('[data-showroom]').getAttribute('data-camera-heading');
 await page.locator('[data-showroom-model]').first().hover();await page.mouse.wheel(75,0);await page.waitForFunction(before=>document.querySelector('[data-showroom]').dataset.cameraHeading!==before,exteriorHeading);
 const exteriorTouch=await context.newCDPSession(page),touchBefore=await page.locator('[data-showroom]').getAttribute('data-camera-heading');
 await exteriorTouch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:400,y:350}]});await exteriorTouch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:470,y:350}]});await exteriorTouch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForFunction(before=>document.querySelector('[data-showroom]').dataset.cameraHeading!==before,touchBefore);await exteriorTouch.detach();await page.waitForTimeout(400);await wheel(page,-80);
 const point=await page.locator('[data-showroom-model="applications"]').evaluate(b=>({x:Number(b.dataset.worldX),y:Number(b.dataset.worldY)}));await page.mouse.click(point.x,point.y);await view(page,'category');
 await page.locator('[data-showroom-room="impex-automotive"]').click();await ready(page);
 assert.equal(await page.locator('[data-showroom]').getAttribute('data-wall-mounted'),'true');assert.equal(await page.locator('[data-showroom]').getAttribute('data-wall-angle'),'90');
 assert.equal(await page.locator('[data-showroom]').getAttribute('data-visible-room'),'impex-automotive');assert.equal(await page.locator('[data-showroom-exit]').isVisible(),false);
 const matrix=await page.locator('[data-wall-story]').evaluate(e=>getComputedStyle(e).transform);assert.ok(matrix.startsWith('matrix3d('));
 const primary=page.locator('[data-exhibit-stage] [data-media-id]');const initial=await primary.getAttribute('data-media-id');
 assert.equal(await page.locator('[data-media-choice]').count(),2);
 const ratio=await page.locator('[data-media-layout]').evaluate(e=>{const c=getComputedStyle(e).gridTemplateColumns.split(' ').map(Number.parseFloat);return c[0]/c[1];});assert.ok(Math.abs(ratio-3)<.02);
 await page.screenshot({path:out+'/media-wall.png'});
 const chosen=await page.locator('[data-media-choice]').first().getAttribute('data-media-choice');await page.locator('[data-media-choice]').first().click();
 assert.equal(await primary.getAttribute('data-media-id'),chosen);assert.equal(await page.locator('[data-media-choice]').first().getAttribute('data-media-choice'),initial);
 await page.waitForFunction(({chosen})=>JSON.parse(document.querySelector('[data-showroom]').dataset.previewMedia||'{}')['impex-automotive']===chosen,{chosen});
 await page.locator('[data-showroom-home]').click();await view(page,'showroom');await page.locator('[data-showroom-model="applications"]').click();await page.locator('[data-showroom-room="impex-automotive"]').click();await ready(page);
 assert.equal(await primary.getAttribute('data-media-id'),chosen);assert.equal(await page.locator('[data-media-choice]').first().getAttribute('data-media-choice'),initial);
 const play=page.locator('[data-exhibit-stage] [data-gif-toggle]');await play.click();await page.waitForFunction(()=>document.querySelector('[data-exhibit-stage] [data-gif-toggle]').getAttribute('aria-pressed')==='true');await play.click();
 // A tap on a lifted GIF remains an activation, not a scroll capture.
 await page.locator('[data-exhibit-stage]').click();await page.waitForSelector('[data-lift-display]:not([hidden])');
 assert.equal(await page.locator('[data-exhibit-stage]>[data-exhibit-asset]').evaluate(e=>getComputedStyle(e).visibility),'hidden');assert.equal(await page.locator('[data-exhibit-media-controls]').isVisible(),true);const liftedPlay=page.locator('[data-media-lift-scroll] [data-gif-toggle]');await liftedPlay.tap();await page.waitForFunction(()=>document.querySelector('[data-media-lift-scroll] [data-gif-toggle]').getAttribute('aria-pressed')==='true');await liftedPlay.tap();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[data-showroom]').dataset.mediaLift==='closed');
 assert.equal(await page.locator('[data-exhibit-stage]>[data-exhibit-asset]').evaluate(e=>getComputedStyle(e).visibility),'visible');await station(page,'story');assert.equal(await page.locator('[data-showroom]').getAttribute('data-room-station'),'story');
 assert.equal(await page.locator('[data-exhibit-chapters],[data-story-next],[data-story-prev]').count(),0);
 await page.locator('[data-story-launch]').click();await page.waitForFunction(()=>document.querySelector('[data-lift-display]').dataset.kind==='story'&&document.querySelector('[data-showroom]').dataset.mediaLift==='open');
 assert.equal(await page.locator('[data-story-launch]').evaluate(e=>getComputedStyle(e).visibility),'hidden');assert.equal(await page.locator('[data-wall-story]').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(21, 21, 21)');const reader=page.locator('[data-media-lift-scroll]');
 assert.equal(await page.locator('[data-lift-display]').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(245, 242, 234)');
 assert.ok((await reader.locator('h2').evaluate(e=>getComputedStyle(e).fontFamily)).includes('Instrument Serif'));
 assert.deepEqual(await reader.locator('.case-copy h3').allTextContents(),['Overview','The challenge','What I built','The outcome','Technologies']);
 await page.screenshot({path:out+'/editorial-story.png'});await visual(out+'/editorial-story.png','STORY');
 await reader.hover();await page.mouse.wheel(0,500);await page.waitForFunction(()=>document.querySelector('[data-media-lift-scroll]').scrollTop>0);
 await reader.focus();await page.keyboard.press('End');assert.ok(await reader.evaluate(e=>e.scrollTop>0));await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[data-showroom]').dataset.mediaLift==='closed');
 assert.equal(await page.locator('[data-story-launch]').evaluate(e=>document.activeElement===e),true);assert.equal(await page.locator('[data-story-launch]').evaluate(e=>getComputedStyle(e).visibility),'visible');
 await page.screenshot({path:out+'/story-wall.png'});await visual(out+'/story-wall.png','COVER');
 const navigationTarget=page.locator('[data-story-launch]');
 const headingBefore=Number(await page.locator('[data-showroom]').getAttribute('data-room-heading'));
 await navigationTarget.hover();await page.mouse.wheel(60,0);await page.waitForFunction(before=>Number(document.querySelector('[data-showroom]').dataset.roomHeading)!==before,headingBefore);
 await station(page,'story');await navigationTarget.hover();await page.mouse.wheel(0,100);await page.waitForFunction(()=>Number(document.querySelector('[data-showroom]').dataset.roomX)>-.9);const beforeX=Number(await page.locator('[data-showroom]').getAttribute('data-room-x'));
 await navigationTarget.hover();await page.mouse.wheel(0,-80);await page.waitForFunction(before=>Number(document.querySelector('[data-showroom]').dataset.roomX)<before,beforeX);
 assert.equal(await page.locator('[data-showroom]').getAttribute('data-view'),'project');
 // Touch and pen are independent of the previous wheel or mouse sequence.
 const cdp=await context.newCDPSession(page);
 const touchHeading=Number(await page.locator('[data-showroom]').getAttribute('data-room-heading'));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:400,y:350}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:470,y:350}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.notEqual(Number(await page.locator('[data-showroom]').getAttribute('data-room-heading')),touchHeading);
 const penHeading=Number(await page.locator('[data-showroom]').getAttribute('data-room-heading'));
 await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:400,y:350,button:'left',buttons:1,clickCount:1,pointerType:'pen'});
 await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:470,y:350,button:'left',buttons:1,pointerType:'pen'});
 await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:470,y:350,button:'left',buttons:0,clickCount:1,pointerType:'pen'});
 assert.notEqual(Number(await page.locator('[data-showroom]').getAttribute('data-room-heading')),penHeading);
 await cdp.detach();await page.waitForTimeout(400);
 await station(page,'story');
 const cameraMatrix=await page.locator('[data-wall-media]').evaluate(e=>getComputedStyle(e.parentElement).transform);
 await wheel(page,0,150);await page.waitForFunction(previous=>getComputedStyle(document.querySelector('[data-wall-media]').parentElement).transform!==previous,cameraMatrix);
 // Turn back toward the front wall before retreating through the actual rear doorway.
 await station(page,'media');
 for(let i=0;i<8;i++){if(await page.locator('[data-showroom]').getAttribute('data-view')==='showroom')break;await wheel(page,-350);}
 await view(page,'showroom');assert.equal(new URL(page.url()).searchParams.has('room'),false);assert.equal(new URL(page.url()).searchParams.has('model'),false);
 await page.goBack();assert.ok(new URL(page.url()).searchParams.has('model'));await page.goForward();await view(page,'showroom');
 await page.locator('[data-showroom-index-open]').click();await page.locator('[data-group="all"]').click();assert.equal(await page.locator('[data-project]:not([hidden])').count(),10);
 await page.locator('[data-group="client"]').click();for(const [category,count]of [['applications',2],['websites',3],['customer-systems',2],['automation',5],['integrations',7]]){await page.locator(`[data-category-filters="client"] [data-filter="${category}"]`).click();assert.equal(await page.locator('[data-project]:not([hidden])').count(),count);}
 const projects=await page.locator('#showroom-data').evaluate(e=>JSON.parse(e.textContent));
 for(const project of projects){if(!await page.locator('[data-showroom-index]').isVisible())await page.locator('[data-showroom-index-open]').click();await page.locator('[data-group="all"]').click();await page.locator(`[data-project-open="${project.slug}"]`).click();await ready(page);assert.equal(await page.locator('[data-exhibit-title]').innerText(),project.title);assert.equal(await page.locator('[data-showroom]').getAttribute('data-visible-room'),project.slug);if(project.slug==='vera-skincare-concept'){await station(page,'media');await page.locator('[data-exhibit-stage]').click();await page.waitForSelector('[data-lift-display]:not([hidden])');assert.equal(await page.locator('[data-showroom]').getAttribute('data-media-lift'),'open');const scroll=page.locator('[data-media-lift-scroll]');assert.ok(await scroll.evaluate(e=>e.scrollHeight>e.clientHeight));await scroll.hover();await page.mouse.wheel(0,600);try{await page.waitForFunction(()=>document.querySelector('[data-media-lift-scroll]').scrollTop>0);}catch(error){console.log('Lift scroll diagnostics',await page.evaluate(()=>{const e=document.querySelector('[data-media-lift-scroll]'),r=e.getBoundingClientRect(),at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {scroll:e.scrollTop,height:e.clientHeight,full:e.scrollHeight,at:at?.outerHTML.slice(0,300),lift:document.querySelector('[data-showroom]').dataset.mediaLift};}));throw error;}assert.ok(await scroll.evaluate(e=>e.scrollTop)>0);const previousScroll=await scroll.evaluate(e=>e.scrollTop);await scroll.focus();await page.keyboard.press('PageDown');assert.ok(await scroll.evaluate(e=>e.scrollTop)>previousScroll);await page.screenshot({path:out+'/lifted-image.png',timeout:60000});await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[data-showroom]').dataset.mediaLift==='closed');assert.equal(await page.locator('[data-showroom]').getAttribute('data-room'),project.slug);await page.locator('[data-exhibit-stage]').click();await page.mouse.click(15,400);await page.waitForFunction(()=>document.querySelector('[data-showroom]').dataset.mediaLift==='closed');}assert.equal(await page.locator('[data-media-choice]').count(),Math.max(0,(project.media?.length||1)-1));assert.equal(await page.locator('dialog').count(),0);
  await station(page,'story');await page.locator('[data-story-launch]').click();
  const copy=await page.locator('[data-media-lift-scroll] .case-copy').textContent();
  const original=await page.locator(`[data-exhibit-template="${project.slug}"] [data-exhibit-copy]`).textContent();
  assert.equal(copy.replace(/\s+/g,' ').trim(),original.replace(/\s+/g,' ').trim(),'Every approved paragraph must remain in the continuous story');
  assert.equal(await page.locator('[data-media-lift-scroll] .case-copy').evaluate(e=>getComputedStyle(e).overflow),'visible');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[data-showroom]').dataset.mediaLift==='closed');
  await station(page,'media');
  if(project.slug==='divine-health-black-onyx'){assert.equal(await page.locator('[data-exhibit-stage] .project-media>img').evaluate(e=>getComputedStyle(e).objectFit),'cover');for(let n=0;n<5;n++){assert.equal(await page.locator('[data-media-choice]').count(),3);assert.equal(await page.locator('[data-exhibit-stage] [data-media-id]').count(),1);const fit=await page.locator('[data-exhibit-media-controls]').evaluate(e=>{const bottom=e.getBoundingClientRect().bottom,layout=e.closest('[data-media-layout]');return e.clientHeight<=layout.clientHeight+1&&[...e.children].every(b=>b.getBoundingClientRect().bottom<=bottom+2&&b.clientHeight>0&&b.offsetHeight<=Math.ceil(e.clientHeight/e.children.length));});assert.ok(fit,'All three Divine thumbnails must stay inside the rail');await page.locator('[data-media-choice]').nth(n%3).click();}}
 }
 assert.deepEqual(errors,[]);await context.close();
 report.checks.push('Cold loading, repeated wheel travel, native touch/pen after wheel, navigation over buttons, camera-relative reverse travel, complete Divine thumbnail rail, full-image lift/scroll/return, physical wall matrices/90-degree placement, 75/25 thumbnails and exact swap, per-project session memory, matching miniature texture, GIF playback, continuous editorial story with all original content, ivory reader, native scrolling and focus return, perspective, room isolation, finite uninterrupted retreat, history, all ten projects and filters');
 for(const width of [1440,1024,768,390,320]){
  const c=await browser.newContext({viewport:{width,height:width<800?844:1000},reducedMotion:'reduce'}),p=await c.newPage();await goto(p,'/work/?project=impex-automotive');await ready(p);assert.equal(await p.locator('[data-exhibit-stage] [data-media-id]').getAttribute('data-media-id'),initial,'Reload must restore the initial media');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if(width===390){await p.locator('[data-story-launch]').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('[data-showroom]').dataset.mediaLift==='open');await p.screenshot({path:out+'/mobile-reading.png'});await p.keyboard.press('Escape');}await p.keyboard.press('Escape');await view(p,'category');report.viewports.push({width,overflow:false});await c.close();
 }
 const moving=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:.7}),mp=await moving.newPage();await goto(mp);await mp.mouse.move(900,250);assert.ok(Number(await mp.locator('[data-showroom]').getAttribute('data-pointer-x'))>.5);const time=Number(await mp.locator('[data-showroom]').getAttribute('data-ambient-time'));await mp.waitForFunction(t=>Number(document.querySelector('[data-showroom]').dataset.ambientTime)>t+.3,time);
 await mp.locator('[data-showroom-model="websites"]').click();const entranceStart=Date.now();await mp.locator('[data-showroom-room="divine-health-black-onyx"]').click();await ready(mp);report.animatedEntranceMilliseconds=Date.now()-entranceStart;assert.equal(await mp.locator('[data-showroom]').getAttribute('data-visible-room'),'divine-health-black-onyx');await mp.screenshot({path:out+'/divine-room.png'});await mp.locator('[data-exhibit-stage]').click();await mp.waitForFunction(()=>document.querySelector('[data-showroom]').dataset.liftResting==='true');assert.equal(await mp.locator('[data-exhibit-stage]>[data-exhibit-asset]').evaluate(e=>getComputedStyle(e).visibility),'hidden');await mp.keyboard.press('Escape');assert.equal(await mp.locator('[data-exhibit-stage]>[data-exhibit-asset]').evaluate(e=>getComputedStyle(e).visibility),'hidden');await mp.waitForFunction(()=>document.querySelector('[data-showroom]').dataset.mediaLift==='closed');assert.equal(await mp.locator('[data-exhibit-stage]>[data-exhibit-asset]').evaluate(e=>getComputedStyle(e).visibility),'visible');await mp.locator('[data-showroom-motion]').click();await moving.close();
 const legacy=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),lp=await legacy.newPage();await goto(lp,'/work/?type=client&category=automation');assert.equal(await lp.locator('[data-project]:not([hidden])').count(),5);await lp.keyboard.press('Escape');await legacy.close();
 const fallback=await browser.newContext({viewport:{width:390,height:844}});await fallback.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2')return null;return old.call(this,type,...args);};});const fp=await fallback.newPage();await goto(fp,'/work/?project=impex-automotive');assert.equal(await fp.locator('[data-showroom]').getAttribute('data-renderer'),'fallback');assert.equal(await fp.locator('[data-exhibit-title]').innerText(),'Impex Automotive');await fallback.close();
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),np=await nojs.newPage();await np.goto(base+'/work/');assert.equal(await np.locator('[data-showroom-index]').isVisible(),true);assert.equal(await np.locator('[data-project]').count(),10);await nojs.close();
 report.checks.push('Reload resets session media, five widths, mobile reading view, animated entrance, pointer/ambient motion, correct Divine isolation, legacy categories, WebGL and JavaScript fallback');
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill('SIGTERM');}
