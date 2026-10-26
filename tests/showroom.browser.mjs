import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const base='http://127.0.0.1:4321',out='artifacts/showroom';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4321'],{stdio:'inherit'});
let browser;const report={checks:[],viewports:[]};
async function goto(page,path='/work/'){await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('[data-showroom][data-ready="true"][data-arrival="ready"]');}
async function view(page,value){await page.waitForFunction(v=>document.querySelector('[data-showroom]').dataset.view===v,value);}
async function roomReady(page){await page.waitForSelector('[data-showroom][data-room-ready="true"]');}
async function wheel(page,dy,dx=0){await page.mouse.move(20,350);await page.mouse.wheel(dx,dy);}
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/work/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 await mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let releaseScripts;const scriptGate=new Promise(resolve=>{releaseScripts=resolve;});
 await context.route('**/_astro/*.js',async route=>{await scriptGate;await route.continue();});
 try {
  await page.goto(base+'/work/',{waitUntil:'commit'});await page.locator('[data-showroom-arrival]').waitFor({state:'visible'});
  assert.equal(await page.locator('.showroom-fallback').isVisible(),false,'The SVG fallback must not flash while scripts load');
  await page.screenshot({path:out+'/arrival-desktop.png'});
 } finally {releaseScripts();}
 await page.waitForSelector('[data-showroom][data-ready="true"][data-arrival="ready"]');await context.unroute('**/_astro/*.js');
 report.checks.push('Cold arrival shows the branded preparation state until the live scene is ready, without flashing fallback artwork');
 assert.equal(await page.locator('dialog').count(),0,'The showroom must not contain project or index modals');
 assert.equal(await page.locator('[data-showroom-model]').count(),4);
 assert.equal(await page.locator('.showroom-fallback').isVisible(),false);
 await page.screenshot({path:out+'/showroom-desktop.png'});
 const point=await page.locator('[data-showroom-model="applications"]').evaluate(b=>({x:Number(b.dataset.worldX),y:Number(b.dataset.worldY)}));await page.mouse.click(point.x,point.y);await view(page,'category');
 await page.waitForFunction(()=>Number(document.querySelector('[data-showroom]').dataset.readyPreviews)>=2);
 const rp=await page.locator('[data-showroom-room="impex-automotive"]').evaluate(b=>({x:Number(b.dataset.worldX),y:Number(b.dataset.worldY)}));await page.mouse.click(rp.x,rp.y);await view(page,'project');await roomReady(page);
 assert.ok((await page.locator('[data-exhibit-title]').innerText()).includes('Impex Automotive'));
 const chapterButtons=page.locator('[data-exhibit-chapters] button');assert.equal(await chapterButtons.count(),5);
 for(let i=0;i<5;i++){await chapterButtons.nth(i).click();assert.equal(await page.locator('[data-exhibit-chapter] h3').innerText(),await chapterButtons.nth(i).innerText());}
 assert.equal(await page.locator('[data-exhibit-media-controls] button').count(),3);
 const play=page.locator('[data-exhibit-stage] [data-gif-toggle]');await play.click();await page.waitForFunction(()=>document.querySelector('[data-exhibit-stage] [data-gif-toggle]').getAttribute('aria-pressed')==='true');await play.click();
 await page.locator('[data-exhibit-media-controls] button').nth(1).click();assert.equal(await page.locator('[data-exhibit-stage] [data-media-id]').getAttribute('data-media-id'),'impex-product-cart');
 await page.screenshot({path:out+'/impex-room-desktop.png'});
 await page.locator('[data-exhibit-expand]').click();assert.equal(await page.locator('[data-scene-reading]').isVisible(),false);await page.keyboard.press('Escape');assert.equal(await page.locator('[data-scene-reading]').isVisible(),true);assert.equal(await page.locator('[data-showroom]').getAttribute('data-room'),'impex-automotive');
 // Reading is isolated from travel, even for strong trackpad gestures.
 await page.locator('[data-exhibit-chapter]').hover();await page.mouse.wheel(0,-900);assert.equal(await page.locator('[data-showroom]').getAttribute('data-room'),'impex-automotive');
 // A partial backward gesture moves the camera before changing route; forward reverses it.
 const initialZ=Number(await page.locator('[data-showroom]').getAttribute('data-camera-z'));
 await wheel(page,-260);assert.equal(await page.locator('[data-showroom]').getAttribute('data-view'),'project');
 assert.notEqual(Number(await page.locator('[data-showroom]').getAttribute('data-camera-z')),initialZ);
 await wheel(page,130);assert.ok(Number(await page.locator('[data-showroom]').getAttribute('data-travel'))<0);
 await page.locator('[data-showroom-exit]').click();await view(page,'category');
 await page.locator('[data-showroom-room="impex-automotive"]').click();await roomReady(page);
 await wheel(page,-800);await view(page,'category');await page.waitForTimeout(300);
 await wheel(page,-800);await view(page,'showroom');
 await page.goBack();await view(page,'category');await page.goForward();await view(page,'showroom');
 const orbitX=Number(await page.locator('[data-showroom]').getAttribute('data-camera-x'));await wheel(page,0,180);await page.waitForFunction(x=>Number(document.querySelector('[data-showroom]').dataset.cameraX)!==x,orbitX);
 await page.waitForTimeout(300);await wheel(page,800);await view(page,'category');await page.waitForTimeout(300);await wheel(page,800);await view(page,'project');await roomReady(page);
 report.checks.push('Direct 3D model and room picking, all Impex chapters/media, GIF playback, reading isolation, reversible trackpad travel, spatial doorway, history and zero modals');
 await page.locator('[data-showroom-index-open]').click();await page.locator('[data-group="all"]').click();assert.equal(await page.locator('[data-project]:not([hidden])').count(),10);
 await page.locator('[data-group="client"]').click();
 for(const [category,count]of [['applications',2],['websites',3],['customer-systems',2],['automation',5],['integrations',7]]){await page.locator(`[data-category-filters="client"] [data-filter="${category}"]`).click();assert.equal(await page.locator('[data-project]:not([hidden])').count(),count);}
 const projects=await page.locator('#showroom-data').evaluate(e=>JSON.parse(e.textContent));
 for(const project of projects){
  if(!await page.locator('[data-showroom-index]').isVisible())await page.locator('[data-showroom-index-open]').click();await page.locator('[data-group="all"]').click();await page.locator(`[data-project-open="${project.slug}"]`).click();await roomReady(page);assert.equal(await page.locator('[data-exhibit-title]').innerText(),project.title);assert.ok(await page.locator('[data-exhibit-chapters] button').count()>=4);assert.equal(await page.locator('dialog').count(),0);
 }
 assert.deepEqual(errors,[]);await context.close();
 const legacy=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),lp=await legacy.newPage();
 await goto(lp,'/work/?type=client&category=automation');await lp.locator('[data-showroom-index]:not([hidden])').waitFor();assert.equal(await lp.locator('[data-project]:not([hidden])').count(),5);
 await lp.keyboard.press('Escape');assert.equal(await lp.locator('[data-showroom-index]').isVisible(),false);await legacy.close();
 report.checks.push('All ten project exhibitions, concepts, original filters, external URLs and legacy category links');
 // Fresh GPU sessions avoid software-renderer readback stalls between viewport captures.
 for(const width of [1440,1024,768,390,320]){
  const c=await browser.newContext({viewport:{width,height:width<800?844:1000},reducedMotion:'reduce'}),p=await c.newPage();await goto(p,'/work/?model=applications&room=impex-automotive');await roomReady(p);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));
  if([1440,390].includes(width))await p.screenshot({path:`${out}/room-${width}.png`});
  await p.locator('[data-showroom-exit]').click();await view(p,'category');await p.keyboard.press('Escape');await view(p,'showroom');
  report.viewports.push({width,overflow:false});await c.close();
 }
 const moving=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:.7}),mp=await moving.newPage();await goto(mp);
 const canvas=mp.locator('[data-showroom-canvas]');const before=Number(await mp.locator('[data-showroom]').getAttribute('data-camera-x'));
 await mp.mouse.move(900,250);assert.ok(Number(await mp.locator('[data-showroom]').getAttribute('data-pointer-x'))>.5);await mp.waitForFunction(x=>Math.abs(Number(document.querySelector('[data-showroom]').dataset.cameraX)-x)>.02,before);
 const t=Number(await mp.locator('[data-showroom]').getAttribute('data-ambient-time'));await mp.waitForFunction(t=>Number(document.querySelector('[data-showroom]').dataset.ambientTime)>t+.3,t);
 await mp.locator('[data-showroom-model="applications"]').click();await mp.locator('[data-showroom-room="impex-automotive"]').click();await roomReady(mp);await mp.screenshot({path:out+'/animated-room.png'});
 await mp.locator('[data-showroom-motion]').click();const frozen=await mp.locator('[data-showroom]').getAttribute('data-ambient-time');await mp.waitForTimeout(250);assert.equal(await mp.locator('[data-showroom]').getAttribute('data-ambient-time'),frozen);await moving.close();
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),tp=await touch.newPage();await goto(tp);await tp.locator('[data-showroom-model="applications"]').tap();await tp.locator('[data-showroom-room="impex-automotive"]').tap();await roomReady(tp);await tp.locator('[data-showroom-exit]').tap();await view(tp,'category');await touch.close();
 const fallback=await browser.newContext({viewport:{width:390,height:844}});await fallback.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2')return null;return old.call(this,type,...args);};});
 const fp=await fallback.newPage();await goto(fp,'/work/?project=impex-automotive');await roomReady(fp);assert.equal(await fp.locator('[data-showroom]').getAttribute('data-renderer'),'fallback');assert.equal(await fp.locator('.showroom-fallback').isVisible(),true);await fallback.close();
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),np=await nojs.newPage();await np.goto(base+'/work/');assert.equal(await np.locator('[data-showroom-index]').isVisible(),true);assert.equal(await np.locator('[data-project]').count(),10);await nojs.close();
 report.checks.push('Pointer camera response without clicking, living ambient motion and pause, doorway camera travel, native touch, reduced motion, WebGL fallback and no-JavaScript index');
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill('SIGTERM');}
