import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SITE_URL, LOGO, CATEGORIES, escapeHtml as esc, jsonLd, text, hasEnglish, readPublicEvent, listCurrentPublicEvents, isEndedEvent, eventDetails } from '../publicSeo.js';

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
const directoryStyles = `<style>
body:has(.category-directory){margin:0;background:#fbf6ed;color:#28181a}
.category-directory{--surface:#fffdf8;--text:#28181a;--muted:#645052;--accent:#78101f;--line:#e6d5bf;--gold:#edc67a;box-sizing:border-box;max-width:1120px;margin:auto;padding:0 clamp(16px,4vw,40px) 48px;color:var(--text);font:1rem/1.65 system-ui,sans-serif;overflow-wrap:anywhere}
.category-directory a{color:var(--accent);text-underline-offset:.2em}
.category-top,.category-intro,.category-nav{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.category-top{justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--line)}
.category-brand{display:inline-flex;align-items:center;gap:10px;font-size:1.2rem;font-weight:800;text-decoration:none}
.category-brand img{width:38px;height:38px;object-fit:contain}
.category-intro{justify-content:space-between;align-items:end;padding:clamp(22px,4vw,48px) 0 20px}
.category-intro h1{font-size:clamp(1.8rem,4vw,2.75rem);line-height:1.25;margin:0}
.category-intro p{color:var(--muted);margin:.45rem 0 0}
.category-directory .category-cta{display:inline-block;border-radius:12px;padding:9px 16px;background:#78101f;color:#fff9ed;text-decoration:none;font-weight:700}
.category-nav{padding-bottom:18px;border-bottom:1px solid var(--line);margin-bottom:22px}
.category-nav a{padding:5px 10px;border:1px solid var(--line);border-radius:999px;text-decoration:none;font-size:.9rem}
.category-nav a[aria-current=page]{background:#78101f;color:#fff9ed;border-color:#78101f}
.category-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:18px}
.category-card{background:var(--surface);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 5px 16px #28181a12}
.category-card img{width:100%;height:clamp(200px,33vw,300px);display:block;object-fit:contain;background:#21191b}
.category-card-body{padding:16px}
.category-card h2{margin:0 0 8px;font-size:1.25rem}
.category-card p{margin:6px 0;color:var(--muted)}
.category-card time{display:inline-block;border-radius:8px;background:#f8e7c7;color:#56211b;padding:2px 8px;font-size:.86rem;font-weight:700}
@media(prefers-color-scheme:dark){body:has(.category-directory){background:#141112}.category-directory{--surface:#211a1c;--text:#fff8ed;--muted:#e1cdd0;--accent:var(--gold);--line:#63494a}}
</style>`;

const siteTitle = lang => lang === 'en' ? 'CityEve | Events, parties and activities in Egypt' : 'CityEve | سيتي إيف - دليل الحفلات والفعاليات والخدمات في مصر';
const siteDescription = lang => lang === 'en' ? 'Discover parties, courses, trips, exhibitions, conferences and event services in Egypt with CityEve.' : 'اكتشف الحفلات والكورسات والرحلات والمعارض والمؤتمرات وخدمات الفعاليات في مصر مع CityEve.';
const languageQuery = lang => lang === 'en' ? '?lang=en' : '';
const categoryUrl = (slug,lang) => `${SITE_URL}/categories/${slug}.html${languageQuery(lang)}`;
const directoryNav = lang => `<nav aria-label="${lang==='en'?'Event categories':'أقسام الفعاليات'}">${CATEGORIES.map(c => `<a href="${categoryUrl(c[0],lang)}">${esc(c[lang==='en'?3:2])}</a>`).join('')}</nav>`;

export function renderDocument({lang='ar',title,description='',url=SITE_URL+'/',image=LOGO,body='',structured=[],index=true,alternates=true,app=true,fallbackVisible=true,extraStyles=''}) {
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
${structured.map(s => `<script type="application/ld+json">${jsonLd(s)}</script>`).join('\n')}${styles}${extraStyles}`;
  let html = appTemplate()
    .replace(/<html\b[^>]*>/i, `<html lang="${lang}" dir="${lang==='en'?'ltr':'rtl'}">`)
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|keywords|robots|author|geo\.[^"']+|ICBM|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `${metadata}</head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${fallbackVisible ? body : '<div style="display:none" data-seo-fallback="true">'+body+'</div>'}</div>`);
  if (!app) html = html.replace(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi, '');
  return html;
}
function eventCard(event,lang) {
  const d = eventDetails(event,lang);
  return `<article><a href="${esc(d.url)}"><img class="seo-card-image" loading="lazy" src="${esc(d.image)}" alt="${esc(d.name)}" /><h2>${esc(d.name)}</h2></a>${d.date?`<time datetime="${esc(d.date)}">${esc(d.date.slice(0,10))}</time>`:''}<p>${esc([d.place,d.city].filter(Boolean).join(' — '))}</p><p>${esc(d.description.slice(0,240))}</p></article>`;
}
function categoryDirectory(category, lang, title, description, events) {
  const en = lang === 'en';
  const otherLang = en ? 'ar' : 'en';
  const nav = CATEGORIES.map(([slug, , ar, english]) =>
    `<a href="${categoryUrl(slug,lang)}"${slug===category[0]?' aria-current="page"':''}>${esc(en?english:ar)}</a>`
  ).join('');
  const cards = events.map(event => {
    const d = eventDetails(event,lang);
    const dateLabel = d.date && new Intl.DateTimeFormat(en?'en-EG':'ar-EG', {
      timeZone:'Africa/Cairo',dateStyle:'medium',...(event.eventStartTime && d.date.includes('T') ? {timeStyle:'short'} : {})
    }).format(new Date(d.date));
    const place = [d.place,d.city].filter(Boolean).join(' — ');
    return `<article class="category-card"><a href="${esc(d.url)}"><img src="${esc(d.image)}" alt="${esc(d.name)}" loading="lazy" /></a><div class="category-card-body"><h2><a href="${esc(d.url)}">${esc(d.name)}</a></h2>${dateLabel?`<time datetime="${esc(d.date)}">${esc(dateLabel)}</time>`:''}${place?`<p>${esc(place)}</p>`:''}${d.description?`<p>${esc(d.description.slice(0,240))}</p>`:''}</div></article>`;
  }).join('');
  return `<main class="category-directory">
    <header class="category-top"><a class="category-brand" href="/${languageQuery(lang)}"><img src="/logo.svg" alt="" />CityEve</a><a hreflang="${otherLang}" lang="${otherLang}" href="${categoryUrl(category[0],otherLang)}">${en?'العربية':'English'}</a></header>
    <section class="category-intro"><div><h1>${esc(title)}</h1><p>${esc(description)}</p></div><a class="category-cta" href="/?category=${category[1]}${en?'&amp;lang=en':''}">${en?'Browse and book in the app':'التصفح والحجز داخل التطبيق'}</a></section>
    <nav class="category-nav" aria-label="${en?'Event categories':'أقسام الفعاليات'}">${nav}</nav>
    <section class="category-grid">${cards||`<p>${en?'No published listings are available in this language yet.':'لا توجد إعلانات منشورة في هذا القسم حاليًا.'}</p>`}</section>
  </main>`;
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
  const isCrawler = /googlebot|bingbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot/i.test(String(req.headers?.['user-agent'] || ''));
  try {
    if (eventId) {
      const valid = typeof eventId==='string' && eventId.length<=150 && !/[\/\u0000-\u001f]/.test(eventId);
      const event = valid ? await readPublicEvent(eventId) : null;
      if (!event) {
        res.setHeader('X-Robots-Tag','noindex');
        const title = en?'Event unavailable | CityEve':'الإعلان غير متاح | CityEve';
        return send(res,404,renderDocument({lang,title,index:false,alternates:false,app:false,body:`<main class="seo-page"><h1>${title}</h1><p>${en?'This event is unavailable. Explore the published events on CityEve.':'هذا الإعلان غير متاح. يمكنك تصفح الفعاليات المنشورة على CityEve.'}</p><a href="/${languageQuery(lang)}">${en?'Browse events':'تصفح الفعاليات'}</a></main>`}));
      }
      const ended = isEndedEvent(event);
      const d = eventDetails(event,lang);
      const dateLabel = event.eventStartTime && d.date.includes('T')
        ? new Intl.DateTimeFormat(en ? 'en-EG' : 'ar-EG', {
          timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short',
        }).format(new Date(d.date))
        : d.date.slice(0, 10);
      const endedNotice = ended ? `<p role="status"><strong>${en?'This event has ended.':'الفعالية انتهت.'}</strong></p>` : '';
      const body = `<main class="seo-page"><a href="/${languageQuery(lang)}">CityEve</a><article><h1>${esc(d.name)}</h1>${endedNotice}<img class="seo-detail-image" src="${esc(d.image)}" alt="${esc(d.name)}" />${d.date?`<p><time datetime="${esc(d.date)}">${esc(dateLabel)}</time></p>`:''}<p>${esc([d.place,d.address,d.city].filter(Boolean).join(' — '))}</p><p class="seo-description">${esc(d.description)}</p>${d.organizer?`<p>${en?'Organizer':'المنظم'}: ${esc(d.organizer)}</p>`:''}</article>${directoryNav(lang)}</main>`;
      return send(res,200,renderDocument({lang,title:d.name+' | CityEve',description:d.description.slice(0,220),url:d.url,image:d.image,structured:[d.structured],body,index:!ended&&(!en||hasEnglish(event)),alternates:hasEnglish(event),app:!ended,fallbackVisible:ended||isCrawler}));
    }
    const category = CATEGORIES.find(c=>c[0]===req.query.page);
    if (req.query.page !== 'home' && !category) return send(res,404,renderDocument({lang,title:'CityEve',index:false,alternates:false,app:false,body:'<main class="seo-page"><h1>404</h1><a href="/">CityEve</a></main>'}));
    const events = (await listCurrentPublicEvents()).filter(e=>(!category || e.category===category[1]) && (!en || hasEnglish(e)));
    events.sort((a,b)=>text(a.eventDate).localeCompare(text(b.eventDate)));
    const title = category ? `${category[en?3:2]} | CityEve` : siteTitle(lang);
    const url = category ? categoryUrl(category[0],lang) : `${SITE_URL}/${languageQuery(lang)}`;
    const description = category ? (en?`Explore published ${category[3].toLowerCase()}, with dates, venues and event details on CityEve.`:`تصفح ${category[2]} المنشورة، واعرف المواعيد والأماكن وتفاصيل كل إعلان على CityEve.`) : siteDescription(lang);
    const body = category ? categoryDirectory(category,lang,category[en?3:2],description,events) : `<main class="seo-page"><nav><a href="/${languageQuery(lang)}">CityEve</a><a hreflang="${en?'ar':'en'}" href="${en?'/':'/?lang=en'}">${en?'العربية':'English'}</a></nav><h1>${esc(title)}</h1><p>${esc(description)}</p>${directoryNav(lang)}<section class="seo-grid">${events.length?events.map(e=>eventCard(e,lang)).join(''):`<p>${en?'No published listings are available in this language yet.':'لا توجد إعلانات منشورة في هذا القسم حاليًا.'}</p>`}</section></main>`;
    const structured = [{'@context':'https://schema.org','@type':category?'CollectionPage':'WebSite',name:title,description,url,inLanguage:lang},
      {'@context':'https://schema.org','@type':'ItemList',itemListElement:events.map((e,i)=>({'@type':'ListItem',position:i+1,url:eventDetails(e,lang).url,name:eventDetails(e,lang).name}))}];
    if (!category) structured.push({'@context':'https://schema.org','@type':'Organization',name:'CityEve',url:SITE_URL,logo:LOGO});
    return send(res,200,renderDocument({lang,title,description,url,body,structured,app:!category,fallbackVisible:category ? true : isCrawler,extraStyles:category?directoryStyles:''}));
  } catch (error) {
    console.error('SEO page unavailable:',error.message);
    res.setHeader('Retry-After','60');
    // An upstream outage must not be cached as a missing event or an empty sitemap.
    return send(res,503,`<!doctype html><html lang="${lang}" dir="${en?'ltr':'rtl'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CityEve</title></head><body><p>${en?'Temporarily unavailable. Please try again shortly.':'الخدمة غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل.'}</p><a href="/index.html${languageQuery(lang)}">CityEve</a></body></html>`);
  }
}
