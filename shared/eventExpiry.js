const cairoDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isEventExpired(value, now = Date.now()) {
  if (!value) return false;
  const date = new Date(typeof value.toDate === 'function' ? value.toDate() : value);
  if (Number.isNaN(date.getTime())) return false;
  return cairoDate.format(date) < cairoDate.format(now);
}

export function isAdExpired(ad, event, now = Date.now()) {
  if (ad.status === 'archived') return true;
  if (ad.status !== 'approved') return false;
  return Date.parse(ad.expiresAt) <= now
    || Boolean(event?.isExpiredBy15DaysRule)
    || isEventExpired(event?.eventDate, now);
}
