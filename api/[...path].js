import accountReference from './_lib/handlers/account-reference.js';
import adChangeRequests from './_lib/handlers/ad-change-requests.js';
import adminUnlock from './_lib/handlers/admin-unlock.js';
import bookings from './_lib/handlers/bookings.js';
import cleanupArchivedAds from './_lib/handlers/cleanup-archived-ads.js';
import cleanupBookingReceipts from './_lib/handlers/cleanup-booking-receipts.js';
import deleteMedia from './_lib/handlers/delete-media.js';
import marketerRules from './_lib/handlers/marketer-rules.js';
import marketerTest from './_lib/handlers/marketer-test.js';
import marketingQuote from './_lib/handlers/marketing-quote.js';
import ogEvent from './_lib/handlers/og-event.js';
import sitemap from './_lib/handlers/sitemap.js';
import translate from './_lib/handlers/translate.js';
import validateMarketerCode from './_lib/handlers/validate-marketer-code.js';

const handlers = new Map([
  ['/account-reference', accountReference],
  ['/ad-change-requests', adChangeRequests],
  ['/admin-unlock', adminUnlock],
  ['/bookings', bookings],
  ['/cleanup-archived-ads', cleanupArchivedAds],
  ['/cleanup-booking-receipts', cleanupBookingReceipts],
  ['/delete-media', deleteMedia],
  ['/marketer-rules', marketerRules],
  ['/marketer-test', marketerTest],
  ['/marketing-quote', marketingQuote],
  ['/og-event', ogEvent],
  ['/sitemap', sitemap],
  ['/translate', translate],
  ['/validate-marketer-code', validateMarketerCode],
]);

function routeFromRequest(req) {
  const requestUrl = String(req.url || '');
  try {
    const pathname = new URL(requestUrl, 'http://cityeve.internal').pathname;
    const apiIndex = pathname.indexOf('/api/');
    if (apiIndex >= 0) return pathname.slice(apiIndex + 4).replace(/\/$/, '') || '/';
  } catch {
    // Fall back to Vercel's dynamic route query below.
  }

  const dynamicPath = req.query?.path;
  const parts = Array.isArray(dynamicPath) ? dynamicPath : [dynamicPath];
  const route = `/${parts.filter(Boolean).join('/')}`;
  return route === '/' ? '/' : route.replace(/\/$/, '');
}

export default async function handler(req, res) {
  const route = routeFromRequest(req);
  const target = handlers.get(route);

  if (!target) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ error: 'API_ROUTE_NOT_FOUND', route });
  }

  return target(req, res);
}
