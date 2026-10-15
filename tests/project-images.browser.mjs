import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { readProjects } from './project-content.mjs';
const base = 'http://127.0.0.1:4337';
const output = 'artifacts/project-images';
const server = spawn('npm', ['run','preview','--','--host','127.0.0.1','--port','4337'], {stdio:'inherit'});
const results = [];
let browser;
try {
  await mkdir(output,{recursive:true});
  for(let i=0;i<100;i++) {try {if((await fetch(base+'/work/')).ok) break;} catch {} if(i===99) throw new Error('Preview not ready'); await new Promise(r=>setTimeout(r,100));}
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1440,768,390,320]) {
    await page.setViewportSize({width,height:900});
    // A single uploaded image must remain full-height without a bounded frame/control.
    for(const slug of ['vera-skincare-concept','vortex-gym-concept']) {
      await page.goto(base+'/work/?project='+slug);
      const dialog = page.locator('#project-dialog'); await dialog.waitFor({state:'visible'});
      const image = dialog.locator('.project-media img'); await image.evaluate(img=>img.decode());
      assert.equal(await dialog.locator('[data-crop-preview]').count(),0);
      assert.equal(await dialog.locator('[data-full-page-image]').count(),0);
      const dimensions = await image.evaluate(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,ratio:Number(img.getAttribute('height'))/Number(img.getAttribute('width')),max:getComputedStyle(img).maxHeight}));
      assert(Math.abs(dimensions.height-dimensions.width*dimensions.ratio)<2,'Single image is clipped or shrunk into a fixed frame: '+JSON.stringify(dimensions));
      assert.equal(dimensions.max,'none');
      await page.keyboard.press('Escape');
    }
    // Both JAYCOR screenshots exceed the cap: original data and source paths stay intact.
    const jaycor = readProjects().find(p=>p.slug==='jaycor-commerce');
    const originalRequests=[];
    const record=r=>{if(jaycor.media.some(m=>r.url().endsWith(m.url))) originalRequests.push(r.url());};page.on('request',record);
    await page.goto(base+'/work/?category=websites');
    await page.locator('[data-project-open="jaycor-commerce"]').click();
    const dialog=page.locator('#project-dialog');await dialog.waitFor({state:'visible'});
    await dialog.locator('.project-media img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
    await page.waitForFunction(()=>[...document.querySelectorAll('#project-dialog [data-crop-preview]')].every(f=>f.dataset.cropped==='true'));
    assert.equal(await dialog.locator('[data-crop-preview]').count(),2);
    assert.equal(await dialog.locator('[data-full-page-image]:visible').count(),2);
    const heights=await dialog.locator('[data-crop-preview]').evaluateAll(fs=>fs.map(f=>f.clientHeight));
    assert.equal(heights[0],heights[1]);assert(heights[0]<=420);
    assert.equal(originalRequests.length,0,'Original full-page images were loaded before inspection');
    const link=dialog.locator('[data-full-page-image]').first();
    await link.scrollIntoViewIfNeeded();await link.focus();
    const parentScroll=await dialog.evaluate(d=>d.scrollTop);const url=page.url();
    await page.keyboard.press('Enter');
    const viewer=page.locator('#project-image-viewer');await viewer.waitFor({state:'visible'});
    await viewer.locator('img').evaluate(img=>img.decode());
    assert.equal(await viewer.locator('img').getAttribute('src'),base+jaycor.media[0].url);
    assert(originalRequests.length>0);assert.equal(page.url(),url);
    assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
    const close=viewer.locator('[data-image-viewer-close]');
    assert(await close.evaluate(el=>el===document.activeElement));
    for(const key of ['Tab','Shift+Tab']) {await page.keyboard.press(key);assert(await close.evaluate(el=>el===document.activeElement));}
    if(width>=768) assert(await viewer.evaluate(v=>v.scrollHeight>v.clientHeight));
    await viewer.evaluate(v=>{v.scrollTop=v.scrollHeight;});
    const closeBox=await close.boundingBox();assert(closeBox.y>=0&&closeBox.y<900);
    assert.equal(await viewer.evaluate(v=>v.scrollWidth>v.clientWidth+1),false);
    if(width===1440||width===390) await page.screenshot({path:`${output}/full-page-viewer-${width}.png`});
    await page.keyboard.press('Escape');await viewer.waitFor({state:'detached'});
    assert(await dialog.isVisible());assert(await link.evaluate(el=>el===document.activeElement));
    assert(Math.abs(await dialog.evaluate(d=>d.scrollTop)-parentScroll)<2);
    assert.equal(page.url(),url);assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
    // Close button and backdrop dismiss only the inspection, never the case study.
    await link.click();await viewer.waitFor({state:'visible'});await viewer.locator('[data-image-viewer-close]').click();await viewer.waitFor({state:'detached'});
    if(width===1440) {await link.click();await viewer.waitFor({state:'visible'});await page.mouse.click(2,2);await viewer.waitFor({state:'detached'});assert(await dialog.isVisible());}
    // A viewport change can make a short image fit; the control must disappear.
    const short=dialog.locator('[data-crop-preview]').last();
    await short.locator('img').evaluate(img=>{img.style.aspectRatio='4 / 1';});
    await page.waitForFunction(()=>document.querySelectorAll('#project-dialog [data-crop-preview]')[1].dataset.cropped==='false');
    assert.equal(await dialog.locator('[data-full-page-image]:visible').count(),1);
    await short.locator('img').evaluate(img=>{img.style.aspectRatio='';});
    await page.waitForFunction(()=>document.querySelectorAll('#project-dialog [data-crop-preview]')[1].dataset.cropped==='true');
    // Source data/media count is not mutated by the viewer.
    if(width===1440||width===390) await dialog.screenshot({path:`${output}/bounded-gallery-${width}.png`});
    await link.click();await viewer.waitFor({state:'visible'});await page.goBack();
    await viewer.waitFor({state:'detached'});await dialog.waitFor({state:'hidden'});
    assert.equal(new URL(page.url()).searchParams.get('category'),'websites');
    assert.equal(new URL(page.url()).searchParams.has('project'),false);
    assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');
    await page.goForward();await dialog.waitFor({state:'visible'});assert.equal(await page.locator('#project-image-viewer').count(),0);
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
    await page.waitForFunction(()=>!new URL(location.href).searchParams.has('project'));
    page.off('request',record);
    results.push({width,singleImagesFull:true,multiImageBounded:true,conditionalControl:true,originalOnDemand:true,keyboardAndFocus:true,parentStatePreserved:true,history:true});
  }
  // Missing media stay pending and GIF previews keep playback controls, without inspection links.
  for(const slug of ['moving-company-crm','impex-automotive','xans-operations-portal']) {
    await page.goto(base+'/work/?project='+slug);const dialog=page.locator('#project-dialog');await dialog.waitFor({state:'visible'});
    assert.equal(await dialog.locator('[data-full-page-image]').count(),0);
    if(slug!=='moving-company-crm') assert(await dialog.locator('[data-gif-toggle]').count()>0);
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);console.log('Passed full-page media rules, inspection, focus, scrolling, history and responsiveness.');
} finally {await writeFile(`${output}/report.json`,JSON.stringify(results,null,2));await browser?.close();server.kill('SIGTERM');}
