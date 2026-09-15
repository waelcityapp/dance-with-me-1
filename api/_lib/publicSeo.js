import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

const PROJECT_ID = 'dance-with-me-35e98';

let firestoreDb = null;
try {
  const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        projectId: 'dance-with-me-35e98',
        appId: '1:163649448355:web:85ba28f8797c6f9d57d216',
        apiKey: 'AIzaSyCUF8UbABOG3mmdUOzBu8oRh5ht0oWk24I',
        authDomain: 'cityeve.online',
        storageBucket: 'dance-with-me-35e98.firebasestorage.app',
        messagingSenderId: '163649448355'
      });
  firestoreDb = getFirestore(firebaseApp);
} catch (error) {
  console.error('Sitemap Firebase initialization note:', error);
}

export const SITE_URL = 'https://cityeve.online';
export const LOGO = 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png';
export const text = (...values) => values.find(v => typeof v === 'string' && v.trim())?.trim() || '';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const jsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c');
export const CATEGORIES = [
  ['parties', 'party', 'حفلات وسهرات في مصر', 'Parties and nightlife in Egypt'],
  ['courses', 'course', 'كورسات وورش عمل في مصر', 'Courses and workshops in Egypt'],
  ['trips', 'trip', 'رحلات في مصر', 'Trips in Egypt'],
  ['exhibitions', 'exhibition', 'معارض ومؤتمرات في مصر', 'Exhibitions and conferences in Egypt'],
  ['services', 'services', 'خدمات الفعاليات في مصر', 'Event services in Egypt'],
  ['jobs', 'jobs', 'وظائف مجال الفعاليات في مصر', 'Event jobs in Egypt']
];

// This is the same explicit approval requirement used by the original sitemap.
export function isPublicEvent(event) {
  if (!event || event.seoIndexable !== true) return false;
  if (['isPublished','published','approved'].some(k => event[k] === false)) return false;
  if (['isArchived','archived','isPaused','paused','isEmpty'].some(k => event[k] === true)) return false;
  return ['status','approvalStatus','moderationStatus','publishStatus'].every(k =>
    !text(event[k]) || ['published','approved','active','live'].includes(text(event[k]).toLowerCase()));
}

export const hasEnglish = event => Boolean(text(event.titleEn) && text(event.descriptionEn));
const decodeValue = v => {
  if (!v || typeof v !== 'object') return v;
  for (const k of ['stringValue','timestampValue','booleanValue','doubleValue']) if (k in v) return v[k];
  if ('integerValue' in v) return Number(v.integerValue);
  if ('nullValue' in v) return null;
  if ('mapValue' in v) return decodeFields(v.mapValue.fields);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  return undefined;
};
const decodeFields = fields => Object.fromEntries(Object.entries(fields || {}).map(([k,v]) => [k,decodeValue(v)]));
const bounded = async operation => {
  let timer;
  try { return await Promise.race([operation, new Promise((_,reject) => { timer = setTimeout(() => reject(new Error('SEO lookup timeout')), 4500); })]); }
  finally { clearTimeout(timer); }
};
const databaseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
let cachedEvents = null;
let cacheExpires = 0;
let pendingEvents = null;
export async function listPublicEvents() {
  if (cachedEvents && Date.now() < cacheExpires) return cachedEvents;
  if (pendingEvents) return pendingEvents;
  pendingEvents = (async () => {
    let events;
    try {
      const response = await fetch(`${databaseUrl}:runQuery`, {
        method: 'POST', headers: {'Content-Type':'application/json'}, signal: AbortSignal.timeout(4500),
        body: JSON.stringify({structuredQuery: {from:[{collectionId:'events'}], where:{fieldFilter:{field:{fieldPath:'seoIndexable'},op:'EQUAL',value:{booleanValue:true}}}}})
      });
      if (!response.ok) throw new Error(`SEO lookup ${response.status}`);
      const rows = await response.json();
      events = rows.filter(row => row.document).map(({document:d}) => ({...decodeFields(d.fields),id:d.name.split('/').pop()}));
    } catch (error) {
      if (!firestoreDb) throw error;
      const snapshot = await bounded(getDocs(query(collection(firestoreDb,'events'),where('seoIndexable','==',true))));
      events = snapshot.docs.map(d => ({...d.data(), id:d.id}));
    }
    cachedEvents = events.filter(isPublicEvent);
    cacheExpires = Date.now() + 300000;
    return cachedEvents;
  })();
  try { return await pendingEvents; } finally { pendingEvents = null; }
}

export async function readPublicEvent(id) {
  let event;
  try {
    const response = await fetch(`${databaseUrl}/events/${encodeURIComponent(id)}`, {signal:AbortSignal.timeout(4500)});
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`SEO event lookup ${response.status}`);
    event = decodeFields((await response.json()).fields);
  } catch (error) {
    if (!firestoreDb) throw error;
    const snapshot = await bounded(getDoc(doc(firestoreDb,'events',id)));
    if (!snapshot.exists()) return null;
    event = snapshot.data();
  }
  return isPublicEvent(event) ? {...event,id} : null;
}

// The form stores a date-only selection as midnight UTC, not an actual start time.
export function schemaDate(value) {
  const raw = typeof value?.toDate === 'function' ? value.toDate().toISOString() : text(value);
  if (!raw || Number.isNaN(Date.parse(raw))) return '';
  return /^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z)?$/.test(raw) ? raw.slice(0,10) : raw;
}
const safeUrl = value => /^https?:\/\//i.test(text(value)) ? text(value) : '';
export function eventDetails(event, lang) {
  const en = lang === 'en';
  const pick = (ar,enValue) => en ? text(enValue) : text(ar,enValue);
  const name = pick(event.titleAr,event.titleEn) || (en ? 'Event on CityEve' : 'فعالية على CityEve');
  const description = pick(event.descriptionAr,event.descriptionEn);
  const location = event.location || {};
  let image = safeUrl(event.thumbnailUrl);
  const media = safeUrl(event.mediaUrl);
  if (!image && (event.mediaType === 'image' || /\.(png|jpe?g|webp|avif)(?:[?#]|$)|cloudinary.com\/image\/upload/.test(media))) image = media;
  if (!image && media.includes('cloudinary.com/video/upload/')) image = media.replace('/video/upload/','/video/upload/so_0/').replace(/\.[^/.?#]+(?:[?#].*)?$/, '.jpg');
  image ||= LOGO;
  if (image.includes('cloudinary.com/image/upload/') && !image.includes('w_1200')) image = image.replace('/image/upload/','/image/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/');
  const place = pick(location.nameAr,location.nameEn) || text(en ? event.locationEn : event.locationAr);
  const address = pick(location.addressAr,location.addressEn) || text(location.address,event.address);
  const city = pick(location.governorateAr,location.governorateEn) || text(location.city,event.city);
  const organizer = text(event.contact?.organizerName,event.organizerName);
  const date = schemaDate(event.eventDate || event.date || event.startDate);
  const endDate = schemaDate(event.endDate || event.eventEndDate);
  const url = `${SITE_URL}/e/${encodeURIComponent(event.id)}${en?'?lang=en':''}`;
  const structured = {'@context':'https://schema.org','@type':'WebPage',name,description,url,inLanguage:lang};
  // Services/jobs are listings; only dated events with a known place receive Event markup.
  if (['party','course','trip','exhibition'].includes(event.category) && date && place) Object.assign(structured, {
    '@type':'Event', startDate:date, ...(endDate ? {endDate} : {}), image,
    location:{'@type':'Place',name:place,...(address || city ? {address:{'@type':'PostalAddress',...(address?{streetAddress:address}:{}),...(city?{addressLocality:city}:{})}}:{})},
    ...(organizer ? {organizer:{'@type':'Organization',name:organizer}} : {})
  });
  return {name,description,image,place,address,city,organizer,date,url,structured};
}
