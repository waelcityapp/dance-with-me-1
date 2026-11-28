import { useEffect, useRef } from 'react';
import { classifyAdSource } from '../../shared/adReporting.js';
import { requestedEventId } from '../utils/seoUrl';
import { auth } from './firebase';

const visits = new Set<string>();

export function recordAdReportAction(eventId: string, action: 'visit' | 'whatsapp' | 'phone' | 'booking') {
  const landingEventId = requestedEventId();
  const referrer = document.referrer;
  const cameFromCityEve = referrer.startsWith(`${window.location.origin}/`);
  const source = (landingEventId && landingEventId !== eventId) || cameFromCityEve
    ? 'internal'
    : classifyAdSource(window.location.search, referrer);
  const visitKey = JSON.stringify([eventId, source]);

  if (action === 'visit') {
    if (visits.has(visitKey)) return;
    visits.add(visitKey);
  }

  void fetch('/api/ad-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ eventId, source, action }),
  }).then(response => {
    if (!response.ok && action === 'visit') visits.delete(visitKey);
  }).catch(() => {
    if (action === 'visit') visits.delete(visitKey);
  });
}

export function useAdReportVisit(eventId: string, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = ref.current;
    if (!enabled || !card || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.15)) return;
      recordAdReportAction(eventId, 'visit');
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(card);
    return () => observer.disconnect();
  }, [eventId, enabled]);
  return ref;
}

export class AdReportLoadError extends Error {
  constructor(public readonly status: number) {
    super('Ad report could not be loaded');
  }
}

export interface AdReport {
  totals: Record<string, number>;
  regions: Record<string, Record<string, number>>;
}

export async function loadAdReport(eventId: string, days: number, signal: AbortSignal): Promise<AdReport> {
  await auth.authStateReady();
  signal.throwIfAborted();
  const user = auth.currentUser;
  if (!user) throw new AdReportLoadError(401);

  let response = await requestAdReport(eventId, days, await user.getIdToken(), signal);
  if (response.status === 401 && auth.currentUser === user) {
    response = await requestAdReport(eventId, days, await user.getIdToken(true), signal);
  }
  if (!response.ok) throw new AdReportLoadError(response.status);
  const { totals, regions = {} } = await response.json();
  return { totals, regions };
}

function requestAdReport(eventId: string, days: number, token: string, signal: AbortSignal) {
  // POST keeps private report responses outside the PWA's GET cache.
  return fetch('/api/ad-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eventId, action: 'summary', days }),
    signal,
  });
}
