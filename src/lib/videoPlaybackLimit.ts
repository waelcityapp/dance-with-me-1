const STORAGE_KEY = 'cityeve_video_playback_usage_v1';
const DEVICE_KEY = 'cityeve_video_viewer_id_v1';
const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_PLAYS = 5;

type UsageStore = Record<string, Record<string, number[]>>;

const readStore = (): UsageStore => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStore = (store: UsageStore) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Playback should remain usable if browser storage is unavailable.
  }
};

export const getVideoViewerKey = (userId?: string | null): string => {
  if (userId) return `user:${userId}`;
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return `device:${existing}`;
    const generated = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, generated);
    return `device:${generated}`;
  } catch {
    return 'anonymous';
  }
};

export const reserveVideoPlay = (videoId: string, viewerKey: string) => {
  if (!videoId) return { allowed: true, remaining: MAX_PLAYS };

  const now = Date.now();
  const store = readStore();
  const viewerUsage = store[viewerKey] || {};
  const recentPlays = (viewerUsage[videoId] || []).filter(timestamp => now - timestamp < WINDOW_MS);

  if (recentPlays.length >= MAX_PLAYS) {
    viewerUsage[videoId] = recentPlays;
    store[viewerKey] = viewerUsage;
    writeStore(store);
    return { allowed: false, remaining: 0 };
  }

  recentPlays.push(now);
  viewerUsage[videoId] = recentPlays;
  store[viewerKey] = viewerUsage;
  writeStore(store);
  return { allowed: true, remaining: MAX_PLAYS - recentPlays.length };
};

export const getVideoLimitMessage = (isArabic: boolean) => (
  isArabic
    ? 'استنفدت الحد المسموح لهذا الفيديو خلال آخر 24 ساعة. حاول مرة أخرى لاحقًا.'
    : 'You have reached the limit for this video during the last 24 hours. Please try again later.'
);
