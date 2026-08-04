export default async function handler(req, res) {
  const eventId = req.query.event;

  try {
    const host = req.headers.host || 'cityeve.online';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const fullUrl = `${proto}://${host}/?event=${eventId}`;
    
    // We add a cache buster so we don't infinitely loop or get a cached rewritten version
    const htmlRes = await fetch(`${proto}://${host}/index.html?internal=1`);
    let html = await htmlRes.text();

    // 2. Fetch event from Firebase REST API
    const fbRes = await fetch(`https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/events/${eventId}`);
    const fbData = await fbRes.json();

    if (fbData && fbData.fields) {
      let title = fbData.fields.titleAr?.stringValue || fbData.fields.titleEn?.stringValue || 'CityEve Event';
      let description = fbData.fields.descriptionAr?.stringValue || fbData.fields.descriptionEn?.stringValue || 'CityEve Event';
      let image = fbData.fields.mediaUrl?.stringValue || fbData.fields.thumbnailUrl?.stringValue || 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png';
      
      // Sanitize for HTML attributes
      title = title.replace(/"/g, '&quot;');
      description = description.replace(/"/g, '&quot;');

      // Try to optimize image if it's cloudinary
      if (image.includes('cloudinary.com') && image.includes('/upload/')) {
        // WhatsApp prefers images smaller than 300kb. We can resize it on the fly using Cloudinary's URL API
        image = image.replace('/upload/', '/upload/w_1200,h_630,c_fill,q_auto,f_auto/');
      }

      // 3. Replace OG tags
      html = html.replace(/<title>.*?<\/title>/, `<title>${title} | CityEve</title>`);
      html = html.replace(/<meta property="og:title" content="[^"]+" \/>/, `<meta property="og:title" content="${title} | CityEve" />`);
      html = html.replace(/<meta property="og:description" content="[^"]+" \/>/, `<meta property="og:description" content="${description}" />`);
      html = html.replace(/<meta property="og:image" content="[^"]+" \/>/g, `<meta property="og:image" content="${image}" />`);
      html = html.replace(/<meta property="og:url" content="[^"]+" \/>/g, `<meta property="og:url" content="${fullUrl}" />`);
      html = html.replace(/<meta name="twitter:title" content="[^"]+" \/>/, `<meta name="twitter:title" content="${title} | CityEve" />`);
      html = html.replace(/<meta name="twitter:description" content="[^"]+" \/>/, `<meta name="twitter:description" content="${description}" />`);
      html = html.replace(/<meta name="twitter:image" content="[^"]+" \/>/g, `<meta name="twitter:image" content="${image}" />`);
      html = html.replace(/<meta itemprop="image" content="[^"]+" \/>/, `<meta itemprop="image" content="${image}" />`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).send(html);
  } catch (err) {
    console.error('OG API Error:', err);
    // If it fails, redirect back without the query to avoid infinite loops, or just serve something basic
    res.redirect(302, '/');
  }
}
