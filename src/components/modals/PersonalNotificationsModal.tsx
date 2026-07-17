import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bell, BellRing, FilePlus, Ticket, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { markAdSubmissionsAsRead, markBookingsAsRead, markSupportMessagesAsRead } from '../../lib/firebase';

interface PersonalNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalNotificationsModal: React.FC<PersonalNotificationsModalProps> = ({ isOpen, onClose }) => {
  const { lang, user, userAdSubmissions, bookings, supportMessages, setActiveTab } = useApp();

  if (!isOpen) return null;

  const unreadAdsCount = userAdSubmissions?.filter(s => (s.status === 'approved' || s.status === 'rejected') && s.userRead === false).length || 0;
  const unreadBookingsCount = bookings?.filter(b => (b.status === 'approved' || b.status === 'rejected') && b.userRead === false).length || 0;
  const unreadMessagesCount = supportMessages?.filter(m => m.status === 'replied' && m.userRead === false).length || 0;

  const totalUnreadCount = unreadAdsCount + unreadBookingsCount + unreadMessagesCount;

  const handleNotifClick = async (type: 'ads' | 'bookings' | 'messages') => {
    onClose();
    setActiveTab('profile');
    if (!user) return;
    
    if (type === 'ads') {
      await markAdSubmissionsAsRead(user.id);
      window.dispatchEvent(new CustomEvent('NAVIGATE_PROFILE_SECTION', { detail: 'ads' }));
    } else if (type === 'bookings') {
      await markBookingsAsRead(user.id);
      window.dispatchEvent(new CustomEvent('NAVIGATE_PROFILE_SECTION', { detail: 'booked' }));
    } else if (type === 'messages') {
      await markSupportMessagesAsRead(user.id);
      window.dispatchEvent(new CustomEvent('NAVIGATE_PROFILE_SECTION', { detail: 'support' }));
    }
  };

  const isRtl = lang === 'ar';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
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
          className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border-2 border-indigo-500/30 bg-neutral-900/95 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10 max-h-[80vh] flex flex-col z-10"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Top Decorative bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 shrink-0" />

          {/* Header */}
          <div className={`flex items-center justify-between border-b border-white/5 bg-neutral-950/40 p-5 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3.5 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BellRing className="h-5 w-5 animate-pulse-slow text-indigo-400" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 rounded-full bg-indigo-500 ring-4 ring-neutral-900" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base tracking-tight">
                  {lang === 'ar' ? 'صندوق تنبيهاتك الشخصي' : 'My Personal Alerts'}
                </h3>
                <p className="text-[11px] text-neutral-400 font-medium">
                  {lang === 'ar' ? 'تحديثات الحجوزات، الإعلانات والدعم الفني' : 'Updates on your bookings, ads & support'}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#ef4444', color: '#ffffff' }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 transition-all border border-white/5 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* List */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {totalUnreadCount === 0 ? (
              <div className="py-16 text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-950 border border-white/5 text-neutral-500">
                    <Bell className="h-7 w-7 opacity-50 text-indigo-400" />
                  </div>
                </div>
                <h4 className="text-white font-extrabold text-sm mb-1">
                  {lang === 'ar' ? 'لا توجد تنبيهات معلقة' : 'No Pending Alerts'}
                </h4>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  {lang === 'ar' ? 'كل إشعاراتك الشخصية مقروءة ومحدثة! عند وجود رد أو تحديث لحجوزاتك ستظهر هنا.' : 'All your personal alerts are read and up to date! Future ticket approvals or replies will appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {unreadAdsCount > 0 && (
                  <motion.button 
                    whileHover={{ scale: 1.01, x: isRtl ? -2 : 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleNotifClick('ads')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-950/40 border border-indigo-500/15 hover:border-indigo-500/30 hover:bg-neutral-900/60 transition-all shadow-md group cursor-pointer text-right"
                  >
                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <FilePlus className="h-5 w-5" />
                      </div>
                      <div className={isRtl ? 'text-right' : 'text-left'}>
                        <span className="text-sm font-extrabold text-neutral-100 block group-hover:text-amber-400 transition-colors">
                          {lang === 'ar' ? 'تحديثات إعلاناتي VIP' : 'My VIP Ads Updates'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {lang === 'ar' ? 'تنبيهات حالة النشر والموافقة' : 'Ad approval & publication status'}
                        </span>
                      </div>
                    </div>
                    <span className="h-7 min-w-[28px] px-2 rounded-lg bg-emerald-500 text-neutral-950 flex items-center justify-center text-xs font-black shadow-lg shadow-emerald-500/20">
                      {unreadAdsCount}
                    </span>
                  </motion.button>
                )}

                {unreadBookingsCount > 0 && (
                  <motion.button 
                    whileHover={{ scale: 1.01, x: isRtl ? -2 : 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleNotifClick('bookings')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-950/40 border border-indigo-500/15 hover:border-indigo-500/30 hover:bg-neutral-900/60 transition-all shadow-md group cursor-pointer text-right"
                  >
                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div className={isRtl ? 'text-right' : 'text-left'}>
                        <span className="text-sm font-extrabold text-neutral-100 block group-hover:text-amber-400 transition-colors">
                          {lang === 'ar' ? 'تحديثات حجوزاتي وتذاكري' : 'My Bookings & Tickets'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {lang === 'ar' ? 'تأكيد الحجز وتذاكر الدخول' : 'Booking confirmation and QR tickets'}
                        </span>
                      </div>
                    </div>
                    <span className="h-7 min-w-[28px] px-2 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">
                      {unreadBookingsCount}
                    </span>
                  </motion.button>
                )}

                {unreadMessagesCount > 0 && (
                  <motion.button 
                    whileHover={{ scale: 1.01, x: isRtl ? -2 : 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleNotifClick('messages')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-950/40 border border-indigo-500/15 hover:border-indigo-500/30 hover:bg-neutral-900/60 transition-all shadow-md group cursor-pointer text-right"
                  >
                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className={isRtl ? 'text-right' : 'text-left'}>
                        <span className="text-sm font-extrabold text-neutral-100 block group-hover:text-amber-400 transition-colors">
                          {lang === 'ar' ? 'ردود الدعم الفني' : 'Support Replies'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {lang === 'ar' ? 'إجابات على استفساراتك المعلقة' : 'Answers to your pending queries'}
                        </span>
                      </div>
                    </div>
                    <span className="h-7 min-w-[28px] px-2 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center text-xs font-black shadow-lg shadow-amber-500/20">
                      {unreadMessagesCount}
                    </span>
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 bg-neutral-950/90 text-center text-[10px] font-bold text-neutral-500 border-t border-white/5 shrink-0">
            {lang === 'ar'
              ? '🔒 تنبيهات خاصة بحسابك فقط ومحفوظة بشكل آمن بالكامل'
              : '🔒 Alerts private to your account only and fully secured'}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
