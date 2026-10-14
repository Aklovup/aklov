import { site } from '../data/site';
export const GET = () => new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site.routes.map(route => `<url><loc>${new URL(route, site.origin).href}</loc></url>`).join('')}</urlset>`, {headers:{'Content-Type':'application/xml'}});
