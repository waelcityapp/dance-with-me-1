import { auth } from './firebase';

export type MarketingRuleValue = { type: 'fixed' | 'percentage'; value: number };
export type TestWallet = { available: number; pending: number; paid: number };
export type TestLedgerEntry = {
  id: string;
  type: string;
  status: string;
  amount: number;
  originalAmount?: number;
  customerDiscount?: number;
  customerFinalAmount?: number;
  targetType?: 'event' | 'advertisement';
  targetId?: string;
  createdAt?: string;
};

async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('يجب تسجيل الدخول بحسابك أولاً.');
  const response = await fetch('/api/marketer-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.error || 'تعذر تنفيذ العملية التجريبية.');
  return body as T;
}

export const marketerTestApi = {
  activateOwner: () => call<{ ok: true }>('activate_test_owner'),
  saveRule: (input: { targetType: 'event' | 'advertisement'; targetId: string; customerDiscount: MarketingRuleValue; marketerReward: MarketingRuleValue }) => call('save_test_rule', input),
  simulateConversion: (input: { targetType: 'event' | 'advertisement'; targetId: string; originalAmount: number; clientRequestId: string }) => call<{ wallet: TestWallet; entry: TestLedgerEntry }>('simulate_test_conversion', input),
  approveCommission: (ledgerId: string) => call<{ wallet: TestWallet }>('approve_test_commission', { ledgerId }),
  requestWithdrawal: (amount: number, clientRequestId: string) => call<{ wallet: TestWallet; withdrawal: { id: string } }>('request_test_withdrawal', { amount, clientRequestId }),
  markWithdrawalPaid: (withdrawalId: string) => call<{ wallet: TestWallet }>('mark_test_withdrawal_paid', { withdrawalId, transferReference: 'TEST-INSTAPAY' }),
  getWallet: () => call<{ wallet: TestWallet; ledger: TestLedgerEntry[] }>('get_test_wallet'),
};
