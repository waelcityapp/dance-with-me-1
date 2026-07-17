import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const CustomAlertModal: React.FC = () => {
  const { customAlert, closeCustomAlert, lang } = useApp();
  const { isOpen, message, type } = customAlert;

  const isRtl = lang === 'ar';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCustomAlert}
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
            <div className={`absolute top-0 inset-x-0 h-1 w-full bg-gradient-to-r ${
              type === 'success' 
                ? 'from-emerald-500 to-teal-500' 
                : type === 'error' 
                ? 'from-rose-500 to-red-600' 
                : 'from-blue-500 to-indigo-500'
            }`} />

            {/* Icon */}
            <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl mb-4 border ${
              type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : type === 'error' 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              {type === 'success' && <CheckCircle2 className="h-8 w-8 animate-pulse" />}
              {type === 'error' && <AlertTriangle className="h-8 w-8 animate-bounce" />}
              {type === 'info' && <Info className="h-8 w-8" />}
            </div>

            {/* Title */}
            <h3 className="font-extrabold text-white text-lg tracking-tight mb-2">
              {type === 'success' && (isRtl ? 'تم بنجاح!' : 'Success!')}
              {type === 'error' && (isRtl ? 'تنبيه / خطأ' : 'Alert / Error')}
              {type === 'info' && (isRtl ? 'تنويه' : 'Notification')}
            </h3>

            {/* Message Body */}
            <div className="text-neutral-300 text-sm font-medium leading-relaxed mb-6 max-w-sm whitespace-pre-line">
              {message}
            </div>

            {/* Close / Action Button */}
            <motion.button
              whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={closeCustomAlert}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer ${
                type === 'success'
                  ? 'bg-emerald-500 text-neutral-950 shadow-emerald-500/10'
                  : type === 'error'
                  ? 'bg-rose-500 text-white shadow-rose-500/10'
                  : 'bg-indigo-500 text-white shadow-indigo-500/10'
              }`}
            >
              {isRtl ? 'حسناً' : 'OK'}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
