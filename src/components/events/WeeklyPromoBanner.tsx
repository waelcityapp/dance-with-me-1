import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceEvent, getStyleLabel } from '../../types';
import { Volume2, VolumeX, Sparkles, MapPin, Calendar, Heart, Share2, Phone, MessageCircle, Trash2, Edit, Pause, Play, Maximize2, Eye, Crown, UserCheck, User } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate, getDaysRemainingBeforeExpiry } from '../../utils/dateUtils';
import { isGoogleDriveUrl, getGoogleDrivePreviewUrl, getSafePlayableVideoUrl } from '../../lib/mediaUtils';
import { FullscreenVideoModal } from './FullscreenVideoModal';

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
    appAssets
  } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreenVideoOpen, setIsFullscreenVideoOpen] = useState(false);
  const [aspectRatioClass, setAspectRatioClass] = useState('aspect-video');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

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
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-[0_25px_55px_rgba(0,0,0,0.8)] hover:border-white/20 hover:shadow-[0_35px_70px_rgba(0,0,0,0.95)] hover:-translate-y-1.5 gold-glow-lg transition-all duration-300">
      {/* Absolute Vertical Red Accent Line */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px] z-30 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]" />

      {/* Top Header Labeling to mark beginning of the ad container */}
      <div className="px-4 py-2.5 flex items-center justify-between text-[11px] font-black tracking-wide uppercase border-b bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 text-amber-400 select-none shrink-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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
          <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-md animate-pulse border border-red-500">
            <Sparkles className="h-2.5 w-2.5 fill-current" />
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
      <div className={`relative w-full overflow-hidden bg-neutral-950 transition-all duration-500 ${aspectRatioClass}`}>
        {/* Paused Overlay with 'X' mark */}
        {promoEvent.isPaused && (
          <div className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 text-red-500 border border-red-500/40 shadow-xl">
              <span className="text-2xl font-black font-sans leading-none">X</span>
            </div>
            <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider px-2.5 py-1 bg-red-950/60 border border-red-800/40 rounded-lg">
              {lang === 'ar' ? 'موقوف مؤقتاً' : 'Temporarily Paused'}
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
          <img
            src={promoEvent.mediaUrl}
            alt={lang === 'ar' ? promoEvent.titleAr : promoEvent.titleEn}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalHeight > img.naturalWidth) {
                setAspectRatioClass('aspect-[9/16] max-h-[500px] sm:max-h-[600px]');
              } else {
                setAspectRatioClass('aspect-[16/10] sm:aspect-video');
              }
            }}
            className="h-full w-full object-cover"
          />
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
        <div className="flex flex-col p-4 sm:p-5 relative z-10 bg-neutral-900 border-t border-neutral-800">
          <div className="mb-3.5">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white mb-2 line-clamp-2 leading-snug">
              {lang === 'ar' ? promoEvent.titleAr : promoEvent.titleEn}
            </h3>
            {/* Price Badge */}
            {(promoEvent.priceAr || promoEvent.priceEn) && (
              <div className="mb-3 inline-block rounded-lg bg-amber-500/10 px-2.5 py-1 border border-amber-500/20">
                <span className="text-xs font-black tracking-wide text-amber-400">
                  {lang === 'ar' ? promoEvent.priceAr : promoEvent.priceEn}
                </span>
              </div>
            )}
          <p className={`text-xs sm:text-sm text-neutral-300 leading-normal ${isDescExpanded ? '' : 'line-clamp-3'}`}>
            {lang === 'ar' ? promoEvent.descriptionAr : promoEvent.descriptionEn}
          </p>
          {((lang === 'ar' ? promoEvent.descriptionAr : promoEvent.descriptionEn) || '').length > 150 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDescExpanded(!isDescExpanded);
              }}
              className="mt-1.5 text-[11px] sm:text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 focus:outline-none bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/20 hover:border-amber-500/40"
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

        {/* Metadata Grid (Date, Location, Price) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3.5 rounded-2xl bg-neutral-900/40 p-3 sm:p-4 border border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-neutral-500 leading-none">{lang === 'ar' ? 'تاريخ الحدث' : 'Event Date'}</p>
              <p className="text-xs font-bold text-white mt-1">{formatDate(promoEvent.eventDate, lang)}</p>
            </div>
          </div>

          <div 
            onClick={() => onOpenMap(promoEvent)}
            className="flex items-center gap-3 cursor-pointer group rounded-xl hover:bg-neutral-800/50 p-1 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors shrink-0">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div className="overflow-hidden w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 leading-none">
                  {lang === 'ar' ? 'الموقع' : 'Location'}
                </p>
                <p className="text-xs font-bold text-white line-clamp-2 group-hover:text-amber-400 mt-1 leading-snug">
                  {lang === 'ar' ? promoEvent.location.nameAr : promoEvent.location.nameEn}
                </p>
              </div>
              {promoEvent.location?.googleMapsUrl && promoEvent.location.googleMapsUrl.trim().length > 0 && (
                <div className="shrink-0 self-start sm:self-auto">
                  <span className="text-[10px] text-amber-400 font-black bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse font-sans shadow-sm inline-flex items-center gap-1">
                    {lang === 'ar' ? 'استخدم الخريطة 🗺️' : 'Use Map 🗺️'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Admin Event Reference Number Badge */}
        {user?.isAdmin && promoEvent.eventRef && (
          <div className="mb-3 px-3 py-1.5 mx-4 sm:mx-6 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 font-mono text-xs flex items-center justify-between mt-2">
            <span className="font-semibold">{lang === 'ar' ? 'الرقم المرجعي (أدمن فقط):' : 'Reference Number (Admin Only):'}</span>
            <span className="font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">{promoEvent.eventRef}</span>
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
            className={`mb-3 px-3 py-1.5 mx-4 sm:mx-6 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-400 font-sans text-xs flex flex-col gap-1 transition-all ${promoEvent.creatorId ? 'cursor-pointer hover:bg-purple-900/50 hover:border-purple-500/50 active:scale-[0.98]' : ''}`}
          >
            <span className="font-semibold flex items-center justify-between">
              <span>{lang === 'ar' ? 'معلومات الإنشاء (أدمن فقط):' : 'Creation Info (Admin Only):'}</span>
              {promoEvent.creatorId && (
                <User className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="font-bold text-[11px] bg-purple-500/10 px-2 py-1 rounded border border-purple-500/30">
              {promoEvent.createdByAdmin === true || (!promoEvent.creatorId && (promoEvent.contact.organizerName === 'إدارة DWM للرقص' || promoEvent.contact.organizerName === 'الإدارة')) 
                ? (lang === 'ar' ? 'تم إنشاء هذا الإعلان بواسطة الإدارة' : 'This ad was created by Management')
                : (lang === 'ar' 
                    ? `تم إنشاء هذا الإعلان بواسطة المستخدم (${promoEvent.creatorName || promoEvent.contact.organizerName})` 
                    : `This ad was created by User (${promoEvent.creatorName || promoEvent.contact.organizerName})`)
              }
            </span>
          </div>
        )}

        {/* Action Buttons Bar: Phone, WhatsApp, Share, Like, Book */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-neutral-800 mt-auto flex-wrap">
          {/* Contact Actions */}
          <div className="flex items-center gap-1.5">
            {user?.isAdmin && (
              <div className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20" title={lang === 'ar' ? 'عدد مشاهدات الإعلان' : 'Ad Views Count'}>
                <Eye className="h-4 w-4" />
                <span className="font-mono">{promoEvent.viewsCount || 0}</span>
              </div>
            )}
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
              className="flex items-center justify-center gap-1 rounded-xl bg-neutral-900 h-10 px-2.5 sm:px-3 text-xs font-bold text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 border border-neutral-800 transition-all shrink-0 cursor-pointer"
              title={lang === 'ar' ? 'اتصال مباشر' : 'Direct Call'}
            >
              <Phone className="h-4 w-4 shrink-0" />
              <span className="text-[11px] sm:text-xs">{lang === 'ar' ? 'اتصل' : 'Call'}</span>
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
              className="flex items-center justify-center gap-1 rounded-xl bg-neutral-900 h-10 px-2.5 sm:px-3 text-xs font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white border border-neutral-800 transition-all shrink-0 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="text-[11px] sm:text-xs">{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
            </button>
          </div>

          {/* Social & Booking Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Share Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenShare(promoEvent)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-400 hover:bg-amber-500/20 hover:text-amber-400 border border-neutral-800 transition-all shrink-0 cursor-pointer"
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
                  : 'bg-neutral-900 text-red-500 border-neutral-700 hover:bg-red-600 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 shrink-0 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-mono text-[11px] sm:text-xs">{String(promoEvent.likesCount || 0)}</span>
            </motion.button>

            {/* Book Now Button */}
            {promoEvent.showBookingButton !== false && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => bookTicket(promoEvent.id)}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl px-6 sm:px-8 min-w-[120px] sm:min-w-[140px] text-xs font-bold transition-all bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-lg cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'احجز الآن' : 'Book Now'}</span>
                </motion.button>
                {(promoEvent.bookingSubtextAr || promoEvent.bookingSubtextEn || promoEvent.priceAr || promoEvent.priceEn) && (
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-400 text-center max-w-[160px] sm:max-w-[200px] leading-tight break-words" title={lang === 'ar' ? (promoEvent.bookingSubtextAr || promoEvent.priceAr || promoEvent.bookingSubtextEn || promoEvent.priceEn) : (promoEvent.bookingSubtextEn || promoEvent.priceEn || promoEvent.bookingSubtextAr || promoEvent.priceAr)}>
                    {lang === 'ar' ? (promoEvent.bookingSubtextAr || promoEvent.priceAr || promoEvent.bookingSubtextEn || promoEvent.priceEn) : (promoEvent.bookingSubtextEn || promoEvent.priceEn || promoEvent.bookingSubtextAr || promoEvent.priceAr)}
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
        videoUrl={promoEvent.mediaUrl}
        posterUrl={promoEvent.thumbnailUrl || undefined}
        titleAr={promoEvent.titleAr}
        titleEn={promoEvent.titleEn}
      />
    </div>
  );
};
