import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceCategory, DanceEvent, DanceStyle, ALL_DANCE_STYLES, getStyleLabel } from '../../types';
import { EventCard } from '../events/EventCard';
import { WeeklyPromoBanner } from '../events/WeeklyPromoBanner';
import { Sparkles, Music, GraduationCap, Palmtree, PlusCircle, Filter, Search, Clock, CheckCircle, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, X, Crown, Gift, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logAnalyticsEvent } from '../../lib/firebase';

interface HomeFeedProps {
  onOpenMap: (event: DanceEvent) => void;
  onOpenShare: (event: DanceEvent) => void;
  onOpenCreate: () => void;
  onOpenInstallModal?: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ onOpenMap, onOpenShare, onOpenCreate, onOpenInstallModal }) => {
  const { lang, activeTab, selectedCategory, setSelectedCategory, activeEvents, user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showWhyBookModal, setShowWhyBookModal] = useState(false);

  // Reset pagination when category, search, or style filter changes
  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory, searchQuery, selectedStyleFilter]);

  // Back to Top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      // Show back to top roughly after scrolling past 4-5 events (~2500px)
      if (window.scrollY > 2500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find weekly featured promo event
  const weeklyPromoEvent = activeEvents.find(ev => ev.isWeeklyPromo);

  // Filter events
  const filteredEvents = activeEvents.filter(ev => {
    // Exclude the weekly promo event if it is already displayed in the main banner at the top
    const isPromoBannerVisible = weeklyPromoEvent && selectedCategory === 'all' && !searchQuery && selectedStyleFilter === 'all';
    if (isPromoBannerVisible && ev.id === weeklyPromoEvent.id) {
      return false;
    }

    // Category check
    if (selectedCategory !== 'all' && ev.category !== selectedCategory) {
      return false;
    }
    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.titleAr.toLowerCase().includes(q) || ev.titleEn.toLowerCase().includes(q);
      const matchDesc = ev.descriptionAr.toLowerCase().includes(q) || ev.descriptionEn.toLowerCase().includes(q);
      const matchLoc = ev.location.nameAr.toLowerCase().includes(q) || ev.location.nameEn.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }
    // Style filter check
    if (selectedStyleFilter !== 'all' && !ev.styles.includes(selectedStyleFilter as DanceStyle)) {
      return false;
    }
    return true;
  });

  const categories: { id: DanceCategory; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'all', labelAr: 'الكل (All)', labelEn: 'All Events', icon: Sparkles },
    { id: 'party', labelAr: '🎉 الحفلات (Parties)', labelEn: '🎉 Parties', icon: Music },
    { id: 'course', labelAr: '🎓 الكورسات (Courses)', labelEn: '🎓 Masterclasses', icon: GraduationCap },
    { id: 'trip', labelAr: '🌴 الرحلات (Trips)', labelEn: '🌴 Retreats', icon: Palmtree }
  ];

  const styleChips: string[] = ['all', ...ALL_DANCE_STYLES];

  return (
    <div className="space-y-6 pb-16">
      {/* Hero Header & Search Bar */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {lang === 'ar' ? 'اكتشف فعاليات و حفلات' : 'Discover Events & Parties'}
            </h2>
            <h3 className="text-xl sm:text-2xl font-black text-amber-400 mt-1 leading-tight">
              {lang === 'ar' ? 'اللاتينى | الشرقى | الغربي| متنوعات' : 'Latin | Oriental | Western | Variety'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 font-medium leading-relaxed">
              {lang === 'ar' ? 'سالسا بتشاتا كيزومبا تانجو بول روم  شرقى غربى كريوكى متنوعات فى ارقى الاماكن و المنتجعات' : 'Salsa, Bachata, Kizomba, Tango, Ballroom, Oriental, Western, Karaoke, Variety in the finest venues & resorts'}
            </p>
          </div>

          <button
            onClick={onOpenCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 text-xs sm:text-sm font-bold text-neutral-950 shadow-xl transition-colors shrink-0"
          >
            <PlusCircle className="h-4 w-4 stroke-[2.5]" />
            <span>{lang === 'ar' ? 'إضافة إعلان' : 'Post Ad'}</span>
          </button>
        </div>

        {/* Search Bar & Style Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute top-3.5 left-4 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن حفلة، كورس، موقع، أو اسم مدرب...' : 'Search for party, course, venue, or instructor...'}
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 py-3 pl-11 pr-4 text-xs sm:text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-3 right-4 text-xs text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Style Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-mono text-neutral-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-amber-400" />
              <span>{lang === 'ar' ? 'التصنيف بحسب الرقصة:' : 'Style filter:'}</span>
            </span>
            {styleChips.map(style => (
              <button
                key={style}
                onClick={() => {
                  setSelectedStyleFilter(style);
                  if (style !== 'all') {
                    // Normalize the name to make it simple/safe for database fields
                    const normalized = style.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                    logAnalyticsEvent(`style_${normalized}`);
                  }
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                  selectedStyleFilter === style
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {style === 'all' ? (lang === 'ar' ? 'كل الأنماط' : 'All Styles') : `#${getStyleLabel(style, lang)}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count = activeEvents.filter(ev => cat.id === 'all' || ev.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                logAnalyticsEvent(`category_${cat.id}`);
              }}
              className={`flex items-center justify-between p-4 rounded-3xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-neutral-900 border-amber-500/50 text-white shadow-xl gold-glow'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${isSelected ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs sm:text-sm font-bold truncate">
                  {lang === 'ar' ? cat.labelAr : cat.labelEn}
                </span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Why Book Banner */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowWhyBookModal(true)}
        className="relative mb-8 rounded-2xl p-[1.5px] cursor-pointer group overflow-hidden shadow-xl shadow-red-900/10"
      >
        {/* Continuous spinning gradient effect */}
        <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] opacity-80 group-hover:opacity-100 transition-opacity duration-500 blur-[2px]"
             style={{
               background: 'conic-gradient(from 0deg, #ef4444, #f59e0b, #8b5cf6, #ec4899, #ef4444)'
             }} 
        />
        
        {/* Inner Content */}
        <div className="relative flex items-center justify-between bg-neutral-950/95 backdrop-blur-md rounded-[14px] px-5 py-4 w-full h-full">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-red-500 animate-pulse" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-red-500 font-black text-sm sm:text-base tracking-wide drop-shadow-md bg-[length:200%_auto] animate-[pulse_3s_ease-in-out_infinite]">
              {lang === 'ar' ? 'ليه تحجز من خلال التطبيق؟' : 'Why book through the app?'}
            </span>
          </div>
          
          <motion.div 
            animate={{ x: lang === 'ar' ? [-5, 0, -5] : [5, 0, 5] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="flex items-center gap-1.5 bg-red-500/10 rounded-full px-3 py-1.5 border border-red-500/30"
          >
            <span className="text-[10px] font-bold text-red-400 hidden sm:block uppercase tracking-wider">
              {lang === 'ar' ? 'اكتشف' : 'Discover'}
            </span>
            {lang === 'ar' ? <ArrowLeft className="h-4 w-4 text-red-400" /> : <ArrowRight className="h-4 w-4 text-red-400" />}
          </motion.div>
        </div>
      </motion.div>

      {/* Weekly Featured Video Promo (Show on Explore tab when no filter is applied or when all is selected) */}
      {weeklyPromoEvent && selectedCategory === 'all' && !searchQuery && selectedStyleFilter === 'all' && (
        <WeeklyPromoBanner
          promoEvent={weeklyPromoEvent}
          onOpenMap={onOpenMap}
          onOpenShare={onOpenShare}
        />
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-amber-400">
            {selectedCategory === 'all'
              ? (lang === 'ar' ? 'أحدث الإعلانات والفعاليات اللاتينية' : 'Latest Latin Announcements')
              : categories.find(c => c.id === selectedCategory)?.[lang === 'ar' ? 'labelAr' : 'labelEn']}
          </h3>
          <span className="rounded-full bg-neutral-800 px-3 py-0.5 text-xs font-mono font-bold text-amber-400 border border-neutral-700">
            {filteredEvents.length} {lang === 'ar' ? 'إعلان' : 'events'}
          </span>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <Music className="h-12 w-12 mx-auto text-neutral-600 mb-3" />
          <h4 className="text-lg font-bold text-white mb-1">
            {lang === 'ar' ? 'لا توجد فعاليات مطابقة لبحثك' : 'No matching events found'}
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-6">
            {lang === 'ar'
              ? 'جرب تغيير خيارات التصفية أو أنماط الرقص، أو كن أول من يضيف إعلاناً جديداً اليوم!'
              : 'Try resetting style filters or search terms, or post a new announcement today!'}
          </p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setSelectedStyleFilter('all'); }}
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-3 text-xs font-bold text-white hover:bg-neutral-700"
          >
            {lang === 'ar' ? 'إعادة ضبط عوامل التصفية' : 'Reset All Filters'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredEvents.slice(0, visibleCount).map((ev, idx) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  index={idx}
                  overrideAdType={idx < 6 ? 'vip' : 'standard'}
                  onOpenMap={onOpenMap}
                  onOpenShare={onOpenShare}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {filteredEvents.length > visibleCount && (
            <div className="flex justify-center pt-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setVisibleCount(prev => prev + 6)}
                className="flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-amber-400 px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-md cursor-pointer"
              >
                <ChevronDown className="h-4 w-4 text-amber-500 animate-bounce" />
                <span>{lang === 'ar' ? 'المزيد من الإعلانات' : 'Load More Ads'}</span>
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-pink-600 to-indigo-500 text-white shadow-2xl shadow-pink-500/30 border border-pink-400/50 hover:opacity-90 transition-all cursor-pointer focus:outline-none"
            title={lang === 'ar' ? 'العودة إلى الأعلى' : 'Back to Top'}
          >
            <ArrowUp className="h-5 w-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Why Book Modal */}
      <AnimatePresence>
        {showWhyBookModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-6 text-neutral-100">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWhyBookModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-amber-500" />
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                      <Sparkles className="h-5 w-5 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {lang === 'ar' ? 'مميزات الحجز' : 'Booking Benefits'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowWhyBookModal(false)}
                    className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 bg-neutral-950/50 p-4 rounded-2xl border border-neutral-800/50">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mt-1">
                      <Gift className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-400 mb-1">
                        {lang === 'ar' ? 'خصومات خاصة' : 'Special Discounts'}
                      </h4>
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        {lang === 'ar' 
                          ? 'الاستفادة من خصومات خاصة عن الأسعار الرسمية.'
                          : 'Enjoy special discounts off the official prices.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-neutral-950/50 p-4 rounded-2xl border border-neutral-800/50">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 mt-1">
                      <Crown className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-400 mb-1">
                        {lang === 'ar' ? 'دعوات لحفلات VIP' : 'VIP Event Invites'}
                      </h4>
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        {lang === 'ar'
                          ? 'عند ملاحظة تفاعلك مع التطبيق والحجز من خلاله ومشاركة الإعلانات تتلقى دعوات لحضور بعض الحفلات بخصومات قد تصل الى 100% وامتيازات تكون فى فئة المستخدمين المميزين جدا أو الـ VIP.'
                          : 'By engaging with the app, booking, and sharing, you may receive invitations to parties with up to 100% discounts and exclusive VIP privileges.'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowWhyBookModal(false)}
                  className="mt-6 w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all"
                >
                  {lang === 'ar' ? 'فهمت، شكراً' : 'Got it, Thanks'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
