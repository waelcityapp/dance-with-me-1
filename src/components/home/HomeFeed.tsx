import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceCategory, DanceEvent, DanceStyle, ALL_DANCE_STYLES, getStyleLabel } from '../../types';
import { EventCard } from '../events/EventCard';
import { WeeklyPromoBanner } from '../events/WeeklyPromoBanner';
import { Sparkles, Music, GraduationCap, Palmtree, PlusCircle, Filter, Search, Clock, CheckCircle2, ArrowUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  // Reset pagination when category, search, or style filter changes
  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory, searchQuery, selectedStyleFilter]);

  // Back to Top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
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
              {lang === 'ar' ? 'اكتشف فعاليات وحفلات الرقص اللاتيني' : 'Discover Luxury Latin Dance Events'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">
              {lang === 'ar' ? 'سالسا، باتشاتا، كيزومبا، تانجو، بول روم في أرقى الفنادق والأستوديوهات والمنتجعات' : 'Salsa, Bachata, Kizomba, Tango, Ballroom at premium hotels, studios and resorts'}
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
                onClick={() => setSelectedStyleFilter(style)}
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
              onClick={() => setSelectedCategory(cat.id)}
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
            className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-neutral-950 shadow-2xl border border-amber-400 hover:bg-amber-400 transition-all cursor-pointer focus:outline-none"
            title={lang === 'ar' ? 'العودة إلى الأعلى' : 'Back to Top'}
          >
            <ArrowUp className="h-5 w-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
