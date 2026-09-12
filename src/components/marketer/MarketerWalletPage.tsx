import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Banknote, Check, Clock3, Copy, FlaskConical, LockKeyhole, Megaphone, WalletCards } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/firebase';
import { marketerTestApi, type MarketingRuleValue, type TestLedgerEntry } from '../../lib/marketerTestApi';

interface MarketerWalletPageProps {
  onBack: () => void;
}

type WalletSnapshot = {
  marketerCode?: string;
  marketerStatus?: 'active' | 'paused' | 'inactive';
  isMarketer?: boolean;
  marketerStatusReason?: string;
  marketerStatusMessage?: string;
  marketerStatusChangedAt?: string;
  marketerWalletStatus?: 'active' | 'withdrawals_paused' | 'frozen' | 'closed';
  marketerWalletReason?: string;
  marketerWalletAvailable?: number;
  marketerWalletPending?: number;
  marketerWalletPaid?: number;
};

export const MarketerWalletPage: React.FC<MarketerWalletPageProps> = ({ onBack }) => {
  const { lang, user } = useApp();
  const [wallet, setWallet] = useState<WalletSnapshot>({});
  const [copied, setCopied] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [testEnabled, setTestEnabled] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testLedger, setTestLedger] = useState<TestLedgerEntry[]>([]);
  const [targetType, setTargetType] = useState<'event' | 'advertisement'>('event');
  const [targetId, setTargetId] = useState('test-event-1');
  const [originalAmount, setOriginalAmount] = useState('1000');
  const [discountType, setDiscountType] = useState<MarketingRuleValue['type']>('fixed');
  const [discountValue, setDiscountValue] = useState('50');
  const [rewardType, setRewardType] = useState<MarketingRuleValue['type']>('fixed');
  const [rewardValue, setRewardValue] = useState('20');

  useEffect(() => {
    if (!user?.id) return;
    return onSnapshot(doc(db, 'users', user.id), (snapshot) => {
      if (!snapshot.exists()) return;
      setWallet(snapshot.data() as WalletSnapshot);
    });
  }, [user?.id]);

  const marketerCode = wallet.marketerCode || user?.marketerCode || '';
  const marketerStatus = wallet.marketerStatus || user?.marketerStatus || 'inactive';
  const hasMarketerHistory = (wallet.isMarketer ?? user?.isMarketer) === true || Boolean(marketerCode);
  const isActive = hasMarketerHistory && marketerStatus === 'active';
  const walletStatus = wallet.marketerWalletStatus || user?.marketerWalletStatus || 'active';
  const canRequestWithdrawal = walletStatus === 'active';
  const available = Number(wallet.marketerWalletAvailable || 0);
  const pending = Number(wallet.marketerWalletPending || 0);
  const paid = Number(wallet.marketerWalletPaid || 0);
  const currency = lang === 'ar' ? 'ج.م' : 'EGP';

  const formatter = useMemo(() => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    maximumFractionDigits: 2,
  }), [lang]);

  const copyCode = async () => {
    if (!marketerCode) return;
    try {
      await navigator.clipboard.writeText(marketerCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const refreshTestWallet = async () => {
    const result = await marketerTestApi.getWallet();
    setTestLedger(result.ledger || []);
  };

  const runTestAction = async (task: () => Promise<void>) => {
    setTestBusy(true);
    setTestMessage(null);
    try {
      await task();
      await refreshTestWallet();
    } catch (error) {
      setTestMessage(error instanceof Error ? error.message : 'تعذر إتمام الاختبار.');
    } finally {
      setTestBusy(false);
    }
  };

  const testRule = () => ({
    targetType,
    targetId: targetId.trim(),
    customerDiscount: { type: discountType, value: Number(discountValue) },
    marketerReward: { type: rewardType, value: Number(rewardValue) },
  });

  const requestId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  if (!user || !hasMarketerHistory) {
    return (
      <section className="py-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-xl mx-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-center shadow-sm">
          <WalletCards className="h-10 w-10 mx-auto text-neutral-400 mb-3" />
          <h1 className="text-lg font-black text-neutral-900 dark:text-white">
            {lang === 'ar' ? 'المحفظة غير متاحة حالياً' : 'Wallet is currently unavailable'}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {lang === 'ar' ? 'لا يوجد سجل تسويقي مرتبط بهذا الحساب.' : 'No marketing record is linked to this account.'}
          </p>
          <button onClick={onBack} className="mt-5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2.5 text-sm font-bold">
            {lang === 'ar' ? 'العودة إلى حسابي' : 'Back to profile'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 pb-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="rounded-3xl border border-emerald-500/25 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-10 w-10 shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label={lang === 'ar' ? 'العودة' : 'Back'}
          >
            {lang === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <WalletCards className="h-5 w-5 text-emerald-500" />
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                {lang === 'ar' ? 'محفظتي' : 'My Wallet'}
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {lang === 'ar' ? 'تابع كودك التسويقي وأرباحك وعمولاتك من مكان واحد.' : 'Track your marketing code, earnings and commissions in one place.'}
            </p>
          </div>
        </div>
      </div>

      {!isActive && (
        <div className={`rounded-3xl border p-5 shadow-sm ${marketerStatus === 'paused' ? 'border-amber-500/30 bg-amber-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${marketerStatus === 'paused' ? 'text-amber-500' : 'text-red-500'}`} />
            <div className="min-w-0 flex-1">
              <h2 className="font-black text-neutral-900 dark:text-white">
                {marketerStatus === 'paused'
                  ? (lang === 'ar' ? 'حساب التسويق موقوف مؤقتًا' : 'Marketing account temporarily paused')
                  : (lang === 'ar' ? 'حساب التسويق موقوف نهائيًا' : 'Marketing account permanently inactive')}
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {lang === 'ar' ? 'يمكنك متابعة أرصدتك وعملياتك السابقة، وتحدد حالة المحفظة أدناه إمكانية السحب.' : 'You can still review previous balances and transactions. The wallet status below controls withdrawals.'}
              </p>
              {(wallet.marketerStatusReason || wallet.marketerStatusMessage) && (
                <button type="button" onClick={() => setShowDecision((current) => !current)} className="mt-3 rounded-xl border border-current/20 px-3 py-2 text-xs font-black">
                  {showDecision ? (lang === 'ar' ? 'إخفاء التفاصيل' : 'Hide details') : (lang === 'ar' ? 'معرفة سبب الإيقاف' : 'View decision reason')}
                </button>
              )}
              {showDecision && (
                <div className="mt-3 rounded-2xl bg-white/60 dark:bg-neutral-950/40 p-4 text-sm">
                  <p><strong>{lang === 'ar' ? 'السبب:' : 'Reason:'}</strong> {wallet.marketerStatusReason || '—'}</p>
                  {wallet.marketerStatusMessage && <p className="mt-2"><strong>{lang === 'ar' ? 'رسالة الإدارة:' : 'Administration message:'}</strong> {wallet.marketerStatusMessage}</p>}
                  {wallet.marketerStatusChangedAt && <p className="mt-2 text-xs text-neutral-500">{new Date(wallet.marketerStatusChangedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-3xl border p-5 shadow-sm ${canRequestWithdrawal ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-red-500/25 bg-red-500/10'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            {canRequestWithdrawal ? <Banknote className="h-5 w-5 shrink-0 text-emerald-500" /> : <LockKeyhole className="h-5 w-5 shrink-0 text-red-500" />}
            <div>
              <h2 className="font-black text-neutral-900 dark:text-white">
                {canRequestWithdrawal
                  ? (lang === 'ar' ? 'السحب مسموح' : 'Withdrawals allowed')
                  : walletStatus === 'frozen'
                    ? (lang === 'ar' ? 'الرصيد مجمّد للمراجعة' : 'Balance frozen for review')
                    : walletStatus === 'closed'
                      ? (lang === 'ar' ? 'المحفظة مغلقة نهائيًا' : 'Wallet permanently closed')
                      : (lang === 'ar' ? 'طلبات السحب متوقفة مؤقتًا' : 'Withdrawals temporarily paused')}
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {wallet.marketerWalletReason || (canRequestWithdrawal
                  ? (lang === 'ar' ? 'يمكنك تقديم طلب سحب عند تفعيل نظام المدفوعات.' : 'You can request a withdrawal once payouts are enabled.')
                  : (lang === 'ar' ? 'راجع سبب قرار الإدارة أعلاه أو تواصل مع الدعم.' : 'Review the administration decision above or contact support.'))}
              </p>
            </div>
          </div>
          <button type="button" disabled={!canRequestWithdrawal || available <= 0} title={lang === 'ar' ? 'سيتم ربط الطلب بمحرك السحب الآمن لاحقًا' : 'This will be connected to the secure payout engine later'} className="h-11 rounded-xl bg-emerald-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-5 text-sm font-black">
            {lang === 'ar' ? 'طلب سحب' : 'Request withdrawal'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-transparent dark:from-amber-500/10 dark:to-neutral-900 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-black">
              <Megaphone className="h-4 w-4" />
              <span>{lang === 'ar' ? 'كودك التسويقي' : 'Your marketing code'}</span>
            </div>
            <div className="mt-2 font-mono text-2xl sm:text-3xl font-black tracking-wider text-neutral-900 dark:text-white" dir="ltr">
              {marketerCode || (lang === 'ar' ? 'جاري التجهيز' : 'Preparing')}
            </div>
          </div>
          <button
            type="button"
            onClick={copyCode}
            disabled={!marketerCode}
            className="h-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 px-4 font-black text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ الكود' : 'Copy code')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-500/25 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{lang === 'ar' ? 'الرصيد المتاح' : 'Available balance'}</span>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400" dir="ltr">{formatter.format(available)} {currency}</div>
          <p className="mt-1 text-[11px] text-neutral-400">{lang === 'ar' ? 'جاهز للسحب بعد اعتماد العمولة' : 'Ready after commission approval'}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/25 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{lang === 'ar' ? 'الرصيد المعلق' : 'Pending balance'}</span>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400" dir="ltr">{formatter.format(pending)} {currency}</div>
          <p className="mt-1 text-[11px] text-neutral-400">{lang === 'ar' ? 'حجوزات لم يتم اعتماد عمولتها بعد' : 'Bookings awaiting commission confirmation'}</p>
        </div>
        <div className="rounded-2xl border border-sky-500/25 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{lang === 'ar' ? 'إجمالي المدفوع' : 'Total paid'}</span>
          <div className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-400" dir="ltr">{formatter.format(paid)} {currency}</div>
          <p className="mt-1 text-[11px] text-neutral-400">{lang === 'ar' ? 'إجمالي ما تم صرفه لك' : 'Total commissions already paid'}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock3 className="h-5 w-5 text-neutral-500" />
          <h2 className="font-black text-neutral-900 dark:text-white">{lang === 'ar' ? 'سجل الحركات والعمولات' : 'Transactions & commissions'}</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
          <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">{lang === 'ar' ? 'لا توجد حركات مالية حتى الآن.' : 'No wallet transactions yet.'}</p>
          <p className="mt-1 text-xs text-neutral-400">{lang === 'ar' ? 'ستظهر هنا العمولات بمجرد ربط الكود التسويقي بعملية الحجز.' : 'Commissions will appear here once the marketing code is linked to bookings.'}</p>
        </div>
      </div>

      {user.isAdmin && (
        <div className="rounded-3xl border border-violet-500/30 bg-violet-500/5 p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <FlaskConical className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h2 className="font-black text-neutral-900 dark:text-white">{lang === 'ar' ? 'اختبارات المالك' : 'Owner tests'}</h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {lang === 'ar' ? 'كل العمليات هنا اختبارية ولا تدخل في عمولات أو سحب حقيقي.' : 'Every action here is test-only and never counts as a real commission or payout.'}
              </p>

              {!testEnabled ? (
                <button type="button" disabled={testBusy} onClick={() => void runTestAction(async () => { await marketerTestApi.activateOwner(); setTestEnabled(true); setTestMessage(lang === 'ar' ? 'تم تفعيل وضع الاختبار لهذا الحساب.' : 'Test mode enabled for this account.'); })} className="mt-4 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 text-sm font-black text-white">
                  {lang === 'ar' ? 'تفعيل وضع الاختبار' : 'Enable test mode'}
                </button>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{lang === 'ar' ? 'نوع العملية' : 'Target type'}
                      <select value={targetType} onChange={(event) => setTargetType(event.target.value as 'event' | 'advertisement')} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm">
                        <option value="event">{lang === 'ar' ? 'فعالية / حجز' : 'Event / booking'}</option>
                        <option value="advertisement">{lang === 'ar' ? 'إعلان مدفوع' : 'Paid advertisement'}</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{lang === 'ar' ? 'رمز الفعالية أو الإعلان' : 'Event or ad ID'}
                      <input value={targetId} onChange={(event) => setTargetId(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm" />
                    </label>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{lang === 'ar' ? 'نوع خصم العميل' : 'Customer discount type'}
                      <select value={discountType} onChange={(event) => setDiscountType(event.target.value as MarketingRuleValue['type'])} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm"><option value="fixed">{lang === 'ar' ? 'مبلغ ثابت' : 'Fixed amount'}</option><option value="percentage">{lang === 'ar' ? 'نسبة مئوية' : 'Percentage'}</option></select>
                    </label>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{lang === 'ar' ? 'قيمة خصم العميل' : 'Customer discount value'}
                      <input inputMode="decimal" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm" />
                    </label>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{lang === 'ar' ? 'نوع عمولة المسوق' : 'Marketer reward type'}
                      <select value={rewardType} onChange={(event) => setRewardType(event.target.value as MarketingRuleValue['type'])} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm"><option value="fixed">{lang === 'ar' ? 'مبلغ ثابت' : 'Fixed amount'}</option><option value="percentage">{lang === 'ar' ? 'نسبة مئوية' : 'Percentage'}</option></select>
                    </label>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{lang === 'ar' ? 'قيمة عمولة المسوق' : 'Marketer reward value'}
                      <input inputMode="decimal" value={rewardValue} onChange={(event) => setRewardValue(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm" />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={testBusy || !targetId.trim()} onClick={() => void runTestAction(async () => { await marketerTestApi.saveRule(testRule()); setTestMessage(lang === 'ar' ? 'تم حفظ الاتفاق التجريبي.' : 'Test agreement saved.'); })} className="h-11 rounded-xl border border-violet-500/40 px-4 text-sm font-black text-violet-700 dark:text-violet-300 disabled:opacity-50">{lang === 'ar' ? 'حفظ الاتفاق' : 'Save agreement'}</button>
                    <input inputMode="decimal" value={originalAmount} onChange={(event) => setOriginalAmount(event.target.value)} className="h-11 w-28 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm" aria-label={lang === 'ar' ? 'قيمة العملية' : 'Original amount'} />
                    <button type="button" disabled={testBusy || !targetId.trim()} onClick={() => void runTestAction(async () => { await marketerTestApi.simulateConversion({ targetType, targetId: targetId.trim(), originalAmount: Number(originalAmount), clientRequestId: requestId('conversion') }); setTestMessage(lang === 'ar' ? 'تم إنشاء عملية تجريبية بعمولة معلّقة.' : 'Test conversion created with a pending commission.'); })} className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 text-sm font-black text-white disabled:opacity-50">{lang === 'ar' ? 'محاكاة عملية' : 'Simulate conversion'}</button>
                  </div>
                  {testLedger.length > 0 && (
                    <div className="space-y-2 rounded-2xl border border-violet-500/20 bg-white/60 dark:bg-neutral-950/20 p-3">
                      {testLedger.slice(0, 5).map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{entry.type === 'commission' ? (lang === 'ar' ? 'عمولة اختبارية' : 'Test commission') : entry.type} · {formatter.format(Number(entry.amount || 0))} {currency} · {entry.status}</span>{entry.status === 'pending' && <button type="button" disabled={testBusy} onClick={() => void runTestAction(async () => { await marketerTestApi.approveCommission(entry.id); setTestMessage(lang === 'ar' ? 'تم اعتماد العمولة التجريبية.' : 'Test commission approved.'); })} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-black text-white disabled:opacity-50">{lang === 'ar' ? 'اعتماد' : 'Approve'}</button>}</div>)}
                      <button type="button" disabled={testBusy || available <= 0} onClick={() => void runTestAction(async () => { const request = await marketerTestApi.requestWithdrawal(available, requestId('withdrawal')); await marketerTestApi.markWithdrawalPaid(request.withdrawal.id); setTestMessage(lang === 'ar' ? 'تم تسجيل سحب وتحويل تجريبي.' : 'Test withdrawal and transfer recorded.'); })} className="mt-2 h-10 rounded-xl bg-sky-600 px-4 text-xs font-black text-white disabled:opacity-50">{lang === 'ar' ? 'اختبار السحب والتحويل' : 'Test withdrawal and transfer'}</button>
                    </div>
                  )}
                </div>
              )}
              {testMessage && <p className="mt-3 rounded-xl bg-white/70 dark:bg-neutral-950/30 p-3 text-xs font-bold text-neutral-700 dark:text-neutral-200">{testMessage}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
