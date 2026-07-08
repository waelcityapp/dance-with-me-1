import React, { useState } from 'react';
import { DanceEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Share2, Copy, Check, MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareModalProps {
  event: DanceEvent | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ event, onClose }) => {
  const { lang } = useApp();
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const shareTitle = lang === 'ar' ? event.titleAr : event.titleEn;
  const shareText = lang === 'ar' ? `${event.titleAr} - ${event.descriptionAr.slice(0, 80)}...` : `${event.titleEn} - ${event.descriptionEn.slice(0, 80)}...`;
  const shareUrl = window.location.href;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(`${shareTitle} | ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        onClose();
      } catch (e) {}
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl gold-glow"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {lang === 'ar' ? 'مشاركة إعلان الفعالية' : 'Share Event Announcement'}
                </h3>
                <p className="text-xs text-neutral-400 font-mono truncate max-w-[200px]">
                  {shareTitle}
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
            {/* Native share button if supported */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-neutral-950 hover:bg-amber-400 transition-all shadow-md gold-glow"
              >
                <Share2 className="h-4 w-4" />
                <span>{lang === 'ar' ? 'مشاركة فورية عبر الهاتف (Web Share)' : 'Native Instant Share'}</span>
              </button>
            )}

            {/* Social Direct Links */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n\n${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600/20 py-3 text-xs font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/20 py-3 text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all"
              >
                <Send className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تويتر / X' : 'Twitter / X'}</span>
              </a>
            </div>

            {/* Copy Link Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-400">
                {lang === 'ar' ? 'رابط الإعلان المباشر' : 'Direct Announcement Link'}
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950 p-2">
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
                      <span>{lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'نسخ الرابط' : 'Copy'}</span>
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
