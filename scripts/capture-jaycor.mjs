import { chromium } from '/tmp/jaycor-capture/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const out='artifacts/jaycor-capture';await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const targets=[
 {name:'jaycor-product-full-page',url:'https://www.jaycor.co.za/products/fd095dc3d1/8116480000000272980'},
 {name:'divine-health-shop-full-page',url:'https://shop.divinehealthwellness.co.za/categories/shop/6881631000000687003'}
];
try {
 const results=await Promise.allSettled(targets.map(async target=>{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  try{
   const response=await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForTimeout(10000);
   await page.waitForFunction(()=>document.body.innerText.length>300&&[...document.images].filter(i=>i.complete&&i.naturalWidth>0).length>=3,{},{timeout:45000});
   await page.evaluate(async()=>{
    await document.fonts.ready;document.documentElement.style.scrollBehavior='auto';
    for(let y=0,steps=0;y<document.documentElement.scrollHeight&&steps<70;y+=700,steps++){
     window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,200));
    }
    await new Promise(r=>setTimeout(r,3000));
    await Promise.race([Promise.all([...document.images].filter(i=>i.getAttribute('src')).map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,8000))]);
    window.scrollTo({top:0,behavior:'instant'});
   });
   await page.waitForTimeout(2000);
   const report=await page.evaluate(()=>({title:document.title,url:location.href,width:innerWidth,height:document.documentElement.scrollHeight,loadedImages:[...document.images].filter(i=>i.complete&&i.naturalWidth>0).length,brokenImages:[...document.images].filter(i=>i.getAttribute('src')&&(!i.complete||!i.naturalWidth)).map(i=>i.src)}));
   report.status=response.status();console.log(JSON.stringify(report,null,2));
   if(report.status!==200||/Access denied|Just a moment|Checking your browser/i.test(report.title))throw new Error('Page did not load normally.');
   await page.screenshot({path:out+'/'+target.name+'.png',fullPage:true,animations:'disabled'});
   await page.screenshot({path:out+'/'+target.name+'.jpg',fullPage:true,quality:95,animations:'disabled'});
   await writeFile(out+'/'+target.name+'-report.json',JSON.stringify(report,null,2));
   return report;
  }finally{await page.close();}
 }));
 await writeFile(out+'/capture-results.json',JSON.stringify(results,null,2));
 if(results.some(r=>r.status==='rejected'))throw new Error('A capture failed: '+results.filter(r=>r.status==='rejected').map(r=>r.reason?.message).join('; '));
}finally{await browser.close();}
