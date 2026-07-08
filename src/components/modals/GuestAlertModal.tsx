import React from 'react';
import { useApp, GuestAlertReason } from '../../context/AppContext';
import { X, ShieldAlert, Sparkles, User, MessageCircle, Heart, Ticket, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GuestAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  reason?: GuestAlertReason;
}

export const GuestAlertModal: React.FC<GuestAlertModalProps> = ({ isOpen, onClose, onOpenAuth, reason = 'default' }) => {
  const { lang } = useApp();

  if (!isOpen) return null;

  const handleGoToAuth = () => {
    onClose();
    onOpenAuth();
  };

  const getModalContent = () => {
    switch (reason) {
      case 'contact':
        return {
          icon: MessageCircle,
          titleAr: 'تنبيه: لابد من وجود حساب لمراسلة التطبيق',
          titleEn: 'Notice: Account Required to Message',
          subtitleAr: 'خدمة التواصل والدعم الفني',
          subtitleEn: 'Support & Messaging Service',
          headingAr: 'سجل دخولك أو أنشئ حساباً للتواصل معنا',
          headingEn: 'Login or Create Account to Contact Us',
          descAr: 'للتواصل عبر الواتساب أو مراسلة إدارة التطبيق وبدء المحادثة، يرجى تسجيل الدخول أو إنشاء حساب مجاني أولاً لضمان جودة التواصل وحماية خصوصية الأعضاء.',
          descEn: 'To contact app support via WhatsApp and initiate a message, please login or create a free account first to ensure secure and quality communication.'
        };
      case 'book':
        return {
          icon: Ticket,
          titleAr: 'تنبيه: لابد من وجود حساب لحجز الفعالية',
          titleEn: 'Notice: Account Required to Book',
          subtitleAr: 'حجوزات التذاكر والفعاليات',
          subtitleEn: 'Event & Ticket Bookings',
          headingAr: 'سجل دخولك أو أنشئ حساباً لتأكيد الحجز',
          headingEn: 'Login or Create Account to Book Now',
          descAr: 'لحجز التذاكر في الفعاليات والحفلات والكورسات، يرجى إنشاء حساب مجاني أو تسجيل الدخول أولاً لتتمكن من إدارة حجوزاتك ومتابعتها في حسابك الشخصي.',
          descEn: 'To book tickets for events, parties, or courses, please login or create a free account first so you can manage and track your bookings in your profile.'
        };
      case 'favorite':
        return {
          icon: Heart,
          titleAr: 'تنبيه: لابد من وجود حساب لحفظ المفضلة',
          titleEn: 'Notice: Account Required to Save Favorites',
          subtitleAr: 'قائمة الفعاليات المفضلة',
          subtitleEn: 'My Favorite Events',
          headingAr: 'سجل دخولك لحفظ الفعاليات في المفضلة',
          headingEn: 'Login to Save Events to Favorites',
          descAr: 'لإضافة الحفلات والفعاليات إلى قائمة المفضلة لديك والرجوع إليها في أي وقت، يرجى إنشاء حساب مجاني أو تسجيل الدخول أولاً.',
          descEn: 'To add events and parties to your favorites list and access them anytime, please login or create a free account first.'
        };
      case 'post_ad':
      default:
        return {
          icon: reason === 'post_ad' ? PlusCircle : User,
          titleAr: reason === 'post_ad' ? 'تنبيه: لابد من وجود حساب لإضافة إعلان' : 'تنبيه: لابد من وجود حساب',
          titleEn: reason === 'post_ad' ? 'Notice: Account Required to Post Ads' : 'Notice: Account Required',
          subtitleAr: 'عضوية النادي الفاخرة (VIP)',
          subtitleEn: 'VIP Club Membership',
          headingAr: reason === 'post_ad' ? 'قم بإنشاء حسابك أولاً لإضافة إعلان' : 'يرجى تسجيل الدخول أو إنشاء حساب أولاً',
          headingEn: reason === 'post_ad' ? 'Create an Account to Post Ads' : 'Please Login or Create an Account First',
          descAr: reason === 'post_ad'
            ? 'لإضافة إعلان جديد في المنصة، يرجى تسجيل الدخول أو إنشاء حساب أولاً لتتمكن من إدارة إعلاناتك ومتابعة الحجوزات بسهولة.'
            : 'للاستفادة من هذه الميزة والتفاعل مع محتوى التطبيق، يرجى تسجيل الدخول أو إنشاء حساب مجاني أولاً.',
          descEn: reason === 'post_ad'
            ? 'To post a new ad or announcement, please login or create a free account first so you can manage your listings and track bookings easily.'
            : 'To use this feature and interact with app content, please login or create a free account first.'
        };
    }
  };

  const content = getModalContent();
  const MainIcon = content.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-neutral-900 shadow-2xl gold-glow"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-950 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {lang === 'ar' ? content.titleAr : content.titleEn}
                </h3>
                <p className="text-xs text-amber-400/80 font-mono">
                  {lang === 'ar' ? content.subtitleAr : content.subtitleEn}
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
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400 mx-auto border border-amber-500/20 shadow-lg gold-glow">
              <MainIcon className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white">
                {lang === 'ar' ? content.headingAr : content.headingEn}
              </h4>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-sm mx-auto">
                {lang === 'ar' ? content.descAr : content.descEn}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoToAuth}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 px-6 text-xs sm:text-sm font-bold text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-xl gold-glow transition-all"
              >
                <Sparkles className="h-4 w-4 fill-current" />
                <span>{lang === 'ar' ? 'إنشاء حساب / تسجيل الدخول' : 'Create Account / Login'}</span>
              </motion.button>

              <button
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-neutral-800 py-3.5 px-6 text-xs sm:text-sm font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
