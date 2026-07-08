import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Download, CheckCircle2, ShieldCheck, X, Smartphone, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PwaInstallBannerProps {
  onOpenInstallModal?: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ onOpenInstallModal }) => {
  const { lang } = useApp();
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone/PWA mode
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isPwa);

    const hidden = sessionStorage.getItem('dwm_hide_pwa_banner');
    if (!isPwa && !hidden) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('dwm_hide_pwa_banner', 'true');
  };

  if (!showBanner || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="relative mb-6 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 p-4 shadow-lg gold-glow"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden border border-amber-500/40 shadow-lg bg-neutral-900">
              <img src="/icon.svg?v=20260706" alt="DWM Icon" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  {lang === 'ar' ? 'تطبيق ويب تقدمي (PWA) مقاوم للفشل' : 'Defensive PWA Available'}
                </h4>
                <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{lang === 'ar' ? 'كاش فوري' : 'Cached One-by-One'}</span>
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                {lang === 'ar'
                  ? 'أضف تطبيق "Dance With Me" لشاشة هاتفك الرئيسية لتجربة سريعة بدون إنترنت وبدون تأخير.'
                  : 'Add "Dance With Me" to your home screen for instant offline browsing and alerts.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-all shadow-md shrink-0"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'طرق التثبيت 📱' : 'Install Guide 📱'}</span>
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
          <span className="flex items-center gap-1 text-amber-300">
            <span>⚡ iOS:</span>
            <span>{lang === 'ar' ? 'اضغط زر المشاركة (Share) ⇾ الإضافة للشاشة الرئيسية (Add to Home Screen)' : 'Tap Share ⇾ Add to Home Screen'}</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-300">
            <span>🤖 Android:</span>
            <span>{lang === 'ar' ? 'اضغط القائمة (⋮) ⇾ تثبيت التطبيق (Install App)' : 'Tap Menu (⋮) ⇾ Install App'}</span>
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
