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
