import test from 'node:test';
import assert from 'node:assert/strict';
import handler, {renderDocument} from '../api/_lib/handlers/og-event.js';
import sitemap from '../api/_lib/handlers/sitemap.js';
import {isPublicEvent,schemaDate,eventDetails} from '../api/_lib/publicSeo.js';

const approved = {id:'published',seoIndexable:true,category:'party',titleAr:'حفلة سالسا',titleEn:'Salsa night',descriptionAr:'تفاصيل الحفلة',descriptionEn:'A salsa night',eventDate:'2026-09-15T00:00:00.000Z',location:{nameAr:'مكان الحفلة',nameEn:'The venue',addressAr:'عنوان المكان',addressEn:'Venue address',governorateAr:'الإسكندرية',governorateEn:'Alexandria'},contact:{organizerName:'Actual organizer'}};
const value = v => typeof v==='boolean'?{booleanValue:v}:typeof v==='string'?{stringValue:v}:{mapValue:{fields:fields(v)}};
const fields = object => Object.fromEntries(Object.entries(object).map(([k,v])=>[k,value(v)]));
const document = e => ({name:`projects/demo/databases/(default)/documents/events/${e.id}`,fields:fields(e)});
const response = () => ({headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},send(html){this.html=html;return this;}});

test('Only explicitly approved, active public events can be indexed',()=>{
  assert.equal(isPublicEvent(approved),true);
  for (const extra of [{seoIndexable:false},{seoIndexable:undefined},{isPaused:true},{status:'archived'},{approvalStatus:'pending'},{isPublished:false},{isEmpty:true}]) assert.equal(isPublicEvent({...approved,...extra}),false);
});
test('Use date-only values and real location/organizer, never fabricated defaults',()=>{
  assert.equal(schemaDate(approved.eventDate),'2026-09-15');
  assert.equal(schemaDate('2026-09-15T21:00:00+03:00'),'2026-09-15T21:00:00+03:00');
  const s=eventDetails(approved,'en').structured;
  assert.equal(s.location.address.addressLocality,'Alexandria');
  assert.equal(s.organizer.name,'Actual organizer');
  assert.equal(s.startDate,'2026-09-15');
  assert.equal(eventDetails({...approved,location:{},contact:{}},'en').structured['@type'],'WebPage');
  assert.equal(eventDetails({...approved,category:'jobs'},'en').structured['@type'],'WebPage');
});
test('English metadata and canonical are independent, structured text cannot inject scripts',()=>{
  const html=renderDocument({lang:'en',title:'English title',url:'https://cityeve.online/?lang=en',structured:[{name:'</script><script>alert(1)</script>'}],body:'<main>Readable text</main>'});
  assert.match(html,/<html lang="en" dir="ltr">/);
  assert.match(html,/<link rel="canonical" href="https:\/\/cityeve.online\/\?lang=en"/);
  assert.equal((html.match(/<title>/g)||[]).length,1);
  assert.doesNotMatch(html,/<script>alert/);
  assert.match(html,/Readable text/);
  assert.match(html,/type="module"/);
});
test('Published pages, missing/private events, bot parity, bilingual sitemap and category links',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async url=>{
    if(String(url).endsWith(':runQuery')) return new Response(JSON.stringify([approved,{...approved,id:'unapproved',seoIndexable:false},{...approved,id:'arabic-only',titleEn:'',descriptionEn:''}].map(e=>({document:document(e)}))),{status:200});
    const id=String(url).split('/').pop();
    if(id==='missing')return new Response('{}',{status:404});
    return new Response(JSON.stringify(document({...approved,id,seoIndexable:id!=='unapproved'})),{status:200});
  };
  try {
    const regular=response();await handler({query:{event:'published'},headers:{}},regular);
    const bot=response();await handler({query:{event:'published'},headers:{'user-agent':'Googlebot'}},bot);
    assert.equal(regular.statusCode,200);assert.equal(regular.html,bot.html);
    assert.match(regular.html,/<h1>حفلة سالسا<\/h1>/);
    assert.doesNotMatch(regular.html,/http-equiv="refresh"|window.location.href/);
    assert.match(regular.html,/type="module"/);
    for(const id of ['missing','unapproved']) {const r=response();await handler({query:{event:id},headers:{}},r);assert.equal(r.statusCode,404);assert.match(r.html,/noindex/);assert.doesNotMatch(r.html,/حفلة سالسا|"@type":"Event"|type="module"/);}
    const category=response();await handler({query:{page:'parties',lang:'en'},headers:{}},category);
    assert.match(category.html,/Salsa night/);assert.match(category.html,/\/e\/published\?lang=en/);assert.doesNotMatch(category.html,/unapproved|type="module"/);
    const map=response();await sitemap({},map);assert.equal(map.statusCode,200);assert.match(map.html,/hreflang="en"/);assert.match(map.html,/\/\?lang=en<\/loc>/);assert.doesNotMatch(map.html,/unapproved|arabic-only\?lang=en/);assert.match(map.html,/\/e\/arabic-only<\/loc>/);
  } finally {globalThis.fetch=original;}
});
