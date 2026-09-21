import { createVerify } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

const projectId = process.env.FIREBASE_PROJECT_ID
  || process.env.VITE_FIREBASE_PROJECT_ID
  || 'dance-with-me-35e98';

const adminEmail = process.env.ADMIN_EMAIL
  || process.env.VITE_ADMIN_EMAIL
  || 'waelvts@gmail.com';

let certCache = null;

async function getFirebaseCerts() {
  if (certCache && certCache.expiresAt > Date.now()) return certCache.certs;

  const response = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!response.ok) throw new Error('Unable to load Firebase token certificates');

  const certs = await response.json();
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
  certCache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

async function verifyFirebaseToken(req) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;

    const token = header.slice('Bearer '.length).trim();
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decode = (value) =>
      JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

    const tokenHeader = decode(parts[0]);
    const tokenPayload = decode(parts[1]);
    if (tokenHeader.alg !== 'RS256' || !tokenHeader.kid) return null;

    const certs = await getFirebaseCerts();
    const certificate = certs[tokenHeader.kid];
    if (!certificate) return null;

    const verifier = createVerify('RSA-SHA256');
    verifier.update(parts[0] + '.' + parts[1]);
    verifier.end();

    if (!verifier.verify(certificate, Buffer.from(parts[2], 'base64url'))) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (
      tokenPayload.aud !== projectId ||
      tokenPayload.iss !== 'https://securetoken.google.com/' + projectId ||
      typeof tokenPayload.sub !== 'string' ||
      tokenPayload.exp <= now
    ) {
      return null;
    }

    return tokenPayload;
  } catch {
    return null;
  }
}

function parseFirestoreValue(value) {
  if (!value || typeof value !== 'object') return value;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if (value.mapValue?.fields) return parseFirestoreFields(value.mapValue.fields);
  if (value.arrayValue?.values) return value.arrayValue.values.map(parseFirestoreValue);
  return value;
}

function parseFirestoreFields(fields) {
  if (!fields || typeof fields !== 'object') return {};
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, parseFirestoreValue(value)])
  );
}

function extractPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex < 0) return null;

  const path = url
    .slice(uploadIndex + '/upload/'.length)
    .split('?')[0]
    .split('#')[0];

  const segments = path.split('/').filter(Boolean);
  const clean = segments.filter((segment) => {
    if (/^v\d+$/.test(segment)) return false;
    return !(
      segment.includes(',') ||
      (segment.includes('_') && /^(c_|w_|h_|f_|q_|l_|g_|b_|so_|e_)/.test(segment))
    );
  });

  if (!clean.length) return null;
  return clean.join('/').replace(/\.[^.]+$/, '');
}

async function verifyOwnerSubmission(req, submissionId, url, claims) {
  const token = (req.headers.authorization || '').slice('Bearer '.length);
  const firestoreUrl =
    'https://firestore.googleapis.com/v1/projects/' +
    projectId +
    '/databases/(default)/documents/ad_submissions/' +
    encodeURIComponent(submissionId);

  const response = await fetch(firestoreUrl, {
    headers: { Authorization: 'Bearer ' + token }
  });

  if (!response.ok) {
    return { ok: false, error: 'تعذر التحقق من ملكية الإعلان' };
  }

  const document = await response.json();
  const submission = parseFirestoreFields(document.fields);
  const allowedUrls = [
    submission.mediaUrl,
    submission.previousMediaUrl,
    submission.thumbnailUrl,
    submission.receiptUrl,
    submission.receiptImage,
    submission.eventData?.mediaUrl,
    submission.eventData?.thumbnailUrl,
    submission.eventData?.receiptUrl
  ].filter((item) => typeof item === 'string' && item.length > 0);

  if (
    submission.advertiserId !== claims.sub ||
    submission.status === 'approved' ||
    !allowedUrls.includes(url)
  ) {
    return {
      ok: false,
      error: 'لا يمكن حذف وسيط إعلان منشور أو إعلان لا يخص هذا الحساب'
    };
  }

  return { ok: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const claims = await verifyFirebaseToken(req);
    if (!claims) {
      return res.status(403).json({
        success: false,
        error: 'يجب تسجيل الدخول بحساب Firebase صالح'
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { url, resourceType = 'image', submissionId } = body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'رابط الوسيط مطلوب' });
    }

    const isAdmin = claims.email === adminEmail && claims.email_verified === true;

    if (!isAdmin) {
      if (!submissionId || typeof submissionId !== 'string') {
        return res.status(403).json({
          success: false,
          error: 'رقم الإعلان مطلوب للتحقق من الملكية'
        });
      }

      const ownership = await verifyOwnerSubmission(req, submissionId, url, claims);
      if (!ownership.ok) {
        return res.status(403).json({ success: false, error: ownership.error });
      }
    }

    if (!url.includes('cloudinary.com')) {
      return res.json({ success: true, message: 'الرابط ليس من Cloudinary' });
    }

    const protectedAssets = ['fbyjfjq8equle5pl7kwz', 'r5uj8nyeht88n4wqdihq'];
    if (protectedAssets.some((asset) => url.includes(asset))) {
      return res.json({ success: true, message: 'الوسيط الافتراضي محمي' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        error: 'مفاتيح Cloudinary الخاصة بالحذف غير موجودة في بيئة Vercel'
      });
    }

    const publicId = extractPublicId(url);
    if (!publicId) {
      return res.status(422).json({
        success: false,
        error: 'تعذر استخراج public_id من رابط Cloudinary'
      });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === 'video' ? 'video' : 'image',
      invalidate: true
    });

    const confirmed = result?.result === 'ok' || result?.result === 'not found';

    return res.status(confirmed ? 200 : 502).json({
      success: confirmed,
      result,
      error: confirmed ? undefined : 'Cloudinary لم يؤكد الحذف'
    });
  } catch (error) {
    console.error('delete-media error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'حدث خطأ غير معروف أثناء الحذف'
    });
  }
}
