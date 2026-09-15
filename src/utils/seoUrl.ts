/** Public event links and the existing query links open the same event in the app. */
export function requestedEventId(location: Pick<Location, 'pathname' | 'search'> = window.location): string | null {
  const queryId = new URLSearchParams(location.search).get('event');
  if (queryId) return queryId;
  const match = location.pathname.match(/^\/(?:e|event)\/([^/]+)\/?$/);
  try { return match ? decodeURIComponent(match[1]) : null; } catch { return null; }
}
