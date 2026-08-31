import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BellRing, X, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem } from '../../types';

interface FloatingNotificationBannerProps {
  notification: NotificationItem | null;
  onClose: () => void;
  onOpenNotification?: (notif: NotificationItem) => void;
}

export const FloatingNotificationBanner: React.FC<FloatingNotificationBannerProps> = ({
  notification,
  onClose,
  onOpenNotification
}) => {
  const { lang } = useApp();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const duration = 6500; // 6.5 seconds auto dismiss
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isAr = lang === 'ar';
  const title = isAr ? notification.titleAr : (notification.titleEn || notification.titleAr);
  const message = isAr ? notification.messageAr : (notification.messageEn || notification.messageAr);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -70, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="fixed top-3 inset-x-3 sm:inset-x-auto sm:end-6 z-[120] max-w-md w-auto rounded-2xl sm:rounded-3xl border-2 border-amber-500/50 bg-neutral-950/95 backdrop-blur-2xl p-3.5 sm:p-4 shadow-2xl shadow-amber-500/25 text-white overflow-hidden"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Progress bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start gap-3 mt-1">
          {/* Notification Icon */}
          <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <BellRing className="h-5 w-5 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {isAr ? 'إشعار فوري جديد' : 'Live Alert'}
              </span>
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-snug line-clamp-1">
              {title}
            </h4>
            <p className="text-[11px] sm:text-xs text-neutral-300 line-clamp-2 mt-0.5 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-2.5 flex items-center justify-end gap-2 pt-2 border-t border-neutral-900">
          <button
            onClick={() => {
              if (onOpenNotification) onOpenNotification(notification);
              onClose();
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <span>{isAr ? 'فتح التفاصيل' : 'View Details'}</span>
            <ExternalLink className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
