import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceCategory, DanceEvent, DanceStyle, ALL_DANCE_STYLES, getStyleLabel } from '../../types';
import { EventCard } from '../events/EventCard';
import { WeeklyPromoBanner } from '../events/WeeklyPromoBanner';
import { Sparkles, Music, GraduationCap, Palmtree, Building2, PlusCircle, Filter, Search, Clock, CheckCircle, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, X, Crown, Gift, Star, ArrowLeft, ArrowRight, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logAnalyticsEvent } from '../../lib/firebase';

interface HomeFeedProps {
  onOpenMap: (event: DanceEvent) => void;
  onOpenShare: (event: DanceEvent) => void;
  onOpenCreate: (initialType?: 'vip' | 'standard' | 'free') => void;
  onOpenInstallModal?: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ onOpenMap, onOpenShare, onOpenCreate, onOpenInstallModal }) => {
  const { lang, activeTab, selectedCategory, setSelectedCategory, activeEvents, user, isLoadingEvents, loadingEventsError } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(5);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showWhyBookModal, setShowWhyBookModal] = useState(false);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  // Reset pagination when category, search, or style filter changes
  useEffect(() => {
    setVisibleCount(5);
  }, [selectedCategory, searchQuery, selectedStyleFilter]);

  // Scroll instantly to specific event from URL if present
  useEffect(() => {
    if (activeEvents.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get('event');
      if (eventId) {
        const index = activeEvents.findIndex(ev => ev.id === eventId);
        if (index !== -1) {
          if (index >= visibleCount) {
            setVisibleCount(index + 5);
          }
          setHighlightedEventId(eventId);

          let attempts = 0;
          const scrollToTarget = () => {
            const el = document.getElementById(`event-${eventId}`);
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY - 100;
              window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            } else if (attempts < 15) {
              attempts++;
              requestAnimationFrame(scrollToTarget);
            }
          };
          scrollToTarget();

          const timer = setTimeout(() => {
            setHighlightedEventId(null);
          }, 4000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [activeEvents.length]);

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

  // Find weekly featured promo event (newest uploaded first to ensure the latest VIP ad is featured)
  const weeklyPromoEvent = useMemo(() => {
    // Unify: If an event has position === 1, it is the weekly promo
    const pos1 = activeEvents.find(ev => ev.position === 1);
    if (pos1) return pos1;
    
    // Fallback to legacy isWeeklyPromo flag
    const promos = activeEvents.filter(ev => ev.isWeeklyPromo);
    if (promos.length === 0) return undefined;
    return [...promos].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0];
  }, [activeEvents]);

  // Determine if banner is visible
  const promoBannerIsVisible = !!(weeklyPromoEvent && selectedCategory === 'all' && !searchQuery && selectedStyleFilter === 'all');

  // Filter events
  const filteredEvents = activeEvents.filter(ev => {
    // Exclude the weekly promo event if it is already displayed in the main banner at the top
    if (promoBannerIsVisible && ev.id === weeklyPromoEvent.id) {
      return false;
    }

    // Category check
    if (selectedCategory !== 'all' && ev.category !== selectedCategory) {
      return false;
    }
    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (ev.titleAr || '').toLowerCase().includes(q) || (ev.titleEn || '').toLowerCase().includes(q);
      const matchDesc = (ev.descriptionAr || '').toLowerCase().includes(q) || (ev.descriptionEn || '').toLowerCase().includes(q);
      const matchLoc = (ev.location?.nameAr || '').toLowerCase().includes(q) || (ev.location?.nameEn || '').toLowerCase().includes(q);
      const matchOrganizer = (ev.contact?.organizerName || '').toLowerCase().includes(q);
      const matchGov = (ev.location?.governorateAr || '').toLowerCase().includes(q) || (ev.location?.governorateEn || '').toLowerCase().includes(q);
      const matchArea = (ev.location?.areaAr || '').toLowerCase().includes(q) || (ev.location?.areaEn || '').toLowerCase().includes(q);
      const matchAddress = (ev.location?.addressAr || '').toLowerCase().includes(q) || (ev.location?.addressEn || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchOrganizer && !matchGov && !matchArea && !matchAddress) return false;
    }
    // Style filter check
    if (selectedStyleFilter !== 'all' && !ev.styles.includes(selectedStyleFilter as DanceStyle)) {
      return false;
    }
    return true;
  });

  const categories: { 
    id: DanceCategory; 
    labelAr: string; 
    labelEn: string; 
    icon: React.ElementType;
    activeBorder: string;
    activeShadow: string;
    activeBadge: string;
    iconColor: string;
    iconBg: string;
  }[] = [
    { 
      id: 'all', 
      labelAr: 'الكل', 
      labelEn: 'All', 
      icon: Sparkles,
      activeBorder: 'border-amber-500',
      activeShadow: 'shadow-lg shadow-amber-500/10 gold-glow',
      activeBadge: 'bg-amber-500 text-neutral-950',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/15'
    },
    { 
      id: 'party', 
      labelAr: 'الحفلات', 
      labelEn: 'Parties', 
      icon: Music,
      activeBorder: 'border-purple-500',
      activeShadow: 'shadow-lg shadow-purple-500/15',
      activeBadge: 'bg-purple-500 text-white',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15'
    },
    { 
      id: 'course', 
      labelAr: 'الكورسات', 
      labelEn: 'Courses', 
      icon: GraduationCap,
      activeBorder: 'border-sky-500',
      activeShadow: 'shadow-lg shadow-sky-500/15',
      activeBadge: 'bg-sky-500 text-white',
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/15'
    },
    { 
      id: 'trip', 
      labelAr: 'الرحلات', 
      labelEn: 'Trips', 
      icon: Palmtree,
      activeBorder: 'border-emerald-500',
      activeShadow: 'shadow-lg shadow-emerald-500/15',
      activeBadge: 'bg-emerald-500 text-neutral-950',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15'
    },
    { 
      id: 'exhibition', 
      labelAr: 'المعارض والمؤتمرات', 
      labelEn: 'Exhibitions & Conferences', 
      icon: Building2,
      activeBorder: 'border-rose-500',
      activeShadow: 'shadow-lg shadow-rose-500/15',
      activeBadge: 'bg-rose-500 text-white',
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/15'
    }
  ];

  const styleChips: string[] = ['all', ...ALL_DANCE_STYLES];

  return (
    <div className="space-y-6 pb-16">
      {/* Category Tabs (Clean Single-Language + Distinct Primary Icons) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {categories.map((cat, index) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count = activeEvents.filter(ev => cat.id === 'all' || ev.category === cat.id).length;
          const isLastOnMobile = index === categories.length - 1;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                logAnalyticsEvent(`category_${cat.id}`);
              }}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isLastOnMobile ? 'col-span-2 sm:col-span-1' : ''
              } ${
                isSelected
                  ? `bg-white dark:bg-neutral-900 ${cat.activeBorder} ${cat.activeShadow} text-neutral-950 dark:text-white shadow-md`
                  : 'bg-white/80 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-950 dark:hover:text-white shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl shrink-0 transition-colors ${
                  isSelected ? `${cat.activeBadge}` : `${cat.iconBg} ${cat.iconColor}`
                }`}>
                  <Icon className="h-4 w-4 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-bold truncate">
                  {lang === 'ar' ? cat.labelAr : cat.labelEn}
                </span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-bold shrink-0 transition-colors ${
                isSelected ? cat.activeBadge : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section Header & Prominent Search Bar (Moved directly under category tabs) */}
      <div id="search-section" className="rounded-3xl border-2 border-amber-500/40 bg-white/95 dark:bg-neutral-900/90 p-4 sm:p-5 shadow-xl dark:shadow-2xl backdrop-blur-md space-y-3.5 my-2 transition-colors">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h3 className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 animate-pulse shrink-0" />
              <span>{lang === 'ar' ? 'أحدث الإعلانات والفاعليات' : 'Latest Announcements & Events'}</span>
            </h3>
            {selectedCategory !== 'all' && (
              <span className="text-xs sm:text-sm font-black text-neutral-950 bg-white border border-white/90 shadow-md px-3.5 py-1 rounded-xl tracking-tight transition-transform transform active:scale-95 inline-flex items-center justify-center">
                {categories.find(c => c.id === selectedCategory)?.[lang === 'ar' ? 'labelAr' : 'labelEn']}
              </span>
            )}
          </div>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shadow-sm shrink-0">
            {isLoadingEvents ? '...' : filteredEvents.length} {lang === 'ar' ? 'إعلان' : 'events'}
          </span>
        </div>

        {/* Prominent Search Bar Input */}
        <div className="space-y-3">
          <div className="relative flex items-center bg-neutral-50 dark:bg-neutral-950 border-2 border-amber-500/60 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl px-3.5 py-1.5 shadow-md transition-all">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              placeholder={lang === 'ar' ? 'ابحث عن حفلة، كورس، موقع، منظم، محافظة، منطقة، أو اسم مدرب...' : 'Search for party, course, venue, organizer, governorate, area, instructor...'}
              className="w-full bg-transparent py-2 px-2.5 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="shrink-0 p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title={lang === 'ar' ? 'مسح البحث' : 'Clear search'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Style Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span>{lang === 'ar' ? 'التصنيف بحسب الرقصة:' : 'Style filter:'}</span>
            </span>
            {styleChips.map(style => (
              <button
                key={style}
                onClick={() => {
                  setSelectedStyleFilter(style);
                  if (style !== 'all') {
                    const normalized = style.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                    logAnalyticsEvent(`style_${normalized}`);
                  }
                }}
                className={`rounded-xl px-2.5 py-1 text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedStyleFilter === style
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                    : 'bg-white dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white shadow-xs'
                }`}
              >
                {style === 'all' ? (lang === 'ar' ? 'كل الأنماط' : 'All Styles') : `#${getStyleLabel(style, lang)}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Featured Video Promo (Show on Explore tab when no filter is applied or when all is selected) */}
      {weeklyPromoEvent && selectedCategory === 'all' && !searchQuery && selectedStyleFilter === 'all' && (
        <WeeklyPromoBanner
          promoEvent={weeklyPromoEvent}
          onOpenMap={onOpenMap}
          onOpenShare={onOpenShare}
        />
      )}

      {/* Events Grid */}
      {isLoadingEvents ? (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/50 p-12 text-center flex flex-col items-center justify-center shadow-md">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
          <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
            {lang === 'ar' ? 'جاري تحميل الفعاليات...' : 'Loading events...'}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {lang === 'ar' ? 'لحظات ونعرض لك أحدث الإعلانات' : 'Please wait while we fetch the latest announcements'}
          </p>
        </div>
      ) : loadingEventsError ? (
        <div className="rounded-3xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 p-12 text-center flex flex-col items-center justify-center shadow-md">
          <WifiOff className="h-12 w-12 text-red-500 mb-4 opacity-80" />
          <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
            {lang === 'ar' ? 'الاتصال بالشبكة ضعيف جداً' : 'Poor Network Connection'}
          </h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto mb-6">
            {lang === 'ar' 
              ? 'يرجى مراجعة اتصالك بالإنترنت والمحاولة مرة أخرى. لم نتمكن من جلب الفعاليات بنجاح.' 
              : 'Please check your internet connection and try again. We could not fetch the events successfully.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            {lang === 'ar' ? 'تحديث الصفحة' : 'Refresh Page'}
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/50 p-12 text-center shadow-md">
          <Music className="h-12 w-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-3" />
          <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
            {lang === 'ar' ? 'لا توجد فعاليات مطابقة لبحثك' : 'No matching events found'}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6">
            {lang === 'ar'
              ? 'جرب تغيير خيارات التصفية أو أنماط الرقص، أو كن أول من يضيف إعلاناً جديداً اليوم!'
              : 'Try resetting style filters or search terms, or post a new announcement today!'}
          </p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setSelectedStyleFilter('all'); }}
            className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-6 py-3 text-xs font-bold text-neutral-900 dark:text-white transition-colors cursor-pointer"
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
                  index={idx + (promoBannerIsVisible ? 1 : 0)}
                  overrideAdType={ev.adType || (ev.isFeatured || (typeof ev.position === 'number' && ev.position <= 19) ? 'vip' : 'standard')}
                  onOpenMap={onOpenMap}
                  onOpenShare={onOpenShare}
                  isHighlighted={ev.id === highlightedEventId}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {filteredEvents.length >= 5 && (
            <div className="flex justify-center pt-4">
              <motion.button
                whileHover={filteredEvents.length > visibleCount ? { scale: 1.03 } : {}}
                whileTap={filteredEvents.length > visibleCount ? { scale: 0.97 } : {}}
                onClick={() => {
                  if (filteredEvents.length > visibleCount) {
                    setVisibleCount(prev => prev + 5);
                  }
                }}
                disabled={filteredEvents.length <= visibleCount}
                className={`flex items-center gap-2 rounded-xl border px-6 py-3 text-xs sm:text-sm font-bold transition-all shadow-md ${
                  filteredEvents.length > visibleCount
                    ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 text-neutral-900 dark:text-white cursor-pointer'
                    : 'bg-neutral-100 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800/50 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                }`}
              >
                {filteredEvents.length > visibleCount && (
                  <ChevronDown className="h-4 w-4 text-amber-500 animate-bounce" />
                )}
                <span>
                  {filteredEvents.length > visibleCount
                    ? (lang === 'ar' ? 'المزيد من الإعلانات' : 'Load More Ads')
                    : (lang === 'ar' ? 'لا توجد إعلانات أخرى' : 'No more ads')}
                </span>
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
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-6 text-neutral-900 dark:text-neutral-100">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWhyBookModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-amber-500" />
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-500/15 flex items-center justify-center border border-red-500/30">
                      <Sparkles className="h-5 w-5 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                      {lang === 'ar' ? 'مميزات الحجز' : 'Booking Benefits'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowWhyBookModal(false)}
                    className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 bg-neutral-50 dark:bg-neutral-950/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800/50">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30 mt-1">
                      <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        {lang === 'ar' ? 'خصومات خاصة' : 'Special Discounts'}
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {lang === 'ar' 
                          ? 'الاستفادة من خصومات خاصة عن الأسعار الرسمية.'
                          : 'Enjoy special discounts off the official prices.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-neutral-50 dark:bg-neutral-950/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800/50">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/15 flex items-center justify-center border border-amber-500/30 mt-1">
                      <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-1">
                        {lang === 'ar' ? 'دعوات لحفلات VIP' : 'VIP Event Invites'}
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {lang === 'ar'
                          ? 'عند ملاحظة تفاعلك مع التطبيق والحجز من خلاله ومشاركة الإعلانات تتلقى دعوات لحضور بعض الحفلات بخصومات قد تصل الى 100% وامتيازات تكون فى فئة المستخدمين المميزين جدا أو الـ VIP.'
                          : 'By engaging with the app, booking, and sharing, you may receive invitations to parties with up to 100% discounts and exclusive VIP privileges.'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowWhyBookModal(false)}
                  className="mt-6 w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md"
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
