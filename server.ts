import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON request body parsing
  app.use(express.json());

  // Configure cloudinary if env vars are present
  if (process.env.VITE_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  // API routes go here FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Redirect favicon requests directly to the app icon image
  app.get("/favicon.ico", (req, res) => {
    res.redirect("https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png");
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
                if (processedImg.includes('/video/upload/')) {
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

  <!-- App Logo / Favicon links for WhatsApp & browser crawlers -->
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
  <meta property="og:image:type" content="image/jpeg" />
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

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(html);
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
      }

      // Dynamic import to avoid loading it if not used immediately, though top-level is fine if installed
      const { GoogleGenAI } = await import("@google/genai");

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Translate the following text to ${targetLang === 'ar' ? 'Arabic' : 'English'}. Return ONLY the translated text without any explanation, markdown formatting, or quotes.\n\nOriginal text:\n${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const translatedText = response.text?.trim() || "";
      res.json({ translatedText });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Failed to translate text" });
    }
  });

  app.post("/api/delete-media", async (req, res) => {
    const { url, resourceType } = req.body;
    if (!url || !url.includes("cloudinary.com")) {
      return res.status(400).json({ error: "Invalid Cloudinary URL" });
    }

    if (!process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: "Cloudinary API Secret not configured on server" });
    }

    try {
      // Extract public ID from the URL
      // Example URL: https://res.cloudinary.com/cloudname/image/upload/v1234567890/folder/filename.jpg
      const urlParts = url.split("/");
      const uploadIndex = urlParts.findIndex(p => p === "upload");
      if (uploadIndex === -1) {
         return res.status(400).json({ error: "Could not parse public ID from URL" });
      }
      
      const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join("/");
      const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ""); // remove extension
      
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType || 'image' });
      res.json({ success: true, result });
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
