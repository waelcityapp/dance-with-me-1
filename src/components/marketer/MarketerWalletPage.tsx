import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Copy, Megaphone, WalletCards } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/firebase';

interface MarketerWalletPageProps {
  onBack: () => void;
}

type WalletSnapshot = {
  marketerCode?: string;
  marketerStatus?: 'active' | 'paused' | 'inactive';
  isMarketer?: boolean;
  marketerWalletAvailable?: number;
  marketerWalletPending?: number;
  marketerWalletPaid?: number;
};

export const MarketerWalletPage: React.FC<MarketerWalletPageProps> = ({ onBack }) => {
  const { lang, user } = useApp();
  const [wallet, setWallet] = useState<WalletSnapshot>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    return onSnapshot(doc(db, 'users', user.id), (snapshot) => {
      if (!snapshot.exists()) return;
      setWallet(snapshot.data() as WalletSnapshot);
    });
  }, [user?.id]);

  const marketerCode = wallet.marketerCode || user?.marketerCode || '';
  const isActive = (wallet.isMarketer ?? user?.isMarketer) === true && (wallet.marketerStatus || user?.marketerStatus) === 'active';
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

  if (!user || !isActive) {
    return (
      <section className="py-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-xl mx-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 text-center shadow-sm">
          <WalletCards className="h-10 w-10 mx-auto text-neutral-400 mb-3" />
          <h1 className="text-lg font-black text-neutral-900 dark:text-white">
            {lang === 'ar' ? 'المحفظة غير متاحة حالياً' : 'Wallet is currently unavailable'}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {lang === 'ar' ? 'تظهر المحفظة فقط للمسوّق النشط.' : 'The wallet is available only to active marketers.'}
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
    </section>
  );
};
