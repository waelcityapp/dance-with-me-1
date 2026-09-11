import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceCategory, DanceEvent, DanceStyle, ALL_DANCE_STYLES, getStyleLabel } from '../../types';
import { getSubcategoriesForCategory, SubCategoryItem } from '../../data/categoriesConfig';
import { EventCard } from '../events/EventCard';
import { WeeklyPromoBanner } from '../events/WeeklyPromoBanner';
import { Sparkles, Music, GraduationCap, Palmtree, Building2, Store, Briefcase, PlusCircle, Filter, Search, Clock, CheckCircle, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, X, Crown, Gift, Star, ArrowLeft, ArrowRight, WifiOff, Loader2, RefreshCw, Layers, LayoutGrid, Calendar, Wrench, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logAnalyticsEvent } from '../../lib/firebase';
import { CategoriesExplorerModal } from '../modals/CategoriesExplorerModal';

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
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [isPillarsOpen, setIsPillarsOpen] = useState(false);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');

  // Reset pagination when category, search, or style filter changes
  useEffect(() => {
    setVisibleCount(5);
  }, [selectedCategory, searchQuery, selectedStyleFilter]);

  // Apply the hierarchical category selection made in the mobile hero menu.
  useEffect(() => {
    const handleHeroFilter = (event: Event) => {
      const detail = (event as CustomEvent<{ category?: DanceCategory; subcategory?: string }>).detail;
      if (!detail?.category) return;
      setSelectedCategory(detail.category);
      setTimeout(() => {
        setSelectedStyleFilter(detail.subcategory || 'all');
        document.getElementById('events-feed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    };
    window.addEventListener('cityeve-hero-filter', handleHeroFilter);
    return () => window.removeEventListener('cityeve-hero-filter', handleHeroFilter);
  }, [setSelectedCategory]);

  useEffect(() => {
    const handleHeroSearch = (event: Event) => {
      const query = (event as CustomEvent<{ query?: string }>).detail?.query || '';
      setSearchQuery(query);
    };
    window.addEventListener('cityeve-hero-search', handleHeroSearch);
    return () => window.removeEventListener('cityeve-hero-search', handleHeroSearch);
  }, []);

  // Reset subcategory filter when main category changes
  useEffect(() => {
    setSelectedStyleFilter('all');
  }, [selectedCategory]);

  // Dynamic Subcategories based on selected category
  const subcategories = useMemo(() => {
    return getSubcategoriesForCategory(selectedCategory);
  }, [selectedCategory]);

  // Scroll instantly to specific event from URL if present
  useEffect(() => {
    if (activeEvents.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get('event');
      if (eventId) {
        const found = activeEvents.find(ev => ev.id === eventId);
        if (found) {
          // Switch to matching category if needed so the event is never hidden by filters
          if (found.category === 'services') {
            if (selectedCategory !== 'services') setSelectedCategory('services');
          } else if (found.category === 'jobs') {
            if (selectedCategory !== 'jobs') setSelectedCategory('jobs');
          } else if (selectedCategory === 'services' || selectedCategory === 'jobs') {
            setSelectedCategory('all');
          }
          if (selectedStyleFilter !== 'all') setSelectedStyleFilter('all');
          if (searchQuery) setSearchQuery('');
        }

        const index = activeEvents.findIndex(ev => ev.id === eventId);
        if (index !== -1) {
          if (index >= visibleCount) {
            setVisibleCount(index + 10);
          }
          setHighlightedEventId(eventId);

          let attempts = 0;
          const scrollToTarget = () => {
            const el = document.getElementById(`event-${eventId}`);
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY - 100;
              window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            } else if (attempts < 20) {
              attempts++;
              setTimeout(scrollToTarget, 80);
            }
          };
          // Slight delay to allow DOM render
          setTimeout(scrollToTarget, 100);

          const timer = setTimeout(() => {
            setHighlightedEventId(null);
          }, 6000);
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
    if (selectedGovernorate !== 'all' && ev.location?.governorateAr !== selectedGovernorate) return false;
    if (selectedArea !== 'all' && ev.location?.areaAr !== selectedArea) return false;
    // Subcategory / Style filter check
    if (selectedStyleFilter !== 'all') {
      const selectedSubcat = subcategories.find(s => s.id === selectedStyleFilter);
      const matchesDirect = ev.styles.includes(selectedStyleFilter as DanceStyle);
      const matchesAlias = selectedSubcat?.aliases?.some(alias => ev.styles.includes(alias as DanceStyle));
      const matchesKeyword = selectedSubcat && (
        (ev.titleAr || '').includes(selectedSubcat.labelAr) ||
        (ev.descriptionAr || '').includes(selectedSubcat.labelAr) ||
        (ev.titleEn || '').toLowerCase().includes(selectedSubcat.labelEn.toLowerCase())
      );
      if (!matchesDirect && !matchesAlias && !matchesKeyword) {
        return false;
      }
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
    },
    { 
      id: 'services', 
      labelAr: 'شركات و خدمات مكملة', 
      labelEn: 'Services & Suppliers', 
      icon: Store,
      activeBorder: 'border-amber-500',
      activeShadow: 'shadow-lg shadow-amber-500/15',
      activeBadge: 'bg-amber-600 text-white',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/15'
    },
    { 
      id: 'jobs', 
      labelAr: 'وظائف فى نفس المجال', 
      labelEn: 'Event Jobs', 
      icon: Briefcase,
      activeBorder: 'border-teal-500',
      activeShadow: 'shadow-lg shadow-teal-500/15',
      activeBadge: 'bg-teal-600 text-white',
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/15'
    }
  ];

  // Active pillar computed from selectedCategory
  const activePillar = useMemo<'events' | 'services' | 'jobs'>(() => {
    if (selectedCategory === 'services') return 'services';
    if (selectedCategory === 'jobs') return 'jobs';
    return 'events';
  }, [selectedCategory]);

  // Counts for each of the 3 pillars
  const pillarCounts = useMemo(() => {
    const eventsCount = activeEvents.filter(ev => !ev.category || ['party', 'course', 'trip', 'exhibition'].includes(ev.category)).length;
    const servicesCount = activeEvents.filter(ev => ev.category === 'services').length;
    const jobsCount = activeEvents.filter(ev => ev.category === 'jobs').length;
    return {
      events: eventsCount,
      services: servicesCount,
      jobs: jobsCount
    };
  }, [activeEvents]);

  const styleChips: string[] = ['all', ...ALL_DANCE_STYLES];
  const governorates = ['الإسكندرية', 'القاهرة', 'الجيزة', 'البحر الأحمر', 'الأقصر', 'أسوان'];
  const areas = useMemo(() => Array.from(new Set(activeEvents.filter(ev => selectedGovernorate === 'all' || ev.location?.governorateAr === selectedGovernorate).map(ev => ev.location?.areaAr).filter(Boolean) as string[])).sort(), [activeEvents, selectedGovernorate]);

  return (
    <div className="space-y-2 sm:space-y-2.5 pb-12 bg-[#3a0710]">
      {/* Section Header & Prominent Search Bar (Moved directly under category tabs) */}
      <div id="search-section" dir={lang === "ar" ? "rtl" : "ltr"} className="rounded-2xl border border-[#b08d57]/50 bg-white/95 dark:bg-[#171214]/95 p-1.5 sm:p-2 shadow-sm backdrop-blur-md space-y-1.5 transition-colors">
        <div className="flex items-center justify-between gap-2 border-b border-[#b08d57]/30 pb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-[11px] sm:text-xs font-black text-[#7d2332] dark:text-[#f4d58d] flex items-center">
              <span>{lang === 'ar' ? 'أحدث الإعلانات والفاعليات' : 'Latest Announcements & Events'}</span>
            </h3>
            {selectedCategory !== 'all' && (
              <span className="text-[10px] font-black text-neutral-950 bg-white border border-white/90 shadow-2xs px-2 py-0.2 rounded-md tracking-tight transition-transform transform active:scale-95 inline-flex items-center justify-center">
                {categories.find(c => c.id === selectedCategory)?.[lang === 'ar' ? 'labelAr' : 'labelEn']}
              </span>
            )}
          </div>
          <button type="button" onClick={() => setShowWhyBookModal(true)} className="order-1 shrink-0 rounded-full border border-[#b08d57]/70 bg-gradient-to-r from-[#5b1220] to-[#8a2636] px-2.5 py-1 text-[10px] sm:text-xs font-black text-[#f4d58d] whitespace-nowrap">{lang === "ar" ? "ليه تحجز من خلال CityEve؟" : "Why book through CityEve?"}</button>
          <span className="rounded-full bg-[#5b1220] dark:bg-[#b08d57]/20 border border-[#b08d57] px-2.5 py-0.5 text-[11px] sm:text-xs font-mono font-black text-[#f4d58d] rounded-full shadow-sm shrink-0">
            {isLoadingEvents ? '...' : filteredEvents.length} {lang === 'ar' ? 'إعلان' : 'events'}
          </span>
        </div>

        {/* Compact Mobile Date & Location Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <button
            type="button"
            className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] sm:text-xs font-black text-neutral-950 border border-amber-400 shadow-2xs cursor-pointer"
          >
            {lang === 'ar' ? 'اليوم' : 'Today'}
          </button>
          <button
            type="button"
            className="shrink-0 rounded-xl bg-white dark:bg-neutral-900 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-neutral-700 dark:text-neutral-200 border border-amber-500/50 hover:border-amber-500 transition-colors cursor-pointer whitespace-nowrap"
          >
            {lang === 'ar' ? 'خلال أسبوع' : 'Within a week'}
          </button>
          <button
            type="button"
            onClick={() => setShowLocationFilter(true)}
            className="shrink-0 rounded-xl bg-white dark:bg-neutral-900 px-3 py-1.5 text-[11px] sm:text-xs font-bold text-neutral-700 dark:text-neutral-200 border border-amber-500/50 hover:border-amber-500 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Filter className="inline-block h-3 w-3 ml-1 text-amber-500 align-[-2px]" />
            {selectedGovernorate === 'all' ? (lang === 'ar' ? 'المحافظة / المنطقة' : 'Governorate / Area') : selectedGovernorate + (selectedArea !== 'all' ? ' / ' + selectedArea : '')}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showLocationFilter && (
          <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div className="absolute inset-0 bg-black/60" onClick={() => setShowLocationFilter(false)} />
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-900 p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between mb-5"><h3 className="font-black text-neutral-900 dark:text-white">{lang === 'ar' ? 'اختار المحافظة والمنطقة' : 'Choose governorate and area'}</h3><button onClick={() => setShowLocationFilter(false)} className="text-neutral-500"><X className="h-5 w-5" /></button></div>
              <label className="block text-xs font-bold text-neutral-500 mb-1">{lang === 'ar' ? 'المحافظة' : 'Governorate'}</label>
              <select value={selectedGovernorate} onChange={e => { setSelectedGovernorate(e.target.value); setSelectedArea('all'); }} className="w-full mb-4 rounded-xl border border-amber-500/50 bg-white dark:bg-neutral-800 p-3 text-sm text-neutral-900 dark:text-white"><option value="all">{lang === 'ar' ? 'كل المحافظات' : 'All governorates'}</option>{governorates.map(g => <option key={g} value={g}>{g}</option>)}</select>
              <label className="block text-xs font-bold text-neutral-500 mb-1">{lang === 'ar' ? 'المنطقة' : 'Area'}</label>
              <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className="w-full mb-5 rounded-xl border border-amber-500/50 bg-white dark:bg-neutral-800 p-3 text-sm text-neutral-900 dark:text-white"><option value="all">{lang === 'ar' ? 'كل المناطق المتاحة' : 'All available areas'}</option>{areas.map(a => <option key={a} value={a}>{a}</option>)}</select>
              <button onClick={() => setShowLocationFilter(false)} className="w-full rounded-xl bg-gradient-to-r from-[#5b1220] to-[#8a2636] border border-[#b08d57]/70 py-3 font-black text-[#f4d58d]">{lang === 'ar' ? 'عرض النتائج' : 'Show results'}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Main Categories Explorer Directory Modal */}
      <CategoriesExplorerModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          logAnalyticsEvent(`explore_cat_${cat}`);
        }}
        selectedSubcategory={selectedStyleFilter}
        onSelectSubcategory={(subId) => {
          setSelectedStyleFilter(subId);
          logAnalyticsEvent(`explore_sub_${subId}`);
        }}
        eventsCountMap={{
          all: activeEvents.length,
          party: activeEvents.filter(e => e.category === 'party').length,
          course: activeEvents.filter(e => e.category === 'course').length,
          trip: activeEvents.filter(e => e.category === 'trip').length,
          exhibition: activeEvents.filter(e => e.category === 'exhibition').length,
          services: activeEvents.filter(e => e.category === 'services').length,
          jobs: activeEvents.filter(e => e.category === 'jobs').length,
        }}
      />
    </div>
  );
};
