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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl gold-glow max-h-[85vh] flex flex-col"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-950 p-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                <BellRing className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {lang === 'ar' ? 'إشعاراتك الشخصية' : 'Personal Alerts'}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  {lang === 'ar' ? 'تحديثات الحجوزات، الإعلانات والدعم' : 'Booking, Ads, and Support Updates'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {totalUnreadCount === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{lang === 'ar' ? 'لا توجد إشعارات شخصية حالياً' : 'No personal notifications yet'}</p>
              </div>
            ) : (
              <>
                {unreadAdsCount > 0 && (
                  <button 
                    onClick={() => handleNotifClick('ads')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-800/90 border border-emerald-500/30 hover:bg-neutral-800 transition-colors shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                        <FilePlus className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-white">
                        {lang === 'ar' ? 'تحديثات إعلاناتي VIP' : 'My VIP Ads Updates'}
                      </span>
                    </div>
                    <span className="h-8 min-w-[32px] px-3 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center text-sm font-black shadow-lg">
                      {unreadAdsCount}
                    </span>
                  </button>
                )}
                {unreadBookingsCount > 0 && (
                  <button 
                    onClick={() => handleNotifClick('bookings')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-800/90 border border-blue-500/30 hover:bg-neutral-800 transition-colors shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                        <Ticket className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-white">
                        {lang === 'ar' ? 'تحديثات حجوزاتي وتذاكري' : 'My Bookings & Tickets'}
                      </span>
                    </div>
                    <span className="h-8 min-w-[32px] px-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-black shadow-lg">
                      {unreadBookingsCount}
                    </span>
                  </button>
                )}
                {unreadMessagesCount > 0 && (
                  <button 
                    onClick={() => handleNotifClick('messages')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-800/90 border border-amber-500/30 hover:bg-neutral-800 transition-colors shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-white">
                        {lang === 'ar' ? 'ردود الدعم الفني' : 'Support Replies'}
                      </span>
                    </div>
                    <span className="h-8 min-w-[32px] px-3 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center text-sm font-black shadow-lg">
                      {unreadMessagesCount}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
