import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, Download, Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EventImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  titleAr?: string;
  titleEn?: string;
}

export const EventImageLightboxModal: React.FC<EventImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  titleAr,
  titleEn,
}) => {
  const { lang } = useApp();

  if (!isOpen) return null;

  const title = lang === 'ar' ? titleAr || 'عرض الصورة' : titleEn || 'Image Preview';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl animate-fade-in select-none"
        onClick={onClose}
      >
        {/* Top Control Bar */}
        <div 
          className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none max-w-5xl mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-900/80 backdrop-blur-md border border-white/10 text-white text-xs sm:text-sm font-bold shadow-2xl max-w-[70%] truncate">
            <ZoomIn className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="truncate">{title}</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-2xl cursor-pointer"
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Image Container with smooth animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-5xl max-h-[88vh] w-full h-full flex items-center justify-center p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
