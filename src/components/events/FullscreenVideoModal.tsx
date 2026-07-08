import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSafePlayableVideoUrl } from '../../lib/mediaUtils';

interface FullscreenVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  posterUrl?: string;
  titleAr?: string;
  titleEn?: string;
}

export const FullscreenVideoModal: React.FC<FullscreenVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  posterUrl,
  titleAr,
  titleEn
}) => {
  const { lang } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let playerInstance: any;
    const timer = setTimeout(() => {
      if (videoRef.current) {
        const PlyrClass = (window as any).Plyr;
        if (PlyrClass) {
          try {
            playerInstance = new PlyrClass(videoRef.current, {
              controls: [
                'play-large',
                'play',
                'progress',
                'current-time',
                'duration',
                'mute',
                'volume',
                'settings',
                'fullscreen'
              ],
              speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
              autoplay: true,
              muted: false,
              keyboard: { focused: true, global: true },
              tooltips: { controls: true, seek: true },
              i18n: lang === 'ar' ? {
                play: 'تشغيل',
                pause: 'إيقاف مؤقت',
                mute: 'كتم الصوت',
                unmute: 'تشغيل الصوت',
                settings: 'الإعدادات',
                speed: 'السرعة',
                normal: 'عادي',
                quality: 'الجودة',
                loop: 'تكرار',
              } : undefined
            });

            playerRef.current = playerInstance;

            playerInstance.on('ready', () => {
              playerInstance.play().catch((err: any) => {
                console.log('Autoplay play failed/blocked:', err);
              });
            });
          } catch (e) {
            console.error('Error initializing Plyr:', e);
          }
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying Plyr:', e);
        }
        playerRef.current = null;
      }
    };
  }, [isOpen, videoUrl, lang]);

  if (!isOpen) return null;

  const displayTitle = lang === 'ar' ? titleAr || 'عرض الفيديو' : titleEn || 'Video Preview';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex flex-col justify-between bg-neutral-950/98 backdrop-blur-xl text-white select-none overflow-hidden"
      >
        {/* Top Header / Bar */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 bg-gradient-to-b from-black/85 via-black/50 to-transparent flex items-center justify-between">
          {/* Back/Close Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-amber-500 hover:text-neutral-950 border border-white/10 hover:border-amber-500 font-medium transition-all duration-300 shadow-lg active:scale-95"
            id="fullscreen-video-back"
          >
            {lang === 'ar' ? (
              <>
                <ArrowRight className="h-5 w-5" />
                <span>الرجوع للرئيسية</span>
              </>
            ) : (
              <>
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </>
            )}
          </button>

          {/* Title */}
          <h2 className="text-sm md:text-lg font-bold tracking-tight text-amber-500 drop-shadow max-w-[50%] truncate">
            {displayTitle}
          </h2>

          {/* Close Icon shortcut */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/5 hover:bg-red-500 hover:text-white border border-white/5 font-medium transition-all duration-300"
            title={lang === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Center Screen Video Player Frame */}
        <div className="flex-1 w-full flex items-center justify-center p-4">
          <div 
            className={`relative max-h-[80vh] md:max-h-[85vh] w-full transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center ${
              isPortrait ? 'max-w-[380px] aspect-[9/16]' : 'max-w-4xl aspect-video'
            }`}
          >
            {/* The video element that Plyr wraps */}
            <video
              ref={videoRef}
              src={getSafePlayableVideoUrl(videoUrl)}
              poster={posterUrl}
              autoPlay
              preload="auto"
              playsInline
              controls
              className="w-full h-full object-contain cursor-pointer"
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                if (video.videoHeight > video.videoWidth) {
                  setIsPortrait(true);
                } else {
                  setIsPortrait(false);
                }
              }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
