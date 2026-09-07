import React, { useState } from 'react';
import { DanceEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Share2, Copy, Check, MessageCircle, Send, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../../utils/dateUtils';

interface ShareModalProps {
  event: DanceEvent | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ event, onClose }) => {
  const { lang } = useApp();
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const isArabic = lang === 'ar';
  const shareTitle = isArabic ? event.titleAr : event.titleEn;
  const shareUrl = `https://cityeve.online/e/${event.id}`;

  const stripLegacyRepoLinks = (value: string) => value
    .replace(/https?:\\/\\/(?:www\\.)?github\\.com\\/waelcityapp\\/mybucket[^\\s<>'"\`\\])\\]]*/gi, '')
    .replace(/(?:www\\.)?github\\.com\\/waelcityapp\\/mybucket[^\\s<>'"\`\\])\\]]*/gi, '');

  const descSnippet = stripLegacyRepoLinks(isArabic ? event.descriptionAr : event.descriptionEn || '')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 150)
    .trim();

  const locationName = isArabic ? event.location?.nameAr : event.location?.nameEn;
  const locationText = locationName ? `📍 ${locationName}` : '';
  const dateText = event.eventDate ? `📅 ${formatDate(event.eventDate, lang)}` : '';
  const priceText = isArabic ? (event.priceAr ? `💰 ${event.priceAr}` : '') : (event.priceEn ? `💰 ${event.priceEn}` : '');

  // Clean, elegant WhatsApp message formatted for high conversion and clear link preview
  const whatsappMessage = isArabic
    ? `🎟️ *${event.titleAr}*\n\n📝 ${descSnippet}${descSnippet.length >= 150 ? '...' : ''}\n\n${locationText ? locationText + '\n' : ''}${dateText ? dateText + '\n' : ''}${priceText ? priceText + '\n' : ''}\n🔗 *تفاصيل الفعالية والحجز عبر منصة سيتي إيف:*\n${shareUrl}\n\n✨ منصة سيتي إيف | CityEve`
    : `🎟️ *${event.titleEn}*\n\n📝 ${descSnippet}${descSnippet.length >= 150 ? '...' : ''}\n\n${locationText ? locationText + '\n' : ''}${dateText ? dateText + '\n' : ''}${priceText ? priceText + '\n' : ''}\n🔗 *Event details and booking on CityEve:*\n${shareUrl}\n\n✨ CityEve Platform`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareTitle}\n${descSnippet}...`,
          url: shareUrl
        });
        onClose();
      } catch (e) {}
    } else {
      handleCopy();
    }
  };

  const previewImage = event.thumbnailUrl || (event.mediaType === 'image' ? event.mediaUrl : 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-neutral-900 shadow-2xl gold-glow"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-950 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {isArabic ? 'مشاركة الإعلان / الفعالية' : 'Share Event'}
                </h3>
                <p className="text-xs text-amber-400/90 font-medium">
                  {isArabic ? 'رابط مباشر مع معاينة واتساب' : 'Direct link with WhatsApp preview'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Visual Card Preview */}
            <div className="flex gap-3 p-3 rounded-2xl bg-neutral-950 border border-white/10 shadow-inner">
              <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-neutral-800 border border-white/10">
                <img
                  src={previewImage}
                  alt={shareTitle}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png';
                  }}
                />
                {/* CityEve Badge watermark in corner */}
                <div className="absolute bottom-1 end-1 bg-black/70 rounded px-1 py-0.5 text-[9px] font-bold text-amber-400">
                  CityEve
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-bold text-sm text-white line-clamp-1">
                  {shareTitle}
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {descSnippet}...
                </p>
                {locationName && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-400/80 mt-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{locationName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Direct Links */}
            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 transition-all border border-emerald-400/30"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{isArabic ? 'مشاركة عبر واتساب' : 'Share to WhatsApp'}</span>
              </a>

              {/* Twitter Button */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareTitle} عبر منصة سيتي إيف`)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-sky-600/20 hover:bg-sky-600 hover:text-white py-3 text-xs font-bold text-sky-300 border border-sky-500/30 transition-all"
              >
                <Send className="h-4 w-4" />
                <span>{isArabic ? 'تويتر / X' : 'Twitter / X'}</span>
              </a>
            </div>

            {/* Native share button if supported on mobile devices */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-neutral-950 hover:brightness-110 transition-all shadow-md"
              >
                <Share2 className="h-4 w-4" />
                <span>{isArabic ? 'مشاركة عبر تطبيقات أخرى (الهاتف)' : 'Share via Other Apps'}</span>
              </button>
            )}

            {/* Copy Link Input with Platform Logo */}
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-400">
                  {isArabic ? 'رابط الإعلان المباشر على المنصة' : 'Direct Event Link'}
                </span>
                <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  cityeve.online
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950 p-2">
                <img
                  src="https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png"
                  alt="CityEve"
                  className="h-6 w-6 rounded-lg shrink-0 object-cover border border-white/10"
                />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full bg-transparent text-xs font-mono text-neutral-300 outline-none truncate px-1"
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                    copied
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>{isArabic ? 'تم النسخ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{isArabic ? 'نسخ' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
