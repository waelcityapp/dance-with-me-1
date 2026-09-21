import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, ClipboardList, Megaphone, Search, Settings2, Ticket, UserCheck, Users, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types';
import { MarketersManagement } from './MarketersManagement';
import { marketerRulesApi, RuleValueType } from '../../lib/marketerRulesApi';

type Section = 'home' | 'assign' | 'plans' | 'review';
type TransactionStatus = 'all' | 'pending' | 'available' | 'reversed' | 'processing' | 'paid' | 'rejected';

const exampleOperations = [
  { number: 'OP-1042', booking: 'BKG-3869', event: 'SBK Latin night', marketer: 'مسوّق تجريبي ١', original: 450, discount: 5, commission: 5, status: 'available' as const },
  { number: 'OP-1041', booking: 'BKG-3852', event: 'Latin Fiesta', marketer: 'مسوّق تجريبي ٢', original: 600, discount: 60, commission: 30, status: 'pending' as const },
  { number: 'OP-1039', booking: 'BKG-3820', event: 'Salsa Evening', marketer: 'مسوّق تجريبي ٣', original: 300, discount: 30, commission: 15, status: 'reversed' as const },
];
const exampleWithdrawals = [
  { number: 'WD-007', marketer: 'مسوّق تجريبي ١', amount: 200, method: 'InstaPay', status: 'pending' as const },
  { number: 'WD-006', marketer: 'مسوّق تجريبي ٢', amount: 300, method: 'InstaPay', status: 'paid' as const },
];
const chartData = [
  { label: 'مسوّق ١', sales: 7600 },
  { label: 'مسوّق ٢', sales: 5900 },
  { label: 'مسوّق ٣', sales: 4250 },
  { label: 'مسوّق ٤', sales: 3100 },
];

const shell = 'rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm';
const muted = 'text-neutral-500 dark:text-neutral-400';
const field = 'h-11 min-w-0 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3 text-sm text-neutral-900 dark:text-white outline-none focus:border-amber-500';

export const MarketerAdminWorkspace: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const [section, setSection] = useState<Section>('home');
  const [selectedMarketer, setSelectedMarketer] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('all');
  const [reviewTab, setReviewTab] = useState<'operations' | 'withdrawals'>('operations');
  const [planTab, setPlanTab] = useState<'bookings' | 'ads'>('bookings');
  const [period, setPeriod] = useState('30');
  const [planSaving, setPlanSaving] = useState(false);
  const [planMessage, setPlanMessage] = useState('');
  const [generalPlans, setGeneralPlans] = useState<any[]>([]);
  const [planDiscount, setPlanDiscount] = useState('');
  const [planReward, setPlanReward] = useState('');
  const [planDiscountType, setPlanDiscountType] = useState<RuleValueType>('percentage');
  const [planRewardType, setPlanRewardType] = useState<RuleValueType>('percentage');
  const [planStart, setPlanStart] = useState('');
  const [planEnd, setPlanEnd] = useState('');
  useEffect(() => {
    if (section !== 'plans') return;
    void marketerRulesApi.listGeneralPlans().then((result) => setGeneralPlans(result.rules)).catch((error) => setPlanMessage(error instanceof Error ? error.message : 'تعذر تحميل الخطة العامة.'));
  }, [section]);
  useEffect(() => {
    const plan = generalPlans.find((item) => item.targetType === (planTab === 'bookings' ? 'booking' : 'advertisement'));
    setPlanDiscount(plan ? String(plan.customerDiscount?.value ?? '') : '');
    setPlanReward(plan ? String(plan.marketerReward?.value ?? '') : '');
    setPlanDiscountType(plan?.customerDiscount?.type || 'percentage');
    setPlanRewardType(plan?.marketerReward?.type || 'percentage');
    setPlanStart(plan?.startsAt || ''); setPlanEnd(plan?.endsAt || '');
  }, [planTab, generalPlans]);

  const saveGeneralPlan = async () => {
    const read = (id: string) => document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    const discount = Number(planDiscount || 0);
    const reward = Number(planReward || 0);
    const discountType = planDiscountType;
    const rewardType = planRewardType;
    const startsAt = planStart;
    const endsAt = planEnd;
    if (!Number.isFinite(discount) || !Number.isFinite(reward) || discount < 0 || reward < 0 || (discountType === 'percentage' && discount > 100) || (rewardType === 'percentage' && reward > 100)) { setPlanMessage('أدخل قيماً صحيحة؛ النسبة من 0 إلى 100.'); return; }
    if (startsAt && endsAt && endsAt < startsAt) { setPlanMessage('تاريخ النهاية يجب أن يكون بعد البداية.'); return; }
    setPlanSaving(true); setPlanMessage('');
    try {
      await marketerRulesApi.saveGeneralPlan({ targetType: planTab === 'bookings' ? 'booking' : 'advertisement', customerDiscount: { type: discountType, value: discount }, marketerReward: { type: rewardType, value: reward }, startsAt, endsAt });
      setPlanMessage('تم اعتماد وحفظ الخطة العامة.');
    } catch (error) { setPlanMessage(error instanceof Error ? error.message : 'تعذر حفظ الخطة.'); }
    finally { setPlanSaving(false); }
  };

  const go = (next: Section) => { setSection(next); setSelectedMarketer(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const back = () => { if (section === 'review' && selectedMarketer) { setSelectedMarketer(null); return; } if (section === 'home') onBack(); else go('home'); };
  const filtered = useMemo(() => exampleOperations.filter((operation) => {
    const term = search.trim().toLowerCase();
    return (!term || [operation.number, operation.booking, operation.event, operation.marketer].some((value) => value.toLowerCase().includes(term)))
      && (status === 'all' || operation.status === status);
  }), [search, status]);
  const filteredWithdrawals = useMemo(() => exampleWithdrawals.filter((request) =>
    (!search.trim() || [request.number, request.marketer].some((value) => value.toLowerCase().includes(search.trim().toLowerCase())))
    && (status === 'all' || request.status === status)
  ), [search, status]);
  const BackIcon = ar ? ArrowRight : ArrowLeft;
  const NextIcon = ar ? ChevronLeft : ChevronRight;

  if (section === 'assign') return <MarketersManagement onBack={() => go('home')} onReviewMarketer={(marketer) => { setSelectedMarketer(marketer); setSection('review'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />;

  return (
    <section className="mx-auto max-w-7xl space-y-5 pb-12 text-neutral-900 dark:text-white" dir={ar ? 'rtl' : 'ltr'}>
      <header className={`${shell} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={back} aria-label={ar ? 'رجوع' : 'Back'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700"><BackIcon className="h-5 w-5" /></button>
          <div>
            <h1 className="text-xl font-black sm:text-2xl">{section === 'home' ? (ar ? 'إدارة المسوّقين' : 'Marketer management') : section === 'plans' ? (ar ? 'ضبط الخطط العامة' : 'General plans') : selectedMarketer ? (ar ? `حساب ${selectedMarketer.name || 'المسوّق'}` : `${selectedMarketer.name || 'Marketer'} account`) : (ar ? 'مراجعة حسابات المسوّقين' : 'Marketer accounts')}</h1>
            <p className={`mt-1 text-xs sm:text-sm ${muted}`}>{section === 'home' ? (ar ? 'اختر القسم الذي تريد مراجعته' : 'Choose an area to review') : section === 'plans' ? (ar ? 'هيكل الخطط العامة قبل ربطه بالتسعير' : 'General plan layout before pricing integration') : (ar ? 'العمليات والأرصدة وطلبات السحب في مكان واحد' : 'Transactions, balances and withdrawals in one place')}</p>
          </div>
        </div>
        {section !== 'home' && <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">{ar ? 'تصور تصميم · البيانات المالية توضيحية' : 'Design preview · financial data is illustrative'}</span>}
      </header>

      {section === 'home' && <div className="grid gap-4 md:grid-cols-3">
        {([
          { id: 'assign', icon: UserCheck, title: ar ? 'تعيين مسوّقين' : 'Assign marketers', body: ar ? 'المستخدمون الحاليون، التفعيل والإيقاف، والخطط الخاصة لكل مسوّق.' : 'Users, activation, suspension and individual agreements.', tag: ar ? 'الوظائف الحالية متاحة' : 'Current controls available' },
          { id: 'plans', icon: Settings2, title: ar ? 'ضبط الخطط العامة' : 'General plans', body: ar ? 'قواعد الحجوزات وإضافة الإعلانات، والفترات والاستثناءات.' : 'Booking and advertising rules, periods and exceptions.', tag: ar ? 'تصميم للمراجعة' : 'Design preview' },
          { id: 'review', icon: BarChart3, title: ar ? 'مراجعة حسابات المسوّقين' : 'Review accounts', body: ar ? 'الأداء والعمولات والعمليات وطلبات السحب اليدوية.' : 'Performance, commissions, operations and manual payouts.', tag: ar ? 'تصميم للمراجعة' : 'Design preview' },
        ] as const).map(({ id, icon: Icon, title, body, tag }) => <button type="button" key={id} onClick={() => go(id)} className={`${shell} group flex min-h-52 flex-col items-start p-6 text-start transition-colors hover:border-amber-500`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Icon className="h-6 w-6" /></span>
          <span className="mt-5 text-lg font-black">{title}</span><span className={`mt-2 text-sm leading-6 ${muted}`}>{body}</span>
          <span className="mt-auto flex w-full items-center justify-between pt-5 text-xs font-bold text-amber-700 dark:text-amber-300"><span>{tag}</span><NextIcon className="h-4 w-4" /></span>
        </button>)}
      </div>}

      {section === 'plans' && <>
        <nav className={`${shell} flex flex-wrap gap-2 p-2`} aria-label={ar ? 'نوع الخطة' : 'Plan type'}>
          <button type="button" onClick={() => setPlanTab('bookings')} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${planTab === 'bookings' ? 'bg-amber-500 text-neutral-950' : muted}`}><Ticket className="h-4 w-4" />{ar ? 'خطط الحجوزات' : 'Booking plans'}</button>
          <button type="button" onClick={() => setPlanTab('ads')} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${planTab === 'ads' ? 'bg-amber-500 text-neutral-950' : muted}`}><Megaphone className="h-4 w-4" />{ar ? 'إضافة الإعلانات والفعاليات' : 'Ads and events'}</button>
        </nav>
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className={`${shell} p-5 sm:p-6`}>
            <div className="flex items-start gap-3"><CircleDollarSign className="mt-0.5 h-5 w-5 text-amber-500" /><div><h2 className="font-black">{planTab === 'bookings' ? (ar ? 'الخطة العامة لكل الحجوزات' : 'Default booking plan') : (ar ? 'الخطة العامة لإضافة إعلان' : 'Default advertising plan')}</h2><p className={`mt-1 text-xs ${muted}`}>{ar ? 'تسري على جميع المسوّقين عند عدم وجود اتفاق أخص' : 'Applies to all marketers unless a more specific agreement exists'}</p></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-bold">{ar ? 'خصم العميل' : 'Customer discount'}<div className="flex gap-2"><input className={field} id="general-plan-discount" type="number" min="0" step="0.01" value={planDiscount} onChange={(event) => setPlanDiscount(event.target.value)} placeholder="10" aria-label={ar ? 'خصم العميل' : 'Customer discount'} /><select id="general-plan-discount-type" value={planDiscountType} onChange={(event) => setPlanDiscountType(event.target.value as RuleValueType)} className={field} aria-label={ar ? 'نوع خصم العميل' : 'Discount type'}><option value="percentage">{ar ? 'نسبة %' : 'Percent %'}</option><option value="fixed">{ar ? 'مبلغ ثابت' : 'Fixed amount'}</option></select></div></label>
              <label className="space-y-2 text-xs font-bold">{ar ? 'عمولة المسوّق' : 'Marketer reward'}<div className="flex gap-2"><input className={field} id="general-plan-reward" type="number" min="0" step="0.01" value={planReward} onChange={(event) => setPlanReward(event.target.value)} placeholder="10" aria-label={ar ? 'عمولة المسوّق' : 'Marketer reward'} /><select id="general-plan-reward-type" value={planRewardType} onChange={(event) => setPlanRewardType(event.target.value as RuleValueType)} className={field} aria-label={ar ? 'نوع العمولة' : 'Reward type'}><option value="percentage">{ar ? 'نسبة %' : 'Percent %'}</option><option value="fixed">{ar ? 'مبلغ ثابت' : 'Fixed amount'}</option></select></div></label>
              {planTab === 'ads' && <label className="space-y-2 text-xs font-bold">{ar ? 'نوع الإعلان' : 'Ad type'}<select className={field}><option>{ar ? 'إعلان عادي' : 'Standard ad'}</option><option>{ar ? 'إعلان مميز' : 'Featured ad'}</option></select></label>}
              <label className="space-y-2 text-xs font-bold">{ar ? 'تاريخ البداية (اختياري)' : 'Start date (optional)'}<input id="general-plan-start" className={field} type="date" value={planStart} onChange={(event) => setPlanStart(event.target.value)} /></label>
              <label className="space-y-2 text-xs font-bold">{ar ? 'تاريخ النهاية (اختياري)' : 'End date (optional)'}<input id="general-plan-end" className={field} type="date" value={planEnd} onChange={(event) => setPlanEnd(event.target.value)} /></label>
            </div>
            {planMessage ? <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-xs font-bold text-amber-800 dark:text-amber-300">{planMessage}</div> : <div className="mt-6 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">{ar ? 'تُستخدم الخطة عند عدم وجود اتفاق خاص للمسوّق.' : 'Used when no marketer-specific agreement exists.'}</div>}
            <button type="button" disabled={planSaving} onClick={() => void saveGeneralPlan()} className="mt-4 rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-neutral-950 disabled:opacity-50">{planSaving ? (ar ? 'جارٍ الحفظ...' : 'Saving...') : (ar ? 'اعتماد وحفظ الخطة' : 'Approve and save plan')}</button>
          </div>
          <div className="space-y-4">
            <div className={`${shell} p-5`}><h2 className="font-black">{ar ? 'استثناءات الخطة العامة' : 'General exceptions'}</h2><p className={`mt-2 text-sm leading-6 ${muted}`}>{planTab === 'bookings' ? (ar ? 'قاعدة لفعالية بعينها أو لفترة محددة، تطبق على جميع المسوّقين.' : 'A rule for one event or a limited period, for all marketers.') : (ar ? 'قاعدة لإعلان عادي أو مميز، ويمكن تحديد فترة لها.' : 'Rules by standard or featured ad, optionally time-limited.')}</p><button type="button" disabled className="mt-4 rounded-xl border border-amber-500/30 px-4 py-2.5 text-xs font-bold text-amber-700 opacity-60 dark:text-amber-300">{ar ? '+ إضافة استثناء · بعد الاعتماد' : '+ Add exception · after approval'}</button></div>
            <div className={`${shell} p-5`}><h2 className="font-black">{ar ? 'ترتيب تطبيق القواعد' : 'Rule priority'}</h2><ol className={`mt-3 list-inside list-decimal space-y-2 text-sm ${muted}`}><li>{ar ? 'اتفاق مسوّق خاص بفعالية' : 'Marketer + event'}</li><li>{ar ? 'اتفاق عام لفعالية' : 'All marketers + event'}</li><li>{ar ? 'اتفاق مسوّق لنوع العملية' : 'Marketer + operation'}</li><li>{ar ? 'الخطة العامة لنوع العملية' : 'General operation plan'}</li></ol></div>
          </div>
        </div>
      </>}

      {section === 'review' && <>
        {selectedMarketer ? <div className={`${shell} p-5`}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black">{selectedMarketer.name || (ar ? 'حساب مسوّق' : 'Marketer account')}</h2><p className={`mt-1 font-mono text-sm ${muted}`}>{selectedMarketer.marketerCode || '—'} · {selectedMarketer.accountReference || '—'}</p></div><button type="button" onClick={() => setSelectedMarketer(null)} className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-bold dark:border-neutral-700">{ar ? 'كل المسوّقين' : 'All marketers'}</button></div><p className={`mt-4 text-sm ${muted}`}>{ar ? 'بيانات الحساب الفعلية ستظهر هنا بعد ربط صفحة المراجعة بسجل العمليات. لا نعرض أرقامًا افتراضية باسم مسوّق حقيقي.' : 'Actual account figures will appear after linking the transaction ledger. No sample balances are shown for a real marketer.'}</p></div> : <div className={`${shell} flex flex-wrap items-center justify-between gap-3 p-4`}><div className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="h-4 w-4 text-amber-500" />{ar ? 'فترة التقرير' : 'Report period'}</div><select className={`${field} max-w-48`} value={period} onChange={(event) => setPeriod(event.target.value)} aria-label={ar ? 'فترة التقرير' : 'Report period'}><option value="7">{ar ? 'آخر ٧ أيام' : 'Last 7 days'}</option><option value="30">{ar ? 'آخر ٣٠ يومًا' : 'Last 30 days'}</option><option value="90">{ar ? 'آخر ٩٠ يومًا' : 'Last 90 days'}</option></select></div>}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
          { icon: Clock3, label: ar ? 'عمولات معلّقة' : 'Pending', value: selectedMarketer ? '—' : '١٢٠ ج.م' },
          { icon: Wallet, label: ar ? 'متاح للسحب' : 'Available', value: selectedMarketer ? '—' : '٣٤٠ ج.م' },
          { icon: ClipboardList, label: ar ? 'طلبات سحب مفتوحة' : 'Withdrawal requests', value: selectedMarketer ? '—' : '٢٠٠ ج.م' },
          { icon: CircleDollarSign, label: ar ? 'تم تحويله' : 'Paid out', value: selectedMarketer ? '—' : '٦٨٠ ج.م' },
        ].map(({ icon: Icon, label, value }) => <div key={label} className={`${shell} p-4`}><Icon className="h-5 w-5 text-amber-500" /><p className={`mt-3 text-xs ${muted}`}>{label}</p><strong className="mt-1 block text-lg sm:text-xl">{value}</strong></div>)}</div>
        {!selectedMarketer && <div className="grid gap-4 lg:grid-cols-2"><div className={`${shell} p-5`}><h2 className="font-black">{ar ? 'أعلى المسوّقين مبيعات' : 'Top marketers by sales'}</h2><p className={`mt-1 text-xs ${muted}`}>{ar ? 'مثال توضيحي · حجوزات معتمدة فقط' : 'Illustrative · approved bookings only'}</p><div className="mt-5 space-y-4">{chartData.map((item) => <div key={item.label} className="grid grid-cols-[64px_1fr_74px] items-center gap-3 text-xs"><span>{item.label}</span><div className="h-3 rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-amber-500" style={{ width: `${item.sales / 7600 * 100}%` }} /></div><span className="text-end font-bold">{item.sales.toLocaleString('ar-EG')}</span></div>)}</div></div><div className={`${shell} p-5`}><h2 className="font-black">{ar ? 'العائد مقابل التزامات المسوّقين' : 'Revenue vs marketer liabilities'}</h2><p className={`mt-1 text-xs ${muted}`}>{ar ? 'موضع التقرير المالي بعد تحديد نصيب المنصة والرسوم' : 'Financial report after defining platform share and fees'}</p><div className="mt-7 flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-200 text-center text-xs text-neutral-500 dark:border-neutral-700"><BarChart3 className="h-7 w-7 text-amber-500" />{ar ? 'لن نسمي مبيعات الحجز ربحًا قبل إدخال تكاليفه' : 'Booking sales will not be labeled profit without costs'}</div></div></div>}
        <div className={`${shell} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800"><div className="flex gap-2"><button type="button" onClick={() => { setReviewTab('operations'); setStatus('all'); setSearch(''); }} className={`rounded-xl px-3 py-2 text-xs font-bold ${reviewTab === 'operations' ? 'bg-amber-500 text-neutral-950' : muted}`}>{ar ? 'العمليات' : 'Operations'}</button><button type="button" onClick={() => { setReviewTab('withdrawals'); setStatus('all'); setSearch(''); }} className={`rounded-xl px-3 py-2 text-xs font-bold ${reviewTab === 'withdrawals' ? 'bg-amber-500 text-neutral-950' : muted}`}>{ar ? 'طلبات السحب' : 'Withdrawals'}</button></div><span className={`text-xs ${muted}`}>{ar ? 'بيانات توضيحية للتصميم فقط' : 'Illustrative design data only'}</span></div>
          <div className="grid gap-3 p-4 sm:grid-cols-[1fr_180px]"><div className="relative"><Search className={`absolute top-3.5 h-4 w-4 text-neutral-400 ${ar ? 'right-3' : 'left-3'}`} /><input className={`${field} ${ar ? 'pr-10' : 'pl-10'}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={reviewTab === 'operations' ? (ar ? 'بحث برقم العملية أو الحجز أو المسوّق' : 'Search operation, booking or marketer') : (ar ? 'بحث برقم طلب السحب أو المسوّق' : 'Search withdrawal or marketer')} /></div><select className={field} value={status} onChange={(event) => setStatus(event.target.value as TransactionStatus)} aria-label={ar ? 'فلتر الحالة' : 'Status filter'}><option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option><option value="pending">{ar ? 'معلّقة' : 'Pending'}</option>{reviewTab === 'operations' ? <><option value="available">{ar ? 'مستحقة' : 'Available'}</option><option value="reversed">{ar ? 'ملغاة' : 'Reversed'}</option></> : <><option value="processing">{ar ? 'قيد التحويل' : 'Processing'}</option><option value="paid">{ar ? 'تم التحويل' : 'Paid'}</option><option value="rejected">{ar ? 'مرفوضة' : 'Rejected'}</option></>}</select></div>
          {selectedMarketer ? <div className={`p-8 text-center text-sm ${muted}`}>{ar ? 'لم تُربط العمليات الفعلية بعد.' : 'Actual transactions are not connected yet.'}</div> : reviewTab === 'withdrawals' ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead className="bg-neutral-50 dark:bg-neutral-800/60"><tr>{[ar ? 'رقم الطلب' : 'Request', ar ? 'المسوّق' : 'Marketer', ar ? 'المبلغ' : 'Amount', ar ? 'طريقة التحويل' : 'Transfer method', ar ? 'الحالة' : 'Status'].map((label) => <th key={label} className="p-3 text-start">{label}</th>)}</tr></thead><tbody>{filteredWithdrawals.map((request) => <tr key={request.number} className="border-t border-neutral-100 dark:border-neutral-800"><td className="p-3 font-mono">{request.number}</td><td className="p-3">{request.marketer}</td><td className="p-3">{request.amount} {ar ? 'ج.م' : 'EGP'}</td><td className="p-3">{request.method}</td><td className="p-3">{request.status === 'paid' ? (ar ? 'تم التحويل' : 'Paid') : (ar ? 'بانتظار المراجعة' : 'Pending')}</td></tr>)}</tbody></table>{filteredWithdrawals.length === 0 && <p className={`p-6 text-center text-sm ${muted}`}>{ar ? 'لا توجد طلبات مطابقة.' : 'No matching requests.'}</p>}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-start text-xs sm:text-sm"><thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400"><tr>{[ar ? 'رقم العملية' : 'Operation', ar ? 'المسوّق' : 'Marketer', ar ? 'الفعالية / الحجز' : 'Event / booking', ar ? 'الأصل' : 'Original', ar ? 'خصم العميل' : 'Discount', ar ? 'العمولة' : 'Commission', ar ? 'الحالة' : 'Status'].map((label) => <th key={label} className="p-3 text-start font-bold">{label}</th>)}</tr></thead><tbody>{filtered.map((operation) => <tr key={operation.number} className="border-t border-neutral-100 dark:border-neutral-800"><td className="p-3 font-mono">{operation.number}</td><td className="p-3">{operation.marketer}</td><td className="p-3">{operation.event}<span className={`block font-mono text-xs ${muted}`}>{operation.booking}</span></td><td className="p-3">{operation.original}</td><td className="p-3">{operation.discount}</td><td className="p-3 font-bold">{operation.commission}</td><td className="p-3">{operation.status === 'pending' ? (ar ? 'معلّقة' : 'Pending') : operation.status === 'available' ? (ar ? 'مستحقة' : 'Available') : (ar ? 'ملغاة' : 'Reversed')}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className={`p-6 text-center text-sm ${muted}`}>{ar ? 'لا توجد عمليات مطابقة.' : 'No matching operations.'}</p>}</div>}
        </div>
        <div className={`${shell} flex flex-wrap items-center justify-between gap-3 p-5`}><div className="flex items-center gap-3"><Users className="h-5 w-5 text-amber-500" /><div><h2 className="font-black">{ar ? 'حساب مسوّق محدد' : 'Individual marketer account'}</h2><p className={`mt-1 text-xs ${muted}`}>{ar ? 'من صفحة تعيين مسوّقين اضغط «مراجعة الحساب» بجوار الاسم.' : 'Choose Review account beside a marketer in Assign marketers.'}</p></div></div><button type="button" onClick={() => go('assign')} className="rounded-xl border border-amber-500/40 px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-300">{ar ? 'فتح قائمة المسوّقين' : 'Open marketer list'}</button></div>
      </>}
    </section>
  );
};
