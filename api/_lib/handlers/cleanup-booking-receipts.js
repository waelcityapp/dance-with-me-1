import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { v2 as cloudinary } from 'cloudinary';

const firebaseConfig = {
  projectId: 'dance-with-me-35e98',
  appId: '1:163649448355:web:85ba28f8797c6f9d57d216',
  apiKey: 'AIzaSyCUF8UbABOG3mmdUOzBu8oRh5ht0oWk24b',
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
  const path = url.slice(uploadIndex + 8).split('?')[0].split('#')[0];
  const segments = path.split('/').filter(Boolean).filter((segment) => {
    if (/^v\d+$/.test(segment)) return false;
    return !(segment.includes(',') || /^((c|w|h|f|q|l|g|b|so|e)_)/.test(segment));
  });
  if (!segments.length) return null;
  return segments.join('/').replace(/\.[^.]+$/, '');
};

const destroyReceipt = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return true;
  const publicId = extractPublicId(url);
  if (!publicId) return true;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return false;

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    return result?.result === 'ok' || result?.result === 'not found';
  } catch (error) {
    console.error('Receipt deletion failed:', publicId, error);
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const [bookingSnapshot, eventSnapshot] = await Promise.all([
    getDocs(collection(db, 'bookings')),
    getDocs(collection(db, 'events'))
  ]);
  const eventsById = new Map(eventSnapshot.docs.map(event => [event.id, event.data()]));
  const cutoff = Date.now() - (24 * 60 * 60 * 1000);
  let cleaned = 0;
  let failed = 0;

  for (const bookingDoc of bookingSnapshot.docs) {
    const booking = bookingDoc.data();
    const eventDate = booking.eventDate || eventsById.get(booking.eventId)?.eventDate;
    const eventTime = eventDate ? Date.parse(eventDate) : NaN;
    const receiptUrl = booking.receiptImage || booking.receiptUrl;
    if (!receiptUrl || !Number.isFinite(eventTime) || eventTime > cutoff) continue;

    try {
      if (!(await destroyReceipt(receiptUrl))) {
        failed += 1;
        continue;
      }
      await updateDoc(doc(db, 'bookings', bookingDoc.id), {
        receiptImage: '',
        receiptUrl: '',
        receiptDeletedAt: new Date().toISOString()
      });
      cleaned += 1;
    } catch (error) {
      failed += 1;
      console.error('Booking receipt cleanup failed for', bookingDoc.id, error);
    }
  }

  return res.status(200).json({
    success: true,
    cleaned,
    failed,
    checked: bookingSnapshot.size,
    ranAt: new Date().toISOString()
  });
}
