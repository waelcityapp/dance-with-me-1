import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, ArrowRight, Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface MainHeroHeaderBannerProps {
  onExploreClick?: () => void;
  onPostAdClick?: () => void;
}

const categories = [
  { ar: 'حفلات وسهرات', en: 'Parties & Nightlife' },
  { ar: 'دورات وكورسات', en: 'Courses & Workshops' },
  { ar: 'رحلات ومعسكرات', en: 'Trips & Camps' },
  { ar: 'معارض ومؤتمرات', en: 'Exhibitions & Conferences' },
  { ar: 'شركات وخدمات مكملة', en: 'Companies & Event Services' },
  { ar: 'وظائف في نفس المجال', en: 'Jobs in the Field' },
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
      className="relative w-full overflow-hidden px-1 pb-1 pt-1 md:px-5 md:pb-5"
    >
      <div
        className="relative isolate mx-auto min-h-[300px] max-w-6xl overflow-hidden rounded-[18px] border border-[#d4af67]/45 bg-[#3a0710] shadow-[0_18px_55px_rgba(67,8,19,0.22)] md:min-h-[340px] md:rounded-[24px] lg:min-h-[340px]"
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

        <div className="relative z-10 flex min-h-[300px] flex-col items-center justify-start px-2 pb-8 pt-8 text-center md:min-h-[340px] md:justify-center md:px-8 md:py-6 lg:min-h-[340px]">
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

          <div className="mb-1.5 flex flex-col items-center md:mb-6">
            {/* Decorative wordmark layer: replaceable later with the final transparent SVG asset. */}
            <div className="relative inline-flex items-center">
              <span className="font-serif text-2xl font-semibold italic leading-none tracking-[-0.08em] text-[#f8e5b1] drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)] md:text-5xl">
                CityEve
              </span>
              <span className="absolute -bottom-3 left-1/2 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d4af67] to-transparent md:w-32" />
            </div>
          </div>

          <div className="max-w-3xl px-1">
            <h1 className="text-lg font-black leading-[1.08] tracking-tight text-white drop-shadow-md md:text-4xl lg:text-4xl">
              {isAr ? (
                <>كل الفعاليات <span className="text-[#edc56d]">في مكان واحد</span></>
              ) : (
                <>Every event <span className="text-[#edc56d]">in one place</span></>
              )}
            </h1>
            <p className="mx-auto mt-1 max-w-2xl text-[10px] font-medium leading-4 text-[#f6e8c8]/85 md:mt-2 md:text-xs lg:text-sm">
              {isAr
                ? 'اكتشف أفضل الحفلات والرحلات والدورات والخدمات، واحجز تجربتك القادمة بسهولة.'
                : 'Discover parties, trips, courses, and services — then book your next experience with ease.'}
            </p>
          </div>

          <div className="mt-3 w-full max-w-2xl md:mt-4">
            <button
              type="button"
              onClick={handleExplore}
              className="group flex w-full items-center gap-2 rounded-2xl border border-[#e0be75]/70 bg-[#fffaf0] px-2.5 py-1.5 text-right text-[#6a1520] shadow-[0_12px_35px_rgba(30,0,6,0.28)] transition hover:bg-white md:px-3 md:py-2"
            >
              <span className="flex h-7 w-7 shrink-0 md:h-8 md:w-8 items-center justify-center rounded-xl bg-[#6b101c] text-[#f0c66e] transition group-hover:bg-[#841526]">
                <Search className="h-4.5 w-4.5 md:h-5 md:w-5" />
              </span>
              <span className="flex-1 text-[10px] font-semibold leading-4 text-[#7c5b57] md:text-sm">
                {isAr ? 'ابحث عن حفلة، دورة، رحلة أو خدمة...' : 'Search for a party, course, trip, or service...'}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#d4a84f] text-[#3d0711]">
                {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </span>
            </button>
          </div>

          <div className="mt-2 flex max-w-4xl flex-wrap justify-center gap-1 px-1 md:mt-3 md:gap-2">
            {categories.map((category) => (
              <motion.button
                key={category.en}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleExplore}
                className="rounded-full border border-[#f4d78d]/55 bg-[#4a0913]/70 px-2 py-1 text-[9px] font-bold text-[#fff0c8] backdrop-blur-sm transition hover:border-[#f4d78d] hover:bg-[#791524] md:px-3 md:text-xs"
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
