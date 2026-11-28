import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { adReportActions, adReportSources } from '../../../shared/adReporting.js';
import { useApp } from '../../context/AppContext';
import { AdReportLoadError, loadAdReport } from '../../lib/adReporting';
import { DanceEvent } from '../../types';

const sourceLabels: Record<string, [string, string]> = {
  facebook_paid: ['فيسبوك ممول', 'Facebook paid'],
  facebook_organic: ['فيسبوك مجاني', 'Facebook organic'],
  facebook_unknown: ['فيسبوك — النوع غير معروف', 'Facebook — type unknown'],
  instagram_paid: ['إنستجرام ممول', 'Instagram paid'],
  instagram_organic: ['إنستجرام مجاني', 'Instagram organic'],
  instagram_unknown: ['إنستجرام — النوع غير معروف', 'Instagram — type unknown'],
  meta_paid: ['Meta ممول — المنصة غير معروفة', 'Meta paid — platform unknown'],
  google: ['بحث جوجل', 'Google Search'],
  chatgpt: ['ChatGPT', 'ChatGPT'],
  tiktok: ['تيك توك', 'TikTok'],
  internal: ['من داخل CityEve', 'Within CityEve'],
  unknown: ['مباشر أو غير معروف', 'Direct or unknown'],
};

export const AdReportPage: React.FC<{ event: DanceEvent; onBack: () => void }> = ({ event, onBack }) => {
  const { lang } = useApp();
  const isAr = lang === 'ar';
  const [days, setDays] = useState(7);
  const [retry, setRetry] = useState(0);
  const [report, setReport] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<number | null>(null);
  const number = new Intl.NumberFormat(isAr ? 'ar-EG' : 'en');

  useEffect(() => {
    const controller = new AbortController();
    setReport(null);
    setError(null);
    loadAdReport(event.id, days, controller.signal)
      .then(data => { if (!controller.signal.aborted) setReport(data); })
      .catch(error => {
        if (!controller.signal.aborted) setError(error instanceof AdReportLoadError ? error.status : 0);
      });
    return () => controller.abort();
  }, [event.id, days, retry]);

  const headings = isAr
    ? ['المصدر', 'مشاهدات الإعلان', 'ضغطات واتساب', 'ضغطات الاتصال', 'ضغطات الحجز']
    : ['Source', 'Ad views', 'WhatsApp clicks', 'Call clicks', 'Booking clicks'];
  const totalViews = adReportSources.reduce((total, source) => total + (report?.[`${source}_visit`] || 0), 0);
  const errorMessage = error === 401
    ? (isAr ? 'سجّل الدخول بحساب الإدارة من جديد، ثم افتح التقرير.' : 'Sign in again with your admin account, then reopen the report.')
    : error === 403
      ? (isAr ? 'التقرير متاح لحساب الإدارة الموثّق.' : 'This report is available to verified admin accounts.')
      : (isAr ? 'تعذّر تحميل التقرير. جرّب مرة أخرى.' : 'The report could not be loaded. Try again.');
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} aria-labelledby="ad-report-title" className="space-y-4 px-1 py-4 text-neutral-950 dark:text-white sm:px-2">
      <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-300 px-3 text-sm font-bold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
        <BackArrow aria-hidden="true" className="size-4" />
        {isAr ? 'العودة للإعلان' : 'Back to ad'}
      </button>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 id="ad-report-title" className="text-2xl font-black">{isAr ? 'تقارير الإعلان' : 'Ad reports'}</h1>
          <p className="break-words text-neutral-600 dark:text-neutral-300">{isAr ? event.titleAr || event.titleEn : event.titleEn || event.titleAr}</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold">
          {isAr ? 'الفترة' : 'Period'}
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="min-h-10 rounded-xl border border-neutral-300 bg-white px-2 dark:border-neutral-700 dark:bg-neutral-900">
            <option value={7}>{isAr ? 'آخر ٧ أيام' : 'Last 7 days'}</option>
            <option value={30}>{isAr ? 'آخر ٣٠ يومًا' : 'Last 30 days'}</option>
          </select>
        </label>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        {isAr ? 'تُحتسب المشاهدة بمجرد ظهور الإعلان على شاشة الزائر، حتى لو ما ضغطش على أي زر. الأرقام تبدأ من وقت تفعيل التتبّع.' : 'A view is counted when the ad appears on a visitor’s screen, even if they never click. Counts start when tracking is enabled.'}
      </p>
      {error !== null ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-300 p-4 dark:border-neutral-700">
          <span>{errorMessage}</span>
          <button type="button" className="font-bold underline" onClick={() => setRetry(attempt => attempt + 1)}>{isAr ? 'إعادة المحاولة' : 'Try again'}</button>
        </div>
      ) : !report ? (
        <p role="status">{isAr ? 'جارٍ تحميل التقرير…' : 'Loading report…'}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
            <strong className="text-xl tabular-nums">{number.format(totalViews)}</strong>
            <span className="text-sm font-bold">{isAr ? 'إجمالي مشاهدات الإعلان في الفترة' : 'Total ad views in this period'}</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <table aria-label={isAr ? 'مصادر زيارات الإعلان وإجراءاته' : 'Ad sources and actions'} className="w-full min-w-[34rem] text-start text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800">
                <tr>{headings.map(heading => <th key={heading} scope="col" className="px-3 py-3 text-start font-bold">{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {adReportSources.map(source => (
                  <tr key={source}>
                    <th scope="row" className="px-3 py-2 text-start font-medium">{sourceLabels[source][isAr ? 0 : 1]}</th>
                    {adReportActions.map(action => <td key={action} className="px-3 py-2 tabular-nums">{number.format(report[`${source}_${action}`] || 0)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
