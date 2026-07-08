import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Upload, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Phone, 
  User, 
  Calendar, 
  DollarSign, 
  Image as ImageIcon, 
  Video, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Lock, 
  CheckCircle2, 
  Copy, 
  Check,
  X,
  FileCheck
} from 'lucide-react';
import { saveAdSubmissionToFirestore, saveNotificationToFirestore } from '../../lib/firebase';
import { AdSubmission } from '../../types';

export interface EventPaymentCheckoutProps {
  lang: 'ar' | 'en';
  user: any;
  pricing: {
    basePrice: number;
    days: number;
    extraDays: number;
    extraPrice: number;
    subtotal: number;
    videoSurcharge: number;
    total: number;
  };
  titleAr: string;
  titleEn: string;
  mediaType: 'image' | 'video';
  expirationNotice: string;
  initialPhone?: string;
  category?: 'party' | 'course' | 'trip';
  styles?: any[];
  mediaUrl?: string;
  eventData?: any;
  onBack: () => void;
  onSuccessComplete: () => void;
}

export const EventPaymentCheckout: React.FC<EventPaymentCheckoutProps> = ({
  lang,
  user,
  pricing,
  titleAr,
  titleEn,
  mediaType,
  expirationNotice,
  initialPhone = '',
  category = 'party',
  styles = ['Salsa'],
  mediaUrl = '',
  eventData,
  onBack,
  onSuccessComplete
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [phone, setPhone] = useState<string>(initialPhone);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Generate unique reference invoice number
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setInvoiceNumber(`DWM-INV-${randomNum}`);
  }, []);

  // Phone validation: at least 10 digits, digits and optional leading + or 0
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const isPhoneValid = cleanPhone.length >= 10 && /^\+?\d+$/.test(cleanPhone);
  
  const isFormValid = isPhoneValid && receiptImage !== null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('01010764256');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readImageFile(file);
    }
  };

  const readImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setReceiptImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        readImageFile(file);
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    
    const advName = user?.name || (lang === 'ar' ? 'معلن DWM VIP' : 'DWM VIP Advertiser');
    const submissionId = `sub_${Date.now()}`;
    const invNum = invoiceNumber || `DWM-INV-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const submissionData: AdSubmission = {
      id: submissionId,
      invoiceNumber: invNum,
      advertiserId: user?.id,
      advertiserName: advName,
      phone,
      titleAr: titleAr || 'سهرة سالسا وباتشاتا ملكية',
      titleEn: titleEn || 'Royal Salsa & Bachata Night',
      category: category as any,
      styles: styles as any,
      mediaType,
      mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80',
      pricing: {
        days: pricing.days,
        subtotal: pricing.subtotal,
        videoSurcharge: pricing.videoSurcharge,
        total: pricing.total
      },
      receiptImage: receiptImage || undefined,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      eventData
    };

    // 1. Save immediately to LocalStorage for 0ms instant display in Admin Panel
    try {
      const existing: AdSubmission[] = JSON.parse(localStorage.getItem('dwm_ad_submissions') || '[]');
      localStorage.setItem('dwm_ad_submissions', JSON.stringify([submissionData, ...existing]));
    } catch (e) {}

    // 2. Save to Firestore with timeout safety guard so button never hangs
    try {
      await Promise.race([
        saveAdSubmissionToFirestore(submissionData),
        new Promise(resolve => setTimeout(resolve, 3500))
      ]);

      await Promise.race([
        saveNotificationToFirestore({
          id: `notif_${Date.now()}`,
          titleAr: '🚀 إعلان VIP جديد قيد المراجعة',
          titleEn: '🚀 New VIP Ad Submission',
          messageAr: `تم استلام الفاتورة رقم ${invNum} من ${advName} بمبلغ ${pricing.total} جنيه. يرجى المراجعة من لوحة التحكم.`,
          messageEn: `Received invoice ${invNum} from ${advName} for ${pricing.total} EGP. Please review in Admin Panel.`,
          date: new Date().toISOString(),
          read: false,
          type: 'system',
          relatedEventId: submissionId
        }),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
    } catch (err) {
      console.warn('Firestore save completed offline or timed out, local state is saved:', err);
    }

    setIsSubmitting(false);
    setShowSuccessModal(true);
  };

  const advertiserName = user?.name || (lang === 'ar' ? 'معلن DWM VIP' : 'DWM VIP Advertiser');
  const displayTitle = lang === 'ar' ? (titleAr || 'سهرة رقص لاتينية') : (titleEn || 'Latin Dance Event');

  return (
    <div className="w-full max-w-3xl mx-auto pt-2 pb-36 sm:pb-44" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="w-full max-w-lg rounded-3xl border-2 border-amber-500/50 bg-neutral-950 p-6 sm:p-8 shadow-2xl gold-glow text-center relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 shadow-xl gold-glow">
                <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 tracking-tight">
                {lang === 'ar' ? 'تم استلام طلب إعلانك بنجاح!' : 'Ad Submission Received!'}
              </h3>

              <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-4.5 my-5 text-sm sm:text-base font-bold text-amber-300 leading-relaxed shadow-inner">
                {lang === 'ar' ? (
                  <span>سوف تتلقى إشعاراً على حسابك الخاص بالفاتورة رقم <strong className="font-mono text-white bg-black/40 px-2 py-0.5 rounded border border-amber-500/30 inline-block mt-1">{invoiceNumber}</strong></span>
                ) : (
                  <span>You will receive a notification on your account regarding invoice <strong className="font-mono text-white bg-black/40 px-2 py-0.5 rounded border border-amber-500/30 inline-block mt-1">{invoiceNumber}</strong></span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
                {lang === 'ar'
                  ? 'تم إرفاق إيصال الدفع ومراجعة الفاتورة. يتم مراجعة الإعلان من قبل فريق الإدارة وتفعيله خلال 1 إلى 24 ساعة كحد أقصى.'
                  : 'Your payment receipt has been attached. The ad is now under review and will go live within 1 to 24 hours.'}
              </p>

              <div className="flex items-center justify-center gap-2 text-xs font-mono text-neutral-400 mb-6 bg-neutral-900/80 py-2.5 px-4 rounded-xl border border-white/5">
                <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{lang === 'ar' ? 'وقت المراجعة المتوقع: 1 - 24 ساعة' : 'Estimated review time: 1 - 24 hours'}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSuccessComplete}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 py-4 px-6 text-base font-extrabold text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-xl gold-glow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-5 w-5 fill-current" />
                <span>{lang === 'ar' ? 'متابعة والعودة للرئيسية' : 'Continue & Return Home'}</span>
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Payment Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-950 p-6 sm:p-8 shadow-2xl gold-glow space-y-7 relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 shadow-lg gold-glow shrink-0">
              <FileText className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>{lang === 'ar' ? 'صفحة الدفع للمعاينة وتأكيد الإعلان' : 'Payment Review & Checkout'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  VIP
                </span>
              </h3>
              <p className="text-xs text-amber-400/80 font-medium mt-0.5">
                {lang === 'ar' ? 'قم بمراجعة ملخص الفاتورة وإرفاق إيصال التحويل البنكي' : 'Review invoice summary and upload transfer receipt'}
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl bg-neutral-800/90 px-4 py-2.5 text-xs font-bold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all border border-neutral-700/60 self-end sm:self-center shrink-0 cursor-pointer"
          >
            <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span>{lang === 'ar' ? 'الرجوع لتعديل الإعلان' : 'Back to Edit Ad'}</span>
          </button>
        </div>

        {/* Invoice Summary Box (شكل الفاتورة باختصار) */}
        <div className="rounded-2xl bg-neutral-950/90 border border-neutral-800/80 p-5 sm:p-6 space-y-4 shadow-xl relative z-10">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-amber-400" />
              <h4 className="text-sm sm:text-base font-extrabold text-white">
                {lang === 'ar' ? 'شكل الفاتورة باختصار (Invoice Summary)' : 'Invoice Summary'}
              </h4>
            </div>
            <div className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
              {invoiceNumber || 'DWM-INV-XXXX'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Advertiser Name */}
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 space-y-1">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-medium">
                <User className="h-3.5 w-3.5 text-amber-400/80" />
                <span>{lang === 'ar' ? 'اسم المعلن:' : 'Advertiser Name:'}</span>
              </span>
              <span className="text-sm font-bold text-white block truncate">
                {advertiserName}
              </span>
            </div>

            {/* Reference Invoice Number */}
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 space-y-1">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-medium">
                <FileText className="h-3.5 w-3.5 text-amber-400/80" />
                <span>{lang === 'ar' ? 'رقم الفاتورة المرجعي:' : 'Reference Invoice #:'}</span>
              </span>
              <span className="text-sm font-mono font-extrabold text-amber-400 block">
                {invoiceNumber || 'DWM-INV-XXXX'}
              </span>
            </div>

            {/* Ad Duration */}
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 space-y-1">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-medium">
                <Calendar className="h-3.5 w-3.5 text-amber-400/80" />
                <span>{lang === 'ar' ? 'مدة الإعلان:' : 'Ad Duration:'}</span>
              </span>
              <span className="text-sm font-bold text-white block">
                {pricing.days} {lang === 'ar' ? 'أيام' : 'Days'} 
                <span className="text-xs font-normal text-neutral-400 block mt-0.5">{expirationNotice}</span>
              </span>
            </div>

            {/* Media Type */}
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-white/5 space-y-1">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-medium">
                {mediaType === 'video' ? (
                  <Video className="h-3.5 w-3.5 text-amber-400/80" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5 text-amber-400/80" />
                )}
                <span>{lang === 'ar' ? 'نوع الوسائط المستخدمة:' : 'Media Types Used:'}</span>
              </span>
              <span className="text-sm font-bold text-white block">
                {mediaType === 'video' 
                  ? (lang === 'ar' ? 'فيديو ترويجي (Video)' : 'Promotional Video')
                  : (lang === 'ar' ? 'صورة وبوستر (Image)' : 'Event Banner Image')}
              </span>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-neutral-300">
              <span>{lang === 'ar' ? `تكلفة مدة الاشتراك (${pricing.days} أيام):` : `Subscription cost (${pricing.days} days):`}</span>
              <span className="font-mono font-semibold">{pricing.subtotal} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
            </div>

            {pricing.videoSurcharge > 0 && (
              <div className="flex justify-between items-center text-amber-300">
                <span>{lang === 'ar' ? 'رسوم إضافة وسائط فيديو (+20%):' : 'Video media surcharge (+20%):'}</span>
                <span className="font-mono font-semibold">+{pricing.videoSurcharge} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-white/10 text-base sm:text-lg font-black text-amber-400">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <span>{lang === 'ar' ? 'إجمالي التكلفة المطلوب سدادها:' : 'Total Cost Payable:'}</span>
              </span>
              <span className="font-mono bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 px-3.5 py-1 rounded-xl shadow-md font-extrabold">
                {pricing.total} {lang === 'ar' ? 'ج.م' : 'EGP'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Number Input Section */}
        <div className="space-y-2.5 relative z-10">
          <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-white">
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-400" />
              <span>{lang === 'ar' ? 'رقم الموبايل للتواصل ومتابعة الفاتورة:' : 'Mobile Number for Invoice Follow-up:'}</span>
              <span className="text-red-400">*</span>
            </span>
            {phone && !isPhoneValid && (
              <span className="text-xs text-red-400 font-medium">
                {lang === 'ar' ? '⚠️ أضف رقم موبايل صحيح (10 أرقام على الأقل)' : '⚠️ Enter a valid phone number (10+ digits)'}
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: 01012345678' : 'e.g., 01012345678'}
              className={`w-full rounded-2xl bg-neutral-950/90 border px-4 py-3.5 text-sm font-mono text-white placeholder-neutral-600 focus:outline-none transition-all ${
                !phone 
                  ? 'border-neutral-800 focus:border-amber-500' 
                  : isPhoneValid 
                    ? 'border-emerald-500/60 focus:border-emerald-400 bg-emerald-950/10' 
                    : 'border-red-500/60 focus:border-red-400'
              }`}
            />
            {isPhoneValid && (
              <div className="absolute top-1/2 -translate-y-1/2 left-4 rtl:left-auto rtl:right-4 text-emerald-400 flex items-center gap-1 text-xs font-bold">
                <Check className="h-4 w-4 stroke-[3]" />
                <span>{lang === 'ar' ? 'صحيح' : 'Valid'}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-neutral-400">
            {lang === 'ar' 
              ? 'سيتم استخدام هذا الرقم للتواصل معك عبر واتساب أو الهاتف في حال وجود استفسار بخصوص إيصال الدفع.' 
              : 'This number will be used to contact you via WhatsApp or phone regarding your payment receipt.'}
          </p>
        </div>

        {/* Important Payment Instructions Box */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-600/15 border-2 border-amber-500/50 p-5 text-neutral-200 space-y-3.5 shadow-xl relative z-10">
          <div className="flex items-center gap-2.5 text-amber-400 font-extrabold text-sm sm:text-base">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>{lang === 'ar' ? 'تعليمات الدفع الهامة:' : 'Important Payment Instructions:'}</span>
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-neutral-100 font-medium">
            {lang === 'ar' ? (
              <span>
                يرجى تسديد المبلغ المطلوب (<strong className="text-amber-300 font-mono font-bold">{pricing.total} ج.م</strong>) عن طريق التحويل انستاباي (InstaPay) او فودافون كاش على الرقم{' '}
                <strong className="font-mono text-amber-300 bg-neutral-950 px-2.5 py-1 rounded-lg border border-amber-500/40 inline-flex items-center gap-1.5 mx-1 font-bold select-all">
                  01010764256
                </strong>{' '}
                مع ارفاق صورة واضحة لايصال الدفع فى الخانة المبينة هنا.
              </span>
            ) : (
              <span>
                Please pay the required amount (<strong className="text-amber-300 font-mono font-bold">{pricing.total} EGP</strong>) via InstaPay or Vodafone Cash transfer to the number{' '}
                <strong className="font-mono text-amber-300 bg-neutral-950 px-2.5 py-1 rounded-lg border border-amber-500/40 inline-flex items-center gap-1.5 mx-1 font-bold select-all">
                  01010764256
                </strong>{' '}
                and attach a clear image of the payment receipt in the field indicated below.
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-500/20">
            <button
              type="button"
              onClick={handleCopyPhone}
              className="flex items-center gap-2 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 px-4 py-2 text-xs font-extrabold transition-all shadow-md gold-glow cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{lang === 'ar' ? 'تم نسخ الرقم بنجاح!' : 'Number Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'نسخ رقم التحويل (01010764256)' : 'Copy Transfer Number (01010764256)'}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-amber-300/80 font-mono">
              <span>🟢 InstaPay</span>
              <span>•</span>
              <span>🔴 Vodafone Cash</span>
            </div>
          </div>
        </div>

        {/* Upload Receipt Image Dropzone (إمكانية رفع الصورة) */}
        <div className="space-y-2.5 relative z-10">
          <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-white">
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-amber-400" />
              <span>{lang === 'ar' ? 'إرفاق صورة واضحة لإيصال الدفع (سكرين شوت التحويل):' : 'Upload Clear Image of Payment Receipt:'}</span>
              <span className="text-red-400">*</span>
            </span>
            {receiptImage && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>{lang === 'ar' ? 'تم الرفع' : 'Uploaded'}</span>
              </span>
            )}
          </label>

          {!receiptImage ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3.5 bg-neutral-950/60 hover:bg-neutral-950 ${
                isDragging 
                  ? 'border-amber-500 bg-amber-500/10 scale-[1.01]' 
                  : 'border-neutral-700 hover:border-amber-500/60'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-upload-input"
              />
              <label htmlFor="receipt-upload-input" className="cursor-pointer flex flex-col items-center gap-3 w-full">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 animate-bounce" />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-bold text-white block">
                    {lang === 'ar' ? 'اضغط لاختيار صورة الإيصال أو اسحب الملف هنا' : 'Click to upload receipt image or drag file here'}
                  </span>
                  <span className="text-xs text-neutral-400 mt-1 block font-mono">
                    {lang === 'ar' ? 'يدعم صور PNG, JPG, JPEG (صورة واضحة لعملية التحويل)' : 'Supports PNG, JPG, JPEG (Clear screenshot of transfer)'}
                  </span>
                </div>
              </label>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/40 bg-neutral-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                  <span>{lang === 'ar' ? 'تم إرفاق صورة إيصال الدفع بنجاح' : 'Payment receipt attached successfully'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/30 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'حذف وتغيير الصورة' : 'Remove & Change'}</span>
                </button>
              </div>

              <div className="relative max-h-80 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 flex items-center justify-center">
                <img src={receiptImage} alt="Payment Receipt Preview" className="max-h-80 w-auto object-contain" />
              </div>
            </div>
          )}
        </div>

        {/* Action Button Section (زر ارسال الاعلان الى المراجعة) */}
        <div className="pt-4 space-y-3 relative z-10">
          <motion.button
            whileHover={isFormValid ? { scale: 1.01 } : {}}
            whileTap={isFormValid ? { scale: 0.98 } : {}}
            type="button"
            disabled={!isFormValid || isSubmitting}
            onClick={handleSubmitReview}
            className={`w-full rounded-2xl py-4.5 px-6 text-base sm:text-lg font-extrabold transition-all flex items-center justify-center gap-3 border ${
              isFormValid
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-2xl gold-glow border-amber-300/40 cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                <span>{lang === 'ar' ? 'جاري إرسال الإعلان وإيصال الدفع...' : 'Submitting Ad & Receipt...'}</span>
              </div>
            ) : (
              <>
                <Sparkles className={`h-6 w-6 shrink-0 ${isFormValid ? 'fill-current animate-spin-slow text-neutral-950' : 'text-neutral-600'}`} />
                <span>
                  {lang === 'ar'
                    ? `إرسال الإعلان إلى المراجعة (${pricing.total} ج.م)`
                    : `Send Ad for Review (${pricing.total} EGP)`}
                </span>
              </>
            )}
          </motion.button>

          {!isFormValid && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 flex items-center justify-center gap-2 text-xs text-red-300 font-medium text-center">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>
                {lang === 'ar'
                  ? '⚠️ لتفعيل زر "إرسال الإعلان إلى المراجعة"، يرجى إدخال رقم موبايل صحيح وإرفاق صورة إيصال الدفع'
                  : '⚠️ To unlock "Send Ad for Review", please enter a valid mobile number and attach your payment receipt image'}
              </span>
            </div>
          )}

          <div className="rounded-xl bg-neutral-950/80 border border-neutral-800/80 p-3.5 flex items-center justify-center gap-2.5 text-xs text-neutral-300 text-center font-medium">
            <Clock className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'يتم مراجعة الاعلان خلال 1 الى 24 ساعة من ارسال الايصال'
                : 'The ad will be reviewed within 1 to 24 hours of submitting the receipt.'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
