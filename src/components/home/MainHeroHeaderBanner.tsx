import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { motion } from 'motion/react';
import { DanceCategory } from '../../types';
import { getSubcategoriesForCategory } from '../../data/categoriesConfig';

interface MainHeroHeaderBannerProps {
  onExploreClick?: () => void;
  onPostAdClick?: () => void;
}

const categories = [
  { id: 'party' as DanceCategory, ar: 'حفلات وسهرات', allAr: 'كل الحفلات والسهرات', en: 'Parties & Nightlife', allEn: 'All Parties & Nightlife' },
  { id: 'course' as DanceCategory, ar: 'دورات وكورسات', allAr: 'كل الدورات والكورسات', en: 'Courses & Workshops', allEn: 'All Courses & Workshops' },
  { id: 'trip' as DanceCategory, ar: 'رحلات ومعسكرات', allAr: 'كل الرحلات والمعسكرات', en: 'Trips & Camps', allEn: 'All Trips & Camps' },
  { id: 'exhibition' as DanceCategory, ar: 'معارض ومؤتمرات', allAr: 'كل المعارض والمؤتمرات', en: 'Exhibitions & Conferences', allEn: 'All Exhibitions & Conferences' },
  { id: 'services' as DanceCategory, ar: 'شركات وخدمات مكملة', allAr: 'كل الشركات والخدمات المكملة', en: 'Companies & Event Services', allEn: 'All Companies & Event Services' },
  { id: 'jobs' as DanceCategory, ar: 'وظائف في نفس المجال', allAr: 'كل الوظائف في نفس المجال', en: 'Jobs in the Field', allEn: 'All Jobs in the Field' },
];

export const MainHeroHeaderBanner: React.FC<MainHeroHeaderBannerProps> = ({
  onExploreClick,
  onPostAdClick,
}) => {
  const { lang, appAssets, selectedCategory } = useApp();
  const isAr = lang === 'ar';
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<DanceCategory | null>(null);
  const [chosenCategoryId, setChosenCategoryId] = useState<DanceCategory | null>(null);
  const [chosenSubcategoryId, setChosenSubcategoryId] = useState('all');
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const uploadedBackground = isAr
    ? appAssets?.app_hero_banner_url
    : appAssets?.app_hero_banner_url_en;
  const uploadedMobileBackground = isAr
    ? appAssets?.app_hero_banner_mobile_url
    : appAssets?.app_hero_banner_mobile_url_en;

  const backgroundImage = uploadedBackground || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80';
  const mobileBackgroundImage = uploadedMobileBackground || uploadedBackground || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80';

  const activeCategory = categories.find(category => category.id === activeCategoryId);
  const selectedCategoryLabel = categories.find(category => category.id === selectedCategory);
  const selectedSubcategoryLabel = chosenCategoryId && chosenSubcategoryId !== 'all'
    ? getSubcategoriesForCategory(chosenCategoryId).find(sub => sub.id === chosenSubcategoryId)
    : null;

  const mobileCategoryLabel = selectedSubcategoryLabel
    ? (isAr ? selectedSubcategoryLabel.labelAr : selectedSubcategoryLabel.labelEn)
    : chosenCategoryId
      ? (isAr
        ? categories.find(category => category.id === chosenCategoryId)?.allAr
        : categories.find(category => category.id === chosenCategoryId)?.allEn)
    : selectedCategoryLabel
      ? (isAr ? selectedCategoryLabel.allAr : selectedCategoryLabel.allEn)
      : (isAr ? 'كل الحفلات والسهرات' : 'All Parties & Nightlife');

  const chooseCategory = (categoryId: DanceCategory) => {
    setActiveCategoryId(categoryId);
  };

  const closeCategoryMenu = () => {
    setIsCategoryMenuOpen(false);
    setActiveCategoryId(null);
  };

  const chooseSubcategory = (categoryId: DanceCategory, subcategoryId: string) => {
    setActiveCategoryId(null);
    setChosenCategoryId(categoryId);
    setChosenSubcategoryId(subcategoryId);
    setIsCategoryMenuOpen(false);
    window.dispatchEvent(new CustomEvent('cityeve-hero-filter', {
      detail: { category: categoryId, subcategory: subcategoryId },
    }));
  };

  const handleExplore = () => {
    if (onExploreClick) {
      onExploreClick();
      return;
    }

    const searchSection = document.getElementById('search-section');
    searchSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      aria-label={isAr ? 'بانر CityEve الرئيسي' : 'CityEve main banner'}
      className="relative w-full overflow-hidden px-1 pb-1 pt-1 md:px-5 md:pb-5"
    >
      <div
        className="relative isolate mx-auto min-h-[270px] max-w-6xl overflow-hidden rounded-[18px] border border-[#d4af67]/45 bg-[#3a0710] shadow-[0_18px_55px_rgba(67,8,19,0.22)] md:min-h-[340px] md:rounded-[24px] lg:min-h-[340px]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-95 md:hidden" style={{ backgroundImage: `url(${mobileBackgroundImage})` }} />
        <div aria-hidden="true" className="absolute inset-0 hidden bg-cover bg-center opacity-95 md:block" style={{ backgroundImage: `url(${backgroundImage})` }} />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(211,151,64,0.12),transparent_34%),linear-gradient(115deg,rgba(61,7,17,0.18)_0%,rgba(91,13,24,0.12)_48%,rgba(43,4,11,0.22)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(39,4,11,0.04),rgba(39,4,11,0.18))]"
        />

        <div className="pointer-events-none absolute -left-16 top-16 h-40 w-40 rounded-full bg-[#d9a441]/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-8 h-52 w-52 rounded-full bg-[#a72b37]/30 blur-3xl" />

        <div className="relative z-10 flex min-h-[270px] flex-col items-center justify-center px-3 py-5 text-center md:min-h-[340px] md:px-8 md:py-6 lg:min-h-[340px]">
          <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-1 md:inset-x-8 md:top-4">
            <button
              type="button"
              onClick={onPostAdClick}
              className="inline-flex items-center gap-1 rounded-full border border-[#d4af67]/70 bg-[#5b0d18]/75 px-2 py-1 text-[10px] font-bold text-[#f7e8bd] shadow-lg backdrop-blur-sm transition hover:bg-[#741523] md:px-3 md:text-xs"
            >
              <Plus className="h-3 w-3 text-[#e1b45b] md:h-4 md:w-4" />
              <span>{isAr ? 'أضف فعاليتك' : 'Post your event'}</span>
            </button>

            <span className="text-[9px] font-medium tracking-[0.12em] text-[#e9ca85]/80 md:text-xs">
              {isAr ? 'اكتشف • احجز • استمتع' : 'DISCOVER • BOOK • ENJOY'}
            </span>
          </div>

          <div className="relative -top-1 mb-3 flex flex-col items-center md:-top-2 md:mb-8">
            {/* Decorative wordmark layer: replaceable later with the final transparent SVG asset. */}
            <div className="relative inline-flex items-center">
              <span
                className="text-[2.15rem] leading-[0.8] text-[#fff1c5] drop-shadow-[0_3px_12px_rgba(0,0,0,0.38)] md:text-6xl"
                style={{ fontFamily: '"Great Vibes", cursive' }}
              >
                CityEve
              </span>
              <span className="absolute -bottom-3 left-1/2 h-px w-28 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#edc56d] to-transparent md:-bottom-4 md:w-40" />
            </div>
          </div>

          <div className="max-w-3xl px-1">
            <h1 className="text-base font-black leading-[1.12] tracking-tight text-white drop-shadow-md md:text-4xl lg:text-4xl">
              {isAr ? (
                <>كل الفعاليات <span className="text-[#edc56d]">في مكان واحد</span></>
              ) : (
                <>Every event <span className="text-[#edc56d]">in one place</span></>
              )}
            </h1>
            <p className="mx-auto mt-1 max-w-[310px] text-[9px] font-medium leading-3.5 text-[#f6e8c8]/85 md:mt-2 md:max-w-2xl md:text-xs lg:text-sm">
              {isAr
                ? 'اكتشف أفضل الحفلات والرحلات والدورات والخدمات، واحجز تجربتك القادمة بسهولة.'
                : 'Discover parties, trips, courses, and services — then book your next experience with ease.'}
            </p>
          </div>

          <div className="mt-2 w-full max-w-[310px] md:mt-4 md:max-w-2xl">
            <div className="group flex w-full items-center gap-1.5 rounded-2xl border border-[#d4a84f]/75 bg-[#4a0913]/72 px-2 py-1.5 text-right text-[#fff0c8] shadow-[0_10px_26px_rgba(30,0,6,0.22)] backdrop-blur-md transition focus-within:border-[#f4d78d] focus-within:bg-[#4a0913]/85 md:gap-2 md:px-3 md:py-2">
              <input
                type="search"
                value={heroSearchQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setHeroSearchQuery(value);
                  window.dispatchEvent(new CustomEvent('cityeve-hero-search', { detail: { query: value } }));
                }}
                placeholder={isAr ? 'ابحث عن حفلة أو دورة أو رحلة...' : 'Search for a party, course, or trip...'}
                aria-label={isAr ? 'البحث عن فعالية' : 'Search events'}
                className="min-w-0 flex-1 bg-transparent text-[10px] font-semibold leading-4 text-[#fff0c8] outline-none placeholder:text-[#e7c98b]/75 md:text-sm"
                dir={isAr ? 'rtl' : 'ltr'}
              />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#d4a84f] text-[#3d0711] shadow-sm">
                {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </span>
            </div>
          </div>

          <div className="relative mt-2 w-full max-w-4xl px-1 md:mt-3">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen(open => !open)}
              className="mx-auto flex w-full max-w-[320px] items-center justify-center gap-2 rounded-full border border-[#f4d78d]/70 bg-[#4a0913]/85 px-3 py-2 text-[11px] font-bold text-[#fff0c8] shadow-sm backdrop-blur-sm transition hover:bg-[#791524] md:hidden"
              aria-expanded={isCategoryMenuOpen}
            >
              <span className="shrink-0">{isAr ? 'كل الأقسام الرئيسية' : 'All Main Sections'}</span>
              <span className="h-4 w-px shrink-0 bg-[#f4d78d]/40" />
              <span className="truncate text-[#edc56d]">{mobileCategoryLabel}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryMenuOpen && (
              <div className="relative z-30 mx-auto mt-2 w-[calc(100%-8px)] max-w-[360px] rounded-2xl border border-[#d4af67]/70 bg-[#3d0711]/98 p-2 text-right shadow-2xl backdrop-blur-md md:hidden">
                <div className="mb-1 flex items-center justify-between border-b border-[#d4af67]/25 px-2 pb-2">
                  <button
                    type="button"
                    onClick={closeCategoryMenu}
                    aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#e8c978] transition hover:bg-[#791524] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] font-black text-[#fff0c8]">
                    {activeCategoryId
                      ? (isAr ? 'اختر التصنيف الفرعي' : 'Choose a subcategory')
                      : (isAr ? 'اختر القسم الرئيسي' : 'Choose a main section')}
                  </span>
                </div>
                {!activeCategoryId ? (
                  <div className="grid grid-cols-1 gap-1">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => chooseCategory(category.id)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-bold text-[#fff0c8] transition hover:bg-[#791524]"
                      >
                        <ChevronLeft className="h-4 w-4 text-[#d4a84f]" />
                        <span>{isAr ? category.ar : category.en}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveCategoryId(null)}
                      className="mb-1 flex w-full items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold text-[#e3b85e] hover:bg-[#791524]"
                    >
                      {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      <span>{isAr ? 'رجوع إلى الأقسام الرئيسية' : 'Back to main sections'}</span>
                    </button>
                    <div className="mb-1 border-b border-[#d4af67]/25 px-3 pb-2 text-[11px] font-black text-white">
                      {activeCategory && (isAr ? activeCategory.ar : activeCategory.en)}
                    </div>
                    <button
                      type="button"
                      onClick={() => chooseSubcategory(activeCategoryId, 'all')}
                      className="mb-1 flex w-full items-center justify-between rounded-xl bg-[#d4a84f]/15 px-3 py-2 text-[11px] font-black text-[#f8df9b] hover:bg-[#d4a84f]/25"
                    >
                      <span>{isAr ? activeCategory?.allAr || 'الكل' : activeCategory?.allEn || 'All'}</span>
                      <span>✓</span>
                    </button>
                    <div className="grid max-h-52 gap-1 overflow-y-auto">
                      {getSubcategoriesForCategory(activeCategoryId).map(sub => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => chooseSubcategory(activeCategoryId, sub.id)}
                          className="rounded-xl px-3 py-2 text-right text-[10px] font-bold text-[#fff0c8] transition hover:bg-[#791524]"
                        >
                          {isAr ? sub.labelAr : sub.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="hidden flex-wrap justify-center gap-1 md:flex md:gap-2">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => chooseCategory(category.id)}
                className="rounded-full border border-[#f4d78d]/55 bg-[#4a0913]/70 px-2 py-1 text-[9px] font-bold text-[#fff0c8] backdrop-blur-sm transition hover:border-[#f4d78d] hover:bg-[#791524] md:px-3 md:text-xs"
              >
                {isAr ? category.ar : category.en}
              </motion.button>
            ))}
            </div>

            {activeCategoryId && (
              <div className="mx-auto mt-3 hidden w-full max-w-2xl rounded-2xl border border-[#d4af67]/65 bg-[#3d0711]/95 p-3 text-right shadow-2xl backdrop-blur-md md:block">
                <div className="mb-2 flex items-center justify-between border-b border-[#d4af67]/25 px-1 pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryId(null)}
                    aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#e8c978] transition hover:bg-[#791524] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-black text-[#fff0c8]">
                    {activeCategory && (isAr ? `تصنيفات ${activeCategory.ar}` : `${activeCategory.en} categories`)}
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => chooseSubcategory(activeCategoryId, 'all')}
                    className="rounded-full border border-[#d4a84f] bg-[#d4a84f]/15 px-3 py-1.5 text-[11px] font-black text-[#f8df9b] transition hover:bg-[#d4a84f]/30"
                  >
                    {isAr ? activeCategory.allAr : activeCategory.allEn}
                  </button>
                  {getSubcategoriesForCategory(activeCategoryId).map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => chooseSubcategory(activeCategoryId, sub.id)}
                      className="rounded-full border border-[#f4d78d]/45 bg-[#4a0913]/75 px-3 py-1.5 text-[10px] font-bold text-[#fff0c8] transition hover:border-[#f4d78d] hover:bg-[#791524]"
                    >
                      {isAr ? sub.labelAr : sub.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
