import React from 'react';
import { DanceEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, MapPin, ExternalLink, Navigation, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MapModalProps {
  event: DanceEvent | null;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ event, onClose }) => {
  const { lang } = useApp();

  if (!event) return null;

  const loc = event.location;
  // Construct a reliable Google Maps iframe URL using coordinates or query
  const mapEmbedUrl = `https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=15&output=embed`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl gold-glow"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-950 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {lang === 'ar' ? 'الموقع الجغرافي للحدث' : 'Event Geographic Location'}
                </h3>
                <p className="text-xs text-amber-400/90 font-medium">
                  {lang === 'ar' ? loc.nameAr : loc.nameEn}
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

          {/* Map Embed Body */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-inner">
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Location"
                className="filter contrast-[1.1] saturate-[1.2]"
              />
            </div>

            {/* Coordinates & Address Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-neutral-950/80 p-4 border border-white/5">
              <div>
                <p className="text-[11px] font-mono text-neutral-400">{lang === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'}</p>
                <p className="text-sm font-semibold text-neutral-100">{lang === 'ar' ? loc.addressAr : loc.addressEn}</p>
              </div>
              <div>
                <p className="text-[11px] font-mono text-neutral-400">{lang === 'ar' ? 'إحداثيات GPS' : 'GPS Coordinates'}</p>
                <p className="text-xs font-mono font-bold text-amber-400">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-neutral-800 px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>

              <a
                href={loc.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-lg gold-glow transition-all"
              >
                <Navigation className="h-4 w-4" />
                <span>{lang === 'ar' ? 'فتح في تطبيق Google Maps' : 'Open in Google Maps App'}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
