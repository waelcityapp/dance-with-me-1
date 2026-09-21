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

function setPreflightHeaders(req, res) {
  const origin = String(req.headers?.origin || '');
  const allowedOrigins = new Set([
    'https://cityeve.online',
    'https://www.cityeve.online',
    'https://dance-with-me-1-git-ai-studio-cityeve-waelcityapps-projects.vercel.app',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  ].filter(Boolean));
  if (allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
}

function routeFromRequest(req) {
  const dynamicPath = req.query?.path;
  const dynamicParts = Array.isArray(dynamicPath) ? dynamicPath : [dynamicPath];
  const dynamicRoute = `/${dynamicParts.filter(Boolean).join('/')}`.replace(/\/$/, '') || '/';
  if (dynamicRoute !== '/') return dynamicRoute;

  try {
    const pathname = new URL(String(req.url || ''), 'http://cityeve.internal').pathname;
    const match = pathname.match(/^\/api\/([^/]+)\/?$/);
    if (match && match[1] !== 'index') return `/${match[1]}`;
  } catch {
    // The query-string route is the normal Vercel path.
  }
  return '/';
}

export default async function handler(req, res) {
  setPreflightHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).send('');

  const route = routeFromRequest(req);
  const target = handlers.get(route);

  if (!target) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ error: 'API_ROUTE_NOT_FOUND', route });
  }

  return target(req, res);
}
