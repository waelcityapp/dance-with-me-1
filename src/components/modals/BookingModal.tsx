import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Phone, Users, CheckCircle, Copy, Check, Upload, 
  Camera, Ticket, QrCode, AlertTriangle, Info, Calendar, DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BookingModal: React.FC = () => {
  const { 
    selectedBookingEvent, 
    setSelectedBookingEvent, 
    lang, 
    submitBooking 
  } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [individuals, setIndividuals] = useState(1);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookingResult, setBookingResult] = useState<any | null>(null);

  // Reset local state when modal opens/closes
  useEffect(() => {
    if (selectedBookingEvent) {
      setName('');
      setPhone('');
      setIndividuals(1);
      setReceiptImage(null);
      setBookingResult(null);
      setIsSubmitting(false);
    }
  }, [selectedBookingEvent]);

  if (!selectedBookingEvent) return null;

  // Extract event price and parse it to numerical value
  const parsePrice = (priceStrAr: string, priceStrEn: string): number => {
    const cleanAr = priceStrAr?.replace(/[^\d]/g, '') || '';
    const cleanEn = priceStrEn?.replace(/[^\d]/g, '') || '';
    const val = parseInt(cleanAr) || parseInt(cleanEn) || 0;
    return val;
  };

  const basePrice = parsePrice(selectedBookingEvent.priceAr, selectedBookingEvent.priceEn);
  const totalAmount = basePrice * individuals;

  const isPhoneValid = phone.trim().length >= 11 && /^\d+$/.test(phone.trim());
  const isNameValid = name.trim().split(' ').filter(Boolean).length >= 2;
  const isFormValid = isNameValid && isPhoneValid && receiptImage !== null && !isSubmitting;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('01010764256');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress with JPEG at 70% quality
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setReceiptImage(compressedDataUrl);
          } else {
            setReceiptImage(e.target!.result as string);
          }
        };
        img.src = e.target.result as string;
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

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);

    try {
      const result = await submitBooking({
        eventId: selectedBookingEvent.id,
        eventTitleAr: selectedBookingEvent.titleAr,
        eventTitleEn: selectedBookingEvent.titleEn,
        eventPrice: basePrice,
        userName: name.trim(),
        userPhone: phone.trim(),
        numberOfIndividuals: individuals,
        totalAmount: totalAmount,
        receiptImage: receiptImage!
      });

      if (result) {
        setBookingResult(result);
      } else {
        alert(lang === 'ar' ? 'حدث خطأ أثناء إرسال الحجز، يرجى المحاولة لاحقاً.' : 'An error occurred while sending booking, please try again.');
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isArabic = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-amber-500" />
            <h3 className="text-lg font-bold text-zinc-100 font-sans">
              {isArabic ? 'بوابة حجز التذاكر الفورية' : 'Instant Ticket Booking Portal'}
            </h3>
          </div>
          <button 
            onClick={() => setSelectedBookingEvent(null)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {!bookingResult ? (
            <div className="space-y-6">
              {/* Event Info Card */}
              <div className="flex gap-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/80 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-600"></div>
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900">
                  {selectedBookingEvent.mediaType === 'video' ? (
                    <video 
                      src={selectedBookingEvent.mediaUrl} 
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img 
                      src={selectedBookingEvent.mediaUrl} 
                      alt={selectedBookingEvent.titleAr} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-base font-bold text-zinc-100 line-clamp-1">
                    {isArabic ? selectedBookingEvent.titleAr : selectedBookingEvent.titleEn}
                  </h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {new Date(selectedBookingEvent.eventDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                      {isArabic ? selectedBookingEvent.priceAr : selectedBookingEvent.priceEn}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Input: Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-500" />
                  {isArabic ? 'اسمك بالكامل (كما بالبطاقة الشخصية)' : 'Full Name (as on your National ID)'}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isArabic ? 'يرجى إدخال اسمك كما هو موضح بالبطاقة الشخصية' : 'Enter your name as shown on your ID'}
                    className="w-full p-3 pl-4 pr-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition font-sans text-sm"
                  />
                </div>
                {name && !isNameValid && (
                  <p className="text-xs text-amber-500/90 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {isArabic ? 'يرجى كتابة الاسم ثنائياً على الأقل للتأكيد' : 'Please enter at least a first and last name'}
                  </p>
                )}
              </div>

              {/* Form Input: Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-500" />
                  {isArabic ? 'رقم الموبايل للتواصل' : 'Mobile Number for Contact'}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isArabic ? 'رقم موبايل صحيح في حالة الاتصال بك للتأكيد' : 'Valid mobile number in case we need to call you'}
                  className="w-full p-3 pl-4 pr-4 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition font-mono text-sm text-left"
                  dir="ltr"
                />
                {phone && !isPhoneValid && (
                  <p className="text-xs text-red-500/90 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {isArabic ? 'يرجى إدخال رقم هاتف صحيح مكون من 11 رقم' : 'Please enter a valid 11-digit mobile number'}
                  </p>
                )}
              </div>

              {/* Individuals Selector & Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" />
                    {isArabic ? 'عدد الأفراد' : 'Number of Individuals'}
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 max-w-[200px]">
                    <button
                      type="button"
                      disabled={individuals <= 1}
                      onClick={() => setIndividuals(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-zinc-900 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 rounded-lg font-bold text-lg transition"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-mono font-bold text-zinc-100">
                      {individuals}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIndividuals(prev => prev + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-lg font-bold text-lg transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">
                      {isArabic ? 'قيمة الحجز للفرد:' : 'Price per person:'}
                    </span>
                    <span className="font-bold text-zinc-200 font-mono">
                      {basePrice} {isArabic ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-800/60">
                    <span className="text-sm text-zinc-100 font-medium">
                      {isArabic ? 'إجمالي المبلغ المستحق:' : 'Total Amount Due:'}
                    </span>
                    <span className="text-xl font-bold text-amber-500 font-mono">
                      {totalAmount} {isArabic ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-3">
                <div className="flex gap-2.5">
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold text-zinc-200">
                      {isArabic ? 'تعليمات الدفع والتحويل' : 'Payment & Transfer Instructions'}
                    </h5>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {isArabic 
                        ? 'برجاء تحويل المبلغ المطلوب عبر فودافون كاش أو انستاباي على الرقم التالي، ثم أرفق لقطة شاشة لإيصال التحويل بالأسفل لتفعيل الحجز فوراً:' 
                        : 'Please transfer the total amount via Vodafone Cash or Instapay to the following number, then attach the receipt screenshot below:'}
                    </p>
                  </div>
                </div>

                {/* Transfer Number Copy Box */}
                <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div className="font-mono text-base font-bold text-amber-500">
                    01010764256
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100 transition py-1 px-2.5 rounded-lg bg-zinc-900"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-sans">{isArabic ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="font-sans">{isArabic ? 'نسخ الرقم' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Receipt File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-500" />
                  {isArabic ? 'إرفاق صورة إيصال الدفع' : 'Attach Transfer Receipt Screenshot'}
                  <span className="text-red-500">*</span>
                </label>

                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                    isDragging ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                  }`}
                >
                  <input
                    id="receipt-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {receiptImage ? (
                    <div className="w-full space-y-4">
                      <div className="relative w-40 h-40 mx-auto rounded-lg overflow-hidden border border-zinc-800">
                        <img 
                          src={receiptImage} 
                          alt="Receipt Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setReceiptImage(null)}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black rounded-full text-zinc-300 hover:text-white transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans">
                        {isArabic ? '✅ تم تحميل الإيصال بنجاح. يمكنك استبداله بالضغط مجدداً.' : '✅ Receipt loaded successfully. Click below to replace.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('receipt-file-input')?.click()}
                        className="py-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs transition"
                      >
                        {isArabic ? 'تغيير الصورة' : 'Change Image'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3" onClick={() => document.getElementById('receipt-file-input')?.click()}>
                      <div className="p-3 bg-zinc-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-zinc-400">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-sans text-zinc-300">
                        {isArabic ? 'اسحب صورتك هنا أو تصفح من الموبايل أو الكاميرا' : 'Drag screenshot here or browse from mobile / camera'}
                      </p>
                      <p className="text-xs text-zinc-500 font-sans">
                        {isArabic ? 'يدعم الصور فقط (JPG, PNG, WEBP)' : 'Supports image formats only (JPG, PNG, WEBP)'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="button"
                disabled={!isFormValid || isSubmitting}
                onClick={handleSubmit}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:opacity-50 disabled:text-zinc-500 text-black font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{isArabic ? 'جاري تأكيد البيانات...' : 'Processing details...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>{isArabic ? 'إرسال طلب الحجز' : 'Send Booking Request'}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Success View: Ticket Graphics */
            <div className="space-y-6 flex flex-col items-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="text-center space-y-1.5">
                <h4 className="text-xl font-bold text-zinc-100">
                  {isArabic ? 'تم إرسال طلب الحجز بنجاح!' : 'Booking Request Sent Successfully!'}
                </h4>
                <p className="text-sm text-zinc-400">
                  {isArabic 
                    ? 'جاري مراجعة الدفع من قِبل المشرفين وسوف يتم تفعيل تذكرتك قريباً.' 
                    : 'Admins are verifying your payment, your ticket will be activated shortly.'}
                </p>
              </div>

              {/* Graphic Ticket Card */}
              <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-lg">
                {/* Sideline red accent for style */}
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-600"></div>

                {/* Ticket header */}
                <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/40 flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-amber-500 tracking-wider">
                    {bookingResult.refNumber}
                  </span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 py-0.5 px-2 rounded font-sans">
                    {isArabic ? 'قيد المراجعة' : 'Pending Review'}
                  </span>
                </div>

                {/* Ticket Details */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      {isArabic ? 'اسم الفعالية' : 'Event'}
                    </span>
                    <h5 className="text-sm font-bold text-zinc-100 line-clamp-1">
                      {isArabic ? bookingResult.eventTitleAr : bookingResult.eventTitleEn}
                    </h5>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                        {isArabic ? 'اسم الحاجز' : 'Name'}
                      </span>
                      <span className="text-xs text-zinc-300 font-medium font-sans">
                        {bookingResult.userName}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                        {isArabic ? 'رقم الهاتف' : 'Phone'}
                      </span>
                      <span className="text-xs text-zinc-300 font-mono">
                        {bookingResult.userPhone}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                        {isArabic ? 'الأفراد' : 'Guests'}
                      </span>
                      <span className="text-xs text-zinc-300 font-medium font-sans">
                        {bookingResult.numberOfIndividuals} {isArabic ? 'أفراد' : 'people'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                        {isArabic ? 'المبلغ الإجمالي' : 'Total Price'}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-500">
                        {bookingResult.totalAmount} {isArabic ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dotted separator with ticket cuts on sides */}
                <div className="relative flex items-center justify-center px-4 my-2">
                  <div className="absolute left-[-8px] w-4 h-4 rounded-full bg-zinc-900 border-r border-zinc-800"></div>
                  <div className="w-full border-t border-dashed border-zinc-800"></div>
                  <div className="absolute right-[-8px] w-4 h-4 rounded-full bg-zinc-900 border-l border-zinc-800"></div>
                </div>

                {/* Barcode/QR Mock Placeholder */}
                <div className="p-5 flex flex-col items-center bg-zinc-900/20">
                  <div className="w-32 h-32 bg-white p-1.5 rounded-xl border border-zinc-800">
                    {/* Generates a live QR representing this specific booking reference code! */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=245-158-11&data=${encodeURIComponent(bookingResult.refNumber)}`}
                      alt="Booking Access QR" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-2.5">
                    {isArabic ? 'سوف يتفعل هذا الكود فور تأكيد الحجز' : 'QR code will activate once confirmed'}
                  </p>
                </div>
              </div>

              {/* Informative notification statement */}
              <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl max-w-md text-center flex gap-2 items-start">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400 text-start leading-relaxed">
                  {isArabic 
                    ? 'سوف تجد إشعاراً في حسابك الشخصي وقريباً كود الدخول الخاص بك والباركود بعد تأكيد المسؤولين لمراجعة إيصال التحويل المرفق.' 
                    : 'You will receive an in-app notification and your access passcode as soon as our administrators verify your attached transfer receipt.'}
                </p>
              </div>

              {/* Back to Explore button */}
              <button
                type="button"
                onClick={() => setSelectedBookingEvent(null)}
                className="py-2.5 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-sm transition font-sans font-medium"
              >
                {isArabic ? 'العودة للاستكشاف' : 'Close & Go Back'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
