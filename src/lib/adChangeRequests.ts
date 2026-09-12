import { auth } from './firebase';

export type AdChangeType = 'edit' | 'renew' | 'republish' | 'reactivate' | 'archive';

export async function submitAdChangeRequest(targetId: string, requestType: AdChangeType, proposedData: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user) throw new Error('UNAUTHENTICATED');
  const token = await user.getIdToken();
  const response = await fetch('/api/ad-change-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ targetId, requestType, proposedData }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'AD_CHANGE_REQUEST_FAILED');
  return body as { ok: true; id: string; remainingToday: number };
}

export async function reviewAdChangeRequest(requestId: string, decision: 'approve' | 'reject', reviewNote = '') {
  const user = auth.currentUser;
  if (!user) throw new Error('UNAUTHENTICATED');
  const token = await user.getIdToken();
  const response = await fetch('/api/ad-change-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'review', requestId, decision, reviewNote }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'AD_CHANGE_REVIEW_FAILED');
  return body;
}

