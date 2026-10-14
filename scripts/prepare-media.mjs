import sharp from 'sharp';
import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve('public/images');
const output = path.join(root,'generated');
const manifest = {};
async function walk(folder) {
  for(const entry of await readdir(folder,{withFileTypes:true})) {
    if(entry.name==='generated') continue;
    const file=path.join(folder,entry.name);
    if(entry.isDirectory()) await walk(file);
    else if(/\.(png|jpe?g|gif)$/i.test(entry.name) && !file.includes(path.sep+'portraits'+path.sep)) {
      const relative=path.relative(root,file), url='/images/'+relative.split(path.sep).join('/');
      const info=await sharp(file,{animated:false}).metadata();
      const width=info.width, height=info.pageHeight||info.height;
      const directory=path.join(output,path.dirname(relative));
      await mkdir(directory,{recursive:true});
      const digest=createHash('sha256').update(await readFile(file)).digest('hex').slice(0,10);
      const stem=path.basename(file,path.extname(file))+'-'+digest;
      const sizes=[...new Set([640,1280,1600].map(n=>Math.min(n,width)))].sort((a,b)=>a-b);
      const variants=[];
      for(const size of sizes) {
        const target=path.join(directory,`${stem}-${size}.webp`);
        await sharp(file,{animated:false}).rotate().resize({width:size,withoutEnlargement:true}).webp({quality:85,effort:4}).toFile(target);
        variants.push({url:'/images/'+path.relative(root,target).split(path.sep).join('/'),width:size,bytes:(await stat(target)).size});
      }
      manifest[url]={width,height,src:variants[Math.min(1,variants.length-1)].url,srcset:variants.map(v=>`${v.url} ${v.width}w`).join(', '),variants};
    }
  }
}
await walk(root);
// Branded share image uses existing approved Home copy and palette.
const share = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#151515"/><circle cx="1050" cy="340" r="310" fill="none" stroke="#d8bd78" stroke-opacity=".24" stroke-width="2"/><text x="70" y="100" fill="#f5f2ea" font-family="Arial,sans-serif" font-size="44" font-weight="700">aklov<tspan fill="#d8bd78">.</tspan></text><text x="70" y="310" fill="#f5f2ea" font-family="serif" font-size="105">Better systems.</text><text x="140" y="435" fill="#d8bd78" font-family="serif" font-size="105">Better business.</text></svg>`;
await sharp(Buffer.from(share)).png().toFile(path.join(output,'social-preview.png'));
await mkdir('.cache',{recursive:true});
await writeFile('.cache/media-manifest.json',JSON.stringify(manifest,null,2));
console.log('Prepared optimized media:',Object.keys(manifest).length,'source files. Original uploads preserved.');
