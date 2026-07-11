import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceEvent, getStyleLabel } from '../../types';
import { Volume2, VolumeX, MapPin, Calendar, Heart, Share2, Phone, MessageCircle, Clock, CheckCircle2, ShieldAlert, Trash2, Edit, Pause, Play, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate, getDaysRemainingBeforeExpiry } from '../../utils/dateUtils';
import { isGoogleDriveUrl, getGoogleDrivePreviewUrl, getSafePlayableVideoUrl } from '../../lib/mediaUtils';
import { FullscreenVideoModal } from './FullscreenVideoModal';

interface EventCardProps {
  event: DanceEvent;
  index?: number;
  onOpenMap: (event: DanceEvent) => void;
  onOpenShare: (event: DanceEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, index, onOpenMap, onOpenShare }) => {
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
  const [aspectRatioClass, setAspectRatioClass] = useState('aspect-[16/10]');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const isBooked = user?.bookedEventIds.includes(event.id);
  const expiryInfo = getDaysRemainingBeforeExpiry(event.eventDate);
  const isExpired = event.isExpiredBy15DaysRule || expiryInfo.isExpired;

  const categoryLabels = {
    party: { ar: '🎉 حفلة لاتينية', en: '🎉 Latin Party', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    course: { ar: '🎓 كورس متخصّص', en: '🎓 Masterclass', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    trip: { ar: '🌴 رحلة / معسكر', en: '🌴 Dance Camp', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  };

  const currentCat = categoryLabels[event.category] || categoryLabels.party;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl ${
        isExpired
          ? 'border-neutral-800 bg-neutral-900/60 opacity-80'
          : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700 hover:shadow-2xl'
      }`}
    >
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

      {/* Banner Media Section (Video or Image) */}
      <div className={`relative w-full overflow-hidden bg-neutral-950 transition-all duration-500 ${aspectRatioClass}`}>
        {event.mediaType === 'video' ? (
          <div className="relative h-full w-full group/video">
            <video
              ref={videoRef}
              src={getSafePlayableVideoUrl(event.mediaUrl)}
              poster={event.thumbnailUrl || undefined}
              autoPlay
              loop
              preload="auto"
              muted={isMuted}
              playsInline
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                if (video.videoHeight > video.videoWidth) {
                  setAspectRatioClass('aspect-[9/16] max-h-[500px] sm:max-h-[550px]');
                } else {
                  setAspectRatioClass('aspect-[16/10]');
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
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-neutral-950 shadow-2xl hover:scale-110 active:scale-95 transition-all"
                >
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                </motion.div>
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={openFullscreenVideo}
              className="absolute top-3 left-3 z-20 flex h-8 px-2.5 items-center justify-center gap-1 rounded-full bg-neutral-950/80 text-white border border-neutral-800 hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-lg backdrop-blur-md text-[10px] font-semibold"
              title={lang === 'ar' ? 'عرض بملء الشاشة' : 'View Full Screen'}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'ملء الشاشة' : 'Full Screen'}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950/80 text-white border border-neutral-800 hover:bg-amber-500 hover:text-neutral-950 transition-all backdrop-blur-md"
              title={isMuted ? (lang === 'ar' ? 'تشغيل الصوت' : 'Unmute') : (lang === 'ar' ? 'كتم الصوت' : 'Mute')}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 animate-pulse" />}
            </button>
          </div>
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
                ? `سيتم حذف إعلان "${event.titleAr}" نهائياً من قاعدة البيانات ولا يمكن استرجاعه.` 
                : `This will permanently delete "${event.titleEn}" from the database.`}
            </p>
            <div className="flex items-center gap-3 w-full max-w-[240px] mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  deleteEvent(event.id);
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

        {/* Top Badges */}
        <div className={`absolute ${isExpired ? 'top-8' : 'top-3'} inset-x-3 z-20 flex items-center justify-between`}>
          <div className="flex items-center gap-1.5">
            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border backdrop-blur-md shadow-sm ${currentCat.color}`}>
              {lang === 'ar' ? currentCat.ar : currentCat.en}
            </span>
            {user?.isAdmin && (
              <span 
                className="flex h-7 px-2.5 items-center justify-center rounded-lg bg-neutral-950/90 border border-amber-500/30 text-[11px] font-extrabold text-amber-400 font-mono shadow-md backdrop-blur-sm" 
                title={lang === 'ar' ? 'الترتيب في الصفحة' : 'Page order'}
              >
                #{index !== undefined ? (index + 1) : ''}
                {event.position !== undefined && event.position !== 0 && (
                  <span className="text-[10px] text-neutral-400 font-bold ml-1">
                    ({event.position})
                  </span>
                )}
                {index === undefined && (event.position === undefined || event.position === 0) && '-'}
              </span>
            )}
          </div>

          {/* Expiry Timer Badge */}
          {!isExpired && (
            <span className="flex items-center gap-1 rounded-lg bg-neutral-950/80 px-2 py-1 text-[11px] font-mono font-bold text-amber-400 border border-neutral-800 backdrop-blur-md">
              <Clock className="h-3 w-3 text-amber-400" />
              <span>{lang === 'ar' ? `ينتهي بعد: ${expiryInfo.days > 0 ? `${expiryInfo.days} يوم` : `${expiryInfo.hours} ساعة`}` : `${expiryInfo.days > 0 ? `${expiryInfo.days}d` : `${expiryInfo.hours}h`} left`}</span>
            </span>
          )}
        </div>

        {/* Paused Overlay with 'X' mark */}
        {event.isPaused && (
          <div className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 text-red-500 border border-red-500/40 shadow-xl">
              <span className="text-2xl font-black font-sans leading-none">X</span>
            </div>
            <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider px-2.5 py-1 bg-red-950/60 border border-red-800/40 rounded-lg">
              {lang === 'ar' ? 'موقوف مؤقتاً' : 'Temporarily Paused'}
            </span>
          </div>
        )}

        {/* Admin Floating Control Toolbar */}
        {user?.isAdmin && (
          <div className="absolute top-14 right-3 z-30 flex flex-col gap-2">
            {/* Position Display next to Admin controls */}
            <div 
              className="flex h-9 items-center justify-center rounded-xl bg-neutral-950/95 border border-amber-500/50 text-[11px] font-black text-amber-400 font-mono shadow-xl px-2 select-all"
              title={lang === 'ar' ? 'الترتيب في الصفحة والموضع' : 'Page order & position'}
            >
              #{index !== undefined ? (index + 1) : ''}
              {event.position !== undefined && event.position !== 0 && (
                <span className="text-[10px] text-neutral-400 font-bold ml-1">
                  ({event.position})
                </span>
              )}
            </div>

            {/* Delete button (triggers local confirm) */}
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
                togglePauseEvent(event.id);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-xl transition-all border hover:scale-105 active:scale-95 cursor-pointer ${
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

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 left-3 z-20 rounded-xl bg-amber-500 px-3 py-1 text-xs font-bold text-neutral-950 shadow-lg font-mono">
          {lang === 'ar' ? event.priceAr : event.priceEn}
        </div>
      </div>

      {/* Event Node Content (النود الموجودة تحت بانر الاعلان) */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Upload Date Metadata */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-500 mb-2">
          <span>{lang === 'ar' ? 'تاريخ التحميل: ' : 'Uploaded: '}{formatDate(event.uploadDate, lang)}</span>
          <div className="flex items-center gap-1">
            {event.styles.map(s => (
              <span key={s} className="text-amber-400 font-bold">#{getStyleLabel(s, lang)}</span>
            ))}
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
          {lang === 'ar' ? event.titleAr : event.titleEn}
        </h3>

        <p className="text-xs sm:text-sm text-neutral-300 mb-4 line-clamp-2 flex-1 leading-relaxed">
          {lang === 'ar' ? event.descriptionAr : event.descriptionEn}
        </p>

        {/* Date & Location Grid */}
        <div className="space-y-2 mb-4 rounded-2xl bg-neutral-950 p-3.5 border border-neutral-800 text-xs">
          <div className="flex items-center gap-2.5 text-neutral-200">
            <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-bold">{formatDate(event.eventDate, lang)}</span>
          </div>

          <div 
            onClick={() => onOpenMap(event)}
            className="flex items-center justify-between gap-2 text-neutral-300 hover:text-amber-400 cursor-pointer group/map transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <MapPin className="h-4 w-4 text-amber-400 shrink-0 group-hover/map:scale-110 transition-transform" />
              <span className="truncate underline decoration-neutral-700 group-hover/map:decoration-amber-400 font-bold">
                {lang === 'ar' ? event.location.nameAr : event.location.nameEn}
              </span>
            </div>
            {event.location?.googleMapsUrl && event.location.googleMapsUrl.trim().length > 0 && (
              <span className="text-[10px] text-amber-400 font-black shrink-0 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse font-sans">
                {lang === 'ar' ? 'استخدم الخريطة 🗺️' : 'Use Map 🗺️'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Bar: Phone, WhatsApp, Share, Like, Book */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-neutral-800 mt-auto">
          {/* Contact Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (!user) {
                  openGuestAlert('contact');
                  return;
                }
                window.location.href = `tel:${event.contact.phone}`;
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-amber-400 border border-neutral-800 transition-all font-bold cursor-pointer"
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
                const url = `https://wa.me/${event.contact.whatsapp}?text=${encodeURIComponent(lang === 'ar' ? `مرحباً، استفسار بخصوص: ${event.titleAr}` : `Hello, inquiry about: ${event.titleEn}`)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-neutral-800 transition-all font-bold cursor-pointer"
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
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-neutral-400 hover:bg-amber-500/20 hover:text-amber-400 border border-neutral-800 transition-all"
              title={lang === 'ar' ? 'مشاركة الإعلان' : 'Share'}
            >
              <Share2 className="h-4 w-4" />
            </motion.button>

            {/* Like */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => toggleLikeEvent(event.id, e.currentTarget)}
              className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold border transition-all ${
                isLiked
                  ? 'bg-red-600 text-white border-red-500 shadow-md'
                  : 'bg-neutral-900 text-red-600 hover:bg-red-600 hover:text-white border-neutral-700'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-mono">{event.likesCount}</span>
            </motion.button>

            {/* Book Now */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => bookTicket(event.id)}
              disabled={isBooked}
              className={`flex h-10 items-center justify-center rounded-xl px-4 text-xs font-bold transition-all ${
                isBooked
                  ? 'bg-emerald-600 text-white cursor-default border border-emerald-500'
                  : 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-lg'
              }`}
            >
              {isBooked ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'تم الحجز' : 'Booked'}</span>
                </span>
              ) : (
                <span>{lang === 'ar' ? 'احجز الآن' : 'Book Now'}</span>
              )}
            </motion.button>
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
    </motion.div>
  );
};
