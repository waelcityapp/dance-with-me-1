const cairoOffset = new Intl.DateTimeFormat('en', {
  timeZone: 'Africa/Cairo',
  timeZoneName: 'longOffset',
});

export function cairoEventStart(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return '';
  const local = `${date}T${time}:00`;
  const wallClock = Date.parse(local + 'Z');
  if (!Number.isFinite(wallClock) || new Date(wallClock).toISOString().slice(0, 19) !== local) return '';

  // Check both offsets near a daylight-saving transition against the requested local time.
  const offsetAt = instant => cairoOffset.formatToParts(instant)
    .find(part => part.type === 'timeZoneName')?.value.replace('GMT', '') || '+00:00';
  for (const offset of new Set([offsetAt(wallClock - 86400000), offsetAt(wallClock + 86400000)])) {
    const candidate = local + offset;
    if (offsetAt(Date.parse(candidate)) === offset) return candidate;
  }
  return '';
}
