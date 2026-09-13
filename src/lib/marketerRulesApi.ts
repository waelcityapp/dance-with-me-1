import { auth } from './firebase';

export type RuleValueType = 'fixed' | 'percentage';
export type RuleValue = { type: RuleValueType; value: number };

export type MarketerRule = {
  id: string;
  marketerId: string;
  scope: 'default' | 'event';
  targetType: 'advertisement' | 'booking' | 'event';
  targetId: string;
  targetReference?: string;
  customerDiscount: RuleValue;
  marketerReward: RuleValue;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  eventSnapshot?: {
    titleAr: string;
    titleEn: string;
    mediaUrl: string;
    thumbnailUrl?: string;
    eventDate: string;
    adType?: string;
    priceAr?: string;
    priceEn?: string;
  };
};

async function call<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('يجب تسجيل الدخول بحساب الإدارة أولاً.');
  const response = await fetch('/api/marketer-rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.error || 'تعذر حفظ إعدادات المسوق.');
  return body as T;
}

export const marketerRulesApi = {
  list: (marketerId: string) => call<{ rules: MarketerRule[] }>('list', { marketerId }),
  save: (input: Omit<MarketerRule, 'id' | 'eventSnapshot'>) => call<{ rule: MarketerRule }>('save', input),
  setStatus: (marketerId: string, ruleId: string, active: boolean) => call<{ rule: MarketerRule }>('set_status', { marketerId, ruleId, active }),
};
