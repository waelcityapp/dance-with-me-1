import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceEvent, getStyleLabel } from '../../types';
import { Volume2, VolumeX, MapPin, Calendar, Heart, Share2, Phone, MessageCircle, Clock, CheckCircle, ShieldAlert, Trash2, Edit, Pause, Play, Maximize2, Eye, Crown, Sparkles, UserCheck, User, BellRing, Smartphone, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate, getDaysRemainingBeforeExpiry } from '../../utils/dateUtils';
import { isGoogleDriveUrl, getGoogleDrivePreviewUrl, getSafePlayableVideoUrl } from '../../lib/mediaUtils';
import { FullscreenVideoModal } from './FullscreenVideoModal';
import { BroadcastPushModal } from '../modals/BroadcastPushModal';
import { logAnalyticsEvent } from '../../lib/firebase';

interface EventCardProps {
  event: DanceEvent;
  index?: number;
  onOpenMap: (event: DanceEvent) => void;
  onOpenShare: (event: DanceEvent) => void;
  overrideAdType?: 'vip' | 'standard';
  isFavoritesTab?: boolean;
  hideAdminControls?: boolean;
  isHighlighted?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, index, onOpenMap, onOpenShare, overrideAdType, isFavoritesTab, hideAdminControls, isHighlighted }) => {
  const { 
    lang, 
    toggleLikeEvent, 
    user, 
    bookTicket, 
    openGuestAlert, 
    deleteEvent,
    togglePauseEvent,
    setEditingEvent,
    setActiveTab,
    setAdminSelectedUserId
  } = useApp();

  const displayAdType = overrideAdType || event.adType;
  console.log("EVENT CARD", event.titleAr, event.eventRef, user?.isAdmin);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreenVideoOpen, setIsFullscreenVideoOpen] = useState(false);
  const [aspectRatioClass, setAspectRatioClass] = useState('aspect-[16/10]');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setAspectRatioClass('aspect-[16/10]');
  }, [event.mediaUrl]);

  const openFullscreenVideo = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setIsFullscreenVideoOpen(true);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.error("Playback failed:", err);
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const isLiked = user?.likedEventIds.includes(event.id);
  const expiryInfo = getDaysRemainingBeforeExpiry(event.eventDate);
  const isExpired = event.isExpiredBy15DaysRule || expiryInfo.isExpired;

  const categoryLabels: Record<string, { ar: string; en: string; color: string }> = {
    party: { ar: 'حفلة وسهرة', en: 'Party & Social', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    course: { ar: 'كورس متخصّص', en: 'Masterclass', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    trip: { ar: 'رحلة / معسكر', en: 'Dance Camp', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    exhibition: { ar: 'معارض ومؤتمرات', en: 'Exhibition & Conference', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
  };

  const currentCat = categoryLabels[event.category] || categoryLabels.party;

  return (
    <motion.div
      id={`event-${event.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1.5 ${
        isHighlighted
          ? 'ring-4 ring-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.5)] border-amber-400 scale-[1.01] z-30'
          : isExpired
            ? 'border-neutral-200 dark:border-white/5 bg-white/70 dark:bg-neutral-900/60 opacity-80 shadow-md dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)]'
            : displayAdType === 'vip'
              ? 'border-amber-400/60 dark:border-amber-500/40 bg-white dark:bg-neutral-900 shadow-xl shadow-amber-500/10 dark:shadow-[0_22px_48px_rgba(245,158,11,0.12)] hover:border-amber-500 dark:hover:border-amber-400/80 hover:shadow-2xl'
              : 'border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg dark:shadow-[0_22px_48px_rgba(0,0,0,0.7)] hover:border-neutral-300 dark:hover:border-white/25 hover:shadow-xl'
      }`}
    >

      {/* Absolute Vertical Red Accent Line */}
      <div className={`absolute left-0 top-0 bottom-0 w-[5px] z-30 ${
        isExpired ? 'bg-red-800' : 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]'
      }`} />

      {/* Topmost accent border line */}
      <div className={`h-1 w-full shrink-0 bg-gradient-to-r ${
        displayAdType === 'vip' 
          ? 'from-amber-600 via-amber-400 to-amber-500 animate-pulse' 
          : 'from-neutral-400 via-neutral-300 to-neutral-400 dark:from-neutral-700 dark:via-neutral-500 dark:to-neutral-600'
      }`} />

      {/* Top Header Labeling to mark beginning of the ad container */}
      <div className={`px-4 py-2.5 flex items-center justify-between text-[11px] font-black tracking-wide uppercase border-b select-none shrink-0 ${
        displayAdType === 'vip'
          ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/20 text-amber-700 dark:text-amber-400'
          : 'bg-neutral-100/70 dark:bg-neutral-950/40 border-neutral-200 dark:border-white/5 text-neutral-500 dark:text-neutral-400'
      }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-1.5">
          {displayAdType === 'vip' ? (
            <>
              <Crown className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>{lang === 'ar' ? 'إعلان مميز VIP' : 'VIP FEATURED AD'}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
              <span>{lang === 'ar' ? 'إعلان عادي' : 'STANDARD AD'}</span>
            </>
          )}
        </div>
        <div className="text-[10px] font-mono opacity-60">
          {event.adNumber ? `${lang === 'ar' ? 'رقم الإعلان' : 'AD'} #${event.adNumber}` : ''}
        </div>
      </div>

      {/* Floating Top Badges at the Media boundary (centered vertically on the line) */}
      <div className="absolute top-[40px] -translate-y-1/2 inset-x-2.5 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold border backdrop-blur-md shadow-md ${currentCat.color}`}>
            {lang === 'ar' ? currentCat.ar : currentCat.en}
          </span>
          {user?.isAdmin && !hideAdminControls && (
            <span 
              className="flex h-6 px-2 items-center justify-center rounded-lg bg-neutral-950/90 border border-amber-500/30 text-[10px] font-extrabold text-amber-400 font-mono shadow-md backdrop-blur-sm" 
              title={lang === 'ar' ? 'الترتيب في الصفحة' : 'Page order'}
            >              #{typeof index === 'number' && !Number.isNaN(index) ? index + 1 : ''}
              {typeof event.position === 'number' && !Number.isNaN(event.position) && event.position !== 999999 && event.position !== 0 && (
                <span className="text-[10px] text-neutral-400 font-bold ml-1">
                  ({event.position})
                </span>
              )}
              {(index === undefined || Number.isNaN(index)) && (event.position === undefined || Number.isNaN(event.position) || event.position === 999999 || event.position === 0) && '-'}            </span>
          )}
        </div>

        {/* Expiry Timer Badge */}
        {!isExpired && (
          <span className="flex items-center gap-1 rounded-lg bg-neutral-950/80 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-neutral-800 backdrop-blur-md pointer-events-auto shadow-md">
            <Clock className="h-2.5 w-2.5 text-amber-400" />
            <span>{lang === 'ar' ? `ينتهي بعد: ${expiryInfo.days > 0 ? `${expiryInfo.days} يوم` : `${expiryInfo.hours} ساعة`}` : `${expiryInfo.days > 0 ? `${expiryInfo.days}d` : `${expiryInfo.hours}h`} left`}</span>
          </span>
        )}
      </div>

      {/* Expired Ribbon Warning if expired */}
      {isExpired && (
        <div className="absolute top-0 inset-x-0 z-30 bg-red-600 py-1 px-4 text-center text-xs font-bold text-white shadow-md backdrop-blur-sm flex items-center justify-center gap-1.5">
          <ShieldAlert className="h-4 w-4" />
          <span>
            {lang === 'ar'
              ? 'انقضت مدة العرض - في الأرشيف الآن'
              : 'Promo Expired - In Archive'}
          </span>
        </div>
      )}





      {/* Admin Floating Control Toolbar */}
      {user?.isAdmin && !hideAdminControls && (
        <div className="absolute top-14 left-4 right-4 z-30 flex flex-wrap gap-2 justify-end pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap gap-2 bg-neutral-950/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
            {/* Position Display */}
            <div 
              className="flex h-9 px-3 items-center justify-center rounded-xl bg-neutral-950/80 border border-amber-500/50 text-[11px] font-black text-amber-400 font-mono shadow-md select-all"
              title={lang === 'ar' ? 'الترتيب في الصفحة والموضع' : 'Page order & position'}
            >
              #{typeof index === 'number' && !Number.isNaN(index) ? index + 1 : ''}
              {typeof event.position === 'number' && !Number.isNaN(event.position) && event.position !== 999999 && event.position !== 0 && (
                <span className="text-[10px] text-neutral-400 font-bold ml-1">
                  ({event.position})
                </span>
              )}
              {(index === undefined || Number.isNaN(index)) && (event.position === undefined || Number.isNaN(event.position) || event.position === 999999 || event.position === 0) && '-'}
            </div>
            {/* Creator Profile Button */}
            {event.creatorId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setAdminSelectedUserId(event.creatorId!);
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all border border-purple-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                title={lang === 'ar' ? 'عرض ملف منشئ الإعلان' : 'View Ad Creator Profile'}
              >
                <User className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            )}
            {/* Broadcast Push Alert Button (Admin Only) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsBroadcastModalOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 shadow-md transition-all border border-amber-400/50 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'بث إشعار فوري لشاشات الموبايل (مثل الواتساب 📱)' : 'Broadcast Push Notification to Mobile Screens'}
            >
              <BellRing className="h-4.5 w-4.5 stroke-[2.5] animate-bounce" />
            </button>
            {/* Pause / Resume button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                togglePauseEvent(event.id);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all border hover:scale-105 active:scale-95 cursor-pointer ${
                event.isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-400/30'
              }`}
              title={event.isPaused 
                ? (lang === 'ar' ? 'إعادة تشغيل الإعلان' : 'Resume Ad') 
                : (lang === 'ar' ? 'إيقاف مؤقت للإعلان' : 'Pause Ad')
              }
            >
              {event.isPaused ? <Play className="h-4.5 w-4.5 fill-current" /> : <Pause className="h-4.5 w-4.5 fill-current" />}
            </button>
            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setEditingEvent(event);
                setActiveTab('edit_ad_admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all border border-blue-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'تعديل الإعلان' : 'Edit Ad'}
            >
              <Edit className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
            {/* Delete button (triggers local confirm) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-all border border-red-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'حذف الإعلان نهائياً' : 'Delete Ad Permanently'}
            >
              <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Banner Media Section (Video or Image) */}
      <div className={`relative w-full overflow-hidden bg-neutral-950 transition-all duration-500 ${aspectRatioClass}`}>
        {/* Paused Overlay with 'X' mark */}
        {event.isPaused && (
          <div className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 text-red-500 border border-red-500/40 shadow-xl">
              <span className="text-2xl font-black font-sans leading-none">X</span>
            </div>
            <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider px-2.5 py-1 bg-red-950/60 border border-red-800/40 rounded-lg">
              {lang === 'ar' ? 'موقوف مؤقتاً (مخفي عن المستخدمين)' : 'Temporarily Paused (Hidden from users)'}
            </span>
          </div>
        )}
        {isGoogleDriveUrl(event.mediaUrl) ? (
          <iframe
            src={getGoogleDrivePreviewUrl(event.mediaUrl) || event.mediaUrl}
            className="h-full w-full border-0 bg-neutral-950"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
          />
        ) : getSafePlayableVideoUrl(event.mediaUrl) ? (
          <video
            ref={videoRef}
            src={getSafePlayableVideoUrl(event.mediaUrl)}
            poster={event.thumbnailUrl || undefined}
            playsInline
            muted={isMuted}
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              if (video.videoHeight > video.videoWidth) {
                setAspectRatioClass('aspect-[9/16] max-h-[500px] sm:max-h-[550px]');
              } else {
                setAspectRatioClass('aspect-[16/10]');
              }
            }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <img
            src={event.mediaUrl}
            alt={lang === 'ar' ? event.titleAr : event.titleEn}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalHeight > img.naturalWidth) {
                setAspectRatioClass('aspect-[9/16] max-h-[500px] sm:max-h-[550px]');
              } else {
                setAspectRatioClass('aspect-[16/10]');
              }
            }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 card-gradient pointer-events-none" />
      </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5 relative z-10 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 transition-colors">
          {/* Content Box (Title, Price, description) */}
          <div className="mb-4">
            <h3 className="mb-2 text-base sm:text-lg font-black tracking-tight text-neutral-900 dark:text-white line-clamp-2 leading-snug">
              {lang === 'ar' ? event.titleAr : event.titleEn}
            </h3>
            {/* Price Badge */}
            {(event.priceAr || event.priceEn) && (
              <div className="mb-3 inline-block rounded-lg bg-amber-500/10 px-2.5 py-1 border border-amber-500/30">
                <span className="text-xs font-black tracking-wide text-amber-700 dark:text-amber-400">
                  {lang === 'ar' ? event.priceAr : event.priceEn}
                </span>
              </div>
            )}
          <p className={`text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed ${isDescExpanded ? '' : 'line-clamp-2'}`}>
            {lang === 'ar' ? (event.descriptionAr || event.descriptionEn) : (event.descriptionEn || event.descriptionAr)}
          </p>
          {((lang === 'ar' ? (event.descriptionAr || event.descriptionEn) : (event.descriptionEn || event.descriptionAr)) || '').length > 120 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDescExpanded(!isDescExpanded);
              }}
              className="mt-1.5 text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 focus:outline-none bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/20 hover:border-amber-500/40"
            >
              <span>
                {isDescExpanded 
                  ? (lang === 'ar' ? 'عرض تفاصيل أقل ⬆️' : 'Show less details ⬆️') 
                  : (lang === 'ar' ? 'مزيد من التفاصيل... ⬇️' : 'More details... ⬇️')
                }
              </span>
            </button>
          )}
        </div>

        {/* Date, Organizer & Location Details */}
        <div className="space-y-2 mb-4 rounded-2xl bg-white dark:bg-neutral-950 p-3.5 border border-neutral-200 dark:border-neutral-800 text-xs shadow-xs transition-colors">
          {/* Event Date */}
          <div className="flex items-center gap-2.5 text-neutral-950 dark:text-neutral-200">
            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-bold">{formatDate(event.eventDate, lang)}</span>
          </div>

          {/* Organizer Name */}
          {event.contact?.organizerName && (
            <div className="flex items-center gap-2.5 text-neutral-950 dark:text-neutral-200">
              <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium shrink-0">{lang === 'ar' ? 'المنظم:' : 'Organizer:'}</span>
                <span className="font-bold text-neutral-950 dark:text-white truncate">{event.contact.organizerName}</span>
              </div>
            </div>
          )}

          {/* Venue, Area & Governorate */}
          <div 
            onClick={() => {
              onOpenMap(event);
              logAnalyticsEvent('clicks_maps');
            }}
            className="flex items-start justify-between gap-2 text-neutral-950 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer group/map transition-colors pt-1 border-t border-neutral-100 dark:border-neutral-800/60"
          >
            <div className="flex items-start gap-2.5 overflow-hidden min-w-0">
              <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 group-hover/map:scale-110 transition-transform" />
              <div className="flex flex-col min-w-0">
                <span className="truncate underline decoration-neutral-300 dark:decoration-neutral-700 group-hover/map:decoration-amber-500 font-bold leading-tight">
                  {lang === 'ar' ? event.location.nameAr : event.location.nameEn}
                </span>
                {(event.location?.areaAr || event.location?.governorateAr || event.location?.areaEn || event.location?.governorateEn || event.location?.addressAr || event.location?.addressEn) && (
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-semibold mt-0.5 leading-tight">
                    {lang === 'ar' 
                      ? [event.location?.areaAr, event.location?.governorateAr].filter(Boolean).join(' - ') || event.location?.addressAr
                      : [event.location?.areaEn, event.location?.governorateEn].filter(Boolean).join(' - ') || event.location?.addressEn
                    }
                  </span>
                )}
              </div>
            </div>
            {event.location?.googleMapsUrl && event.location.googleMapsUrl.trim().length > 0 && (
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-black shrink-0 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse font-sans mt-0.5">
                {lang === 'ar' ? 'الخريطة 🗺️' : 'Map 🗺️'}
              </span>
            )}
          </div>
        </div>

        {/* Admin Event Reference Number Badge */}
        {user?.isAdmin && !hideAdminControls && event.eventRef && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-400 font-mono text-xs flex items-center justify-between">
            <span className="font-semibold">{lang === 'ar' ? 'الرقم المرجعي (أدمن فقط):' : 'Reference Number (Admin Only):'}</span>
            <span className="font-bold bg-white dark:bg-indigo-500/10 text-neutral-950 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">{event.eventRef}</span>
          </div>
        )}

        {/* Admin Event Creator Info Badge */}
        {user?.isAdmin && !hideAdminControls && (
          <div 
            onClick={(e) => {
              if (event.creatorId) {
                e.preventDefault();
                e.stopPropagation();
                setAdminSelectedUserId(event.creatorId);
                setActiveTab('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`mb-3 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/20 text-purple-900 dark:text-purple-400 font-sans text-xs flex flex-col gap-1 transition-all ${event.creatorId ? 'cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:border-purple-500/50 active:scale-[0.98]' : ''}`}
          >
            <span className="font-semibold flex items-center justify-between">
              <span>{lang === 'ar' ? 'معلومات الإنشاء (أدمن فقط):' : 'Creation Info (Admin Only):'}</span>
              {event.creatorId && (
                <User className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="font-bold text-[11px] bg-white dark:bg-purple-500/10 text-neutral-950 dark:text-purple-300 px-2 py-1 rounded border border-purple-200 dark:border-purple-500/30">
              {event.createdByAdmin === true || (!event.creatorId && (event.contact.organizerName === 'إدارة DWM للرقص' || event.contact.organizerName === 'الإدارة')) 
                ? (lang === 'ar' ? 'تم إنشاء هذا الإعلان بواسطة الإدارة' : 'This ad was created by Management')
                : (lang === 'ar' 
                    ? `تم إنشاء هذا الإعلان بواسطة المستخدم (${event.creatorName || event.contact.organizerName})` 
                    : `This ad was created by User (${event.creatorName || event.contact.organizerName})`)
              }
            </span>
          </div>
        )}

        {/* Admin Direct Mobile Push Broadcast Bar */}
        {user?.isAdmin && !hideAdminControls && (
          <div className="mb-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 font-bold">
              <Smartphone className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{lang === 'ar' ? 'إشعار شاشات الموبايل (Push):' : 'Broadcast Lock Screen Push:'}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsBroadcastModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title={lang === 'ar' ? 'إرسال إشعار فوري لجميع المستخدمين على شاشات الموبايل' : 'Broadcast to all user mobile screens'}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إرسال إشعار للمستخدمين 📱' : 'Send Push Alert 📱'}</span>
            </button>
          </div>
        )}

        {/* Action Buttons Bar: Phone, WhatsApp, Share, Like, Book */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-auto flex-wrap">
          {/* Contact Actions */}
          <div className="flex items-center gap-1.5">
            {user?.isAdmin && !hideAdminControls && (
              <div className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" title={lang === 'ar' ? 'عدد مشاهدات الإعلان' : 'Ad Views Count'}>
                <Eye className="h-4 w-4" />
                <span className="font-mono">{event.viewsCount || 0}</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                if (!user) {
                  openGuestAlert('contact');
                  return;
                }
                logAnalyticsEvent('clicks_phone');
                window.location.href = `tel:${event.contact.phone}`;
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 border border-neutral-200 dark:border-neutral-800 transition-all font-bold cursor-pointer"
              title={lang === 'ar' ? `اتصال: ${event.contact.phone}` : `Call: ${event.contact.phone}`}
            >
              <Phone className="h-4 w-4" />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                if (!user) {
                  openGuestAlert('contact');
                  return;
                }
                logAnalyticsEvent('clicks_whatsapp');
                const url = `https://wa.me/${event.contact.whatsapp}?text=${encodeURIComponent(lang === 'ar' ? `مرحباً، استفسار بخصوص: ${event.titleAr}` : `Hello, inquiry about: ${event.titleEn}`)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-neutral-800 transition-all font-bold cursor-pointer"
              title={lang === 'ar' ? 'واتساب للمنظم' : 'WhatsApp Organizer'}
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>

          {/* Social & Booking Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Share */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenShare(event)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 border border-neutral-200 dark:border-neutral-800 transition-all cursor-pointer"
              title={lang === 'ar' ? 'مشاركة الإعلان' : 'Share'}
            >
              <Share2 className="h-4 w-4" />
            </motion.button>

            {/* Like / Remove from Favorites */}
            {isFavoritesTab ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleLikeEvent(event.id);
                }}
                className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold border border-red-500/30 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                title={lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from Favorites'}
              >
                <Trash2 className="h-4 w-4 text-red-500 group-hover:text-white" />
                <span>{lang === 'ar' ? 'إزالة' : 'Remove'}</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => toggleLikeEvent(event.id, e.currentTarget)}
                className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold border transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-red-600 text-white border-red-500 shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-red-500 hover:bg-red-600 hover:text-white border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-mono">{String(event.likesCount || 0)}</span>
              </motion.button>
            )}

            {/* Book Now & Price/Promo Subtext */}
            {event.showBookingButton !== false && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => bookTicket(event.id)}
                  className="flex h-10 items-center justify-center rounded-xl px-6 sm:px-8 min-w-[120px] sm:min-w-[140px] text-xs font-bold transition-all bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-lg cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'احجز الآن' : 'Book Now'}</span>
                </motion.button>
                {(event.bookingSubtextAr || event.bookingSubtextEn || event.priceAr || event.priceEn) && (
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-700 dark:text-amber-400 text-center max-w-[160px] sm:max-w-[200px] leading-tight break-words" title={lang === 'ar' ? (event.bookingSubtextAr || event.priceAr || event.bookingSubtextEn || event.priceEn) : (event.bookingSubtextEn || event.priceEn || event.bookingSubtextAr || event.priceAr)}>
                    {lang === 'ar' ? (event.bookingSubtextAr || event.priceAr || event.bookingSubtextEn || event.priceEn) : (event.bookingSubtextEn || event.priceEn || event.bookingSubtextAr || event.priceAr)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal for ultimate player experience */}
      <FullscreenVideoModal
        isOpen={isFullscreenVideoOpen}
        onClose={() => setIsFullscreenVideoOpen(false)}
        videoUrl={event.mediaUrl}
        posterUrl={event.thumbnailUrl || undefined}
        titleAr={event.titleAr}
        titleEn={event.titleEn}
      />
      {/* Delete Confirmation Modal for Admins */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
              </h3>
              <p className="text-sm text-neutral-400">
                {lang === 'ar' ? 'هل أنت متأكد من حذف هذا الإعلان نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.' : 'Are you sure you want to permanently delete this ad? This action cannot be undone.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-neutral-800">
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                className="bg-neutral-900 py-4 text-sm font-bold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                  deleteEvent(event.id);
                  alert(lang === 'ar' ? 'تم حذف الإعلان نهائياً ولن يظهر للمستخدمين بعد الآن.' : 'Ad deleted successfully and is now hidden from users.');
                }}
                className="bg-neutral-900 py-4 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                {lang === 'ar' ? 'حذف الإعلان' : 'Delete Ad'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Broadcast Push Modal for Admins */}
      <BroadcastPushModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        event={event}
      />
    </motion.div>
  );
};
