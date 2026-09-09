import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, ArrowRight, Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface MainHeroHeaderBannerProps {
  onExploreClick?: () => void;
  onPostAdClick?: () => void;
}

const categories = [
  { ar: 'حفلات', en: 'Parties' },
  { ar: 'دورات', en: 'Courses' },
  { ar: 'رحلات', en: 'Trips' },
  { ar: 'معارض', en: 'Exhibitions' },
  { ar: 'خدمات', en: 'Services' },
  { ar: 'وظائف', en: 'Jobs' },
];

export const MainHeroHeaderBanner: React.FC<MainHeroHeaderBannerProps> = ({
  onExploreClick,
  onPostAdClick,
}) => {
  const { lang, appAssets } = useApp();
  const isAr = lang === 'ar';
  const uploadedBackground = isAr
    ? appAssets?.app_hero_banner_url
    : appAssets?.app_hero_banner_url_en;

  const backgroundImage = uploadedBackground || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80';

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
      className="relative w-full overflow-hidden px-3 pb-3 pt-2 sm:px-5 sm:pb-5"
    >
      <div
        className="relative isolate mx-auto min-h-[300px] max-w-6xl overflow-hidden rounded-[28px] border border-[#d4af67]/45 bg-[#3a0710] shadow-[0_18px_55px_rgba(67,8,19,0.22)] sm:min-h-[430px] lg:min-h-[470px]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-95"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
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

        <div className="relative z-10 flex min-h-[300px] flex-col items-center justify-start px-4 pb-16 pt-9 text-center sm:min-h-[430px] sm:justify-center sm:px-8 sm:py-12 lg:min-h-[470px]">
          <div className="absolute inset-x-4 top-3 flex items-center justify-between gap-2 sm:inset-x-8 sm:top-7">
            <button
              type="button"
              onClick={onPostAdClick}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af67]/70 bg-[#5b0d18]/75 px-2.5 py-1.5 text-[11px] font-bold text-[#f7e8bd] shadow-lg backdrop-blur-sm transition hover:bg-[#741523] sm:px-4 sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 text-[#e1b45b] sm:h-4 sm:w-4" />
              <span>{isAr ? 'أضف فعاليتك' : 'Post your event'}</span>
            </button>

            <span className="text-[9px] font-medium tracking-[0.12em] text-[#e9ca85]/80 sm:text-xs">
              {isAr ? 'اكتشف • احجز • استمتع' : 'DISCOVER • BOOK • ENJOY'}
            </span>
          </div>

          <div className="mb-1.5 flex flex-col items-center sm:mb-6">
            {/* Decorative wordmark layer: replaceable later with the final transparent SVG asset. */}
            <div className="relative inline-flex items-center">
              <span className="font-serif text-2xl font-semibold italic leading-none tracking-[-0.08em] text-[#f8e5b1] drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)] sm:text-7xl">
                CityEve
              </span>
              <span className="absolute -bottom-3 left-1/2 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d4af67] to-transparent sm:w-32" />
            </div>
          </div>

          <div className="max-w-3xl px-1">
            <h1 className="text-lg font-black leading-[1.08] tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
              {isAr ? (
                <>كل الفعاليات <span className="text-[#edc56d]">في مكان واحد</span></>
              ) : (
                <>Every event <span className="text-[#edc56d]">in one place</span></>
              )}
            </h1>
            <p className="mx-auto mt-1 max-w-2xl text-[10px] font-medium leading-4 text-[#f6e8c8]/85 sm:mt-4 sm:text-base lg:text-lg">
              {isAr
                ? 'اكتشف أفضل الحفلات والرحلات والدورات والخدمات، واحجز تجربتك القادمة بسهولة.'
                : 'Discover parties, trips, courses, and services — then book your next experience with ease.'}
            </p>
          </div>

          <div className="mt-3 w-full max-w-2xl sm:mt-8">
            <button
              type="button"
              onClick={handleExplore}
              className="group flex w-full items-center gap-2 rounded-2xl border border-[#e0be75]/70 bg-[#fffaf0] px-2.5 py-1.5 text-right text-[#6a1520] shadow-[0_12px_35px_rgba(30,0,6,0.28)] transition hover:bg-white sm:px-4 sm:py-3"
            >
              <span className="flex h-7 w-7 shrink-0 sm:h-9 sm:w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#6b101c] text-[#f0c66e] transition group-hover:bg-[#841526]">
                <Search className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </span>
              <span className="flex-1 text-[10px] font-semibold leading-4 text-[#7c5b57] sm:text-base">
                {isAr ? 'ابحث عن حفلة، دورة، رحلة أو خدمة...' : 'Search for a party, course, trip, or service...'}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#d4a84f] text-[#3d0711]">
                {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </span>
            </button>
          </div>

          <div className="mt-2 flex max-w-4xl flex-wrap justify-center gap-1 px-1 sm:mt-6 sm:gap-2.5">
            {categories.map((category) => (
              <motion.button
                key={category.en}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleExplore}
                className="rounded-full border border-[#f4d78d]/55 bg-[#4a0913]/70 px-2 py-1 text-[9px] font-bold text-[#fff0c8] backdrop-blur-sm transition hover:border-[#f4d78d] hover:bg-[#791524] sm:px-4 sm:text-sm"
              >
                {isAr ? category.ar : category.en}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
