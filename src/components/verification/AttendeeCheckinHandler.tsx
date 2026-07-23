import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, CheckCircle, XCircle, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DanceEvent } from '../../types';

export const AttendeeCheckinHandler: React.FC = () => {
  const { user, bookings, events, lang, openGuestAlert } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  
  const [result, setResult] = useState<'success' | 'error' | 'already_checked_in' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [checkedEvent, setCheckedEvent] = useState<DanceEvent | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventCheckin');
    
    if (eventId) {
      setPendingEventId(eventId);
      // Keep the URL so if they refresh, they see it, but we can clear it once processed.
    }
  }, []);

  useEffect(() => {
    if (pendingEventId && !isProcessing && !result) {
      if (!user) {
        openGuestAlert('view_tickets');
        return;
      }
      
      const processCheckin = async () => {
        setIsProcessing(true);
        try {
          const ev = events.find(e => e.id === pendingEventId);
          if (ev) setCheckedEvent(ev);

          const myBooking = bookings.find(b => b.eventId === pendingEventId && b.userId === user.id);
          
          if (!myBooking) {
            setResult('error');
            setErrorMessage(lang === 'ar' ? 'عفواً، لا يوجد لديك تذكرة مسجلة لهذه الفعالية.' : 'Sorry, you do not have a ticket for this event.');
          } else if (myBooking.status !== 'approved') {
            setResult('error');
            setErrorMessage(lang === 'ar' ? 'تذكرتك لم يتم تفعيلها بعد.' : 'Your ticket is not approved yet.');
          } else if (myBooking.attended) {
            setResult('already_checked_in');
          } else {
            // Update Firestore
            const bookingDocRef = doc(db, 'bookings', myBooking.id);
            await updateDoc(bookingDocRef, {
              attended: true,
              attendedAt: new Date().toISOString()
            });
            setResult('success');
          }
        } catch (error) {
          console.error("Check-in error:", error);
          setResult('error');
          setErrorMessage(lang === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول.' : 'An error occurred during check-in.');
        } finally {
          setIsProcessing(false);
          try {
            window.history.replaceState({}, '', '/');
          } catch (e) {}
        }
      };
      
      if (bookings.length > 0 && events.length > 0) {
         processCheckin();
      } else {
         setTimeout(() => {
           processCheckin();
         }, 2000);
      }
    }
  }, [pendingEventId, user, bookings, events, isProcessing, lang, openGuestAlert, result]);

  const closeHandler = () => {
    setResult(null);
    setPendingEventId(null);
  };

  if (!pendingEventId && !result && !isProcessing) return null;

  return (
    <AnimatePresence>
      {(isProcessing || result) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-neutral-950 flex flex-col items-center justify-center p-4 overflow-hidden"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Background FX */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full" />
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />
          </div>

          <div className="relative z-10 w-full max-w-md bg-neutral-900/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
            
            {isProcessing && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6 py-10"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-neutral-800 border-t-amber-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin-reverse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-white">
                    {lang === 'ar' ? 'جاري تأكيد الحضور...' : 'Confirming attendance...'}
                  </h2>
                  <p className="text-sm text-neutral-400">
                    {lang === 'ar' ? 'يرجى الانتظار، جاري مطابقة بيانات التذكرة' : 'Please wait, verifying ticket details'}
                  </p>
                </div>
              </motion.div>
            )}

            {!isProcessing && result === 'success' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                  <CheckCircle className="w-12 h-12 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white">
                    {lang === 'ar' ? 'تم تأكيد الحضور!' : 'Checked In Successfully!'}
                  </h2>
                  <p className="text-base text-neutral-300">
                    {lang === 'ar' ? 'أهلاً بك، نتمنى لك وقتاً رائعاً.' : 'Welcome, we hope you have a great time.'}
                  </p>
                </div>
                
                {checkedEvent && (
                  <div className="w-full bg-neutral-950/50 rounded-2xl p-4 border border-white/5 text-left flex flex-col gap-3 mt-2">
                    <div className="flex gap-3 items-center">
                       <img src={checkedEvent.thumbnailUrl || checkedEvent.mediaUrl} alt="Event" className="w-14 h-14 rounded-xl object-cover" />
                       <div>
                         <h4 className="font-bold text-white text-sm line-clamp-1">{lang === 'ar' ? checkedEvent.titleAr : checkedEvent.titleEn}</h4>
                         <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mt-1 inline-block">
                           {lang === 'ar' ? 'تذكرة صالحة' : 'Valid Ticket'}
                         </span>
                       </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={closeHandler}
                  className="w-full mt-4 py-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-lg rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  {lang === 'ar' ? 'الاستمرار' : 'Continue'}
                </button>
              </motion.div>
            )}

            {!isProcessing && result === 'already_checked_in' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center border-4 border-blue-500/30">
                  <CheckCircle className="w-12 h-12 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">
                    {lang === 'ar' ? 'تم تأكيد حضورك مسبقاً' : 'Already Checked In'}
                  </h2>
                  <p className="text-sm text-neutral-400">
                    {lang === 'ar' ? 'لقد قمت بمسح الباركود والدخول بالفعل.' : 'You have already scanned the QR and checked in.'}
                  </p>
                </div>
                <button 
                  onClick={closeHandler}
                  className="w-full mt-4 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-base rounded-2xl transition-all"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </motion.div>
            )}

            {!isProcessing && result === 'error' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500/30">
                  <XCircle className="w-12 h-12 text-red-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">
                    {lang === 'ar' ? 'فشل تأكيد الحضور' : 'Check-in Failed'}
                  </h2>
                  <p className="text-sm text-neutral-300 max-w-[280px]">
                    {errorMessage}
                  </p>
                </div>
                <button 
                  onClick={closeHandler}
                  className="w-full mt-4 py-4 bg-red-500 hover:bg-red-600 text-neutral-950 font-black text-lg rounded-2xl transition-all shadow-lg shadow-red-500/20"
                >
                  {lang === 'ar' ? 'الرجوع' : 'Go Back'}
                </button>
              </motion.div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
