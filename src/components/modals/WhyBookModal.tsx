import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, Gift, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhyBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyBookModal: React.FC<WhyBookModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useApp();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-6 text-neutral-900 dark:text-neutral-100">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-[#1877F2]" />
            
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-red-500/15 flex items-center justify-center border border-red-500/30">
                    <Sparkles className="h-5 w-5 text-red-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'مميزات الحجز عبر التطبيق' : 'Booking Benefits'}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mt-0.5">
                    <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-emerald-700 dark:text-emerald-400 mb-1">
                      {lang === 'ar' ? 'خصومات خاصة وحصرية' : 'Exclusive Discounts'}
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {lang === 'ar' 
                        ? 'الاستفادة من خصومات خاصة وحصرية عن الأسعار الرسمية عند الحجز من خلال التطبيق.'
                        : 'Enjoy special and exclusive discounts off official prices when booking via the app.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/40">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 mt-0.5">
                    <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-amber-700 dark:text-amber-400 mb-1">
                      {lang === 'ar' ? 'دعوات وامتيازات VIP' : 'VIP Event Invites'}
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {lang === 'ar'
                        ? 'عند ملاحظة تفاعلك مع التطبيق والحجز من خلاله ومشاركة الإعلانات تتلقى دعوات لحضور بعض الحفلات بخصومات قد تصل إلى 100% وامتيازات VIP خاصة.'
                        : 'By engaging with the app, booking, and sharing, you receive invitations with up to 100% discounts and exclusive VIP privileges.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-5 w-full py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                {lang === 'ar' ? 'فهمت، شكراً' : 'Got it, Thanks'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
