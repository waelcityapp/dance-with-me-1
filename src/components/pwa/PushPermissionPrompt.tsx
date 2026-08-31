import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BellRing, X, ShieldCheck, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeUserToPush } from '../../lib/pushNotifications';

export const PushPermissionPrompt: React.FC = () => {
  const { lang, user } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Only check in browser
    if (typeof window === 'undefined') return;

    // Check if permission already granted or dismissed in current session
    const isDismissed = sessionStorage.getItem('cityeve_dismiss_push_prompt') === 'true';
    if (isDismissed) return;

    const isGranted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
    if (isGranted) return;

    // Show prompt after 1.2s for smooth entrance
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setIsSubscribing(true);
    try {
      const res = await subscribeUserToPush(user?.id, user?.email, true);
      if (res.success) {
        setIsVisible(false);
      } else if (res.message) {
        alert(res.message);
      }
    } catch (err) {
      console.warn('Push subscribe prompt note:', err);
    } finally {
      setIsSubscribing(false);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('cityeve_dismiss_push_prompt', 'true');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:end-6 z-50 max-w-md w-auto rounded-3xl border-2 border-amber-500/40 bg-neutral-950/95 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl shadow-amber-500/20 text-white gold-glow overflow-hidden"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 animate-pulse" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <BellRing className="h-6 w-6 animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  {lang === 'ar' ? 'تفعيل إشعارات الحفلات والسهرات 🔔' : 'Enable Event & Nightlife Alerts 🔔'}
                </h4>
              </div>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                {lang === 'ar'
                  ? 'احصل على إشعارات فورية برنة مميزة عند إعلان أي حفلة، كورس أو فاعلية جديدة قبل اكتمال العدد.'
                  : 'Get instant phone alerts with luxury chimes when new parties and courses are announced.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Benefits Badges */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[11px] text-amber-300/90 font-medium">
          <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
            <Smartphone className="h-3 w-3 text-amber-400" />
            <span>{lang === 'ar' ? 'تنبيه شاشة القفل' : 'Lock Screen Alerts'}</span>
          </span>
          <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-300">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>{lang === 'ar' ? 'مجاني وبدون إزعاج' : '100% Free'}</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleEnable}
            disabled={isSubscribing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <BellRing className="h-4 w-4 stroke-[2.5]" />
            <span>
              {isSubscribing
                ? (lang === 'ar' ? 'جاري تفعيل الإذن...' : 'Enabling...')
                : (lang === 'ar' ? 'سماح بالإشعارات الفورية ✓' : 'Allow Push Alerts ✓')}
            </span>
          </button>
          <button
            onClick={handleDismiss}
            className="py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            {lang === 'ar' ? 'لاحقاً' : 'Later'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
