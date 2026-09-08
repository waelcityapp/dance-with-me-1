import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
} catch (e) {
  console.error('Firebase SDK initialization note:', e);
}

export default async function handler(req, res) {
  const eventId = req.query.event || req.query.eventId;
  const requestedLang = req.query.lang === 'en' ? 'en' : 'ar';
  const isEnglish = requestedLang === 'en';
  const siteName = isEnglish ? 'CityEve' : 'CityEve | سيتي إيف';
  const documentLang = isEnglish ? 'en' : 'ar';
  const documentDir = isEnglish ? 'ltr' : 'rtl';
  const ogLocale = isEnglish ? 'en_US' : 'ar_EG';
  const alternateOgLocale = isEnglish ? 'ar_EG' : 'en_US';

  // Localized default fallback values (CityEve brand)
  let title = isEnglish
    ? "CityEve - Egypt Events, Parties and Activities"
    : "CityEve | سيتي إيف - أهم منصة لجميع أنواع الفعاليات والحفلات في مصر";
  let description = isEnglish
    ? "Discover and book the latest events, parties, courses, exhibitions and activities in Egypt on CityEve."
    : "منصتك الأولى لمعرفة وحجز أحدث الفعاليات والحفلات والكورسات والمعارض في مصر عبر CityEve.";
  let image = "https://res.cloudinary.com/dynasmcaj/image/upload/w_1200,h_630,c_fill,q_auto,f_jpg/fbyjfjq8equle5pl7kwz.png";
  const appIcon = "https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png";
  const appIconSmall = "https://res.cloudinary.com/dynasmcaj/image/upload/w_64,h_64,c_fill,g_auto,q_auto,f_png/fbyjfjq8equle5pl7kwz.png";
  let eventDate = '';
  let eventEndDate = '';
  let eventIsArchived = false;
  let eventIsPaused = false;
  let locationName = "Cairo, Egypt";
  let locationAddress = '';
  let locationCity = 'Cairo';

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'cityeve.online';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const canonicalBase = 'https://cityeve.online';
  const encodedEventId = eventId ? encodeURIComponent(eventId) : '';
  const localizedQuery = isEnglish ? '?lang=en' : '';
  const targetUrl = eventId
    ? `${proto}://${host}/?event=${encodedEventId}${isEnglish ? '&lang=en' : ''}`
    : `${proto}://${host}/${localizedQuery}`;
  const arabicPageUrl = eventId
    ? `${canonicalBase}/e/${encodedEventId}`
    : canonicalBase;
  const englishPageUrl = eventId
    ? `${canonicalBase}/e/${encodedEventId}?lang=en`
    : `${canonicalBase}/?lang=en`;
  const pageUrl = isEnglish ? englishPageUrl : arabicPageUrl;

  // Convert Firestore REST values into normal JavaScript values, including nested maps/arrays.
  const fromFirestoreValue = (value) => {
    if (!value || typeof value !== 'object') return value;
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return Number(value.doubleValue);
    if ('booleanValue' in value) return value.booleanValue;
    if ('timestampValue' in value) return value.timestampValue;
    if ('nullValue' in value) return null;
    if (value.mapValue?.fields) return fromFirestoreFields(value.mapValue.fields);
    if (value.arrayValue?.values) return value.arrayValue.values.map(fromFirestoreValue);
    return value;
  };

  const fromFirestoreFields = (fields) => {
    if (!fields || typeof fields !== 'object') return {};
    return Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)])
    );
  };

  const stripLegacyRepoLinks = (value) => String(value || '')
    .replace(/https?:\/\/(?:www\.)?github\.com\/waelcityapp\/mybucket[^\s<>'\"`)\]]*/gi, '')
    .replace(/(?:www\.)?github\.com\/waelcityapp\/mybucket[^\s<>'\"`)\]]*/gi, '')
    .trim();

  const firstText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
  const isImageUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return false;
    const clean = value.split('?')[0].split('#')[0].toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif|avif)(?:$|\/)/.test(clean) ||
      clean.includes('images.unsplash.com') ||
      clean.includes('cloudinary.com/image/upload');
  };

  const formatPreviewImage = (rawImg) => {
    if (!rawImg || typeof rawImg !== 'string') return image;
    let processedImg = rawImg.trim();

    if (processedImg.includes('cloudinary.com')) {
      if (processedImg.includes('/video/upload/')) {
        return image;
      }
      if (processedImg.includes('/image/upload/') && !processedImg.includes('w_1200')) {
        processedImg = processedImg.replace(
          '/image/upload/',
          '/image/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/'
        );
      }
    } else if (processedImg.includes('images.unsplash.com')) {
      const separator = processedImg.includes('?') ? '&' : '?';
      processedImg = processedImg
        .replace(/([?&])w=\d+/i, '$1w=1200')
        .replace(/([?&])h=\d+/i, '$1h=630');
      if (!/[?&]w=/i.test(processedImg)) processedImg += `${separator}w=1200`;
      if (!/[?&]h=/i.test(processedImg)) processedImg += '&h=630';
      if (!/[?&]fit=/i.test(processedImg)) processedImg += '&fit=crop';
    }

    return processedImg;
  };

  if (eventId) {
    try {
      const collections = ['events', 'ad_submissions'];
      let found = null;

      for (const collectionName of collections) {
        if (found) break;
        const url = 'https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/' + collectionName + '/' + encodeURIComponent(eventId);
        const fbRes = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!fbRes.ok) continue;
        const fbData = await fbRes.json();
        if (fbData && fbData.fields) found = fromFirestoreFields(fbData.fields);
      }

      // REST can be rate-limited. Use the Firebase SDK as a reliable fallback.
      if (!found && firestoreDb) {
        for (const collectionName of collections) {
          try {
            const snap = await getDoc(doc(firestoreDb, collectionName, eventId));
            if (snap.exists()) {
              found = snap.data();
              break;
            }
          } catch (sdkError) {
            console.error('Firebase SDK event lookup note:', sdkError);
          }
        }
      }

      if (found) {
        const event = found.eventData && typeof found.eventData === 'object'
          ? { ...found, ...found.eventData }
          : found;

        const rawTitle = requestedLang === 'en'
          ? firstText(event.titleEn, event.titleAr, found.titleEn, found.titleAr)
          : firstText(event.titleAr, event.titleEn, found.titleAr, found.titleEn);
        const rawDesc = requestedLang === 'en'
          ? firstText(event.descriptionEn, event.descriptionAr, found.descriptionEn, found.descriptionAr)
          : firstText(event.descriptionAr, event.descriptionEn, found.descriptionAr, found.descriptionEn);
        const rawDate = firstText(event.eventDate, event.date, event.startDate, found.eventDate, found.date);
        const rawEndDate = firstText(event.endDate, event.eventEndDate, found.endDate, found.eventEndDate);
        const rawLocation = firstText(
          ...(requestedLang === 'en'
            ? [event.location?.nameEn, event.location?.nameAr, event.locationEn, event.locationAr, found.locationEn, found.locationAr]
            : [event.location?.nameAr, event.location?.nameEn, event.locationAr, event.locationEn, found.locationAr, found.locationEn])
        );
        const rawLocationAddress = firstText(
          event.location?.address, event.address, found.location?.address, found.address
        );
        const rawLocationCity = firstText(
          event.location?.city, event.city, found.location?.city, found.city
        );

        // Keep the event image as the large preview image.
        // Priority: thumbnailUrl, then mediaUrl only when it is an image.
        const thumbnail = firstText(event.thumbnailUrl, found.thumbnailUrl);
        const media = firstText(event.mediaUrl, found.mediaUrl);
        const rawImg = thumbnail || (isImageUrl(media) ? media : '');

        if (rawTitle) title = stripLegacyRepoLinks(rawTitle) + (requestedLang === 'en' ? ' | CityEve' : ' | CityEve سيتي إيف');
        if (rawDesc) description = stripLegacyRepoLinks(rawDesc).replace(/[\r\n]+/g, ' ').substring(0, 220).trim();
        if (rawDate) eventDate = rawDate;
        if (rawEndDate) eventEndDate = rawEndDate;
        eventIsArchived =
          event.status === 'archived' ||
          found.status === 'archived' ||
          event.seoIndexable === false ||
          found.seoIndexable === false;
        eventIsPaused = event.isPaused === true || found.isPaused === true;
        if (rawLocation) locationName = stripLegacyRepoLinks(rawLocation);
        if (rawLocationAddress) locationAddress = stripLegacyRepoLinks(rawLocationAddress);
        if (rawLocationCity) locationCity = stripLegacyRepoLinks(rawLocationCity);
        if (rawImg) image = formatPreviewImage(rawImg);
      }
    } catch (e) {
      console.error('Error fetching event preview from Firestore:', e);
    }
  }

  title = stripLegacyRepoLinks(title);
  description = stripLegacyRepoLinks(description);

  // Clean strings for HTML attributes
  const safeTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeDesc = description.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const keywords = isEnglish
    ? "CityEve, cityeve.online, Egypt events, Cairo events, Egypt parties, Cairo nightlife, salsa Egypt, bachata Egypt, kizomba Egypt, Egypt exhibitions, Egypt conferences, event booking Egypt"
    : "CityEve, سيتي إيف, cityeve.online, فعاليات مصر, حفلات مصر, معارض مصر, مؤتمرات مصر, حفلات القاهرة, سهرات القاهرة, سالسا مصر, باتشاتا مصر, كيزومبا, حجز فعاليات مصر";

  const shouldIndexEvent = !eventIsArchived && !eventIsPaused;
  const eventJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${pageUrl}#event`,
    "identifier": eventId || undefined,
    "name": safeTitle,
    "description": description,
    "image": image,
    "url": pageUrl,
    ...(eventDate ? { "startDate": eventDate } : {}),
    ...(eventEndDate ? { "endDate": eventEndDate } : {}),
    ...(shouldIndexEvent ? { "eventStatus": "https://schema.org/EventScheduled" } : {}),
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": locationName,
      "address": {
        "@type": "PostalAddress",
        ...(locationAddress ? { "streetAddress": locationAddress } : {}),
        "addressLocality": locationCity,
        "addressCountry": "EG"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": siteName,
      "url": "https://cityeve.online/"
    },
    "inLanguage": documentLang
  });

  const html = `<!doctype html>
<html lang="${documentLang}" dir="${documentDir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="robots" content="${shouldIndexEvent ? 'index, follow' : 'noindex, follow'}, max-image-preview:large" />
  <link rel="canonical" href="${pageUrl}" />
  <link rel="alternate" hreflang="ar" href="${arabicPageUrl}" />
  <link rel="alternate" hreflang="en" href="${englishPageUrl}" />
  <link rel="alternate" hreflang="x-default" href="${arabicPageUrl}" />

  <!-- App Logo / Favicon links for WhatsApp & browser crawlers -->
  <link rel="icon" type="image/png" href="${appIconSmall}" />
  <link rel="shortcut icon" href="${appIconSmall}" />
  <link rel="apple-touch-icon" href="${appIconSmall}" />

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="${ogLocale}" />
  <meta property="og:locale:alternate" content="${alternateOgLocale}" />
  <meta property="og:logo" content="${appIconSmall}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${image}" />

  <meta itemprop="image" content="${image}" />
  
  <!-- JSON-LD Event Structured Data for Google Rich Snippets -->
  <script type="application/ld+json">
  ${eventJsonLd.replace(/</g, '\\u003c')}
  </script>

  <meta http-equiv="refresh" content="0;url=${targetUrl}" />
</head>
<body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="text-align:center;padding:20px;">
    <h2>${isEnglish ? 'Redirecting to the event...' : 'جاري تحويلك إلى الإعلان...'}</h2>
    <p><a href="${targetUrl}" style="color:#f59e0b;">${isEnglish ? 'Click here to continue' : 'اضغط هنا للانتقال فوراً'}</a></p>
  </div>
  <script>window.location.href = "${targetUrl}";</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).send(html);
}
