import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bell, BellRing, CheckCircle, Sparkles, Calendar, BookOpen, Volume2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatRelativeTime } from '../../utils/dateUtils';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { lang, notifications, markAllNotificationsAsRead, pushEnabled, togglePushNotifications, user } = useApp();
  
  const visibleNotifications = notifications.filter(n => !n.userId || n.userId === user?.id);

  if (!isOpen) return null;

  const typeIcons = {
    new_party: { icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    course_alert: { icon: BookOpen, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    trip: { icon: Sparkles, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    expiry_warning: { icon: Bell, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    system: { icon: Info, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
  };

  const isRtl = lang === 'ar';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-900/95 backdrop-blur-2xl shadow-2xl gold-glow max-h-[80vh] flex flex-col z-10"
        >
          {/* Top Decorative bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 shrink-0" />

          {/* Header */}
          <div className={`flex items-center justify-between border-b border-white/5 bg-neutral-950/40 p-5 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3.5 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <BellRing className="h-5 w-5 animate-pulse-slow text-amber-400" />
                {visibleNotifications.some(n => !n.read) && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 rounded-full bg-amber-500 ring-4 ring-neutral-900" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base tracking-tight">
                  {lang === 'ar' ? 'تنبيهات مجتمع الرقص الفورية' : 'Dance Alerts & News'}
                </h3>
                <p className="text-[11px] text-neutral-400 font-medium">
                  {lang === 'ar' ? 'أحدث أخبار الحفلات، الكورسات والرحلات' : 'Instant updates on parties, bootcamps & trips'}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {visibleNotifications.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#262626' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={markAllNotificationsAsRead}
                  className={`flex items-center gap-1.5 rounded-xl bg-neutral-900 border border-white/5 px-3 py-2 text-xs font-bold text-neutral-300 transition-all`}
                  title={lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                >
                  <CheckCircle className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'قراءة الكل' : 'Mark Read'}</span>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#ef4444', color: '#ffffff' }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 transition-all border border-white/5"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Push Notification Toggle Box */}
          <div className={`bg-neutral-950/80 p-4 px-5 border-b border-white/5 flex items-center justify-between gap-4 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 text-xs ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <span className="text-neutral-100 font-bold block">
                  {lang === 'ar' ? 'إشعارات الهاتف الفورية' : 'Instant Push Alerts'}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {lang === 'ar' ? 'تصلك تنبيهات حتى لو التطبيق مغلق' : 'Get notified even when the app is closed'}
                </span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={togglePushNotifications}
              className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition-all border shrink-0 ${
                pushEnabled
                  ? 'bg-amber-500 text-neutral-950 border-amber-400/40 shadow-lg gold-glow font-bold'
                  : 'bg-neutral-900 text-neutral-400 border-white/5 hover:border-white/10'
              }`}
            >
              {pushEnabled ? (lang === 'ar' ? '✓ مفعلة' : '✓ ON') : (lang === 'ar' ? 'تفعيل الآن' : 'Enable')}
            </motion.button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto p-5 space-y-3.5 flex-1 custom-scrollbar">
            {visibleNotifications.length === 0 ? (
              <div className="py-16 text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-950 border border-white/5 text-neutral-500">
                    <Bell className="h-7 w-7 opacity-50" />
                  </div>
                </div>
                <h4 className="text-white font-extrabold text-sm mb-1">
                  {lang === 'ar' ? 'صندوق الوارد فارغ' : 'Inbox is Clean'}
                </h4>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  {lang === 'ar' ? 'لا توجد إشعارات أو تنبيهات نشطة حالياً. بمجرد توفر حفل جديد ستظهر هنا فوراً!' : 'No active alerts at the moment. As soon as a new social is posted, you will see it here.'}
                </p>
              </div>
            ) : (
              visibleNotifications.map(notif => {
                const iconConf = typeIcons[notif.type] || typeIcons.system;
                const Icon = iconConf.icon;
                const isUnread = !notif.read;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={notif.id}
                    className={`relative flex gap-4 rounded-2xl p-4 border transition-all ${
                      isUnread
                        ? 'bg-neutral-800/90 border-amber-500/30 shadow-lg gold-glow-sm'
                        : 'bg-neutral-950/40 border-white/5 opacity-75'
                    }`}
                  >
                    {/* Visual left/right accent indicator for unread messages */}
                    {isUnread && (
                      <span className={`absolute top-0 bottom-0 w-1 bg-amber-500 rounded-full my-3 ${isRtl ? 'right-0' : 'left-0'}`} />
                    )}

                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 ${iconConf.color} ${isRtl ? 'mr-1' : 'ml-1'}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className={`flex-1 overflow-hidden ${isRtl ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-start justify-between gap-3 mb-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h4 className="font-extrabold text-xs sm:text-sm text-neutral-100 tracking-tight leading-snug">
                          {lang === 'ar' ? notif.titleAr : notif.titleEn}
                        </h4>
                        <span className="text-[9px] font-bold font-mono text-neutral-400 bg-neutral-900/60 border border-white/5 px-2 py-0.5 rounded-full shrink-0">
                          {formatRelativeTime(notif.date, lang)}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                        {lang === 'ar' ? notif.messageAr : notif.messageEn}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Notice */}
          <div className="p-3.5 bg-neutral-950/90 text-center text-[10px] font-bold text-neutral-500 border-t border-white/5 shrink-0">
            {lang === 'ar'
              ? '📢 يتم تحديث البيانات فورياً فور النشر والموافقة على الإعلانات'
              : '📢 Alerts are delivered instantly upon event posting and admin approval'}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

