export default async function handler(req, res) {
  const eventId = req.query.event || req.query.eventId;

  // Default fallback values (CityEve brand)
  let title = "CityEve | سيتي إيف - أهم تطبيق لجميع أنواع الحفلات في مصر";
  let description = "منصتك الأولى لمعرفة وحجز أحدث الحفلات، الكورسات، ورحلات الرقص في مصر.";
  let image = "https://res.cloudinary.com/dynasmcaj/image/upload/w_1200,h_630,c_fill,q_auto,f_jpg/fbyjfjq8equle5pl7kwz.png";
  const appIcon = "https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png";
  let eventDate = new Date().toISOString();
  let locationName = "Cairo, Egypt";

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'cityeve.online';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const targetUrl = `${proto}://${host}/?event=${eventId || ''}`;
  const pageUrl = eventId ? `${proto}://${host}/e/${eventId}` : targetUrl;

  if (eventId) {
    try {
      const fbRes = await fetch(`https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/events/${eventId}`);
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (fbData && fbData.fields) {
          const rawTitle = fbData.fields.titleAr?.stringValue || fbData.fields.titleEn?.stringValue;
          const rawDesc = fbData.fields.descriptionAr?.stringValue || fbData.fields.descriptionEn?.stringValue;
          const rawImg = fbData.fields.mediaUrl?.stringValue || fbData.fields.thumbnailUrl?.stringValue;
          const rawDate = fbData.fields.date?.stringValue;
          const rawLoc = fbData.fields.locationAr?.stringValue || fbData.fields.locationEn?.stringValue;

          if (rawTitle) title = `${rawTitle} | CityEve سيتي إيف`;
          if (rawDesc) description = rawDesc.substring(0, 200).replace(/[\r\n]+/g, ' ');
          if (rawDate) eventDate = rawDate;
          if (rawLoc) locationName = rawLoc;
          if (rawImg && rawImg.trim().length > 0) {
            let processedImg = rawImg.trim();
            if (processedImg.includes('cloudinary.com')) {
              if (processedImg.includes('/video/upload/')) {
                // Transform video into 1200x630 JPEG frame snapshot for WhatsApp/FB previews
                processedImg = processedImg
                  .replace('/video/upload/', '/video/upload/w_1200,h_630,c_fill,so_1,q_auto,f_jpg/')
                  .replace(/\.(mp4|mov|webm|avi|m4v)$/i, '.jpg');
              } else if (processedImg.includes('/image/upload/')) {
                processedImg = processedImg.replace('/image/upload/', '/image/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/');
              }
            }
            image = processedImg;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching event from Firestore:', e);
    }
  }

  // Clean strings for HTML attributes
  const safeTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeDesc = description.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const keywords = "CityEve, سيتي إيف, حفلات مصر, حفلات القاهرة, حفلات لاتيني في مصر, سالسا مصر, باتشاتا مصر, كيزومبا, سهرات ليلية, حجز تذاكر حفلات, فعاليات مصر, Salsa Egypt, Cairo Nightlife, Egypt Events";

  const eventJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    "name": safeTitle,
    "description": safeDesc,
    "image": image,
    "url": pageUrl,
    "startDate": eventDate,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": locationName,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Cairo",
        "addressCountry": "EG"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "CityEve | سيتي إيف",
      "url": "https://cityeve.online/"
    }
  });

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${pageUrl}" />

  <!-- App Logo / Favicon links for WhatsApp & browser crawlers -->
  <link rel="icon" type="image/png" href="${appIcon}" />
  <link rel="shortcut icon" href="${appIcon}" />
  <link rel="apple-touch-icon" href="${appIcon}" />

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="CityEve | سيتي إيف" />
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
  ${eventJsonLd}
  </script>

  <meta http-equiv="refresh" content="0;url=${targetUrl}" />
</head>
<body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="text-align:center;padding:20px;">
    <h2>جاري تحويلك إلى الإعلان...</h2>
    <p><a href="${targetUrl}" style="color:#f59e0b;">اضغط هنا للانتقال فوراً</a></p>
  </div>
  <script>window.location.href = "${targetUrl}";</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).send(html);
}
