import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { EventBooking, DanceEvent } from '../../types';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Ticket, 
  User, 
  Lock, 
  Loader2, 
  Calendar, 
  DollarSign, 
  Users, 
  Sparkles,
  ArrowLeft,
  XCircle,
  Clock,
  Phone
} from 'lucide-react';

export const VerificationView: React.FC = () => {
  const { lang, setActiveTab } = useApp();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [associatedEvent, setAssociatedEvent] = useState<DanceEvent | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Verification states
  const [inputRefNumber, setInputRefNumber] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isArabic = lang === 'ar';

  useEffect(() => {
    // Parse URL parameter
    const params = new URLSearchParams(window.location.search);
    const id = params.get('verify');
    if (id) {
      setBookingId(id);
      fetchBookingDetails(id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchBookingDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch booking document
      const bookingDocRef = doc(db, 'bookings', id);
      const bookingSnap = await getDoc(bookingDocRef);
      
      if (!bookingSnap.exists()) {
        setError(
          isArabic 
            ? '❌ لم يتم العثور على تذكرة بهذا الرقم أو الرابط غير صالح!' 
            : '❌ Booking ticket not found or invalid QR link!'
        );
        setLoading(false);
        return;
      }

      const bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as EventBooking;
      setBooking(bookingData);

      // 2. Fetch associated event document to compare the secret eventRef
      if (bookingData.eventId) {
        const eventDocRef = doc(db, 'events', bookingData.eventId);
        const eventSnap = await getDoc(eventDocRef);
        if (eventSnap.exists()) {
          setAssociatedEvent({ id: eventSnap.id, ...eventSnap.data() } as DanceEvent);
        } else {
          console.warn('Associated event not found in database');
        }
      }
    } catch (err) {
      console.error('Error fetching verification details:', err);
      setError(
        isArabic 
          ? '⚠️ خطأ أثناء تحميل بيانات التحقق. يرجى التأكد من اتصال الإنترنت وحاول مجدداً.' 
          : '⚠️ Error loading verification details. Please check connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!booking || !associatedEvent) return;
    
    // Safety check reference number
    const eventRefStr = String(associatedEvent.eventRef || '');
    if (inputRefNumber.trim() !== eventRefStr) {
      alert(
        isArabic
          ? '❌ الرقم المرجعي للحدث غير صحيح! يرجى إدخال الرقم الصحيح المخصص لهذه الحفلة.'
          : '❌ Incorrect Event Reference Number! Please input the authorized code for this event.'
      );
      return;
    }

    setIsConfirming(true);
    try {
      const bookingDocRef = doc(db, 'bookings', booking.id);
      const attendedTime = new Date().toISOString();
      
      // Update in Firestore
      await updateDoc(bookingDocRef, {
        attended: true,
        attendedAt: attendedTime
      });

      // Update local state
      setBooking(prev => prev ? { ...prev, attended: true, attendedAt: attendedTime } : null);
      
      setSuccessMessage(
        isArabic
          ? '✅ تم تأكيد حضور العميل بنجاح! تم قفل التذكرة وحساب مستحقات الفاعلية.'
          : '✅ Attendance confirmed successfully! Ticket locked & revenue counted.'
      );
    } catch (err) {
      console.error('Error confirming attendance:', err);
      alert(
        isArabic
          ? '❌ حدث خطأ أثناء تأكيد الحضور، يرجى المحاولة مرة أخرى.'
          : '❌ An error occurred during confirmation, please try again.'
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClearUrl = () => {
    // Clear url query param and return home
    window.history.replaceState({}, document.title, window.location.pathname);
    setActiveTab('explore');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-sm text-neutral-400 font-medium">
          {isArabic ? 'جاري فحص وتأكيد بيانات الباركود...' : 'Verifying ticket passcode & loading details...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Top Bar with back */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={handleClearUrl}
          className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition-all border border-neutral-800 cursor-pointer"
        >
          <ArrowLeft className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
        </button>
        <h2 className="text-lg font-black text-white tracking-tight">
          {isArabic ? 'بوابة التحقق ومسح التذاكر' : 'Ticket Gateway Verification'}
        </h2>
      </div>

      {error ? (
        <div className="rounded-3xl border-2 border-red-500/20 bg-red-500/5 p-6 text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-white">{isArabic ? 'خطأ في التحقق' : 'Verification Error'}</h3>
          <p className="text-xs text-neutral-400 leading-relaxed font-sans">{error}</p>
          <button 
            onClick={handleClearUrl}
            className="w-full py-3 bg-neutral-800 text-neutral-200 rounded-xl text-xs font-bold hover:bg-neutral-700 transition-all cursor-pointer"
          >
            {isArabic ? 'العودة للرئيسية' : 'Return to Home'}
          </button>
        </div>
      ) : !bookingId ? (
        <div className="rounded-3xl border-2 border-dashed border-neutral-800 bg-neutral-900/40 p-8 text-center space-y-4">
          <Ticket className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {isArabic ? 'مسح الباركود مخصص لبوابة الأمن والمنظمين' : 'Security Scanner Verification Portal'}
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed font-sans">
            {isArabic 
              ? 'يرجى مسح كود الباركود/QR المرفق على تذكرة المستخدم لفتح تفاصيل الحجز وتأكيد الحضور تلقائياً.' 
              : 'Please scan the QR code displayed on the attendee’s ticket directly to unlock booking details & confirm gate entry.'}
          </p>
          <button 
            onClick={handleClearUrl}
            className="w-full py-3 bg-neutral-800 text-neutral-200 rounded-xl text-xs font-bold hover:bg-neutral-700 transition-all cursor-pointer"
          >
            {isArabic ? 'تصفح الفعاليات' : 'Explore Events'}
          </button>
        </div>
      ) : booking ? (
        <div className="space-y-6">
          {/* Ticket status badge */}
          {booking.attended ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-red-400 block mb-1">
                  {isArabic ? '🛑 تنبيه حماية: كود مستخدم مسبقاً!' : '🛑 Security Alert: Ticket Already Used!'}
                </span>
                <span className="text-neutral-200 block">
                  {isArabic 
                    ? `تم استخدام هذه التذكرة وإتمام الدخول مسبقاً بتاريخ ووقت الحضور الموضح أدناه.` 
                    : `This ticket has already been validated and checked in. Re-entry denied.`}
                </span>
                {booking.attendedAt && (
                  <span className="mt-1 font-mono text-amber-400 block font-bold bg-neutral-950/60 px-2 py-1 rounded inline-block">
                    {new Date(booking.attendedAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-neutral-200">
                <span className="font-bold text-emerald-400 block mb-1">
                  {isArabic ? '🟢 التذكرة صالحة ومفعلة للدخول' : '🟢 Ticket is Valid & Active'}
                </span>
                {isArabic 
                  ? 'يرجى مطابقة بيانات الاسم والتحقق من الرقم المرجعي للحدث قبل تأكيد البوابة.' 
                  : 'Please cross-reference name/guest count and type the event Reference Number to check-in.'}
              </div>
            </div>
          )}

          {/* Ticket Information Card */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-neutral-800 bg-neutral-900/95 shadow-xl">
            {/* Ticket Graphic Header decorative */}
            <div className="h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
            
            <div className="p-6 space-y-5">
              {/* Event title info */}
              <div className="border-b border-neutral-800 pb-4">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                  {isArabic ? 'الحدث / الفاعلية المحجوزة' : 'BOOKED EVENT / WORKSHOP'}
                </span>
                <h3 className="text-lg font-black text-white tracking-tight mt-1">
                  {isArabic ? booking.eventTitleAr : booking.eventTitleEn}
                </h3>
              </div>

              {/* Grid ticket data */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                <div>
                  <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
                    {isArabic ? '👤 اسم صاحب الحجز' : '👤 BOOKER NAME'}
                  </span>
                  <span className="text-white font-extrabold block mt-0.5">{booking.userName}</span>
                </div>

                <div>
                  <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
                    {isArabic ? '📞 رقم الهاتف' : '📞 PHONE NUMBER'}
                  </span>
                  <span className="text-neutral-300 font-mono font-bold block mt-0.5">{booking.userPhone}</span>
                </div>

                <div className="border-t border-neutral-800/60 pt-3">
                  <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
                    {isArabic ? '👥 عدد الحاضرين' : '👥 GUESTS COUNT'}
                  </span>
                  <span className="text-white font-extrabold block text-sm mt-0.5">
                    {booking.numberOfIndividuals} {isArabic ? 'أفراد' : 'people'}
                  </span>
                </div>

                <div className="border-t border-neutral-800/60 pt-3">
                  <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
                    {isArabic ? '💰 المبلغ المستحق' : '💰 TOTAL PAID AMOUNT'}
                  </span>
                  <span className="text-amber-400 font-mono font-black block text-sm mt-0.5">
                    {booking.totalAmount} {isArabic ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket dotted cutoff lines */}
            <div className="relative flex items-center justify-center my-1 px-4">
              <div className="absolute left-[-12px] w-6 h-6 rounded-full bg-neutral-950 border-r-2 border-neutral-800" />
              <div className="w-full border-t-2 border-dashed border-neutral-800" />
              <div className="absolute right-[-12px] w-6 h-6 rounded-full bg-neutral-950 border-l-2 border-neutral-800" />
            </div>

            {/* Bottom confirmation verification details */}
            <div className="p-6 bg-neutral-950/60">
              {successMessage ? (
                <div className="text-center space-y-2 py-2">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-emerald-400 leading-relaxed">{successMessage}</p>
                </div>
              ) : booking.attended ? (
                <div className="text-center py-2 text-neutral-500 text-xs font-semibold">
                  {isArabic 
                    ? '🔒 تم تأكيد الدخول وقفل هذه التذكرة مسبقاً.' 
                    : '🔒 Booking check-in is finalized and locked.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Security authorization box */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'التحقق الأمني: أدخل الرقم المرجعي للحدث' : 'Security Check: Enter Event Reference Number'}</span>
                    </label>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={inputRefNumber}
                      onChange={(e) => setInputRefNumber(e.target.value)}
                      placeholder={isArabic ? 'مثال: 1001' : 'e.g. 1001'}
                      className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-center font-mono font-black text-lg text-white tracking-widest focus:border-indigo-500 focus:outline-none transition-all"
                    />
                    <p className="text-[10px] text-neutral-500 text-center font-sans">
                      {isArabic 
                        ? 'ملاحظة: الرقم المرجعي متاح في تفاصيل الإعلان للأدمن والمنظم المعتمد.' 
                        : 'Note: The Reference Number is displayed under the ad card to Admin and organizers.'}
                    </p>
                  </div>

                  {/* Confirm Attendance Button */}
                  {inputRefNumber.trim() === String(associatedEvent?.eventRef || '') && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isConfirming}
                      onClick={handleConfirmAttendance}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-neutral-950 font-black text-sm rounded-xl hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isConfirming ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>{isArabic ? 'تأكيد الحضور والدخول بوابة الدخول' : 'Confirm Attendee Check-In'}</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
