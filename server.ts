import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";
import { v2 as cloudinary } from "cloudinary";
import { createVerify } from "crypto";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

// Initialize Firebase SDK on server for reliable event metadata & SEO without 429 quota limits
let db: any = null;
try {
  const cfgRaw = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8");
  const cfg = JSON.parse(cfgRaw);
  const fbApp = !getApps().length ? initializeApp(cfg) : getApps()[0];
  db = getFirestore(fbApp);
} catch (e) {
  console.warn("Server Firebase initialization note:", e);
}

// Helper to parse Firestore REST API response fields
function parseFirestoreFields(fieldsObj: any): Record<string, any> {
  if (!fieldsObj || typeof fieldsObj !== 'object') return {};
  const res: Record<string, any> = {};
  for (const [key, val] of Object.entries(fieldsObj)) {
    if (!val || typeof val !== 'object') continue;
    const v = val as any;
    if (v.stringValue !== undefined) res[key] = v.stringValue;
    else if (v.booleanValue !== undefined) res[key] = v.booleanValue;
    else if (v.integerValue !== undefined) res[key] = Number(v.integerValue);
    else if (v.doubleValue !== undefined) res[key] = Number(v.doubleValue);
    else if (v.mapValue && v.mapValue.fields) res[key] = parseFirestoreFields(v.mapValue.fields);
    else if (v.arrayValue && v.arrayValue.values) {
      res[key] = v.arrayValue.values.map((item: any) => {
        if (item.stringValue !== undefined) return item.stringValue;
        if (item.mapValue && item.mapValue.fields) return parseFirestoreFields(item.mapValue.fields);
        return item;
      });
    }
  }
  return res;
}

// In-memory cache for event metadata to ensure instant (1ms) crawler responses
const eventOgCache = new Map<string, { title: string; desc: string; image: string; time: number }>();

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

// Verify Firebase Auth before allowing destructive Cloudinary operations.
const firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  "dance-with-me-35e98";
const adminEmail =
  process.env.ADMIN_EMAIL ||
  process.env.VITE_ADMIN_EMAIL ||
  "waelvts@gmail.com";

let firebaseCertsCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getFirebaseCerts(): Promise<Record<string, string>> {
  if (firebaseCertsCache && firebaseCertsCache.expiresAt > Date.now()) {
    return firebaseCertsCache.certs;
  }
  const response = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );
  if (!response.ok) throw new Error("Unable to load Firebase token certificates");
  const certs = await response.json() as Record<string, string>;
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\\d+)/)?.[1] || 3600);
  firebaseCertsCache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

async function isAuthorizedAdminRequest(req: express.Request): Promise<boolean> {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return false;
    const token = header.slice("Bearer ".length).trim();
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const decode = (value: string) =>
      JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const tokenHeader = decode(parts[0]);
    const tokenPayload = decode(parts[1]);
    if (tokenHeader.alg !== "RS256" || !tokenHeader.kid) return false;

    const certs = await getFirebaseCerts();
    const certificate = certs[tokenHeader.kid];
    if (!certificate) return false;

    const verifier = createVerify("RSA-SHA256");
    verifier.update(parts[0] + "." + parts[1]);
    verifier.end();
    if (!verifier.verify(certificate, Buffer.from(parts[2], "base64url"))) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return tokenPayload.aud === firebaseProjectId
      && tokenPayload.iss === ("https://securetoken.google.com/" + firebaseProjectId)
      && typeof tokenPayload.sub === "string"
      && tokenPayload.exp > now
      && tokenPayload.email === adminEmail
      && tokenPayload.email_verified === true;
  } catch {
    return false;
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

  // Cloudinary media delete endpoint. Destructive deletion is admin-only.
  app.post("/api/delete-media", async (req, res) => {
    try {
      if (!(await isAuthorizedAdminRequest(req))) {
        return res.status(403).json({
          success: false,
          error: "Admin authentication required",
        });
      }
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

  // Built-in fallback events for instant zero-latency Open Graph previews
  const BUILTIN_EVENTS_FALLBACK: Record<string, {
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    priceAr?: string;
    priceEn?: string;
    location?: { nameAr: string; nameEn?: string };
    thumbnailUrl?: string;
    mediaUrl?: string;
  }> = {
    'evt_hero_cairo_nights': {
      titleAr: 'سهرة ليالي اللاتين والرقص الكبرى - القاهرة',
      titleEn: 'Grand Latin Dance & Salsa Night - Cairo',
      descriptionAr: 'أقوى سهرة لاتينية تجمع عشاق السالسا والباتشاتا والكيزومبا مع أفضل الـ DJs في أجواء ساحرة وموسيقى لايف.',
      descriptionEn: 'The biggest Latin dance night bringing together Salsa, Bachata, and Kizomba lovers with top DJs and live music.',
      priceAr: '350 ج.م شامل مشروب',
      priceEn: '350 EGP with drink',
      location: { nameAr: 'رويال كلوب - الزمالك، القاهرة', nameEn: 'Royal Club - Zamalek, Cairo' },
      thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&h=630&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&h=630&q=80'
    },
    'evt_party_rooftop_bachata': {
      titleAr: 'سهرة الباتشاتا على الروف المطل على النيل',
      titleEn: 'Rooftop Bachata & Salsa Sunset Party',
      descriptionAr: 'استمتع بأروع إطلالة على النيل مع دروس تمهيدية وسوشيال دانس حتى منتصف الليل.',
      descriptionEn: 'Enjoy breathtaking Nile views with intro workshops and social dancing till midnight.',
      priceAr: '250 ج.م',
      priceEn: '250 EGP',
      location: { nameAr: 'سكاي فيو روف بار - كورنيش المعادي', nameEn: 'Sky View Rooftop - Maadi Corniche' },
      thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&h=630&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&h=630&q=80'
    },
    'evt_expo_tech_design': {
      titleAr: 'معرض القاهرة الدولي للفعاليات والفنون والتقنية 2026',
      titleEn: 'Cairo International Events & Tech Expo 2026',
      descriptionAr: 'الملتقى الأضخم لصناع الفعاليات والمصممين وشركات الإنتاج والتسويق الرقمي.',
      descriptionEn: 'The biggest gathering for event organizers, designers, production agencies, and digital tech.',
      priceAr: 'دخول مجاني بالتسجيل',
      priceEn: 'Free with Registration',
      location: { nameAr: 'مركز المنارة للمؤتمرات الدولية - التجمع الخامس', nameEn: 'Al Manara International Center - New Cairo' },
      thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&h=630&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&h=630&q=80'
    },
    'evt_course_masterclass': {
      titleAr: 'كورس ماستركلاس الرقص اللاتيني الاحترافي',
      titleEn: 'Latin Dance Masterclass & Musicality Workshop',
      descriptionAr: 'برنامج تدريبي مكثف للمستويات المتوسطة والمتقدمة لتحسين التكنيك والاتزان والموسيقى مع مدربين معتمدين دولياً.',
      descriptionEn: 'Intensive masterclass for intermediate and advanced dancers covering technique, balance, and musicality.',
      priceAr: '600 ج.م',
      priceEn: '600 EGP',
      location: { nameAr: 'أكاديمية موشن دانس - مدينة نصر', nameEn: 'Motion Dance Academy - Nasr City' },
      thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&h=630&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&h=630&q=80'
    },
    'evt_trip_redsea_festival': {
      titleAr: 'مهرجان ورحلة الجونة اللاتينية على اليخت والريزورت',
      titleEn: 'El Gouna Latin Sea Retreat & Yacht Party',
      descriptionAr: '3 أيام من المرح والرقص في الجونة تشمل إقامة فندقية وسهرات شاطئية وحفلة يخت خاصة.',
      descriptionEn: '3 days of dance and relaxation in El Gouna including resort stay, beach parties, and private yacht cruise.',
      priceAr: '3200 ج.م شامل الإقامة',
      priceEn: '3200 EGP All Inclusive',
      location: { nameAr: 'مارينا الجونة - البحر الأحمر', nameEn: 'El Gouna Marina - Red Sea' },
      thumbnailUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&h=630&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&h=630&q=80'
    },
    'evt_party_alex_sea_view': {
      titleAr: 'سهرة الإسكندرية الساحلية - إيقاعات الكاريبي',
      titleEn: 'Alexandria Coastal Latin Night - Caribbean Vibes',
      descriptionAr: 'سهرة خاصة على شاطئ البحر في الإسكندرية مع عروض استعراضية حية وفقرات دي جي عالمية.',
      descriptionEn: 'Special coastal night on Alexandria beachfront with live dance shows and international DJ sets.',
      priceAr: '200 ج.م',
      priceEn: '200 EGP',
      location: { nameAr: 'شاطئ ستانلي - الإسكندرية', nameEn: 'Stanley Beach - Alexandria' },
      thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&h=630&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&h=630&q=80'
    },
    'weekly-promo-1': {
      titleAr: 'مهرجان هافانا نايتس الملكي للسالسا والباتشاتا (فيديو الأسبوع)',
      titleEn: 'Havana Nights Royal Salsa & Bachata Gala',
      descriptionAr: 'الحدث الأضخم هذا الأسبوع! سهرة استثنائية على سطح فندق ريتز كارلتون مع أشهر دي جي لاتيني في الشرق الأوسط.',
      descriptionEn: 'The biggest Latin event of the week! An exclusive rooftop night at The Ritz-Carlton featuring top international Latin DJs.',
      priceAr: '350 ج.م / للشخص (شامل مشروب)',
      priceEn: '350 EGP / person (includes drink)',
      location: { nameAr: 'فندق ريتز كارلتون - الروف توب تراس', nameEn: 'The Ritz-Carlton - Rooftop Terrace' },
      thumbnailUrl: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&h=630&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&h=630&q=80'
    }
  };

  // Helper to transform images for WhatsApp / Open Graph standards
  const formatOgImage = (rawImg: string): string => {
    if (!rawImg || typeof rawImg !== 'string' || rawImg.trim().length === 0) {
      return "https://res.cloudinary.com/dynasmcaj/image/upload/w_1200,h_630,c_fill,q_auto,f_jpg/fbyjfjq8equle5pl7kwz.png";
    }
    let processed = rawImg.trim();
    if (processed.includes('cloudinary.com')) {
      if (processed.includes('/video/upload/')) {
        processed = processed
          .replace('/video/upload/', '/video/upload/w_1200,h_630,c_fill,so_1,q_auto,f_jpg/')
          .replace(/\.(mp4|mov|webm|avi|m4v)$/i, '.jpg');
      } else if (processed.includes('/image/upload/') && !processed.includes('w_1200')) {
        processed = processed.replace('/image/upload/', '/image/upload/w_1200,h_630,c_fill,g_auto,q_auto,f_jpg/');
      }
    } else if (processed.includes('images.unsplash.com')) {
      if (processed.includes('?')) {
        let clean = processed.replace(/([?&])w=\d+/, '$1w=1200');
        if (!clean.includes('h=630')) clean += '&h=630';
        if (!clean.includes('fit=crop')) clean += '&fit=crop';
        return clean;
      }
      return `${processed}?w=1200&h=630&fit=crop&q=80`;
    }
    return processed;
  };

  // Dedicated dynamic Open Graph / WhatsApp meta tag handler
  app.get(["/", "/api/og-event", "/e/:eventId", "/event/:eventId", "/events/:eventId"], async (req, res, next) => {
    const eventId = (req.query.event || req.params.eventId) as string;

    // If root route is accessed without any eventId, proceed to standard SPA
    if (req.path === "/" && !eventId) {
      return next();
    }

    // Determine target and canonical domains
    const isLocal = req.headers.host?.includes('localhost');
    const appBaseUrl = isLocal ? `http://${req.headers.host}` : 'https://cityeve.online';
    const canonicalBaseUrl = 'https://cityeve.online';
    const targetUrl = `${appBaseUrl}/?event=${eventId ? encodeURIComponent(eventId) : ''}`;
    const canonicalPageUrl = eventId ? `${canonicalBaseUrl}/e/${eventId}` : canonicalBaseUrl;

    let title = "CityEve | سيتي إيف - أهم تطبيق لجميع أنواع الفعاليات والحفلات في مصر";
    let description = "منصتك الأولى لمعرفة وحجز أحدث الحفلات، الكورسات، المعارض، والخدمات في مصر عبر cityeve.online.";
    let image = "https://res.cloudinary.com/dynasmcaj/image/upload/w_1200,h_630,c_fill,q_auto,f_jpg/fbyjfjq8equle5pl7kwz.png";
    const appIcon = "https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png";

    // Direct query params fallback (for instant preview generation)
    const queryTitle = (req.query.t || req.query.title) as string;
    const queryDesc = (req.query.d || req.query.desc) as string;
    const queryImg = (req.query.img || req.query.image) as string;

    if (queryTitle) title = `${queryTitle} | CityEve سيتي إيف`;
    if (queryDesc) description = queryDesc.substring(0, 220);
    if (queryImg) image = formatOgImage(queryImg);

    if (eventId) {
      const cached = eventOgCache.get(eventId);
      if (cached && (Date.now() - cached.time < 1000 * 60 * 30)) {
        title = cached.title;
        description = cached.desc;
        image = cached.image;
      } else {
        let foundData: any = null;

        // 1. Check builtin events first for instantaneous sub-millisecond response
        if (BUILTIN_EVENTS_FALLBACK[eventId]) {
          foundData = BUILTIN_EVENTS_FALLBACK[eventId];
        }

        // 2. Query Firestore via REST API for maximum speed and zero credentials friction
        if (!foundData) {
          try {
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/events/${encodeURIComponent(eventId)}`;
            const fbRes = await fetch(firestoreUrl, { signal: AbortSignal.timeout(2000) });
            if (fbRes.ok) {
              const docJson: any = await fbRes.json();
              if (docJson && docJson.fields) {
                foundData = parseFirestoreFields(docJson.fields);
              }
            }
          } catch (err) {
            // Silence timeout note
          }
        }

        // 3. Fallback to ad_submissions collection if not found in events
        if (!foundData) {
          try {
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/dance-with-me-35e98/databases/(default)/documents/ad_submissions/${encodeURIComponent(eventId)}`;
            const fbRes = await fetch(firestoreUrl, { signal: AbortSignal.timeout(2000) });
            if (fbRes.ok) {
              const docJson: any = await fbRes.json();
              if (docJson && docJson.fields) {
                foundData = parseFirestoreFields(docJson.fields);
              }
            }
          } catch (err) {
            // Silence timeout note
          }
        }

        // 4. Query Firestore SDK if still not found
        if (!foundData && db) {
          try {
            const fetchPromise = getDoc(doc(db, "events", eventId));
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Firestore fetch timeout')), 1500)
            );
            const snap: any = await Promise.race([fetchPromise, timeoutPromise]);
            if (snap && snap.exists && snap.exists()) {
              foundData = snap.data();
            }
          } catch (dbErr) {
            console.warn('Note: Firestore events SDK lookup skipped:', dbErr);
          }
        }

        if (foundData) {
          const evData = foundData.eventData || foundData;
          const rawTitle = evData.titleAr || evData.titleEn || foundData.titleAr || foundData.titleEn;
          const rawDesc = evData.descriptionAr || evData.descriptionEn || foundData.descriptionAr || foundData.descriptionEn;
          const rawPrice = evData.priceAr || evData.priceEn || foundData.priceAr || foundData.priceEn;
          const rawLocation = evData.location?.nameAr || evData.location?.nameEn || foundData.location?.nameAr || foundData.location?.nameEn;
          const rawImg = evData.thumbnailUrl || evData.mediaUrl || evData.posterUrl || evData.imageUrl || evData.image ||
                         foundData.thumbnailUrl || foundData.mediaUrl || foundData.posterUrl || foundData.imageUrl || foundData.image;

          if (rawTitle) title = `${rawTitle} | CityEve سيتي إيف`;
          if (rawDesc) {
            const cleanDesc = rawDesc.replace(/[\r\n]+/g, ' ').substring(0, 200).trim();
            const locationSnippet = rawLocation ? ` 📍 ${rawLocation}` : '';
            const priceSnippet = rawPrice ? ` 💰 ${rawPrice}` : '';
            description = `${cleanDesc}${locationSnippet}${priceSnippet} • احجز عبر cityeve.online`.trim();
          }

          if (rawImg) {
            image = formatOgImage(rawImg);
          }

          eventOgCache.set(eventId, { title, desc: description, image, time: Date.now() });
        }
      }
    }

    const safeTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeDesc = description.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const imageType = (image.includes('.png') || image.includes('f_png')) ? 'image/png' : 'image/jpeg';
    const keywords = "CityEve, سيتي إيف, cityeve.online, حفلات مصر, معارض مصر, مؤتمرات مصر, معارض القاهرة, حفلات لاتيني في مصر, سالسا مصر, باتشاتا مصر, كيزومبا, سهرات ليلية, حجز تذاكر حفلات, حجز مؤتمرات, فعاليات مصر, Salsa Egypt, Cairo Nightlife, Egypt Events, Egypt Exhibitions, Cairo Conferences";

    const eventJsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      "name": safeTitle,
      "description": safeDesc,
      "image": image,
      "url": canonicalPageUrl,
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
        "url": "https://cityeve.online",
        "logo": appIcon
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
  <link rel="canonical" href="${canonicalPageUrl}" />

  <link rel="icon" type="image/png" href="${appIcon}" />
  <link rel="shortcut icon" href="${appIcon}" />
  <link rel="apple-touch-icon" href="${appIcon}" />

  <!-- Open Graph / WhatsApp / Facebook Preview Tags -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="CityEve | سيتي إيف (cityeve.online)" />
  <meta property="og:logo" content="${appIcon}" />
  <meta property="og:url" content="${canonicalPageUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:url" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:type" content="${imageType}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta property="og:locale" content="ar_EG" />

  <!-- WhatsApp Fallback and Image Links -->
  <link rel="image_src" href="${image}" />
  <meta itemprop="name" content="${safeTitle}" />
  <meta itemprop="description" content="${safeDesc}" />
  <meta itemprop="image" content="${image}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@CityEveOnline" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${image}" />

  <script type="application/ld+json">
  ${eventJsonLd}
  </script>
</head>
<body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="text-align:center;padding:24px;max-width:500px;">
    <img src="${appIcon}" alt="CityEve" style="width:72px;height:72px;border-radius:18px;margin-bottom:16px;box-shadow:0 10px 25px rgba(0,0,0,0.5);" />
    <h2 style="font-size:18px;margin-bottom:8px;color:#fff;">${safeTitle}</h2>
    <p style="color:#aaa;font-size:13px;margin-bottom:20px;">جاري تحويلك إلى الفعالية على منصة سيتي إيف (cityeve.online)...</p>
    <a href="${targetUrl}" style="display:inline-block;background:#f59e0b;color:#000;padding:12px 24px;border-radius:12px;font-weight:bold;text-decoration:none;box-shadow:0 4px 14px rgba(245,158,11,0.4);">اضغط هنا للدخول للفعالية فوراً</a>
  </div>
  <script>
    if (window.location.pathname.startsWith('/e/') || window.location.pathname.startsWith('/event/')) {
      window.location.replace("${targetUrl}");
    }
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=7200");
    return res.send(html);
  });

  // Proxy /api/events for SEO / External Crawlers
  app.get("/api/events", async (req, res) => {
    try {
      if (db) {
        const snap = await getDocs(collection(db, "events"));
        const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return res.json({ events });
      }
      return res.status(500).json({ error: "Database not initialized" });
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
      if (db) {
        try {
          const snap = await getDocs(collection(db, "events"));
          eventUrls = snap.docs.map(docSnap => {
            const id = docSnap.id;
            const data: any = docSnap.data();
            const updateTime = data.uploadDate || now;
            return `
  <url>
    <loc>${baseUrl}/e/${id}</loc>
    <lastmod>${updateTime}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
          }).join('');
        } catch (err) {
          console.error('Error querying events for sitemap:', err);
        }
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
