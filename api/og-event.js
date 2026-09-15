import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SITE_URL, LOGO, CATEGORIES, escapeHtml as esc, jsonLd, text, hasEnglish, readPublicEvent, listPublicEvents, eventDetails } from './_lib/publicSeo.js';

let template;
function appTemplate() {
  // Vercel explicitly bundles the built HTML, including Vite's hashed asset URLs.
  template ||= readFileSync(path.join(process.cwd(), 'dist/index.html'), 'utf8');
  return template;
}
const styles = `<style>
.seo-page{max-width:1080px;margin:auto;padding:28px 20px 60px;font-family:Arial,Tahoma,sans-serif;line-height:1.8;color:#17251e;background:#fafcfb;min-height:100vh;overflow-wrap:anywhere}
.seo-page a{color:#176640;text-decoration:underline;text-underline-offset:4px}.seo-page h1{font-size:clamp(24px,5vw,38px);line-height:1.4;margin:24px 0}.seo-page h2{font-size:22px;margin:12px 0}.seo-page nav{display:flex;gap:12px 22px;flex-wrap:wrap;margin:16px 0}.seo-page .seo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:20px}.seo-page article{padding:20px;border:1px solid #cbd9d1;border-radius:16px}.seo-page img{display:block;max-width:100%;height:auto;border-radius:10px}.seo-page .seo-description{white-space:pre-line}.seo-page .seo-card-image{width:100%;height:180px;object-fit:contain}.seo-page .seo-detail-image{max-height:480px;margin:20px auto;object-fit:contain}.seo-page .seo-button{display:inline-block;margin:16px 0;padding:10px 18px;background:#176640;color:#fff;border-radius:10px;text-decoration:none}
@media(prefers-color-scheme:dark){html:not(.light) .seo-page{background:#101914;color:#eef5f0}html:not(.light) .seo-page a{color:#85d9a8}html:not(.light) .seo-page article{border-color:#344c3d}}
html.dark .seo-page{background:#101914;color:#eef5f0}html.dark .seo-page a{color:#85d9a8}html.dark .seo-page article{border-color:#344c3d}
</style>`;
const siteTitle = lang => lang === 'en' ? 'CityEve | Events, parties and activities in Egypt' : 'CityEve | سيتي إيف - دليل الحفلات والفعاليات والخدمات في مصر';
const siteDescription = lang => lang === 'en' ? 'Discover parties, courses, trips, exhibitions, conferences and event services in Egypt with CityEve.' : 'اكتشف الحفلات والكورسات والرحلات والمعارض والمؤتمرات وخدمات الفعاليات في مصر مع CityEve.';
const languageQuery = lang => lang === 'en' ? '?lang=en' : '';
const categoryUrl = (slug,lang) => `${SITE_URL}/categories/${slug}.html${languageQuery(lang)}`;
const directoryNav = lang => `<nav aria-label="${lang==='en'?'Event categories':'أقسام الفعاليات'}">${CATEGORIES.map(c => `<a href="${categoryUrl(c[0],lang)}">${esc(c[lang==='en'?3:2])}</a>`).join('')}</nav>`;

export function renderDocument({lang='ar',title,description='',url=SITE_URL+'/',image=LOGO,body='',structured=[],index=true,alternates=true,app=true}) {
  const arUrl = url.replace(/\?lang=en$/, '');
  const enUrl = arUrl + '?lang=en';
  const metadata = `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="${index?'index':'noindex'}, follow, max-image-preview:large" />
<link rel="canonical" href="${esc(url)}" />
${alternates ? `<link rel="alternate" hreflang="ar" href="${esc(arUrl)}" /><link rel="alternate" hreflang="en" href="${esc(enUrl)}" /><link rel="alternate" hreflang="x-default" href="${esc(arUrl)}" />` : ''}
<meta property="og:type" content="${url.includes('/e/')?'article':'website'}" />
<meta property="og:site_name" content="CityEve" /><meta property="og:locale" content="${lang==='en'?'en_US':'ar_EG'}" />
<meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(url)}" /><meta property="og:image" content="${esc(image)}" /><meta property="og:image:secure_url" content="${esc(image)}" />
${image.includes('w_1200,h_630') ? '<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />' : ''}
<meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${esc(title)}" /><meta name="twitter:description" content="${esc(description)}" /><meta name="twitter:image" content="${esc(image)}" />
${structured.map(s => `<script type="application/ld+json">${jsonLd(s)}</script>`).join('\n')}${styles}`;
  let html = appTemplate()
    .replace(/<html\b[^>]*>/i, `<html lang="${lang}" dir="${lang==='en'?'ltr':'rtl'}">`)
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|keywords|robots|author|geo\.[^"']+|ICBM|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `${metadata}</head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
  if (!app) html = html.replace(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi, '');
  return html;
}
function eventCard(event,lang) {
  const d = eventDetails(event,lang);
  return `<article><a href="${esc(d.url)}"><img class="seo-card-image" loading="lazy" src="${esc(d.image)}" alt="${esc(d.name)}" /><h2>${esc(d.name)}</h2></a>${d.date?`<time datetime="${esc(d.date)}">${esc(d.date.slice(0,10))}</time>`:''}<p>${esc([d.place,d.city].filter(Boolean).join(' — '))}</p><p>${esc(d.description.slice(0,240))}</p></article>`;
}
function send(res,status,html) {
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control',status===200?'public, max-age=0, s-maxage=300':'no-store');
  return res.status(status).send(html);
}
export default async function handler(req,res) {
  const lang = req.query.lang === 'en' ? 'en' : 'ar';
  const eventId = req.query.event || req.query.eventId;
  const en = lang === 'en';
  try {
    if (eventId) {
      const valid = typeof eventId==='string' && eventId.length<=150 && !/[\/\u0000-\u001f]/.test(eventId);
      const event = valid ? await readPublicEvent(eventId) : null;
      if (!event) {
        res.setHeader('X-Robots-Tag','noindex');
        const title = en?'Event unavailable | CityEve':'الإعلان غير متاح | CityEve';
        return send(res,404,renderDocument({lang,title,index:false,alternates:false,app:false,body:`<main class="seo-page"><h1>${title}</h1><p>${en?'This event is unavailable. Explore the published events on CityEve.':'هذا الإعلان غير متاح. يمكنك تصفح الفعاليات المنشورة على CityEve.'}</p><a href="/${languageQuery(lang)}">${en?'Browse events':'تصفح الفعاليات'}</a></main>`}));
      }
      const d = eventDetails(event,lang);
      const body = `<main class="seo-page"><a href="/${languageQuery(lang)}">CityEve</a><article><h1>${esc(d.name)}</h1><img class="seo-detail-image" src="${esc(d.image)}" alt="${esc(d.name)}" />${d.date?`<p><time datetime="${esc(d.date)}">${esc(d.date.slice(0,10))}</time></p>`:''}<p>${esc([d.place,d.address,d.city].filter(Boolean).join(' — '))}</p><p class="seo-description">${esc(d.description)}</p>${d.organizer?`<p>${en?'Organizer':'المنظم'}: ${esc(d.organizer)}</p>`:''}</article>${directoryNav(lang)}</main>`;
      return send(res,200,renderDocument({lang,title:d.name+' | CityEve',description:d.description.slice(0,220),url:d.url,image:d.image,structured:[d.structured],body,index:!en||hasEnglish(event),alternates:hasEnglish(event)}));
    }
    const category = CATEGORIES.find(c=>c[0]===req.query.page);
    if (req.query.page !== 'home' && !category) return send(res,404,renderDocument({lang,title:'CityEve',index:false,alternates:false,app:false,body:'<main class="seo-page"><h1>404</h1><a href="/">CityEve</a></main>'}));
    const events = (await listPublicEvents()).filter(e=>(!category || e.category===category[1]) && (!en || hasEnglish(e)));
    events.sort((a,b)=>text(a.eventDate).localeCompare(text(b.eventDate)));
    const title = category ? `${category[en?3:2]} | CityEve` : siteTitle(lang);
    const url = category ? categoryUrl(category[0],lang) : `${SITE_URL}/${languageQuery(lang)}`;
    const description = category ? (en?`Explore published ${category[3].toLowerCase()}, with dates, venues and event details on CityEve.`:`تصفح ${category[2]} المنشورة، واعرف المواعيد والأماكن وتفاصيل كل إعلان على CityEve.`) : siteDescription(lang);
    const body = `<main class="seo-page"><nav><a href="/${languageQuery(lang)}">CityEve</a><a hreflang="${en?'ar':'en'}" href="${category?categoryUrl(category[0],en?'ar':'en'):`/${en?'':'?lang=en'}`}">${en?'العربية':'English'}</a></nav><h1>${esc(title)}</h1><p>${esc(description)}</p>${directoryNav(lang)}${category?`<a class="seo-button" href="/?category=${category[1]}${en?'&lang=en':''}">${en?'Browse and book in the app':'التصفح والحجز داخل التطبيق'}</a>`:''}<section class="seo-grid">${events.length?events.map(e=>eventCard(e,lang)).join(''):`<p>${en?'No published listings are available in this language yet.':'لا توجد إعلانات منشورة في هذا القسم حاليًا.'}</p>`}</section></main>`;
    const structured = [{'@context':'https://schema.org','@type':category?'CollectionPage':'WebSite',name:title,description,url,inLanguage:lang},
      {'@context':'https://schema.org','@type':'ItemList',itemListElement:events.map((e,i)=>({'@type':'ListItem',position:i+1,url:eventDetails(e,lang).url,name:eventDetails(e,lang).name}))}];
    if (!category) structured.push({'@context':'https://schema.org','@type':'Organization',name:'CityEve',url:SITE_URL,logo:LOGO});
    return send(res,200,renderDocument({lang,title,description,url,body,structured,app:!category}));
  } catch (error) {
    console.error('SEO page unavailable:',error.message);
    res.setHeader('Retry-After','60');
    // An upstream outage must not be cached as a missing event or an empty sitemap.
    return send(res,503,`<!doctype html><html lang="${lang}" dir="${en?'ltr':'rtl'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CityEve</title></head><body><p>${en?'Temporarily unavailable. Please try again shortly.':'الخدمة غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل.'}</p><a href="/index.html${languageQuery(lang)}">CityEve</a></body></html>`);
  }
}
