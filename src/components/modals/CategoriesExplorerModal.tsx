import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceCategory } from '../../types';
import { 
  PARTY_SUBCATEGORIES, 
  COURSE_SUBCATEGORIES, 
  TRIP_SUBCATEGORIES, 
  EXHIBITION_SUBCATEGORIES, 
  SERVICE_SUBCATEGORIES,
  JOB_SUBCATEGORIES,
  SubCategoryItem 
} from '../../data/categoriesConfig';
import { 
  X, 
  Layers, 
  Sparkles, 
  Music, 
  GraduationCap, 
  Palmtree, 
  Building2, 
  Store,
  Briefcase,
  ChevronRight, 
  ChevronLeft, 
  Check, 
  ArrowRight,
  Flame,
  LayoutGrid,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoriesExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: DanceCategory;
  onSelectCategory: (cat: DanceCategory) => void;
  selectedSubcategory: string;
  onSelectSubcategory: (subId: string) => void;
  eventsCountMap: {
    all: number;
    party: number;
    course: number;
    trip: number;
    exhibition: number;
    services?: number;
    jobs?: number;
  };
}

export const CategoriesExplorerModal: React.FC<CategoriesExplorerModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
  selectedSubcategory,
  onSelectSubcategory,
  eventsCountMap,
}) => {
  const { lang } = useApp();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<DanceCategory>(
    selectedCategory === 'all' ? 'party' : selectedCategory
  );

  if (!isOpen) return null;

  const categories = [
    {
      id: 'party' as DanceCategory,
      titleAr: 'سهرات وحفلات وعروض',
      titleEn: 'Parties, Concerts & Shows',
      descAr: 'حفلات غنائية، ستاند أب، مسرح، عروض موسيقية ولاتينية وسهرات',
      descEn: 'Concerts, stand-up, theater, live music, Latin & nightlife',
      icon: Music,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-500',
      activeBg: 'bg-amber-500 text-neutral-950 font-black',
      count: eventsCountMap.party,
      subcategories: PARTY_SUBCATEGORIES,
    },
    {
      id: 'course' as DanceCategory,
      titleAr: 'كورسات وورش عمل',
      titleEn: 'Courses & Workshops',
      descAr: 'تدريب رقص، موسيقى، رسم، يوجا ولياقة وورش تطوير مهارات',
      descEn: 'Dance classes, music lessons, art, fitness & workshops',
      icon: GraduationCap,
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-500',
      activeBg: 'bg-blue-500 text-white font-black',
      count: eventsCountMap.course,
      subcategories: COURSE_SUBCATEGORIES,
    },
    {
      id: 'trip' as DanceCategory,
      titleAr: 'رحلات ومعسكرات',
      titleEn: 'Trips & Camps',
      descAr: 'سفاري، معسكرات تخييم، رحلات اليوم الواحد، وسياحة ترفيهية',
      descEn: 'Day trips, safari camping, travel & weekend getaways',
      icon: Palmtree,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-500',
      activeBg: 'bg-emerald-500 text-white font-black',
      count: eventsCountMap.trip,
      subcategories: TRIP_SUBCATEGORIES,
    },
    {
      id: 'exhibition' as DanceCategory,
      titleAr: 'معارض ومؤتمرات',
      titleEn: 'Exhibitions & Conferences',
      descAr: 'معارض تجارية وتسوق، منتديات أعمال، وفنون تشكيلية',
      descEn: 'Business fairs, trade expos, conferences & book fairs',
      icon: Building2,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-500',
      activeBg: 'bg-purple-500 text-white font-black',
      count: eventsCountMap.exhibition,
      subcategories: EXHIBITION_SUBCATEGORIES,
    },
    {
      id: 'services' as DanceCategory,
      titleAr: 'شركات و خدمات مكملة',
      titleEn: 'Services & Suppliers',
      descAr: 'قاعات أفراح، صوت وإضاءة، فراشة، كاترنج، تأجير باصات وتصوير',
      descEn: 'Wedding halls, sound & light, catering, buses & event planners',
      icon: Store,
      color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-500',
      activeBg: 'bg-amber-600 text-white font-black',
      count: eventsCountMap.services || 0,
      subcategories: SERVICE_SUBCATEGORIES,
    },
    {
      id: 'jobs' as DanceCategory,
      titleAr: 'وظائف فى نفس المجال',
      titleEn: 'Event Jobs & Gigs',
      descAr: 'فرص عمل لمنظمين، مصورين، دي جي، ويترز، سائقين وأمن وحراسات',
      descEn: 'Jobs for event organizers, photographers, DJs, waiters & bouncers',
      icon: Briefcase,
      color: 'from-teal-500/20 to-cyan-500/20 border-teal-500/40 text-teal-500',
      activeBg: 'bg-teal-600 text-white font-black',
      count: eventsCountMap.jobs || 0,
      subcategories: JOB_SUBCATEGORIES,
    },
  ];

  const currentCategoryData = categories.find((c) => c.id === activeTab) || categories[0];

  const catGradientBg = (id: DanceCategory) => {
    switch (id) {
      case 'party':
        return 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      case 'course':
        return 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30';
      case 'trip':
        return 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      case 'exhibition':
        return 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30';
      case 'services':
        return 'from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      case 'jobs':
        return 'from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30';
      default:
        return 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    }
  };

  const handleSelectSub = (subId: string) => {
    onSelectCategory(activeTab);
    onSelectSubcategory(subId);
    onClose();
  };

  const handleSelectAllInCat = () => {
    onSelectCategory(activeTab);
    onSelectSubcategory('all');
    onClose();
  };

  const handleShowAllEvents = () => {
    onSelectCategory('all');
    onSelectSubcategory('all');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/70 dark:bg-neutral-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/70 shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
                {isAr ? 'دليل الأقسام والتصنيفات' : 'App Categories Directory'}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {isAr ? 'شامل 6 أقسام' : '6 Sections'}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isAr ? 'اختر القسم والتصنيف الدقيق للوصول السريع لما تبحث عنه' : 'Choose a section to quickly find what you are looking for'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 Pillars Selector */}
        <div className="p-3 bg-neutral-100/70 dark:bg-neutral-950/40 border-b border-neutral-100 dark:border-neutral-800 space-y-2.5 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            {/* Pillar 1 */}
            <button
              onClick={() => {
                if (activeTab === 'services' || activeTab === 'jobs') {
                  setActiveTab('party');
                }
              }}
              className={`flex items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-xl transition-all border text-center cursor-pointer ${
                activeTab !== 'services' && activeTab !== 'jobs'
                  ? 'bg-amber-500 text-neutral-950 font-black border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700/50 hover:bg-neutral-50'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs font-black truncate">
                {isAr ? 'الاقسام الرئيسية و الفاعليات' : 'Events & Activities'}
              </span>
            </button>

            {/* Pillar 2 */}
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-xl transition-all border text-center cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-amber-500 text-neutral-950 font-black border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700/50 hover:bg-neutral-50'
              }`}
            >
              <Store className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs font-black truncate">
                {isAr ? 'خدمات و شركات مكملة' : 'Services & Suppliers'}
              </span>
            </button>

            {/* Pillar 3 */}
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-xl transition-all border text-center cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-teal-500 text-white font-black border-teal-500 shadow-sm'
                  : 'bg-white dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700/50 hover:bg-neutral-50'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs font-black truncate">
                {isAr ? 'التوظيف فى نفس المجال' : 'Jobs & Careers'}
              </span>
            </button>
          </div>

          {/* Sub tabs for Events when Pillar 1 is active */}
          {activeTab !== 'services' && activeTab !== 'jobs' && (
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {categories.filter(c => ['party', 'course', 'trip', 'exhibition'].includes(c.id)).map((cat) => {
                const Icon = cat.icon;
                const isTabActive = activeTab === cat.id;
                const shortLabelAr = cat.id === 'party' ? 'الحفلات' : cat.id === 'course' ? 'الكورسات' : cat.id === 'trip' ? 'الرحلات' : 'المعارض';
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-all border text-center cursor-pointer ${
                      isTabActive
                        ? `${cat.activeBg} shadow-xs border-transparent`
                        : 'bg-white/80 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200/60 dark:border-neutral-700/40 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-bold truncate">
                      {isAr ? shortLabelAr : cat.titleEn.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-mono opacity-80">
                      ({cat.count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Section Description & Subcategories List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* Section banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/50">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${catGradientBg(currentCategoryData.id)}`}>
                <currentCategoryData.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                  {isAr ? currentCategoryData.titleAr : currentCategoryData.titleEn}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {isAr ? currentCategoryData.descAr : currentCategoryData.descEn}
                </p>
              </div>
            </div>
            <button
              onClick={handleSelectAllInCat}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-neutral-700 hover:bg-amber-500 hover:text-neutral-950 dark:hover:bg-amber-500 dark:hover:text-neutral-950 text-neutral-800 dark:text-white transition-all shrink-0 border border-neutral-200 dark:border-neutral-600 hover:border-amber-400 shadow-xs"
            >
              {isAr ? 'عرض الكل في هذا القسم' : 'View all in section'}
            </button>
          </div>

          {/* Subcategories Grid */}
          <div>
            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span>{isAr ? 'التصنيفات الفرعية المتاحة:' : 'Available Subcategories:'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentCategoryData.subcategories.map((sub: SubCategoryItem) => {
                const isSelected = selectedCategory === activeTab && selectedSubcategory === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSub(sub.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                        : 'bg-white dark:bg-neutral-800/50 hover:bg-amber-50/50 dark:hover:bg-neutral-800 border-neutral-200/80 dark:border-neutral-700/60 hover:border-amber-300 dark:hover:border-neutral-500 text-neutral-800 dark:text-neutral-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${isSelected ? 'bg-amber-500 dark:bg-amber-400' : 'bg-neutral-300 dark:bg-neutral-600 group-hover:bg-amber-500 dark:group-hover:bg-amber-400'} transition-colors`} />
                      <span className="text-xs sm:text-sm font-bold">
                        {isAr ? sub.labelAr : sub.labelEn}
                      </span>
                    </div>
                    {isAr ? (
                      <ChevronLeft className="h-4 w-4 text-neutral-400 dark:text-neutral-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:-translate-x-0.5 transition-all" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Quick Action */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-950/70 shrink-0">
          <button
            onClick={handleShowAllEvents}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{isAr ? 'عرض كل إعلانات التطبيق بدون تصفية' : 'Show all app events without filters'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
