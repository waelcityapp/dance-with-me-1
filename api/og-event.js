import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const eventId = req.query.event;

  // Default fallback values (CityEve brand)
  let title = "CityEve | سيتي إيف - أهم تطبيق لجميع أنواع الحفلات في مصر";
  let description = "منصتك الأولى لمعرفة وحجز أحدث الحفلات، الكورسات، ورحلات الرقص في مصر.";
  let image = "https://res.cloudinary.com/dynasmcaj/image/upload/w_1200,h_630,c_fill,q_auto,f_jpg/fbyjfjq8equle5pl7kwz.png";
  const host = req.headers.host || 'cityeve.online';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const fullUrl = `${proto}://${host}/?event=${eventId || ''}`;

  if (eventId) {
    try {
      const fbRes = await fetch(`https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/events/${eventId}`);
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (fbData && fbData.fields) {
          const rawTitle = fbData.fields.titleAr?.stringValue || fbData.fields.titleEn?.stringValue;
          const rawDesc = fbData.fields.descriptionAr?.stringValue || fbData.fields.descriptionEn?.stringValue;
          const rawImg = fbData.fields.mediaUrl?.stringValue || fbData.fields.thumbnailUrl?.stringValue;

          if (rawTitle) title = `${rawTitle} | CityEve سيتي إيف`;
          if (rawDesc) description = rawDesc.substring(0, 200).replace(/[\r\n]+/g, ' ');
          if (rawImg) {
            image = rawImg;
            if (image.includes('cloudinary.com') && image.includes('/upload/')) {
              // Format for WhatsApp & Social preview (1200x630 JPG < 300KB)
              image = image.replace('/upload/', '/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/');
            }
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

  // Read base index.html from disk safely
  let baseHtml = '';
  try {
    const distIndex = path.join(process.cwd(), 'dist', 'index.html');
    const rootIndex = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(distIndex)) {
      baseHtml = fs.readFileSync(distIndex, 'utf8');
    } else if (fs.existsSync(rootIndex)) {
      baseHtml = fs.readFileSync(rootIndex, 'utf8');
    }
  } catch (err) {
    console.warn('Could not read local index.html, using dynamic template fallback:', err);
  }

  if (baseHtml) {
    // Replace existing tags inside index.html
    baseHtml = baseHtml.replace(/<title>.*?<\/title>/i, `<title>${safeTitle}</title>`);
    baseHtml = baseHtml.replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${safeTitle}" />`);
    baseHtml = baseHtml.replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${safeDesc}" />`);
    baseHtml = baseHtml.replace(/<meta property="og:image" content="[^"]*" \/>/gi, `<meta property="og:image" content="${image}" />`);
    baseHtml = baseHtml.replace(/<meta property="og:url" content="[^"]*" \/>/gi, `<meta property="og:url" content="${fullUrl}" />`);
    baseHtml = baseHtml.replace(/<meta name="twitter:title" content="[^"]*" \/>/i, `<meta name="twitter:title" content="${safeTitle}" />`);
    baseHtml = baseHtml.replace(/<meta name="twitter:description" content="[^"]*" \/>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
    baseHtml = baseHtml.replace(/<meta name="twitter:image" content="[^"]*" \/>/gi, `<meta name="twitter:image" content="${image}" />`);
    baseHtml = baseHtml.replace(/<meta itemprop="image" content="[^"]*" \/>/i, `<meta itemprop="image" content="${image}" />`);

    // Inject extra OG tags for WhatsApp & Facebook crawlers right before </head>
    const extraOgTags = `
    <meta property="og:site_name" content="CityEve | سيتي إيف" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/jpeg" />
    `;
    baseHtml = baseHtml.replace('</head>', `${extraOgTags}\n</head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(baseHtml);
  }

  // Fallback full HTML response if index.html was unreadable
  const fullHtml = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  
  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="CityEve | سيتي إيف" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${image}" />
  
  <meta http-equiv="refresh" content="0;url=${fullUrl}" />
</head>
<body>
  <p>جاري التحويل إلى الإعلان... <a href="${fullUrl}">اضغط هنا إذا لم يتم التحويل تلقائياً</a></p>
  <script>window.location.href = "${fullUrl}";</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).send(fullHtml);
}
