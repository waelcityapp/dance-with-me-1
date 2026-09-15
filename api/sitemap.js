import {SITE_URL,CATEGORIES,escapeHtml as esc,text,hasEnglish,listPublicEvents} from './_lib/publicSeo.js';

export default async function handler(req,res) {
  try {
    const events = await listPublicEvents();
    const pages = [
      {url:SITE_URL+'/',english:true},
      ...CATEGORIES.map(c=>({url:`${SITE_URL}/categories/${c[0]}.html`,english:true})),
      ...events.map(e=>({url:`${SITE_URL}/e/${encodeURIComponent(e.id)}`,english:hasEnglish(e),updated:e.updatedAt||e.updated_at||e.createdAt||e.created_at}))
    ];
    const rows = pages.flatMap(({url,english,updated})=>{
      const raw = typeof updated?.toDate==='function'?updated.toDate().toISOString():text(updated);
      const lastmod = raw && !Number.isNaN(Date.parse(raw)) ? `<lastmod>${esc(new Date(raw).toISOString())}</lastmod>` : '';
      const alternatives = english?`<xhtml:link rel="alternate" hreflang="ar" href="${esc(url)}"/><xhtml:link rel="alternate" hreflang="en" href="${esc(url+'?lang=en')}"/><xhtml:link rel="alternate" hreflang="x-default" href="${esc(url)}"/>`:'';
      return (english?[url,url+'?lang=en']:[url]).map(loc=>`  <url><loc>${esc(loc)}</loc>${lastmod}${alternatives}</url>`);
    });
    res.setHeader('Content-Type','application/xml; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>`);
  } catch (error) {
    console.error('Sitemap unavailable:',error.message);
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Retry-After','60');
    return res.status(503).send('Sitemap temporarily unavailable');
  }
}
