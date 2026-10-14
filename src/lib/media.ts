import { readFileSync } from 'node:fs';
interface Preview { width:number; height:number; src:string; srcset:string; variants:{url:string;width:number;bytes:number}[]; }
const manifest: Record<string,Preview> = JSON.parse(readFileSync('.cache/media-manifest.json','utf8'));
export const mediaPreview = (url?: string): Preview | undefined => url ? manifest[url] : undefined;
