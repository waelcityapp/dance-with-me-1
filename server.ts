import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";
import { v2 as cloudinary } from "cloudinary";

// Helper to extract Cloudinary public_id from URL
function extractCloudinaryPublicId(url: string): string | null {
  try {
    if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) return null;
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    let filePath = parts[1];
    
    // Remove query params or hashes
    filePath = filePath.split("?")[0].split("#")[0];
    
    // Split into path segments
    const segments = filePath.split("/");
    
    // Filter out transformation segments (e.g. w_500, f_auto, v1234567, c_fill, etc.)
    const cleanSegments: string[] = [];
    for (const seg of segments) {
      if (/^v\d+$/.test(seg)) continue; // version segment like v1740833123
      if (seg.includes(",") || (seg.includes("_") && /^(c_|w_|h_|f_|q_|l_|g_|b_|so_|e_)/.test(seg))) {
        continue; // transformation segment
      }
      cleanSegments.push(seg);
    }
    
    if (cleanSegments.length === 0) return null;
    
    const fullPath = cleanSegments.join("/");
    const lastDotIndex = fullPath.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      return fullPath.substring(0, lastDotIndex);
    }
    return fullPath;
  } catch (e) {
    return null;
  }
}

// Default / Persisted VAPID Configuration
// Can be customized via environment variables VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "BJGxmjsed25gM5oW5bD85jkU2mXfcMubN-arM5uTobCM5lUQZkUqao22afa32sVLXGvWAcrBnxsz44PYlioeL0I";
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "fRVXq7WFP6pMm3a1J3FESVlyyWrP18K1xVfve6iYECE";

try {
  webpush.setVapidDetails(
    "mailto:support@cityeve.online",
    vapidPublicKey,
    vapidPrivateKey
  );
} catch (vapidErr) {
  console.warn("VAPID set details note:", vapidErr);
}

const pushSubscriptionsMap = new Map<string, any>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser for API routes
  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Cloudinary media delete endpoint
  app.post("/api/delete-media", async (req, res) => {
    try {
      const { url, resourceType = "image" } = req.body || {};
      if (!url || typeof url !== "string") {
        return res.json({ success: true, message: "No URL provided" });
      }

      // Check if not a cloudinary URL
      if (!url.includes("cloudinary.com")) {
        return res.json({ success: true, message: "Not a Cloudinary URL" });
      }

      // Protect default system assets
      const protectedAssets = ["fbyjfjq8equle5pl7kwz", "r5uj8nyeht88n4wqdihq"];
      if (protectedAssets.some((asset) => url.includes(asset))) {
        return res.json({ success: true, message: "Protected default asset preserved" });
      }

      const cloudName =
        process.env.CLOUDINARY_CLOUD_NAME ||
        process.env.VITE_CLOUDINARY_CLOUD_NAME ||
        "dynasmcaj";
      const apiKey =
        process.env.CLOUDINARY_API_KEY ||
        process.env.VITE_CLOUDINARY_API_KEY;
      const apiSecret =
        process.env.CLOUDINARY_API_SECRET ||
        process.env.VITE_CLOUDINARY_API_SECRET;

      // If credentials are not provided in environment, handle gracefully without failing
      if (!apiKey || !apiSecret) {
        return res.json({ success: true, warning: "Cloudinary credentials not set on server" });
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const publicId = extractCloudinaryPublicId(url);
      if (!publicId) {
        return res.json({ success: true, message: "Could not extract public_id" });
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType === "video" ? "video" : "image",
        invalidate: true,
      });

      return res.json({ success: true, result });
    } catch (err: any) {
      console.warn("Cloudinary delete-media note:", err?.message || err);
      return res.json({ success: false, error: err?.message || "Failed to delete" });
    }
  });

  // Web Push Stats Endpoint
  app.get("/api/push-stats", async (req, res) => {
    let totalSubscribers = pushSubscriptionsMap.size;
    const seenIds = new Set<string>();

    for (const [key, item] of pushSubscriptionsMap.entries()) {
      const id = item.deviceId || item.subscription?.endpoint || key;
      if (id) seenIds.add(id);
    }

    try {
      const fbRes = await fetch("https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/push_subscribers?pageSize=300");
      if (fbRes.ok) {
        const fbData: any = await fbRes.json();
        if (fbData && fbData.documents && Array.isArray(fbData.documents)) {
          for (const doc of fbData.documents) {
            const docName = doc.name ? doc.name.split("/").pop() : null;
            const docId = doc.fields?.id?.stringValue || doc.fields?.deviceId?.stringValue || doc.fields?.endpoint?.stringValue || docName;
            if (docId && !seenIds.has(docId)) {
              seenIds.add(docId);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Error reading push_subscribers stats from Firestore:", err);
    }

    totalSubscribers = Math.max(seenIds.size, pushSubscriptionsMap.size);
    return res.json({
      success: true,
      count: totalSubscribers,
      activeMemory: pushSubscriptionsMap.size
    });
  });

  // Web Push VAPID Public Key Endpoint
  app.get("/api/push-vapid-key", (req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  // Web Push / Device Subscribe Endpoint
  app.post("/api/push-subscribe", (req, res) => {
    const { subscription, userId, userEmail, subscriberId, deviceId, platform, permission } = req.body;
    const id = subscriberId || deviceId || subscription?.endpoint || `sub_${Date.now()}`;
    
    pushSubscriptionsMap.set(id, {
      subscription: subscription || null,
      deviceId: deviceId || id,
      userId: userId || null,
      userEmail: userEmail || null,
      platform: platform || "web",
      permission: permission || "default",
      subscribedAt: new Date().toISOString()
    });
    return res.json({ success: true, count: pushSubscriptionsMap.size, id });
  });

  // Web Push Unsubscribe Endpoint
  app.post("/api/push-unsubscribe", (req, res) => {
    const { endpoint, deviceId } = req.body;
    if (endpoint || deviceId) {
      for (const [key, val] of pushSubscriptionsMap.entries()) {
        if ((endpoint && val.subscription?.endpoint === endpoint) || (deviceId && val.deviceId === deviceId)) {
          pushSubscriptionsMap.delete(key);
        }
      }
    }
    return res.json({ success: true });
  });

  // Web Push Send / Broadcast Endpoint
  app.post("/api/send-push", async (req, res) => {
    const { title, body, url, image, eventId } = req.body;
    const payload = JSON.stringify({
      title: title || "CityEve | إشعار جديد 🔔",
      body: body || "يوجد إعلان جديد أو تحديث مهم في التطبيق!",
      url: url || "/",
      image: image || undefined,
      eventId: eventId || undefined,
      timestamp: Date.now()
    });

    const subsToSend: any[] = [];
    const seenEndpoints = new Set<string>();

    // 1. From active memory subscribers
    for (const item of pushSubscriptionsMap.values()) {
      if (item.subscription && item.subscription.endpoint && !seenEndpoints.has(item.subscription.endpoint)) {
        subsToSend.push(item.subscription);
        seenEndpoints.add(item.subscription.endpoint);
      }
    }

    // 2. From Firestore push_subscribers collection
    try {
      const fbRes = await fetch("https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/push_subscribers?pageSize=300");
      if (fbRes.ok) {
        const fbData: any = await fbRes.json();
        if (fbData && fbData.documents && Array.isArray(fbData.documents)) {
          for (const doc of fbData.documents) {
            const endpoint = doc.fields?.endpoint?.stringValue;
            if (endpoint && !seenEndpoints.has(endpoint)) {
              let subObj = null;
              if (doc.fields?.subscription?.stringValue) {
                try {
                  subObj = JSON.parse(doc.fields.subscription.stringValue);
                } catch (e) {}
              } else if (doc.fields?.subscription?.mapValue?.fields) {
                const f = doc.fields.subscription.mapValue.fields;
                subObj = {
                  endpoint: f.endpoint?.stringValue || endpoint,
                  keys: {
                    p256dh: f.keys?.mapValue?.fields?.p256dh?.stringValue,
                    auth: f.keys?.mapValue?.fields?.auth?.stringValue
                  }
                };
              }
              if (subObj && subObj.keys) {
                subsToSend.push(subObj);
                seenEndpoints.add(endpoint);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("Error reading push_subscribers from Firestore:", err);
    }

    let sentCount = 0;
    let failCount = 0;

    const sendPromises = subsToSend.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
        sentCount++;
      } catch (err: any) {
        failCount++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          for (const [key, val] of pushSubscriptionsMap.entries()) {
            if (val.subscription?.endpoint === sub.endpoint) {
              pushSubscriptionsMap.delete(key);
            }
          }
        }
      }
    });

    await Promise.allSettled(sendPromises);

    return res.json({
      success: true,
      sentCount,
      failCount,
      totalSubscribers: subsToSend.length
    });
  });


  // Dynamic Open Graph / SEO Preview for Shared Events
  // Allows WhatsApp, Facebook, Twitter, and Telegram to render the event banner & details
  app.get("/api/og-image", (req, res) => {
    const defaultLogo = "https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png";
    const imgUrl = (req.query.url as string) || defaultLogo;
    res.redirect(302, imgUrl);
  });

  app.get(["/api/og-event", "/e/:eventId", "/event/:eventId"], async (req, res) => {
    const eventId = (req.query.event || req.params.eventId) as string;
    let title = "CityEve | سيتي إيف - أهم تطبيق لجميع أنواع الحفلات في مصر";
    let description = "منصتك الأولى لمعرفة وحجز أحدث الحفلات، الكورسات، ورحلات الرقص في مصر.";
    let image = "https://res.cloudinary.com/dynasmcaj/image/upload/w_1200,h_630,c_fill,q_auto,f_jpg/fbyjfjq8equle5pl7kwz.png";
    const appIcon = "https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png";
    const host = (req.headers['x-forwarded-host'] || req.headers.host || 'cityeve.online') as string;
    const proto = (req.headers['x-forwarded-proto'] || 'https') as string;
    const targetUrl = `${proto}://${host}/?event=${eventId || ''}`;
    const pageUrl = eventId ? `${proto}://${host}/e/${eventId}` : targetUrl;

    if (eventId) {
      try {
        const fbRes = await fetch(`https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/events/${eventId}`);
        if (fbRes.ok) {
          const fbData: any = await fbRes.json();
          if (fbData && fbData.fields) {
            const rawTitle = fbData.fields.titleAr?.stringValue || fbData.fields.titleEn?.stringValue;
            const rawDesc = fbData.fields.descriptionAr?.stringValue || fbData.fields.descriptionEn?.stringValue;
            const rawImg = fbData.fields.mediaUrl?.stringValue || fbData.fields.thumbnailUrl?.stringValue;

            if (rawTitle) title = `${rawTitle} | CityEve سيتي إيف`;
            if (rawDesc) description = rawDesc.substring(0, 200).replace(/[\r\n]+/g, ' ');
            if (rawImg && rawImg.trim().length > 0) {
              let processedImg = rawImg.trim();
              if (processedImg.includes('cloudinary.com')) {
                // Add CityEve subtle watermark logo badge in south_east corner
                if (processedImg.includes('/video/upload/')) {
                  processedImg = processedImg
                    .replace('/video/upload/', '/video/upload/w_1200,h_630,c_fill,so_1,q_auto,f_jpg/l_fbyjfjq8equle5pl7kwz,w_180,g_south_east,x_24,y_24,o_90/')
                    .replace(/\.(mp4|mov|webm|avi|m4v)$/i, '.jpg');
                } else if (processedImg.includes('/image/upload/')) {
                  processedImg = processedImg.replace('/image/upload/', '/image/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/l_fbyjfjq8equle5pl7kwz,w_180,g_south_east,x_24,y_24,o_90/');
                }
              }
              image = processedImg;
            }
          }
        }
      } catch (e) {
        console.error('Error fetching event in Express OG handler:', e);
      }
    }

    const safeTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeDesc = description.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const keywords = "CityEve, سيتي إيف, حفلات مصر, معارض مصر, مؤتمرات مصر, معارض القاهرة, حفلات لاتيني في مصر, سالسا مصر, باتشاتا مصر, كيزومبا, سهرات ليلية, حجز تذاكر حفلات, حجز مؤتمرات, فعاليات مصر, Salsa Egypt, Cairo Nightlife, Egypt Events, Egypt Exhibitions, Cairo Conferences";

    const eventJsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      "name": safeTitle,
      "description": safeDesc,
      "image": image,
      "url": pageUrl,
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": "Cairo, Egypt",
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

  <link rel="icon" type="image/png" href="${appIcon}" />
  <link rel="shortcut icon" href="${appIcon}" />
  <link rel="apple-touch-icon" href="${appIcon}" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="CityEve | سيتي إيف" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${image}" />
  <meta itemprop="image" content="${image}" />
  
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

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=7200");
    return res.send(html);
  });

  // Proxy /api/events for SEO / External Crawlers
  app.get("/api/events", async (req, res) => {
    try {
      const fbRes = await fetch("https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/events");
      if (fbRes.ok) {
        const data = await fbRes.json();
        return res.json(data);
      }
      return res.status(500).json({ error: "Failed to fetch from Firestore" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Dynamic Sitemap.xml generator with all active events for Google indexing
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const host = (req.headers['x-forwarded-host'] || req.headers.host || 'cityeve.online') as string;
      const proto = (req.headers['x-forwarded-proto'] || 'https') as string;
      const baseUrl = `${proto}://${host}`;
      const now = new Date().toISOString();

      let eventUrls = '';
      try {
        const fbRes = await fetch("https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/events");
        if (fbRes.ok) {
          const data: any = await fbRes.json();
          if (data && data.documents && Array.isArray(data.documents)) {
            eventUrls = data.documents.map((doc: any) => {
              const id = doc.name.split('/').pop();
              const updateTime = doc.updateTime || now;
              return `
  <url>
    <loc>${baseUrl}/e/${id}</loc>
    <lastmod>${updateTime}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
            }).join('');
          }
        }
      } catch (err) {
        console.error('Error querying events for sitemap:', err);
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=parties</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=courses</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?tab=trips</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${eventUrls}
</urlset>`;

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=7200");
      return res.send(sitemap);
    } catch (e: any) {
      return res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const host = (req.headers['x-forwarded-host'] || req.headers.host || 'cityeve.online') as string;
    const proto = (req.headers['x-forwarded-proto'] || 'https') as string;
    const content = `User-agent: *
Allow: /
Sitemap: ${proto}://${host}/sitemap.xml
`;
    res.setHeader("Content-Type", "text/plain");
    return res.send(content);
  });

  // Vite development middleware vs Static production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CityEve Web Server running on port ${PORT}`);
  });
}

startServer();
