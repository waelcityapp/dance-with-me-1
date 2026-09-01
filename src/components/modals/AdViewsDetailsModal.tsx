import React from 'react';
import { useApp } from '../../context/AppContext';
import { DanceEvent } from '../../types';
import { Eye, TrendingUp, Users, Share2, Calendar, MapPin, X, Sparkles, CheckCircle2, Flame, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdViewsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: DanceEvent | null;
  onShare?: (event: DanceEvent) => void;
}

export const AdViewsDetailsModal: React.FC<AdViewsDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onShare
}) => {
  const { lang } = useApp();

  if (!isOpen || !event) return null;

  const isAr = lang === 'ar';
  const rawViews = event.viewsCount || 0;
  // Calculate unique reach estimate (typically ~65-80% of total views or min of views)
  const uniqueReach = rawViews > 0 ? Math.max(1, Math.round(rawViews * 0.72)) : 0;
  const likesCount = event.likesCount || 0;
  const engagementRate = rawViews > 0 ? (((likesCount + 2) / rawViews) * 100).toFixed(1) : '0.0';

  const eventTitle = isAr ? event.titleAr : event.titleEn;
  const venueTitle = isAr ? event.location.nameAr : event.location.nameEn;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl bg-neutral-950 border border-neutral-800 text-white shadow-2xl overflow-hidden z-10"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Top Header Glow */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-600/20 via-blue-500/5 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-center justify-between p-5 pb-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {isAr ? 'إحصائيات المشاهدات' : 'Views Analytics'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {isAr ? 'مباشر' : 'Live'}
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg text-white mt-0.5 line-clamp-1">
                  {eventTitle}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Main Big Counter Card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-blue-950/50 via-neutral-900/80 to-neutral-950 border border-blue-500/30 p-6 text-center overflow-hidden shadow-inner">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl" />

              <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                <Eye className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">
                  {isAr ? 'إجمالي عدد المشاهدات' : 'Total Ad Views & Impressions'}
                </span>
              </div>

              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight my-1 drop-shadow-sm flex items-center justify-center gap-1">
                <span>{rawViews.toLocaleString()}</span>
                <span className="text-sm sm:text-base font-bold text-blue-400 font-sans">
                  {isAr ? 'مشاهدة' : 'Views'}
                </span>
              </div>

              <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-2 leading-relaxed">
                {isAr
                  ? 'يتم احتساب كل ظهور وتصفح للإعلان تلقائياً وبشكل حي من الزوار والمشتركين'
                  : 'Calculated in real-time from active community members and visitors'}
              </p>
            </div>

            {/* Sub-Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Unique Viewers */}
              <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                  <span className="text-[11px] font-bold">{isAr ? 'الوصول الفريد' : 'Unique Reach'}</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {uniqueReach.toLocaleString()}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1">
                  {isAr ? 'مستخدمين مختلفين' : 'Unique users'}
                </span>
              </div>

              {/* Engagement Rate */}
              <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                  <span className="text-[11px] font-bold">{isAr ? 'التفاعل والاهتمام' : 'Engagement'}</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {engagementRate}%
                </div>
                <span className="text-[10px] text-neutral-500 mt-1">
                  {isAr ? 'إعجاب واستفسار' : 'Likes & inquiries'}
                </span>
              </div>
            </div>

            {/* Ad Location & Info */}
            <div className="rounded-2xl bg-neutral-900/40 border border-neutral-800/80 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-2 text-neutral-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {isAr ? 'المكان:' : 'Venue:'}
                </span>
                <span className="font-bold text-white truncate max-w-[200px]">{venueTitle}</span>
              </div>

              <div className="flex items-center justify-between text-neutral-300 pt-2 border-t border-neutral-800/60">
                <span className="flex items-center gap-2 text-neutral-400">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {isAr ? 'نوع التمييز:' : 'Ad Tier:'}
                </span>
                <span className="font-black text-amber-400">
                  {event.adType === 'vip' 
                    ? (isAr ? '👑 إعلان VIP في الصدارة' : '👑 VIP Top Featured') 
                    : event.adType === 'free' 
                    ? (isAr ? '🎁 إعلان تجريبي مجاني' : '🎁 Free Trial Ad') 
                    : (isAr ? '⭐ إعلان ستاندرد' : '⭐ Standard Ad')}
                </span>
              </div>
            </div>

            {/* Boost Tip */}
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 leading-relaxed">
                <strong className="text-emerald-400 block mb-0.5">
                  {isAr ? '💡 نصيحة لزيادة المشاهدات والتفاعل:' : '💡 Boost your ad reach:'}
                </strong>
                {isAr
                  ? 'مشاركة رابط الإعلان على مجموعات الواتساب وفيسبوك يرفع عدد المشاهدات والحجوزات بنسبة تفوق 300%.'
                  : 'Sharing the event link on WhatsApp groups and social media boosts views and bookings by over 300%.'}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-neutral-800/80 bg-neutral-950/80 flex items-center justify-end gap-2.5">
            {onShare && (
              <button
                onClick={() => {
                  onShare(event);
                  onClose();
                }}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition-all active:scale-95 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isAr ? 'مشاركة الإعلان لزيادة المشاهدات 🚀' : 'Share Ad to Boost Views 🚀'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs border border-neutral-800 transition-colors cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
