import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MapPin, Calendar, Clock, DollarSign, Phone, MessageCircle, 
  Share2, Heart, ExternalLink, Ticket, Sparkles, Volume2, VolumeX, 
  Play, Pause, Maximize2, ShieldAlert, CheckCircle, UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DanceEvent, getStyleLabel } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { getSafePlayableVideoUrl } from '../../lib/mediaUtils';
import { FullscreenVideoModal } from './FullscreenVideoModal';

interface EventQuickDetailsModalProps {
  event: DanceEvent | null;
  onClose: () => void;
  onOpenMap: (event: DanceEvent) => void;
  onOpenShare: (event: DanceEvent) => void;
}

export const EventQuickDetailsModal: React.FC<EventQuickDetailsModalProps> = ({
  event,
  onClose,
  onOpenMap,
  onOpenShare,
}) => {
  const { lang, user, toggleLikeEvent, setSelectedBookingEvent, openGuestAlert, recordEventView } = useApp();
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreenVideoOpen, setIsFullscreenVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (event && event.id) {
      recordEventView(event.id);
    }
    if (event && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [event]);

  if (!event) return null;

  const isLiked = user && event.likes?.includes(user.id);
  const mediaUrl = event.mediaUrl || event.thumbnailUrl || '';
  const isVideo = event.mediaType === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl);
  const playableVideoUrl = isVideo ? getSafePlayableVideoUrl(mediaUrl) : '';

  const handleBookClick = () => {
    onClose();
    setSelectedBookingEvent(event);
  };

  const handlePhoneClick = () => {
    if (event.contact?.phone) {
      window.location.href = `tel:${event.contact.phone}`;
    }
  };

  const handleWhatsAppClick = () => {
    if (event.contact?.whatsapp) {
      const cleanPhone = event.contact.whatsapp.replace(/\D/g, '');
      const defaultText = encodeURIComponent(
        lang === 'ar' 
          ? `مرحباً، أود الاستفسار والحجز بخصوص فعالية: "${event.titleAr || event.titleEn}" المعروضة في سيتي إيف.`
          : `Hello, I would like to inquire/book regarding event: "${event.titleEn || event.titleAr}" on CityEve.`
      );
      window.open(`https://wa.me/${cleanPhone}?text=${defaultText}`, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl my-auto text-neutral-100 flex flex-col max-h-[90vh]"
        >
          {/* Header Bar with Close Button */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {event.category === 'party' && (lang === 'ar' ? '🎉 حفلة وسهرة' : '🎉 Party')}
                {event.category === 'course' && (lang === 'ar' ? '🎓 كورس تدريبي' : '🎓 Masterclass')}
                {event.category === 'trip' && (lang === 'ar' ? '🌴 رحلة سياحية' : '🌴 Trip & Retreat')}
                {event.category === 'exhibition' && (lang === 'ar' ? '🏛️ معرض ومؤتمر' : '🏛️ Exhibition')}
                {(!event.category || event.category === 'all') && (lang === 'ar' ? '✨ فعالية مميزة' : '✨ Featured Event')}
              </span>
              {event.adType === 'vip' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950">
                  VIP ⭐
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenShare(event)}
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                title={lang === 'ar' ? 'مشاركة' : 'Share'}
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggleLikeEvent(event.id)}
                className={`p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-neutral-300 hover:text-red-400'
                }`}
                title={lang === 'ar' ? 'إعجاب' : 'Like'}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Modal Body */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Media Box */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-inner group">
              {isVideo ? (
                <>
                  <video
                    ref={videoRef}
                    src={playableVideoUrl}
                    poster={event.thumbnailUrl}
                    className="w-full h-full object-contain"
                    loop
                    muted={isMuted}
                    playsInline
                    autoPlay
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) {
                          videoRef.current.pause();
                          setIsPlaying(false);
                        } else {
                          videoRef.current.play();
                          setIsPlaying(true);
                        }
                      }
                    }}
                  />
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-400" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFullscreenVideoOpen(true);
                      }}
                      className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <img
                  src={mediaUrl}
                  alt={event.titleAr || event.titleEn}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              )}
            </div>

            {/* Title & Styles */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {lang === 'ar' ? (event.titleAr || event.titleEn) : (event.titleEn || event.titleAr)}
              </h2>

              {event.styles && event.styles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {event.styles.map((st, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-neutral-800 text-amber-300 border border-neutral-700"
                    >
                      {getStyleLabel(st, lang)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Key Event Metadata Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Date & Time */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] text-neutral-400 font-bold">
                    {lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-neutral-200">
                    {formatDate(event.date, lang)}
                    {event.time && ` • ${event.time}`}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] text-neutral-400 font-bold">
                    {lang === 'ar' ? 'سعر التذكرة / الدخول' : 'Entry / Ticket Price'}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-emerald-400">
                    {lang === 'ar' ? (event.priceAr || event.priceEn || 'مجاناً') : (event.priceEn || event.priceAr || 'Free')}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800 sm:col-span-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[11px] text-neutral-400 font-bold">
                      {lang === 'ar' ? 'الموقع والعنوان' : 'Venue & Location'}
                    </div>
                    <div className="text-xs sm:text-sm font-black text-neutral-200 truncate">
                      {lang === 'ar' 
                        ? (event.location?.nameAr || event.location?.addressAr || 'القاهرة، مصر')
                        : (event.location?.nameEn || event.location?.addressEn || 'Cairo, Egypt')}
                    </div>
                    {(event.location?.areaAr || event.location?.governorateAr || event.location?.areaEn || event.location?.governorateEn) && (
                      <div className="text-[11px] text-neutral-400 font-semibold mt-0.5">
                        📍 {lang === 'ar'
                          ? [event.location?.areaAr, event.location?.governorateAr].filter(Boolean).join(' - ')
                          : [event.location?.areaEn, event.location?.governorateEn].filter(Boolean).join(' - ')
                        }
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onOpenMap(event)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-amber-400 shrink-0 transition-colors"
                >
                  <span>{lang === 'ar' ? 'الخريطة' : 'Map'}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Description */}
            {((event.descriptionAr && event.descriptionAr.trim().length > 0) || (event.descriptionEn && event.descriptionEn.trim().length > 0)) && (
              <div className="p-4 rounded-2xl bg-neutral-950/40 border border-neutral-800/80 space-y-2">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {lang === 'ar' ? 'تفاصيل الفعالية' : 'Event Description'}
                </h4>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                  {lang === 'ar' ? (event.descriptionAr || event.descriptionEn) : (event.descriptionEn || event.descriptionAr)}
                </p>
              </div>
            )}

            {/* Organizer Info */}
            {event.contact && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-black text-sm">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 font-bold">{lang === 'ar' ? 'المنظم المعتمد' : 'Organizer'}</div>
                    <div className="text-xs font-black text-white">{event.contact.organizerName || 'CityEve Organizer'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {event.contact.whatsapp && (
                    <button
                      onClick={handleWhatsAppClick}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                    </button>
                  )}
                  {event.contact.phone && (
                    <button
                      onClick={handlePhoneClick}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                      title={lang === 'ar' ? 'اتصال هاتفياً' : 'Call'}
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="sticky bottom-0 z-20 flex items-center gap-3 p-4 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800">
            <button
              onClick={handleBookClick}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <Ticket className="h-5 w-5" />
              <span>{lang === 'ar' ? 'احجز تذكرتك الآن' : 'Book Your Ticket Now'}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Fullscreen Video Modal if triggered */}
      {isFullscreenVideoOpen && isVideo && (
        <FullscreenVideoModal
          videoUrl={playableVideoUrl}
          posterUrl={event.thumbnailUrl}
          title={lang === 'ar' ? (event.titleAr || event.titleEn) : (event.titleEn || event.titleAr)}
          onClose={() => setIsFullscreenVideoOpen(false)}
        />
      )}
    </AnimatePresence>
  );
};
