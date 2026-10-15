import { chromium } from '/tmp/jaycor-capture/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'artifacts/jaycor-capture';
await mkdir(out,{recursive:true});
const browser = await chromium.launch();
try {
 const page = await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const response = await page.goto('https://www.jaycor.co.za/categories/fieldbus/8116480000000168055',{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('[data-zs-product-id]').first().waitFor({timeout:45000});
 await page.waitForTimeout(10000);
 await page.evaluate(async()=>{
  await document.fonts.ready;
  document.documentElement.style.scrollBehavior='auto';
  for(let y=0,steps=0;y<document.documentElement.scrollHeight&&steps<70;y+=700,steps++){
   window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,200));
  }
  await new Promise(r=>setTimeout(r,3000));
  await Promise.race([Promise.all([...document.images].filter(i=>i.getAttribute('src')).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,8000))]);
  window.scrollTo({top:0,behavior:'instant'});
 });
 await page.waitForTimeout(2000);
 const report=await page.evaluate(()=>({title:document.title,url:location.href,width:innerWidth,height:document.documentElement.scrollHeight,products:document.querySelectorAll('[data-zs-product-id]').length,loadedImages:[...document.images].filter(i=>i.complete&&i.naturalWidth>0).length,brokenImages:[...document.images].filter(i=>i.getAttribute('src')&&(!i.complete||!i.naturalWidth)).map(i=>i.src)}));
 report.status=response.status();console.log(JSON.stringify(report,null,2));
 if(!report.products||report.loadedImages<5)throw new Error('Product content did not load sufficiently for a full-page capture.');
 await page.screenshot({path:out+'/jaycor-fieldbus-full-page.png',fullPage:true,animations:'disabled'});
 await page.screenshot({path:out+'/jaycor-fieldbus-full-page.jpg',fullPage:true,quality:95,animations:'disabled'});
 await writeFile(out+'/capture-report.json',JSON.stringify(report,null,2));
}finally{await browser.close();}
