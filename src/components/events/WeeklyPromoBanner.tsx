import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceEvent, getStyleLabel } from '../../types';
import { Volume2, VolumeX, Sparkles, MapPin, Calendar, Heart, Share2, Phone, MessageCircle, Trash2, Edit, Pause, Play, Maximize2 } from 'lucide-react';
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
    setActiveTab
  } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreenVideoOpen, setIsFullscreenVideoOpen] = useState(false);
  const [aspectRatioClass, setAspectRatioClass] = useState('aspect-video');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const isBooked = user?.bookedEventIds.includes(promoEvent.id);
  const expiryInfo = getDaysRemainingBeforeExpiry(promoEvent.eventDate);

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl gold-glow-lg transition-all">
      {/* Top Badge */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md animate-pulse">
            <Sparkles className="h-3.5 w-3.5 fill-current" />
            <span>{lang === 'ar' ? 'فيديو الأسبوع الحصري' : 'Weekly Featured Video'}</span>
          </div>
          {user?.isAdmin && (
            <span className="flex h-7 px-2.5 items-center justify-center rounded-lg bg-neutral-950/90 border border-amber-500/30 text-[11px] font-extrabold text-amber-400 font-mono shadow-md backdrop-blur-sm" title={lang === 'ar' ? 'رقم الترتيب' : 'Placement Position'}>
              #{promoEvent.position !== undefined ? promoEvent.position : '-'}
            </span>
          )}
        </div>

        <div className="rounded-full bg-neutral-950/80 px-3 py-1 text-[11px] font-mono font-bold text-amber-400 border border-neutral-800 backdrop-blur-md">
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
        <div className="absolute top-14 right-4 z-30 flex flex-col gap-2">
          {/* Position Display next to Admin controls */}
          <div 
            className="flex h-9 items-center justify-center rounded-xl bg-neutral-950/95 border border-amber-500/50 text-[11px] font-black text-amber-400 font-mono shadow-xl px-2 select-all"
            title={lang === 'ar' ? 'الموضع والترتيب' : 'Placement position'}
          >
            #{promoEvent.position !== undefined ? promoEvent.position : '-'}
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowDeleteConfirm(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-xl transition-all border border-red-500/30 hover:scale-105 active:scale-95 cursor-pointer"
            title={lang === 'ar' ? 'حذف الإعلان نهائياً' : 'Delete Ad Permanently'}
          >
            <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>

          {/* Pause / Resume button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              togglePauseEvent(promoEvent.id);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-xl transition-all border hover:scale-105 active:scale-95 cursor-pointer ${
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
              setActiveTab('create_ad');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl transition-all border border-blue-500/30 hover:scale-105 active:scale-95 cursor-pointer"
            title={lang === 'ar' ? 'تعديل الإعلان' : 'Edit Ad'}
          >
            <Edit className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
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
        ) : promoEvent.mediaType === 'video' ? (
          <div className="relative h-full w-full group/video">
            <video
              ref={videoRef}
              src={getSafePlayableVideoUrl(promoEvent.mediaUrl)}
              poster={promoEvent.thumbnailUrl || undefined}
              autoPlay
              preload="auto"
              muted={isMuted}
              playsInline
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                if (video.videoHeight > video.videoWidth) {
                  setAspectRatioClass('aspect-[9/16] max-h-[550px] sm:max-h-[600px]');
                } else {
                  setAspectRatioClass('aspect-video');
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="h-full w-full object-contain bg-neutral-950 cursor-pointer"
              onClick={() => togglePlay()}
            />
            {/* Play/Pause Center Overlay */}
            {!isPlaying && (
              <div 
                onClick={() => togglePlay()}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 cursor-pointer transition-all duration-300"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-neutral-950 shadow-2xl hover:scale-110 active:scale-95 transition-all"
                >
                  <Play className="h-8 w-8 fill-current ml-1" />
                </motion.div>
              </div>
            )}
            
            {/* Fullscreen Button */}
            <button
              onClick={openFullscreenVideo}
              className="absolute top-4 left-4 z-20 flex h-10 px-3 items-center justify-center gap-1.5 rounded-full bg-neutral-950/80 text-white border border-neutral-800 hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-lg backdrop-blur-md text-xs font-semibold"
              title={lang === 'ar' ? 'عرض بملء الشاشة' : 'View Full Screen'}
            >
              <Maximize2 className="h-4 w-4" />
              <span>{lang === 'ar' ? 'ملء الشاشة' : 'Full Screen'}</span>
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={toggleMute}
              className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/80 text-white border border-neutral-800 hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-lg backdrop-blur-md"
              title={isMuted ? (lang === 'ar' ? 'تشغيل الصوت' : 'Unmute') : (lang === 'ar' ? 'كتم الصوت' : 'Mute')}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 animate-pulse" />}
            </button>
          </div>
        ) : (
          <img
            src={promoEvent.mediaUrl}
            alt={lang === 'ar' ? promoEvent.titleAr : promoEvent.titleEn}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalHeight > img.naturalWidth) {
                setAspectRatioClass('aspect-[9/16] max-h-[550px] sm:max-h-[600px]');
              } else {
                setAspectRatioClass('aspect-video');
              }
            }}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        )}
        <div className="absolute inset-0 card-gradient pointer-events-none" />
      </div>

      {/* Event Node Details (النود الموجودة تحت بانر الاعلان) */}
      <div className="relative z-10 -mt-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {promoEvent.styles.map((style) => (
            <span key={style} className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-400/30 font-mono">
              #{getStyleLabel(style, lang)}
            </span>
          ))}
          <span className="ml-auto text-[10px] font-mono text-neutral-500">
            {lang === 'ar' ? 'تاريخ التحميل: ' : 'Uploaded: '}{formatDate(promoEvent.uploadDate, lang)}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5 leading-tight">
          {lang === 'ar' ? promoEvent.titleAr : promoEvent.titleEn}
        </h2>

        <p className="text-xs sm:text-sm text-neutral-300 mb-3.5 line-clamp-3 leading-normal">
          {lang === 'ar' ? promoEvent.descriptionAr : promoEvent.descriptionEn}
        </p>

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
            <div className="overflow-hidden">
              <p className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 leading-none">
                {lang === 'ar' ? 'الموقع على جوجل ماب' : 'Google Map Location'}
                <span className="text-amber-500 hover:underline text-[9px] font-bold">({lang === 'ar' ? 'عرض' : 'View'})</span>
              </p>
              <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 mt-1">
                {lang === 'ar' ? promoEvent.location.nameAr : promoEvent.location.nameEn}
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar: Contact, Share, Like, Book in a single row */}
        <div className="flex flex-row items-center gap-1.5 sm:gap-2 pt-3 border-t border-neutral-800 overflow-x-auto no-scrollbar w-full whitespace-nowrap">
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
            className="flex items-center justify-center gap-1 rounded-xl bg-neutral-900 h-10 px-2.5 sm:px-3 text-xs font-bold text-white hover:bg-neutral-800 hover:text-amber-400 border border-neutral-800 transition-all shrink-0 cursor-pointer"
            title={lang === 'ar' ? 'اتصال مباشر' : 'Direct Call'}
          >
            <Phone className="h-3.5 w-3.5 text-amber-400 shrink-0" />
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
            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs">{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
          </button>

          {/* Share Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onOpenShare(promoEvent)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-400 hover:bg-amber-500/20 hover:text-amber-400 border border-neutral-800 transition-all shrink-0 cursor-pointer"
            title={lang === 'ar' ? 'مشاركة الإعلان' : 'Share Event'}
          >
            <Share2 className="h-3.5 w-3.5 shrink-0" />
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
            <Heart className={`h-3.5 w-3.5 shrink-0 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-mono text-[11px] sm:text-xs">{promoEvent.likesCount}</span>
          </motion.button>

          {/* Book Now Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => bookTicket(promoEvent.id)}
            disabled={isBooked}
            className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-xl px-3 sm:px-4 text-xs font-bold transition-colors shrink-0 ${
              isBooked
                ? 'bg-emerald-600 text-white cursor-default border border-emerald-500'
                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg'
            }`}
          >
            <span className="text-[11px] sm:text-xs">{isBooked ? (lang === 'ar' ? '✓ تم' : '✓ Booked') : (lang === 'ar' ? 'احجز' : 'Book')}</span>
          </motion.button>
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
