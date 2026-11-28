export const adReportSources = [
  'facebook_paid', 'facebook_organic', 'facebook_unknown',
  'instagram_paid', 'instagram_organic', 'instagram_unknown',
  'meta_paid', 'google', 'chatgpt', 'tiktok', 'internal', 'unknown',
];

export const adReportActions = ['visit', 'whatsapp', 'phone', 'booking'];

export function classifyAdSource(search, referrer) {
  const params = new URLSearchParams(search);
  const source = (params.get('utm_source') || '').toLowerCase().trim();
  const medium = (params.get('utm_medium') || '').toLowerCase().trim();
  let host = '';
  try { host = new URL(referrer).hostname.toLowerCase(); } catch {}
  const from = domain => host === domain || host.endsWith(`.${domain}`);
  const paid = /^(paid(_|-)?social|paid|cpc|ppc|cpm)$/.test(medium);
  const organic = /^(organic(_|-)?social|organic|social)$/.test(medium);
  const social = source === 'fb' ? 'facebook' : source === 'ig' ? 'instagram' : source;
  if (social === 'facebook' || social === 'instagram') return `${social}_${paid ? 'paid' : organic ? 'organic' : 'unknown'}`;
  if (['meta', 'facebook_instagram'].includes(source) && paid) return 'meta_paid';
  if (['chatgpt', 'chatgpt.com'].includes(source) || from('chatgpt.com')) return 'chatgpt';
  if (source === 'tiktok' || from('tiktok.com')) return 'tiktok';
  if (from('facebook.com') || from('fb.com')) return 'facebook_unknown';
  if (from('instagram.com')) return 'instagram_unknown';
  if (!params.has('gclid') && !paid && (source === 'google' || /^((www|m|images)\.)?google\.(com|[a-z]{2}|(?:com|co)\.[a-z]{2})$/.test(host))) return 'google';
  return 'unknown';
}
