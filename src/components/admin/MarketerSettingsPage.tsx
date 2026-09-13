import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Copy, Pause, Pencil, Play, Save, Search, Settings, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MarketerRule, marketerRulesApi, RuleValueType } from '../../lib/marketerRulesApi';
import { DanceEvent, UserProfile } from '../../types';

type Props = { marketer: UserProfile; onBack: () => void };
type FormValue = { type: RuleValueType; value: string };
const emptyValue = (): FormValue => ({ type: 'percentage', value: '0' });

const RuleInput = ({ label, value, onChange }: { label: string; value: FormValue; onChange: (value: FormValue) => void }) => (
  <label className="block text-sm font-black text-neutral-800 dark:text-neutral-200">
    {label}
    <div className="mt-2 grid grid-cols-[1fr_130px] gap-2">
      <input type="number" min="0" step="0.01" value={value.value} onChange={(event) => onChange({ ...value, value: event.target.value })} className="h-11 min-w-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3" />
      <select value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value as RuleValueType })} className="h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-2">
        <option value="percentage">نسبة %</option>
        <option value="fixed">مبلغ ثابت</option>
      </select>
    </div>
  </label>
);

const eventImage = (event?: DanceEvent) => event?.thumbnailUrl || event?.mediaUrl || '';

export const MarketerSettingsPage: React.FC<Props> = ({ marketer, onBack }) => {
  const { lang, activeEvents, events } = useApp();
  const [rules, setRules] = useState<MarketerRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [defaultTarget, setDefaultTarget] = useState<'advertisement' | 'booking'>('advertisement');
  const [defaultDiscount, setDefaultDiscount] = useState<FormValue>(emptyValue);
  const [defaultReward, setDefaultReward] = useState<FormValue>(emptyValue);
  const [reference, setReference] = useState('');
  const [eventDiscount, setEventDiscount] = useState<FormValue>(emptyValue);
  const [eventReward, setEventReward] = useState<FormValue>(emptyValue);
  const [eventTarget, setEventTarget] = useState<'advertisement' | 'booking'>('booking');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const allEvents = events.length ? events : activeEvents;
  const matchedEvent = useMemo(() => {
    const clean = reference.trim().toLowerCase();
    if (!clean) return undefined;
    return allEvents.find((event) => String(event.eventRef || '').toLowerCase() === clean || String(event.adNumber || '').trim().toLowerCase() === clean);
  }, [allEvents, reference]);

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await marketerRulesApi.list(marketer.id);
      setRules(result.rules);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل الاتفاقات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [marketer.id]);

  const saveRule = async (scope: 'default' | 'event') => {
    if (scope === 'event' && !matchedEvent) {
      setMessage('أدخل رقمًا مرجعيًا صحيحًا واختر الفاعلية الظاهرة أولاً.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const discount = scope === 'event' ? eventDiscount : defaultDiscount;
      const reward = scope === 'event' ? eventReward : defaultReward;
      await marketerRulesApi.save({
        marketerId: marketer.id,
        scope,
        targetType: scope === 'event' ? eventTarget : defaultTarget,
        targetId: scope === 'event' ? matchedEvent!.id : 'default',
        targetReference: scope === 'event' ? String(matchedEvent!.eventRef || matchedEvent!.adNumber || '') : '',
        customerDiscount: { type: discount.type, value: Number(discount.value || 0) },
        marketerReward: { type: reward.type, value: Number(reward.value || 0) },
        active: true,
        startsAt,
        endsAt,
      });
      setMessage('تم حفظ الاتفاق. سيُطبق على الحجوزات المطابقة بعد التحقق من كود المسوّق.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حفظ الاتفاق.');
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: MarketerRule) => {
    setSaving(true);
    try {
      await marketerRulesApi.setStatus(marketer.id, rule.id, !rule.active);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تغيير حالة الاتفاق.');
    } finally {
      setSaving(false);
    }
  };

  const editRule = (rule: MarketerRule) => {
    const discount = { type: rule.customerDiscount.type, value: String(rule.customerDiscount.value) };
    const reward = { type: rule.marketerReward.type, value: String(rule.marketerReward.value) };
    if (rule.scope === 'event') {
      setReference(rule.targetReference || '');
      setEventDiscount(discount);
      setEventReward(reward);
      setEventTarget(rule.targetType === 'advertisement' ? 'advertisement' : 'booking');
      setStartsAt(rule.startsAt || '');
      setEndsAt(rule.endsAt || '');
    } else {
      setDefaultTarget(rule.targetType === 'booking' ? 'booking' : 'advertisement');
      setDefaultDiscount(discount);
      setDefaultReward(reward);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const valueText = (value: MarketerRule['customerDiscount']) => value.type === 'percentage' ? `${value.value}%` : `${value.value} ج.م`;

  const copyMarketerCode = async () => {
    if (!marketer.marketerCode) return;
    try {
      await navigator.clipboard.writeText(marketer.marketerCode);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2500);
    } catch {
      setMessage(lang === 'ar' ? 'تعذر نسخ الكود تلقائيًا؛ يمكنك تحديده ونسخه يدويًا.' : 'Could not copy the code automatically; select and copy it manually.');
    }
  };

  return (
    <section className="space-y-5 animate-fadeIn" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="rounded-3xl border border-amber-500/25 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="h-10 w-10 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center" aria-label="رجوع">
            {lang === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <div className="h-12 w-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
            {marketer.avatar ? <img src={marketer.avatar} alt="" className="h-full w-full object-cover" /> : <Settings className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black break-words">{lang === 'ar' ? 'إعدادات المسوق:' : 'Marketer settings:'} {marketer.name || marketer.email}</h1>
              {marketer.marketerCode ? (
                <button type="button" onClick={() => void copyMarketerCode()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 text-sm font-black text-amber-800 hover:bg-amber-500/20 dark:text-amber-300" aria-label={lang === 'ar' ? `نسخ كود المسوق ${marketer.marketerCode}` : `Copy marketer code ${marketer.marketerCode}`} title={lang === 'ar' ? 'اضغط لنسخ كود المسوق' : 'Click to copy marketer code'}>
                  <span className="font-mono" dir="ltr">{marketer.marketerCode}</span>
                  {codeCopied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  <span className="text-xs">{codeCopied ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ' : 'Copy')}</span>
                </button>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-neutral-500">{lang === 'ar' ? 'رقم الحساب:' : 'Account reference:'} {marketer.accountReference || marketer.id}</p>
          </div>
        </div>
      </div>

      {message ? <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-300">{message}</div> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="font-black flex items-center gap-2"><Tag className="h-5 w-5 text-amber-500" /> الاتفاق الافتراضي</h2>
          <p className="mt-1 text-xs text-neutral-500">يُستخدم عند عدم وجود اتفاق خاص. إعداد مستقل للإعلانات أو الحجوزات.</p>
          <label className="mt-5 block text-sm font-black">نوع العملية
            <select value={defaultTarget} onChange={(event) => setDefaultTarget(event.target.value as typeof defaultTarget)} className="mt-2 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3">
              <option value="advertisement">إضافة إعلان</option><option value="booking">حجز فاعلية</option>
            </select>
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <RuleInput label="خصم العميل" value={defaultDiscount} onChange={setDefaultDiscount} />
            <RuleInput label="عمولة المسوق" value={defaultReward} onChange={setDefaultReward} />
          </div>
          <button type="button" disabled={saving} onClick={() => void saveRule('default')} className="mt-5 h-11 w-full rounded-xl bg-amber-500 text-neutral-950 font-black flex items-center justify-center gap-2 disabled:opacity-50"><Save className="h-4 w-4" />حفظ الافتراضي</button>
        </div>

        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <h2 className="font-black flex items-center gap-2"><CalendarDays className="h-5 w-5 text-amber-500" /> اتفاق خاص بفاعلية</h2>
          <p className="mt-1 text-xs text-neutral-500">هذا الاتفاق له الأولوية على الإعداد الافتراضي.</p>
          <label className="mt-5 block text-sm font-black">نوع العملية
            <select value={eventTarget} onChange={(event) => setEventTarget(event.target.value as typeof eventTarget)} className="mt-2 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3">
              <option value="booking">حجز فعالية</option><option value="advertisement">إضافة إعلان</option>
            </select>
          </label>
          <label className="mt-5 block text-sm font-black">الرقم المرجعي للفاعلية
            <div className="relative mt-2"><Search className="absolute right-3 top-3.5 h-4 w-4 text-neutral-400" /><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="مثال: 3869" className="h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 pr-10 pl-3" /></div>
          </label>
          {matchedEvent ? (
            <div className="mt-3 flex gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3">
              <img src={eventImage(matchedEvent)} alt="" className="h-20 w-24 rounded-xl object-cover bg-neutral-800" />
              <div className="min-w-0 text-xs"><div className="font-black text-sm truncate">{matchedEvent.titleAr || matchedEvent.titleEn}</div><div className="mt-1 text-neutral-500">مرجع #{matchedEvent.eventRef || matchedEvent.adNumber}</div><div className="text-neutral-500">{matchedEvent.eventDate ? new Date(matchedEvent.eventDate).toLocaleDateString('ar-EG') : 'بدون تاريخ'} · {matchedEvent.adType || 'standard'}</div><div className="font-bold text-amber-600">{matchedEvent.priceAr || matchedEvent.priceEn || 'السعر غير محدد'}</div></div>
            </div>
          ) : reference.trim() ? <p className="mt-2 text-xs font-bold text-red-500">لم يتم العثور على فاعلية بهذا الرقم.</p> : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><RuleInput label="خصم العميل" value={eventDiscount} onChange={setEventDiscount} /><RuleInput label="عمولة المسوق" value={eventReward} onChange={setEventReward} /></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-black">يبدأ (اختياري)<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-2" /></label><label className="text-xs font-black">ينتهي (اختياري)<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-2" /></label></div>
          <button type="button" disabled={saving || !matchedEvent} onClick={() => void saveRule('event')} className="mt-5 h-11 w-full rounded-xl bg-amber-500 text-neutral-950 font-black flex items-center justify-center gap-2 disabled:opacity-50"><Save className="h-4 w-4" />حفظ اتفاق الفاعلية</button>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h2 className="font-black">الاتفاقات المحفوظة</h2>
        {loading ? <p className="mt-4 text-sm text-neutral-500">جاري التحميل...</p> : rules.length === 0 ? <p className="mt-4 text-sm text-neutral-500">لا توجد اتفاقات محفوظة لهذا المسوق.</p> : <div className="mt-4 grid gap-3">{rules.map((rule) => (
          <article key={rule.id} className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-3 flex flex-col sm:flex-row gap-3 sm:items-center">
            {rule.eventSnapshot ? <img src={rule.eventSnapshot.thumbnailUrl || rule.eventSnapshot.mediaUrl} alt="" className="h-16 w-20 rounded-xl object-cover" /> : <div className="h-16 w-20 rounded-xl bg-amber-500/10 flex items-center justify-center"><Tag className="text-amber-500" /></div>}
            <div className="min-w-0 flex-1"><div className="font-black truncate">{rule.eventSnapshot?.titleAr || (rule.scope === 'event' ? (rule.targetType === 'advertisement' ? 'اتفاق خاص: إضافة إعلان' : 'اتفاق خاص: حجز فعالية') : (rule.targetType === 'advertisement' ? 'افتراضي: إضافة إعلان' : 'افتراضي: حجز فعالية'))}</div><div className="mt-1 text-xs text-neutral-500">{rule.targetReference ? `مرجع #${rule.targetReference} · ` : ''}خصم {valueText(rule.customerDiscount)} · عمولة {valueText(rule.marketerReward)}</div><span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${rule.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-neutral-500/10 text-neutral-500'}`}>{rule.active ? 'نشط' : 'متوقف'}</span></div>
            <div className="flex gap-2"><button type="button" onClick={() => editRule(rule)} className="h-10 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 text-xs font-black flex items-center justify-center gap-2"><Pencil className="h-4 w-4" />تعديل</button><button type="button" disabled={saving} onClick={() => void toggleRule(rule)} className="h-10 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 text-xs font-black flex items-center justify-center gap-2">{rule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{rule.active ? 'إيقاف' : 'تفعيل'}</button></div>
          </article>
        ))}</div>}
      </div>
    </section>
  );
};
