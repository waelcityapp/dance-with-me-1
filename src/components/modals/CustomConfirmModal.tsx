import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { HelpCircle, AlertTriangle } from 'lucide-react';

export const CustomConfirmModal: React.FC = () => {
  const { customConfirm, lang } = useApp();
  const { isOpen, message, resolve } = customConfirm;

  const isRtl = lang === 'ar';

  const handleConfirm = () => {
    if (resolve) resolve(true);
  };

  const handleCancel = () => {
    if (resolve) resolve(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="absolute inset-0 cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-900/95 backdrop-blur-2xl shadow-2xl p-6 text-center z-10 flex flex-col items-center"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />

            {/* Icon */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl mb-4 border bg-amber-500/10 text-amber-400 border-amber-500/20">
              {message.includes('⚠️') || message.includes('تنبيه') || message.includes('تحذير') || message.includes('حذف') ? (
                <AlertTriangle className="h-8 w-8 animate-pulse" />
              ) : (
                <HelpCircle className="h-8 w-8" />
              )}
            </div>

            {/* Title */}
            <h3 className="font-extrabold text-white text-lg tracking-tight mb-2">
              {isRtl ? 'تأكيد الإجراء' : 'Confirm Action'}
            </h3>

            {/* Message Body */}
            <div className="text-neutral-300 text-sm font-medium leading-relaxed mb-6 max-w-sm whitespace-pre-line text-center">
              {message}
            </div>

            {/* Buttons Row */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Cancel Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                className="py-3.5 px-4 rounded-2xl font-black text-sm transition-all cursor-pointer bg-neutral-800 text-neutral-300 hover:bg-neutral-750 border border-white/5"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </motion.button>

              {/* Confirm Button */}
              <motion.button
                whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className="py-3.5 px-4 rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer bg-amber-500 text-neutral-950 shadow-amber-500/10"
              >
                {isRtl ? 'تأكيد' : 'Confirm'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
