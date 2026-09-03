import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Calendar, Ticket, ArrowLeft, ArrowRight, Flame, PlusCircle, Smartphone, MapPin, Music } from 'lucide-react';
import { motion } from 'motion/react';

interface MainHeroHeaderBannerProps {
  onExploreClick?: () => void;
  onPostAdClick?: () => void;
}

export const MainHeroHeaderBanner: React.FC<MainHeroHeaderBannerProps> = ({
  onExploreClick,
  onPostAdClick
}) => {
  const { lang, appAssets } = useApp();
  const isAr = lang === 'ar';

  const customBannerUrlAr = appAssets?.app_hero_banner_url;
  const customBannerUrlEn = appAssets?.app_hero_banner_url_en;

  const activeBannerUrl = isAr ? customBannerUrlAr : customBannerUrlEn;

  // Optimize Cloudinary banner images for ultra-fast load speed (WebP/AVIF auto compression)
  const optimizedBannerSrc = React.useMemo(() => {
    if (!activeBannerUrl) return '';
    if (activeBannerUrl.includes('res.cloudinary.com') && activeBannerUrl.includes('/image/upload/')) {
      if (!activeBannerUrl.includes('/f_auto') && !activeBannerUrl.includes('/q_auto')) {
        return activeBannerUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_1400/');
      }
    }
    return activeBannerUrl;
  }, [activeBannerUrl]);

  const handleExplore = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      const searchSec = document.getElementById('search-section');
      if (searchSec) {
        searchSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
    }
  };

  return (
    <section 
      aria-label="CityEVE Hero Banner"
      className="relative w-full overflow-hidden bg-transparent text-white transition-all pt-2 sm:pt-3 px-3 sm:px-6"
    >
      {/* If custom banner image is provided for current language, render it cleanly */}
      {activeBannerUrl ? (
        <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 shadow-md bg-neutral-950">
          <img
            src={optimizedBannerSrc || activeBannerUrl}
            alt={isAr ? "CityEVE - اكبر الحفلات والفعاليات في جيبك" : "CityEVE - The Biggest Parties & Events in Your Pocket"}
            className="w-full h-auto object-cover max-h-[260px] sm:max-h-[340px] md:max-h-[380px] will-change-transform block"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            referrerPolicy="no-referrer"
          />

          {/* Light gentle bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

          {/* Ultra-Prominent Action Overlay Floating on Banner */}
          <div className="absolute bottom-3 sm:bottom-4 inset-x-0 z-30 px-3 sm:px-6 flex justify-center pointer-events-none">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onPostAdClick}
              className="pointer-events-auto group relative w-full max-w-md sm:max-w-lg md:max-w-xl flex items-center justify-between py-2 px-3 sm:py-2.5 sm:px-4 rounded-2xl sm:rounded-3xl bg-neutral-950/85 hover:bg-neutral-950/95 backdrop-blur-md border-2 border-amber-400/40 hover:border-amber-400 shadow-2xl shadow-black/80 transition-all cursor-pointer overflow-hidden text-right"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Subtle shining gradient accent */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 flex items-center gap-2.5 sm:gap-3.5">
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-neutral-950 shadow-md shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="text-sm sm:text-base md:text-lg font-black text-white group-hover:text-amber-300 transition-colors drop-shadow-md">
                    {isAr ? 'إضافة إعلان' : 'Post Event'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold text-[#F5E6D8] bg-[#500610]/90 border border-[#D4AF37]/60 shadow-md">
                    <span className="text-xs sm:text-sm">🎁</span>
                    <span className="text-amber-300">{isAr ? 'مجاناً حتى 1 نوفمبر' : 'Free until Nov 1st'}</span>
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/15 text-white group-hover:bg-amber-400 group-hover:text-neutral-950 transition-all shrink-0 shadow-sm">
                {isAr ? <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /> : <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}
              </div>
            </motion.button>
          </div>
        </div>
      ) : (
        /* Full Dynamic High-End Canvas Banner matching the uploaded graphic - Optimized for high performance */
        <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 shadow-md bg-neutral-950 min-h-[300px] sm:min-h-[340px] flex items-center">
          {/* Background Concert Crowd & Stage Lighting - Optimized size & opacity */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 will-change-transform"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=75')`
            }}
          />

          {/* High-Performance Gradient Overlays without heavy blur filters */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/70 z-10" />
          
          {/* Lightweight Radial Ambient Lights (CSS radial gradient instead of heavy blur-3xl) */}
          <div 
            className="absolute top-0 right-1/4 w-80 h-80 pointer-events-none z-10 opacity-30" 
            style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(0, 0, 0, 0) 70%)' }}
          />
          <div 
            className="absolute bottom-0 right-10 w-72 h-72 pointer-events-none z-10 opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(0, 0, 0, 0) 70%)' }}
          />
          <div 
            className="absolute top-1/3 left-10 w-64 h-64 pointer-events-none z-10 opacity-25"
            style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(0, 0, 0, 0) 70%)' }}
          />

          {/* Content Container */}
          <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center" dir={isAr ? 'rtl' : 'ltr'}>
              
              {/* Left Column: Typography, Logo, and Action Buttons */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-start">
                
                {/* Brand Logo with Glowing Stars */}
                <div 
                  className="inline-flex items-center gap-3 bg-white/10 dark:bg-neutral-900/90 border border-white/20 dark:border-amber-500/30 px-4 py-2 rounded-2xl shadow-lg"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs shadow-md">
                    CE
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xl sm:text-2xl tracking-wider text-white">
                      City<span className="text-amber-400">EVE</span>
                    </span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                </div>

                {/* Main Slogan Headline */}
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] drop-shadow-md">
                    {isAr ? (
                      <>
                        أكبر <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">الحفلات والفعاليات</span> في جيبك
                      </>
                    ) : (
                      <>
                        The Biggest <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Parties & Events</span> In Your Pocket
                      </>
                    )}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-xl font-medium leading-relaxed drop-shadow">
                    {isAr 
                      ? 'استكشف، احجز، وعش التجربة مع منصة CityEVE المتكاملة للحفلات الكبرى والسهرات وأرقى الفعاليات'
                      : 'Discover, book tickets, and live the moment with CityEVE — the premier Latin dance, nightlife & festival portal'}
                  </p>
                </div>

                {/* Quick Feature Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'حجوزات فورية مباشرة' : 'Instant Direct Bookings'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-3 py-1.5 rounded-xl shadow-sm">
                    <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isAr ? 'تجربة موبايل متكاملة' : 'Mobile First Experience'}</span>
                  </span>
                </div>

                {/* Call-To-Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                  <button
                    onClick={handleExplore}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4 stroke-[2.5]" />
                    <span>{isAr ? 'استكشف الحفلات الآن' : 'Explore Events Now'}</span>
                    {isAr ? <ArrowLeft className="w-4 h-4 stroke-[2.5]" /> : <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                  </button>

                  {onPostAdClick && (
                    <button
                      onClick={onPostAdClick}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-amber-400" />
                      <span>{isAr ? 'أضف فعاليتك مجاناً' : 'Post Your Event Free'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Device Mockups & Concert Visuals */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-full">
                  {/* Floating Phone App Preview Card */}
                  <div className="relative mx-auto rounded-3xl p-3 bg-neutral-900/95 border-2 border-amber-500/40 shadow-2xl max-w-[280px] sm:max-w-[320px]">
                    
                    {/* Phone Notch / Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[11px] text-neutral-400 px-1 font-mono">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Sparkles className="w-3 h-3" />
                        <span>CityEVE Live</span>
                      </div>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ONLINE
                      </span>
                    </div>

                    {/* Miniature Card */}
                    <div className="rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800/80 shadow-inner">
                      <div className="relative h-32 w-full overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=75" 
                          alt="Party Preview" 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                        <span className="absolute top-2 right-2 bg-amber-500 text-neutral-950 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                          👑 VIP EVENT
                        </span>
                      </div>

                      <div className="p-3 space-y-1.5">
                        <h4 className="font-black text-xs text-white truncate">
                          {isAr ? 'ليالي السالسا والباتشاتا الكبرى' : 'Grand Latin Night & Festival'}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {isAr ? 'القاهرة، المعادي' : 'Cairo, Maadi'}
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {isAr ? 'حجز فوري' : 'Open'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-neutral-800/60 text-center text-[10px]">
                      <div className="bg-neutral-950/60 rounded-xl p-1.5 border border-neutral-800">
                        <span className="text-neutral-400 block">{isAr ? 'الفعاليات' : 'Events'}</span>
                        <strong className="text-white font-mono font-bold">+500</strong>
                      </div>
                      <div className="bg-neutral-950/60 rounded-xl p-1.5 border border-neutral-800">
                        <span className="text-neutral-400 block">{isAr ? 'المشتركين' : 'Members'}</span>
                        <strong className="text-amber-400 font-mono font-bold">+25,000</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </section>
  );
};
