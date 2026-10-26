import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const base='http://127.0.0.1:4321',out='artifacts/showroom';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4321'],{stdio:'inherit'});
let browser;
const report={checks:[],viewports:[]};
async function goto(page,url){await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});}
async function ready(page){await page.waitForSelector('[data-showroom][data-ready="true"]');}
async function view(page,value){await page.waitForFunction(v=>document.querySelector('[data-showroom]').dataset.view===v,value);}
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/work/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 await mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader Error|WebGLProgram/.test(m.text()))errors.push(m.text());});
 await goto(page,base+'/work/');await ready(page);await page.evaluate(()=>document.fonts.ready);
 await page.waitForSelector('[data-showroom][data-renderer="webgl"][data-rendered="true"]');
 assert.equal(await page.locator('[data-showroom-model]').count(),4);
 assert.equal(await page.locator('[data-showroom-model="integrations"]').count(),0);
 assert.equal(await page.locator('[data-showroom-motion]').getAttribute('aria-pressed'),'true');
 await page.screenshot({path:out+'/showroom-desktop.png'});
 // Pick a physical model at its projected centre, rather than only using its index button.
 const point=await page.locator('[data-showroom-model="applications"]').evaluate(b=>({x:Number(b.dataset.worldX),y:Number(b.dataset.worldY)}));
 assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
 await page.mouse.click(point.x,point.y);await view(page,'category');
 assert.equal(await page.locator('[data-showroom]').getAttribute('data-model'),'applications');
 assert.equal(await page.locator('[data-showroom-room]').count(),2);
 await page.waitForFunction(()=>Number(document.querySelector('[data-showroom]').dataset.roofOpen)>.98);
 await page.waitForFunction(()=>Number(document.querySelector('[data-showroom]').dataset.readyPreviews)>=2);
 await page.screenshot({path:out+'/category-desktop.png'});
 await page.locator('[data-showroom-room="impex-automotive"]').click();await view(page,'project');
 await page.screenshot({path:out+'/room-desktop.png'});
 await page.locator('[data-showroom-case]').click();await page.waitForSelector('[data-project-dialog][open]');
 assert.ok((await page.locator('[data-project-dialog]').innerText()).includes('A B2B ordering experience built around the business'));
 const play=page.locator('[data-project-dialog] [data-gif-toggle]').first();await play.click();await page.waitForFunction(()=>document.querySelector('[data-project-dialog] [data-gif-toggle]').getAttribute('aria-pressed')==='true');await play.click();
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[data-project-dialog]').open);
 await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-showroom-case'));
 await page.locator('[data-showroom-back]').click();await view(page,'category');
 await page.locator('[data-showroom-back]').click();await view(page,'showroom');
 await page.goBack();await view(page,'category');await page.goForward();await view(page,'showroom');
 const beforeOrbit=await page.screenshot();await page.mouse.move(650,380);await page.mouse.down();await page.mouse.move(830,380,{steps:8});await page.mouse.up();const afterOrbit=await page.screenshot();assert.notDeepEqual(beforeOrbit,afterOrbit,'Dragging should change the model-table viewpoint');assert.equal(await page.locator('[data-showroom]').getAttribute('data-view'),'showroom');
 report.checks.push('Physical model picking, cutaway roof, canonical project rooms, uploaded previews, case study, GIF controls, focus return and history');
 for(const [category,count] of [['websites',3],['customer-systems',1],['automation',2]]){
  await page.locator(`[data-showroom-model="${category}"]`).click();await view(page,'category');assert.equal(await page.locator('[data-showroom-room]').count(),count);await page.locator('[data-showroom-home]').click();
 }
 await page.locator('[data-showroom-type="concepts"]').click();assert.equal(await page.locator('[data-showroom-model]').count(),1);
 await page.locator('[data-showroom-model="websites"]').click();assert.equal(await page.locator('[data-showroom-room]').count(),2);
 await page.locator('[data-showroom-room="vera-skincare-concept"]').click();await page.locator('[data-showroom-case]').click();await page.waitForSelector('[data-project-dialog][open]');
 assert.ok((await page.locator('[data-project-dialog]').innerText()).includes('Independent Concept'));await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[data-project-dialog]').open);
 await page.locator('[data-showroom-type="client"]').click();
 await page.locator('[data-showroom-index-open]').click();await page.waitForSelector('[data-showroom-index][open][data-user-open]');
 await page.locator('[data-group="all"]').click();assert.equal(await page.locator('[data-project]:not([hidden])').count(),10);
 await page.locator('[data-group="client"]').click();assert.equal(await page.locator('[data-project]:not([hidden])').count(),8);
 for(const [category,count] of [['applications',2],['websites',3],['customer-systems',2],['automation',5],['integrations',7]]){
  await page.locator(`[data-category-filters="client"] [data-filter="${category}"]`).click();assert.equal(await page.locator('[data-project]:not([hidden])').count(),count);
 }
 await page.locator('[data-project-open="impex-automotive"]').click();await page.waitForSelector('[data-project-dialog][open]');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[data-project-dialog]').open);
 assert.equal(await page.locator('[data-showroom-index]').isVisible(),true);
 await page.locator('[data-showroom-index-close]').click();
 report.checks.push('All category buildings, separate concepts, complete index, all original multi-category filters and nested case-study dialog');
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:width<800?844:1000});await page.locator('[data-showroom-home]').click();await view(page,'showroom');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Horizontal overflow at '+width);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'The experiment must stay inside one viewport');
  await page.screenshot({path:`${out}/showroom-${width}.png`});
  await page.locator('[data-showroom-model="applications"]').click();await page.screenshot({path:`${out}/category-${width}.png`});
  await page.locator('[data-showroom-room="impex-automotive"]').click();await page.screenshot({path:`${out}/room-${width}.png`});
  report.viewports.push({width,overflow:false});
 }
 await goto(page,base+'/work/?project=jaycor-commerce');await ready(page);await page.waitForSelector('[data-project-dialog][open]');assert.equal(await page.locator('[data-showroom]').getAttribute('data-room'),'jaycor-commerce');await page.keyboard.press('Escape');
 await goto(page,base+'/work/?type=client&category=integrations');await ready(page);await page.waitForSelector('[data-showroom-index][open][data-user-open]');assert.equal(await page.locator('[data-project]:not([hidden])').count(),7);
 assert.deepEqual(errors,[]);await context.close();
 const moving=await browser.newContext({viewport:{width:1440,height:1000}}),mp=await moving.newPage();await goto(mp,base+'/work/');await ready(mp);await mp.locator('[data-showroom-model="applications"]').click();await view(mp,'category');
 await mp.waitForFunction(()=>Number(document.querySelector('[data-showroom]').dataset.roofOpen)>.05&&Number(document.querySelector('[data-showroom]').dataset.roofOpen)<.98);
 await mp.waitForFunction(()=>document.querySelector('[data-showroom]').dataset.transitionSettled==='true');await mp.screenshot({path:out+'/animated-cutaway-settled.png'});await moving.close();
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),tp=await touch.newPage();await goto(tp,base+'/work/');await ready(tp);await tp.locator('[data-showroom-model="applications"]').tap();await view(tp,'category');await tp.locator('[data-showroom-room="impex-automotive"]').tap();await view(tp,'project');await tp.locator('[data-showroom-case]').tap();await tp.waitForSelector('[data-project-dialog][open]');await tp.keyboard.press('Escape');await tp.waitForFunction(()=>!document.querySelector('[data-project-dialog]').open);await touch.close();
 const fallback=await browser.newContext({viewport:{width:390,height:844}});await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2')return null;return original.call(this,type,...args);};});
 const fp=await fallback.newPage();await goto(fp,base+'/work/');await ready(fp);assert.equal(await fp.locator('.showroom-fallback').isVisible(),true);await fp.locator('[data-showroom-model="applications"]').click();await fp.locator('[data-showroom-room="impex-automotive"]').click();await fp.locator('[data-showroom-case]').click();await fp.waitForSelector('[data-project-dialog][open]');await fallback.close();
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),np=await nojs.newPage();await goto(np,base+'/work/');assert.equal(await np.locator('[data-showroom-index]').isVisible(),true);assert.equal(await np.locator('[data-project]').count(),10);await nojs.close();
 report.checks.push('Desktop/tablet/mobile single-screen layouts, deep links, animated roof/camera transition, native touch selection, reduced motion, no-WebGL and no-JavaScript access');
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill('SIGTERM');}
