import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { v2 as cloudinary } from 'cloudinary';

const firebaseConfig = {
  projectId: 'dance-with-me-35e98',
  appId: '1:163649448355:web:85ba28f8797c6f9d57d216',
  apiKey: 'AIzaSyCUF8UbABOG3mmdUOzBu8oRh5ht0oWk24I',
  authDomain: 'cityeve.online',
  storageBucket: 'dance-with-me-35e98.firebasestorage.app',
  messagingSenderId: '163649448355'
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const extractPublicId = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex < 0) return null;

  let path = url.slice(uploadIndex + '/upload/'.length).split('?')[0].split('#')[0];
  const segments = path.split('/').filter(Boolean);
  const clean = segments.filter((segment) => {
    if (/^v\\d+$/.test(segment)) return false;
    return !(segment.includes(',') || (segment.includes('_') && /^(c_|w_|h_|f_|q_|l_|g_|b_|so_|e_)/.test(segment)));
  });

  if (!clean.length) return null;
  const fullPath = clean.join('/');
  return fullPath.replace(/\\.[^.]+$/, '');
};

const protectedAssets = ['fbyjfjq8equle5pl7kwz', 'r5uj8nyeht88n4wqdihq'];

const destroyMedia = async (url, resourceType = 'image') => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return true;
  if (protectedAssets.some((asset) => url.includes(asset))) return true;

  const publicId = extractPublicId(url);
  if (!publicId) return true;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary credentials are missing; keeping the Firestore record for retry.');
    return false;
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === 'video' ? 'video' : 'image',
      invalidate: true
    });
    return result?.result === 'ok' || result?.result === 'not found';
  } catch (error) {
    console.error('Cloudinary deletion failed:', publicId, error);
    return false;
  }
};

const uniqueMedia = (sub) => {
  const candidates = [
    [sub.mediaUrl, sub.mediaType || 'image'],
    [sub.eventData?.mediaUrl, sub.eventData?.mediaType || sub.mediaType || 'image'],
    [sub.thumbnailUrl, 'image'],
    [sub.eventData?.thumbnailUrl, 'image'],
    [sub.receiptUrl, 'image'],
    [sub.receiptImage, 'image']
  ];
  const seen = new Set();
  return candidates.filter(([url]) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
};

const getEventId = async (sub) => {
  if (sub.eventData?.id) return sub.eventData.id;
  if (sub.eventRef === undefined || sub.eventRef === null) return null;

  const events = await getDocs(query(
    collection(db, 'events'),
    where('eventRef', '==', sub.eventRef)
  ));
  return events.docs[0]?.id || null;
};

const archiveExpiredSubmission = async (sub, now) => {
  const expiresAt = sub.expiresAt ? Date.parse(sub.expiresAt) : NaN;
  if (sub.status !== 'approved' || Number.isNaN(expiresAt) || expiresAt > now) return false;

  const archivedAt = new Date(expiresAt).toISOString();
  await updateDoc(doc(db, 'ad_submissions', sub.id), {
    status: 'archived',
    archivedAt
  });

  const eventId = await getEventId(sub);
  if (eventId) {
    await updateDoc(doc(db, 'events', eventId), {
      isPaused: true,
      seoIndexable: false,
      archivedAt
    }).catch((error) => console.error('Failed to pause archived event:', eventId, error));
  }
  return true;
};

const purgeArchivedSubmission = async (sub, now) => {
  const archivedAt = sub.archivedAt ? Date.parse(sub.archivedAt) : NaN;
  if (sub.status !== 'archived' || Number.isNaN(archivedAt)) return false;
  if (now - archivedAt < 30 * 24 * 60 * 60 * 1000) return false;

  for (const [url, resourceType] of uniqueMedia(sub)) {
    if (!(await destroyMedia(url, resourceType))) return false;
  }

  const eventId = await getEventId(sub);
  if (eventId) {
    const bookings = await getDocs(query(
      collection(db, 'bookings'),
      where('eventId', '==', eventId)
    ));

    for (const booking of bookings.docs) {
      const data = booking.data();
      const bookingMedia = data.receiptImage || data.receiptUrl;
      if (bookingMedia && !(await destroyMedia(bookingMedia, 'image'))) return false;
      await deleteDoc(booking.ref);
    }

    await deleteDoc(doc(db, 'events', eventId));
  }

  await deleteDoc(doc(db, 'ad_submissions', sub.id));
  return true;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const secret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization || '';
  if (!secret || authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const snapshot = await getDocs(collection(db, 'ad_submissions'));
  const now = Date.now();
  let archived = 0;
  let purged = 0;
  let failed = 0;

  for (const submissionDoc of snapshot.docs) {
    const sub = { id: submissionDoc.id, ...submissionDoc.data() };
    try {
      if (await archiveExpiredSubmission(sub, now)) {
        archived += 1;
        continue;
      }
      if (await purgeArchivedSubmission(sub, now)) purged += 1;
    } catch (error) {
      failed += 1;
      console.error('Archive cleanup failed for', sub.id, error);
    }
  }

  return res.status(200).json({
    success: true,
    archived,
    purged,
    failed,
    checked: snapshot.size,
    ranAt: new Date().toISOString()
  });
}
