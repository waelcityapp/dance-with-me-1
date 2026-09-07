const PROJECT_ID = 'dance-with-me-35e98';
const DATABASE = '(default)';
const SITE_URL = 'https://cityeve.online';

const xmlEscape = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const fromFirestoreValue = (value) => {
  if (!value || typeof value !== 'object') return value;
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('integerValue' in value) return value.integerValue;
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if (value.mapValue?.fields) return fromFirestoreFields(value.mapValue.fields);
  if (value.arrayValue?.values) return value.arrayValue.values.map(fromFirestoreValue);
  return value;
};

const fromFirestoreFields = (fields) => Object.fromEntries(
  Object.entries(fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)])
);

const firstText = (...values) => values.find(
  (value) => typeof value === 'string' && value.trim()
)?.trim() || '';

const isPublicEvent = (event) => {
  if (!event || typeof event !== 'object') return false;

  if (event.isPublished === false || event.published === false || event.approved === false) {
    return false;
  }

  const status = firstText(
    event.status,
    event.approvalStatus,
    event.moderationStatus,
    event.publishStatus
  ).toLowerCase();

  return !status || ['published', 'approved', 'active', 'live'].includes(status);
};

export default async function handler(req, res) {
  const eventUrls = [];
  let pageToken = '';

  try {
    do {
      const params = new URLSearchParams({ pageSize: '1000' });
      if (pageToken) params.set('pageToken', pageToken);

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(DATABASE)}/documents/events?${params}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) break;

      const payload = await response.json();
      for (const document of payload.documents || []) {
        const eventId = document.name?.split('/').pop();
        const event = fromFirestoreFields(document.fields);
        if (!eventId || !isPublicEvent(event)) continue;

        const updatedAt = firstText(
          event.updatedAt,
          event.updated_at,
          event.createdAt,
          event.created_at
        );

        eventUrls.push({
          id: eventId,
          updatedAt: updatedAt && !Number.isNaN(Date.parse(updatedAt))
            ? new Date(updatedAt).toISOString()
            : ''
        });
      }

      pageToken = payload.nextPageToken || '';
    } while (pageToken);
  } catch (error) {
    console.error('Sitemap event lookup failed:', error);
  }

  const urls = [
    { loc: SITE_URL, alternates: true },
    ...eventUrls.flatMap(({ id, updatedAt }) => [
      { loc: `${SITE_URL}/e/${encodeURIComponent(id)}`, updatedAt, alternates: true },
      { loc: `${SITE_URL}/e/${encodeURIComponent(id)}?lang=en`, updatedAt, alternates: false }
    ])
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, updatedAt }) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
${updatedAt ? `    <lastmod>${xmlEscape(updatedAt)}</lastmod>
` : ''}  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(body);
}
