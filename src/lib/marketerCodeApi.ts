import { auth } from './firebase';

export type ValidatedMarketerCode = {
  code: string;
  marketerId: string;
};

export async function validateMarketerCode(code: string): Promise<ValidatedMarketerCode> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const response = await fetch('/api/validate-marketer-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.valid) throw new Error(body.error || 'INVALID_MARKETER_CODE');
  return { code: String(body.code), marketerId: String(body.marketerId) };
}
