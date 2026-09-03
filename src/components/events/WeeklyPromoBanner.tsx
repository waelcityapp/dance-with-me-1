import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceEvent, getStyleLabel } from '../../types';
import { Volume2, VolumeX, Sparkles, MapPin, Calendar, Heart, Share2, Phone, MessageCircle, Trash2, Edit, Pause, Play, Maximize2, Eye, EyeOff, Crown, UserCheck, User, BellRing, Smartphone, Radio, ZoomIn } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate, getDaysRemainingBeforeExpiry } from '../../utils/dateUtils';
import { isGoogleDriveUrl, getGoogleDrivePreviewUrl, getSafePlayableVideoUrl } from '../../lib/mediaUtils';
import { FullscreenVideoModal } from './FullscreenVideoModal';
import { EventImageLightboxModal } from './EventImageLightboxModal';
import { BroadcastPushModal } from '../modals/BroadcastPushModal';

interface WeeklyPromoBannerProps {
  promoEvent: DanceEvent;
  onOpenMap: (event: DanceEvent) => void;
  onOpenShare: (event: DanceEvent) => void;
}

export const WeeklyPromoBanner: React.FC<WeeklyPromoBannerProps> = ({ promoEvent, onOpenMap, onOpenShare }) => {
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
    setAdminSelectedUserId,
    appAssets,
    setSelectedViewsEvent,
    recordEventView
  } = useApp();

  // Auto record view for promo event
  useEffect(() => {
    if (promoEvent && promoEvent.id) {
      recordEventView(promoEvent.id);
    }
  }, [promoEvent?.id]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreenVideoOpen, setIsFullscreenVideoOpen] = useState(false);
  const [aspectRatioClass, setAspectRatioClass] = useState('aspect-video');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
    setAspectRatioClass('aspect-video');
  }, [promoEvent.mediaUrl]);

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

  const isLiked = user?.likedEventIds.includes(promoEvent.id);
  const expiryInfo = getDaysRemainingBeforeExpiry(promoEvent.eventDate);

  return (
    <div id={`event-${promoEvent.id}`} className="relative mb-8 overflow-hidden rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl dark:shadow-[0_25px_55px_rgba(0,0,0,0.8)] hover:border-neutral-300 dark:hover:border-white/20 hover:shadow-2xl dark:hover:shadow-[0_35px_70px_rgba(0,0,0,0.95)] hover:-translate-y-1.5 gold-glow-lg transition-all duration-300">
      {/* Absolute Vertical Accent Line matching Main Banner */}
      <div className="absolute start-0 top-0 bottom-0 w-1.5 z-30 bg-gradient-to-b from-[#5B0813] via-[#8B1528] to-[#5B0813] border-e border-amber-400/50 shadow-[0_0_12px_rgba(120,16,31,0.7)]" />

      {/* Top Header Labeling to mark beginning of the ad container */}
      <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-black tracking-wide uppercase border-b bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/20 text-amber-700 dark:text-amber-400 select-none shrink-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          <span>{lang === 'ar' ? (appAssets?.promoTitleAr || 'فيديو الأسبوع الحصري المميز VIP') : (appAssets?.promoTitleEn || 'EXCLUSIVE WEEKLY VIP FEATURED VIDEO')}</span>
        </div>
        <div className="text-[10px] font-mono opacity-60">
          {lang === 'ar' ? (appAssets?.promoSubtitleAr || 'إعلان خاص') : (appAssets?.promoSubtitleEn || 'SPECIAL AD')}
        </div>
      </div>

      {/* Top Badge floating exactly at the image/video boundary */}
      <div className="absolute top-[40px] -translate-y-1/2 inset-x-2.5 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#5B0813] via-[#78101F] to-[#5B0813] px-2.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-lg backdrop-blur-md border border-amber-400/40">
            <Sparkles className="h-2.5 w-2.5 fill-current text-amber-300" />
            <span>{lang === 'ar' ? (appAssets?.promoBadgeAr || 'فيديو الأسبوع الحصري') : (appAssets?.promoBadgeEn || 'Weekly Featured Video')}</span>
          </div>
          {user?.isAdmin && (
            <span className="flex h-6 px-2 items-center justify-center rounded-lg bg-neutral-950/90 border border-amber-500/30 text-[10px] font-extrabold text-amber-400 font-mono shadow-md backdrop-blur-sm" title={lang === 'ar' ? 'رقم الترتيب' : 'Placement Position'}>              #{promoEvent.position && promoEvent.position !== 999999 ? promoEvent.position : 1}            </span>
          )}
        </div>

        <div className="rounded-full bg-neutral-950/80 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-neutral-800 backdrop-blur-md pointer-events-auto shadow-lg">
          ⏳ {lang === 'ar' ? `متبقي على العرض: ${expiryInfo.days > 0 ? `${expiryInfo.days} يوم` : `${expiryInfo.hours} ساعة`}` : `Promo Ends in: ${expiryInfo.days > 0 ? `${expiryInfo.days}d` : `${expiryInfo.hours}h`}`}
        </div>
      </div>

      {/* Custom Confirmation Overlay for Admin Deletion (Iframe-safe, no browser popup) */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 bg-neutral-950/98 flex flex-col items-center justify-center p-6 text-center border-2 border-red-500/30 rounded-3xl animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 text-red-500 border border-red-500/30 mb-2">
            <Trash2 className="h-5 w-5 stroke-[2]" />
          </div>
          <h4 className="text-base font-extrabold text-white">
            {lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?'}
          </h4>
          <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
            {lang === 'ar' 
              ? `سيتم حذف إعلان "${promoEvent.titleAr}" نهائياً من قاعدة البيانات ولا يمكن استرجاعه.` 
              : `This will permanently delete "${promoEvent.titleEn}" from the database.`}
          </p>
          <div className="flex items-center gap-3 w-full max-w-[240px] mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                deleteEvent(promoEvent.id);
                setShowDeleteConfirm(false);
                alert(lang === 'ar' ? 'تم حذف الإعلان نهائياً ولن يظهر للمستخدمين بعد الآن.' : 'Ad deleted successfully and is now hidden from users.');
              }}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white py-2.5 px-4 text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              {lang === 'ar' ? 'نعم، احذف' : 'Yes, Delete'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteConfirm(false);
              }}
              className="flex-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2.5 px-4 text-xs font-bold border border-neutral-700 transition-all active:scale-95 cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}



      {/* Admin Floating Control Toolbar */}
      {user?.isAdmin && (
        <div className="absolute top-14 left-4 right-4 z-30 flex flex-wrap gap-2 justify-end pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap gap-2 bg-neutral-950/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
            {/* Position Display */}
            <div 
              className="flex h-9 px-3 items-center justify-center rounded-xl bg-neutral-950/80 border border-amber-500/50 text-[11px] font-black text-amber-400 font-mono shadow-md select-all"
              title={lang === 'ar' ? 'الموضع والترتيب' : 'Placement position'}
            >
              #{promoEvent.position && promoEvent.position !== 999999 ? promoEvent.position : 1}
            </div>

            {/* Creator Profile Button */}
            {promoEvent.creatorId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setAdminSelectedUserId(promoEvent.creatorId!);
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
                togglePauseEvent(promoEvent.id);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all border hover:scale-105 active:scale-95 cursor-pointer ${
                promoEvent.isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-400/30'
              }`}
              title={promoEvent.isPaused 
                ? (lang === 'ar' ? 'إعادة تشغيل الإعلان' : 'Resume Ad') 
                : (lang === 'ar' ? 'إيقاف مؤقت للإعلان' : 'Pause Ad')
              }
            >
              {promoEvent.isPaused ? <Play className="h-4.5 w-4.5 fill-current" /> : <Pause className="h-4.5 w-4.5 fill-current" />}
            </button>

            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setEditingEvent(promoEvent);
                setActiveTab('edit_ad_admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all border border-blue-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'تعديل الإعلان' : 'Edit Ad'}
            >
              <Edit className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-all border border-red-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'حذف الإعلان' : 'Delete Ad'}
            >
              <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
      {/* Media Player Container (Video/Image) */}
      <div className={`relative w-full overflow-hidden bg-neutral-950 transition-all duration-500 ${isGoogleDriveUrl(promoEvent.mediaUrl) || getSafePlayableVideoUrl(promoEvent.mediaUrl) ? aspectRatioClass : ''}`}>
        {/* Paused Overlay with 'X' mark */}
        {promoEvent.isPaused && (
          <div className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 text-red-500 border border-red-500/40 shadow-xl">
              <span className="text-2xl font-black font-sans leading-none">X</span>
            </div>
            <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider px-2.5 py-1 bg-red-950/60 border border-red-800/40 rounded-lg">
              {lang === 'ar' ? 'موقوف مؤقتاً (مخفي عن المستخدمين)' : 'Temporarily Paused (Hidden from users)'}
            </span>
          </div>
        )}
        {isGoogleDriveUrl(promoEvent.mediaUrl) ? (
          <iframe
            src={getGoogleDrivePreviewUrl(promoEvent.mediaUrl) || promoEvent.mediaUrl}
            className="h-full w-full border-0 bg-neutral-950"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
          />
        ) : getSafePlayableVideoUrl(promoEvent.mediaUrl) ? (
          <video
            ref={videoRef}
            src={getSafePlayableVideoUrl(promoEvent.mediaUrl)}
            poster={promoEvent.thumbnailUrl || undefined}
            playsInline
            muted={isMuted}
            loop
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              if (video.videoHeight > video.videoWidth) {
                setAspectRatioClass('aspect-[9/16] max-h-[500px] sm:max-h-[600px]');
              } else {
                setAspectRatioClass('aspect-[16/10] sm:aspect-video');
              }
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div 
            className="relative w-full cursor-pointer group/img overflow-hidden flex items-center justify-center bg-neutral-950"
            onClick={() => setIsLightboxOpen(true)}
            title={lang === 'ar' ? 'اضغط لعرض وتكبير الصورة بالكامل' : 'Click to view full image'}
          >
            <img
              src={promoEvent.mediaUrl}
              alt={lang === 'ar' ? promoEvent.titleAr : promoEvent.titleEn}
              className="w-full h-auto max-h-[650px] object-contain transition-transform duration-700 group-hover:scale-[1.02] block"
            />
            {/* Subtle Zoom Pill Badge */}
            <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-950/75 hover:bg-neutral-950/90 text-white text-[11px] font-bold backdrop-blur-md border border-white/15 shadow-lg transition-all transform opacity-80 group-hover/img:opacity-100 group-hover/img:scale-105">
              <ZoomIn className="h-3.5 w-3.5 text-amber-400" />
              <span>{lang === 'ar' ? 'تكبير الصورة' : 'Full View'}</span>
            </div>
          </div>
        )}
        {/* Play/Pause Button overlay */}
        {getSafePlayableVideoUrl(promoEvent.mediaUrl) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (videoRef.current) {
                if (isPlaying) {
                  videoRef.current.pause();
                } else {
                  videoRef.current.play().catch(console.error);
                }
              }
            }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group/play"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950/80 text-white backdrop-blur-md border border-white/10 group-hover/play:scale-110 transition-transform">
              {isPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
            </div>
          </button>
        )}
        {/* Mute/Unmute Button overlay */}
        {getSafePlayableVideoUrl(promoEvent.mediaUrl) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.muted = !videoRef.current.muted;
                setIsMuted(videoRef.current.muted);
              }
            }}
            className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/80 text-white backdrop-blur-md border border-white/10 hover:scale-110 transition-transform"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
        {/* Fullscreen Button overlay */}
        {getSafePlayableVideoUrl(promoEvent.mediaUrl) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFullscreenVideoOpen(true);
            }}
            className="absolute bottom-4 right-16 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/80 text-white backdrop-blur-md border border-white/10 hover:scale-110 transition-transform"
            title={lang === 'ar' ? 'تكبير الفيديو' : 'Fullscreen Video'}
          >
            <Maximize2 className="h-4.5 w-4.5" />
          </button>
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80" />
      </div>
        <div className="flex flex-col p-4 sm:p-5 relative z-10 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 transition-colors">
          <div className="mb-3.5">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-neutral-950 dark:text-white mb-2 line-clamp-2 leading-snug">
              {lang === 'ar' ? promoEvent.titleAr : promoEvent.titleEn}
            </h3>
            {/* Price Badge */}
            {(promoEvent.priceAr || promoEvent.priceEn) && (
              <div className="mb-3 inline-block rounded-lg bg-amber-500/10 px-2.5 py-1 border border-amber-500/30">
                <span className="text-xs font-black tracking-wide text-amber-700 dark:text-amber-400">
                  {lang === 'ar' ? promoEvent.priceAr : promoEvent.priceEn}
                </span>
              </div>
            )}
          <p className={`text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-normal ${isDescExpanded ? '' : 'line-clamp-3'}`}>
            {lang === 'ar' ? promoEvent.descriptionAr : promoEvent.descriptionEn}
          </p>
          {((lang === 'ar' ? promoEvent.descriptionAr : promoEvent.descriptionEn) || '').length > 150 && (
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

        {/* Metadata Grid (Date, Organizer, Location) - Pure white in light mode, dynamic text pure black */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5 rounded-2xl bg-white dark:bg-neutral-900/40 p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
          {/* Event Date */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 leading-none">{lang === 'ar' ? 'تاريخ الحدث' : 'Event Date'}</p>
              <p className="text-xs font-bold text-neutral-950 dark:text-white mt-1">{formatDate(promoEvent.eventDate, lang)}</p>
            </div>
          </div>

          {/* Organizer Name */}
          {promoEvent.contact?.organizerName && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <UserCheck className="h-4.5 w-4.5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 leading-none">{lang === 'ar' ? 'المنظم' : 'Organizer'}</p>
                <p className="text-xs font-bold text-neutral-950 dark:text-white mt-1 truncate">{promoEvent.contact.organizerName}</p>
              </div>
            </div>
          )}

          {/* Location with Area & Governorate */}
          <div 
            onClick={() => onOpenMap(promoEvent)}
            className="flex items-start gap-3 cursor-pointer group rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 p-1 transition-colors sm:col-span-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors shrink-0 mt-0.5">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div className="overflow-hidden w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1 leading-none">
                  {lang === 'ar' ? 'الموقع والعنوان' : 'Venue & Location'}
                </p>
                <p className="text-xs font-bold text-neutral-950 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 mt-1 leading-snug">
                  {lang === 'ar' ? promoEvent.location.nameAr : promoEvent.location.nameEn}
                </p>
                {(promoEvent.location?.areaAr || promoEvent.location?.governorateAr || promoEvent.location?.areaEn || promoEvent.location?.governorateEn || promoEvent.location?.addressAr || promoEvent.location?.addressEn) && (
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-semibold mt-0.5">
                    📍 {lang === 'ar' 
                      ? [promoEvent.location?.areaAr, promoEvent.location?.governorateAr].filter(Boolean).join(' - ') || promoEvent.location?.addressAr
                      : [promoEvent.location?.areaEn, promoEvent.location?.governorateEn].filter(Boolean).join(' - ') || promoEvent.location?.addressEn
                    }
                  </p>
                )}
              </div>
              {promoEvent.location?.googleMapsUrl && promoEvent.location.googleMapsUrl.trim().length > 0 && (
                <div className="shrink-0 self-start sm:self-auto">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-black bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse font-sans shadow-xs inline-flex items-center gap-1">
                    {lang === 'ar' ? 'الخريطة 🗺️' : 'Map 🗺️'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Admin Event Reference Number Badge */}
        {user?.isAdmin && promoEvent.eventRef && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-400 font-mono text-xs flex items-center justify-between mt-2">
            <span className="font-semibold">{lang === 'ar' ? 'الرقم المرجعي (أدمن فقط):' : 'Reference Number (Admin Only):'}</span>
            <span className="font-bold bg-white dark:bg-indigo-500/10 text-neutral-950 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">{promoEvent.eventRef}</span>
          </div>
        )}

        {/* Admin Event Creator Info Badge */}
        {user?.isAdmin && (
          <div 
            onClick={(e) => {
              if (promoEvent.creatorId) {
                e.preventDefault();
                e.stopPropagation();
                setAdminSelectedUserId(promoEvent.creatorId);
                setActiveTab('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`mb-3 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/20 text-purple-900 dark:text-purple-400 font-sans text-xs flex flex-col gap-1 transition-all ${promoEvent.creatorId ? 'cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:border-purple-500/50 active:scale-[0.98]' : ''}`}
          >
            <span className="font-semibold flex items-center justify-between">
              <span>{lang === 'ar' ? 'معلومات الإنشاء (أدمن فقط):' : 'Creation Info (Admin Only):'}</span>
              {promoEvent.creatorId && (
                <User className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="font-bold text-[11px] bg-white dark:bg-purple-500/10 text-neutral-950 dark:text-purple-300 px-2 py-1 rounded border border-purple-200 dark:border-purple-500/30">
              {promoEvent.createdByAdmin === true || (!promoEvent.creatorId && (promoEvent.contact.organizerName === 'إدارة DWM للرقص' || promoEvent.contact.organizerName === 'الإدارة')) 
                ? (lang === 'ar' ? 'تم إنشاء هذا الإعلان بواسطة الإدارة' : 'This ad was created by Management')
                : (lang === 'ar' 
                    ? `تم إنشاء هذا الإعلان بواسطة المستخدم (${promoEvent.creatorName || promoEvent.contact.organizerName})` 
                    : `This ad was created by User (${promoEvent.creatorName || promoEvent.contact.organizerName})`)
              }
            </span>
          </div>
        )}

        {/* Admin Direct Mobile Push Broadcast Bar */}
        {user?.isAdmin && (
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

        {/* Action Buttons Bar: Views & Icons on Row 1, Full-width Book Now on Row 2 */}
        <div className="pt-3.5 sm:pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-auto space-y-2.5">
          {/* Row 1: Views Counter + All Action Icons (Phone, WhatsApp, Share, Like) */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
            {/* Views Counter Badge */}
            {(() => {
              const isAdmin = !!user?.isAdmin;
              const isViewsVisible = promoEvent.showViewsCount !== false;
              
              if (!isViewsVisible && !isAdmin) return null;

              if (isAdmin) {
                return (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedViewsEvent(promoEvent);
                    }}
                    className={`flex h-10 items-center justify-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                      !isViewsVisible
                        ? 'bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-500 dark:text-neutral-400 border border-dashed border-neutral-400/40 hover:border-neutral-400/60'
                        : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:border-blue-500/40'
                    }`}
                    title={
                      !isViewsVisible
                        ? (lang === 'ar' ? '🔒 عداد المشاهدات مخفي عن الجمهور (مرئي للإدارة فقط) - انقر لعرض تقرير الإحصائيات 📊' : '🔒 Views count is hidden from users (Admin only) - Click for analytics 📊')
                        : (lang === 'ar' ? 'انقر لعرض تفاصيل وإحصائيات مشاهدات الإعلان (خاص بالإدارة) 📊' : 'Click to view ad views analytics (Admin only) 📊')
                    }
                  >
                    {!isViewsVisible ? (
                      <EyeOff className="h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                    ) : (
                      <Eye className="h-4 w-4 shrink-0 text-blue-500" />
                    )}
                    <span className="text-[11px] sm:text-xs font-bold">
                      {lang === 'ar' ? 'عدد المشاهدات' : 'Views'}
                    </span>
                    <span className="font-mono font-black">{promoEvent.viewsCount || 0}</span>
                    {!isViewsVisible && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 leading-none">
                        {lang === 'ar' ? 'مخفي' : 'Hidden'}
                      </span>
                    )}
                  </button>
                );
              }

              // Regular public display badge (without admin analytics modal trigger)
              return (
                <div
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-2xs select-none shrink-0"
                  title={lang === 'ar' ? `عدد المشاهدات: ${promoEvent.viewsCount || 0}` : `Views: ${promoEvent.viewsCount || 0}`}
                >
                  <Eye className="h-4 w-4 shrink-0 text-blue-500" />
                  <span className="text-[11px] sm:text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {lang === 'ar' ? 'عدد المشاهدات' : 'Views'}
                  </span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400">{promoEvent.viewsCount || 0}</span>
                </div>
              );
            })()}

            {/* Action Icons Group: Phone, WhatsApp, Share, Like */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ms-auto">
              {/* Direct Call Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!user) {
                    openGuestAlert('contact');
                    return;
                  }
                  window.location.href = `tel:${promoEvent.contact.phone}`;
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 border border-neutral-200 dark:border-neutral-800 transition-all shrink-0 cursor-pointer font-bold"
                title={lang === 'ar' ? 'اتصال مباشر' : 'Direct Call'}
              >
                <Phone className="h-4 w-4 shrink-0" />
              </button>

              {/* WhatsApp Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!user) {
                    openGuestAlert('contact');
                    return;
                  }
                  const url = `https://wa.me/${promoEvent.contact.whatsapp}?text=${encodeURIComponent(lang === 'ar' ? `مرحباً، أستفسر عن حجز تذاكر: ${promoEvent.titleAr}` : `Hello, inquiring about: ${promoEvent.titleEn}`)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-neutral-800 transition-all shrink-0 cursor-pointer font-bold"
                title={lang === 'ar' ? 'واتساب' : 'WhatsApp'}
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
              </button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenShare(promoEvent)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 border border-neutral-200 dark:border-neutral-800 transition-all shrink-0 cursor-pointer"
                title={lang === 'ar' ? 'مشاركة الإعلان' : 'Share Event'}
              >
                <Share2 className="h-4 w-4 shrink-0" />
              </motion.button>

              {/* Like Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => toggleLikeEvent(promoEvent.id, e.currentTarget)}
                className={`flex h-10 px-2.5 sm:px-3 items-center justify-center gap-1.5 rounded-xl border font-bold transition-all shrink-0 cursor-pointer ${
                  isLiked
                    ? 'bg-red-600 text-white border-red-500 shadow-lg'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-red-500 border-neutral-200 dark:border-neutral-700 hover:bg-red-600 hover:text-white'
                }`}
              >
                <Heart className={`h-4 w-4 shrink-0 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-mono text-[11px] sm:text-xs">{String(promoEvent.likesCount || 0)}</span>
              </motion.button>
            </div>
          </div>

          {/* Row 2: Book Now & Price/Promo Subtext (Full Width) */}
          {promoEvent.showBookingButton !== false && (() => {
            const rawSubtext = lang === 'ar'
              ? (promoEvent.bookingSubtextAr || promoEvent.priceAr || promoEvent.bookingSubtextEn || promoEvent.priceEn)
              : (promoEvent.bookingSubtextEn || promoEvent.priceEn || promoEvent.bookingSubtextAr || promoEvent.priceAr);
            const cleanSubtext = rawSubtext && String(rawSubtext).trim() !== '0' ? String(rawSubtext).trim() : null;

            return (
              <div className="w-full flex flex-col items-center gap-1 pt-0.5">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => bookTicket(promoEvent.id)}
                  className="w-full flex h-11 items-center justify-center rounded-xl px-4 text-sm font-black transition-all bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-[0.99] shadow-sm hover:shadow-md cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'احجز الآن' : 'Book Now'}</span>
                </motion.button>
                {cleanSubtext && (
                  <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 text-center max-w-full leading-tight break-words" title={cleanSubtext}>
                    {cleanSubtext}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Fullscreen Video Modal for ultimate player experience */}
      <FullscreenVideoModal
        isOpen={isFullscreenVideoOpen}
        onClose={() => setIsFullscreenVideoOpen(false)}
        videoUrl={promoEvent.mediaUrl}
        posterUrl={promoEvent.thumbnailUrl || undefined}
        titleAr={promoEvent.titleAr}
        titleEn={promoEvent.titleEn}
      />

      {/* Broadcast Push Modal for Admins */}
      <BroadcastPushModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        event={promoEvent}
      />

      {/* Event Image Fullscreen Lightbox Modal */}
      <EventImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={promoEvent.mediaUrl}
        titleAr={promoEvent.titleAr}
        titleEn={promoEvent.titleEn}
      />
    </div>
  );
};
