import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bell, BellRing, CheckCircle, Trash2, Calendar, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatRelativeTime } from '../../utils/dateUtils';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { lang, notifications, markAllNotificationsAsRead, pushEnabled, togglePushNotifications } = useApp();

  if (!isOpen) return null;

  const typeIcons = {
    new_party: { icon: Sparkles, color: 'text-purple-400 bg-purple-500/10' },
    course_alert: { icon: Calendar, color: 'text-blue-400 bg-blue-500/10' },
    trip: { icon: Sparkles, color: 'text-emerald-400 bg-emerald-500/10' },
    expiry_warning: { icon: Bell, color: 'text-amber-400 bg-amber-500/10' },
    system: { icon: BellRing, color: 'text-neutral-300 bg-neutral-800' }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl gold-glow max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-950 p-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                <BellRing className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {lang === 'ar' ? 'إشعارات الحفلات والرحلات' : 'Dance Notifications'}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  {lang === 'ar' ? 'تنبيهات الفعاليات اللاتينية الفورية' : 'Instant Latin Event Alerts'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsAsRead}
                className="flex items-center gap-1 rounded-xl bg-neutral-800 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-300 hover:bg-neutral-700 transition-colors"
                title={lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
              >
                <CheckCircle className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'قراءة الكل' : 'Mark Read'}</span>
              </button>

              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Push Notification Permission Toggle Bar */}
          <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-3.5 px-5 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 text-xs">
              <Bell className="h-4 w-4 text-amber-400" />
              <span className="text-neutral-200 font-semibold">
                {lang === 'ar' ? 'إشعارات الهاتف الفورية (Push Alerts)' : 'Instant Mobile Push Alerts'}
              </span>
            </div>

            <button
              onClick={togglePushNotifications}
              className={`rounded-full px-3 py-1 text-[11px] font-bold font-mono transition-all ${
                pushEnabled
                  ? 'bg-amber-500 text-neutral-950 shadow-md gold-glow'
                  : 'bg-neutral-800 text-neutral-400 border border-white/10'
              }`}
            >
              {pushEnabled ? (lang === 'ar' ? '✓ مفعل' : '✓ ON') : (lang === 'ar' ? 'تفعيل' : 'Turn ON')}
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto p-4 space-y-3 flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{lang === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}</p>
              </div>
            ) : (
              notifications.map(notif => {
                const iconConf = typeIcons[notif.type] || typeIcons.system;
                const Icon = iconConf.icon;

                return (
                  <div
                    key={notif.id}
                    className={`flex gap-3.5 rounded-2xl p-4 border transition-all ${
                      !notif.read
                        ? 'bg-neutral-800/90 border-amber-500/30 shadow-md'
                        : 'bg-neutral-950/60 border-white/5 opacity-70'
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${iconConf.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                          {lang === 'ar' ? notif.titleAr : notif.titleEn}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          {formatRelativeTime(notif.date, lang)}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {lang === 'ar' ? notif.messageAr : notif.messageEn}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Notice */}
          <div className="p-3 bg-neutral-950 text-center text-[11px] font-mono text-neutral-500 border-t border-white/10 shrink-0">
            {lang === 'ar'
              ? 'يتم إرسال إشعارات تلقائية عند إضافة حفلات وكورسات جديدة'
              : 'Automated alerts sent when new salsa nights & bootcamps launch'}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
