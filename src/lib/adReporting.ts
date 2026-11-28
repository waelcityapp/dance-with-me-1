import { useEffect, useRef } from 'react';
import { classifyAdSource } from '../../shared/adReporting.js';
import { requestedEventId } from '../utils/seoUrl';
import { auth } from './firebase';

const visits = new Set<string>();

export function recordAdReportAction(eventId: string, action: 'visit' | 'whatsapp' | 'phone' | 'booking') {
  const landingEventId = requestedEventId();
  const source = landingEventId === eventId
    ? classifyAdSource(window.location.search, document.referrer)
    : 'internal';
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

export async function loadAdReport(eventId: string, days: number, signal: AbortSignal): Promise<Record<string, number>> {
  const user = auth.currentUser;
  if (!user) throw new Error('UNAUTHENTICATED');
  const token = await user.getIdToken();
  // POST keeps private report responses outside the PWA's GET cache.
  const response = await fetch('/api/ad-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eventId, action: 'summary', days }),
    signal,
  });
  if (!response.ok) throw new Error('AD_REPORT_UNAVAILABLE');
  return (await response.json()).totals;
}
