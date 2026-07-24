import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { EventBooking, DanceEvent, SecurityStaffSettings, AdSubmission } from '../../types';
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
  XCircle,
  Clock,
  Phone,
  Camera,
  Upload,
  Search,
  Key,
  Home
} from 'lucide-react';
import { QrScanner } from './QrScanner';
import jsQR from 'jsqr';

export const VerificationView: React.FC = () => {
  const { lang, setActiveTab, user, isAdminUnlocked, openGuestAlert } = useApp();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [associatedEvent, setAssociatedEvent] = useState<DanceEvent | null>(null);
  
  // Verification mode tab: camera | manual | upload
  const [activeMethod, setActiveMethod] = useState<'camera' | 'manual' | 'upload'>('camera');
  const [manualInput, setManualInput] = useState<string>('');
  const [manualSearching, setManualSearching] = useState<boolean>(false);

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Verification states
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Staff security & session state
  const [liveStaffSettings, setLiveStaffSettings] = useState<SecurityStaffSettings | null>(null);
  const [staffPinInput, setStaffPinInput] = useState<string>(() => sessionStorage.getItem('dwm_staff_pin') || '');
  const [inputRefNumber, setInputRefNumber] = useState<string>(() => sessionStorage.getItem('dwm_event_ref') || '');

  const isArabic = lang === 'ar';

  // Listen in real-time to event staffSettings changes from both 'events' and 'adSubmissions' collections
  useEffect(() => {
    if (!associatedEvent?.id) return;
    
    // 1. Listen to 'events' doc
    const eventDocRef = doc(db, 'events', associatedEvent.id);
    const unsubEvent = onSnapshot(eventDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as DanceEvent;
        if (data.staffSettings) {
          setLiveStaffSettings(data.staffSettings);
        }
      }
    });

    let unsubSub: () => void = () => {};
    // 2. Listen to 'ad_submissions' doc by eventRef
    import('firebase/firestore').then(({ collection, query, where, onSnapshot: onSnap }) => {
      const subsCol = collection(db, 'ad_submissions');
      const subsQuery = query(subsCol, where('eventRef', '==', associatedEvent.eventRef));
      unsubSub = onSnap(subsQuery, (snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data() as AdSubmission;
          if (data.staffSettings) {
            setLiveStaffSettings(data.staffSettings);
          }
        }
      });
    });

    return () => {
      unsubEvent();
      unsubSub();
    };
  }, [associatedEvent?.id]);

  // Determine security staff authorization in real time based strictly on event staffSettings
  const staffAuthStatus = useMemo(() => {
    const settings = liveStaffSettings || associatedEvent?.staffSettings;
    const staffList = settings?.staffList || [];
    const hasStaffList = staffList.length > 0;

    const pin = staffPinInput.trim();

    // PIN is strictly required for security staff
    if (!pin) {
      return {
        isAuthorized: false,
        needsPinInput: true,
        message: isArabic ? '🔒 يرجى إدخال الرقم السري لموظف الأمن (4 أرقام) لتفعيل زر التأكيد' : '🔒 Enter 4-digit PIN for security staff to enable check-in'
      };
    }

    if (pin.length !== 4) {
      return {
        isAuthorized: false,
        needsPinInput: true,
        isInvalidPin: true,
        message: isArabic ? '🔒 الرقم السري ينبغي أن يتكون من 4 أرقام' : '🔒 PIN must be exactly 4 digits'
      };
    }

    if (!hasStaffList) {
      return {
        isAuthorized: false,
        needsPinInput: true,
        isInvalidPin: true,
        message: isArabic ? '❌ لم يتم تعيين أي موظف أمن لهذه الفاعلية بعد!' : '❌ No security staff has been assigned to this event yet!'
      };
    }

    const staffMember = staffList.find(s => String(s.pin) === String(pin));
    if (!staffMember) {
      return {
        isAuthorized: false,
        needsPinInput: true,
        isInvalidPin: true,
        message: isArabic ? '❌ الرقم السري غير صحيح أو غير معتمد لموظف بهذه الفاعلية!' : '❌ Invalid PIN or staff access removed by organizer!'
      };
    }

    if (!staffMember.isActive) {
      return {
        isAuthorized: false,
        needsPinInput: true,
        isPaused: true,
        scannerName: staffMember.name,
        message: isArabic ? `🔴 غير مسموح بمسح التذاكر! الموظف (${staffMember.name}) موقوف مؤقتاً من قبل المنظم.` : `🔴 Access Paused! Staff (${staffMember.name}) temporarily suspended.`
      };
    }

    return {
      isAuthorized: true,
      scannerName: staffMember.name,
      staffPin: staffMember.pin,
      gateNumber: staffMember.gateNumber,
      message: isArabic 
        ? `🟢 موظف أمن معتمد: ${staffMember.name} ${staffMember.gateNumber ? `(بوابة ${staffMember.gateNumber})` : ''}` 
        : `🟢 Authorized Security Staff: ${staffMember.name} ${staffMember.gateNumber ? `(Gate ${staffMember.gateNumber})` : ''}`
    };
  }, [liveStaffSettings, associatedEvent, staffPinInput, isArabic]);

  // Check if Event Reference Code is valid
  const isRefCodeValid = useMemo(() => {
    if (!associatedEvent?.eventRef) return true;
    return inputRefNumber.trim() !== '' && inputRefNumber.trim() === String(associatedEvent.eventRef);
  }, [associatedEvent?.eventRef, inputRefNumber]);

  const isCanConfirm = staffAuthStatus.isAuthorized && isRefCodeValid;
  useEffect(() => {
    if (staffAuthStatus.isAuthorized && staffAuthStatus.staffPin) {
      sessionStorage.setItem('dwm_staff_pin', staffAuthStatus.staffPin);
    }
  }, [staffAuthStatus]);

  useEffect(() => {
    // Parse URL parameter
    const params = new URLSearchParams(window.location.search);
    const id = params.get('verify');
    if (id && id !== 'scan') {
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
      if (!id || id.includes('/')) {
        setError(isArabic ? '❌ صيغة الباركود غير صالحة ولا يحتوي على بيانات تذكرة صحيحة.' : '❌ Invalid QR code format. Not a valid ticket.');
        setLoading(false);
        return;
      }
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

      // 2. Fetch associated event document to compare the secret eventRef & staffSettings
      if (bookingData.eventId) {
        let foundEv: DanceEvent | null = null;
        const eventDocRef = doc(db, 'events', bookingData.eventId);
        const eventSnap = await getDoc(eventDocRef);
        if (eventSnap.exists()) {
          foundEv = { id: eventSnap.id, ...eventSnap.data() } as DanceEvent;
        } else {
          // Check ad_submissions collection
          const subDocRef = doc(db, 'ad_submissions', bookingData.eventId);
          const subSnap = await getDoc(subDocRef);
          if (subSnap.exists()) {
            const subData = subSnap.data() as AdSubmission;
            foundEv = {
              ...(subData.eventData || {}),
              id: subSnap.id,
              eventRef: subData.eventRef || subData.eventData?.eventRef,
              staffSettings: subData.staffSettings || subData.eventData?.staffSettings
            } as DanceEvent;
          }
        }

        if (foundEv) {
          // If staffSettings missing or staffList empty on foundEv, check ad_submissions doc too
          if (!foundEv.staffSettings || !foundEv.staffSettings.staffList?.length) {
            try {
              const { collection, query, where, getDocs } = await import('firebase/firestore');
              const subsCol = collection(db, 'ad_submissions');
              const subsQuery = query(subsCol, where('eventRef', '==', foundEv.eventRef));
              const subsSnap = await getDocs(subsQuery);
              if (!subsSnap.empty) {
                const sData = subsSnap.docs[0].data() as AdSubmission;
                if (sData.staffSettings) {
                  foundEv.staffSettings = sData.staffSettings;
                }
              }
            } catch (e) {}
          }
          setAssociatedEvent(foundEv);
          if (foundEv.staffSettings) {
            setLiveStaffSettings(foundEv.staffSettings);
          }
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

    // Safety check security staff authorization
    if (!staffAuthStatus.isAuthorized) {
      alert(staffAuthStatus.message);
      return;
    }

    setIsConfirming(true);
    try {
      const bookingDocRef = doc(db, 'bookings', booking.id);
      const attendedTime = new Date().toISOString();
      
      // Update in Firestore with staff scanner details
      await updateDoc(bookingDocRef, {
        attended: true,
        attendedAt: attendedTime,
        attendedByStaffName: staffAuthStatus.scannerName,
        attendedByStaffPin: staffAuthStatus.staffPin || null,
        attendedByGateNumber: staffAuthStatus.gateNumber || null
      });

      // Update local state
      setBooking(prev => prev ? { 
        ...prev, 
        attended: true, 
        attendedAt: attendedTime,
        attendedByStaffName: staffAuthStatus.scannerName,
        attendedByStaffPin: staffAuthStatus.staffPin || undefined,
        attendedByGateNumber: staffAuthStatus.gateNumber || undefined
      } : null);
      
      setSuccessMessage(
        isArabic
          ? '✅ تم تأكيد حضور العميل بنجاح! تم قفل التذكرة وحساب مستحقات الفاعلية.'
          : '✅ Attendance confirmed successfully! Ticket locked & revenue counted.'
      );

      // Notify the Advertiser and Admin(s)
      try {
        const { saveNotificationToFirestore } = await import('../../lib/firebase');
        const { collection, query, where, getDocs } = await import('firebase/firestore');

        // A. Find the ad submission to get advertiserId and title
        let advertiserId: string | undefined = undefined;
        let eventTitleAr = associatedEvent.titleAr;
        let eventTitleEn = associatedEvent.titleEn;
        
        const subsCol = collection(db, 'ad_submissions');
        const subsQuery = query(subsCol, where('eventRef', '==', associatedEvent.eventRef));
        const subsSnapshot = await getDocs(subsQuery);
        if (!subsSnapshot.empty) {
          const subDoc = subsSnapshot.docs[0].data();
          advertiserId = subDoc.advertiserId;
          eventTitleAr = subDoc.titleAr || eventTitleAr;
          eventTitleEn = subDoc.titleEn || eventTitleEn;
        }

        // B. Calculate updated actual attendees count
        let actualAttendeesCount = 0;
        const bookingsCol = collection(db, 'bookings');
        const bookingsQuery = query(
          bookingsCol,
          where('eventId', '==', associatedEvent.id),
          where('status', '==', 'approved')
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        bookingsSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          // Force the current booking being checked in to be true, regardless of what's in Firestore right now
          const isAttended = docSnap.id === booking.id ? true : !!data.attended;
          if (isAttended) {
            actualAttendeesCount += Number(data.numberOfIndividuals || 1);
          }
        });

        // C. Send notification to the Advertiser
        if (advertiserId) {
          await saveNotificationToFirestore({
            id: `notif_checkin_adv_${Date.now()}_${booking.id}`,
            userId: advertiserId,
            type: 'system',
            titleAr: 'تحديث الحضور الفعلي لإعلانك! 👥',
            titleEn: 'Attendance Updated for your Ad! 👥',
            messageAr: `تم تسجيل حضور جديد لحدثك "${eventTitleAr}". كود الحدث: ${associatedEvent.eventRef}. عدد الحضور الفعلي حالياً: ${actualAttendeesCount} عضو.`,
            messageEn: `A new check-in has been confirmed for your event "${eventTitleEn}". Event Code: ${associatedEvent.eventRef}. Total actual attendees: ${actualAttendeesCount}.`,
            date: new Date().toISOString(),
            read: false,
            relatedEventId: associatedEvent.id
          });
        }

        // D. Send notification to the Admin(s)
        const adminsCol = collection(db, 'users');
        const adminsQuery = query(adminsCol, where('isAdmin', '==', true));
        const adminsSnapshot = await getDocs(adminsQuery);
        const adminIds: string[] = [];
        adminsSnapshot.forEach(docSnap => {
          adminIds.push(docSnap.id);
        });

        for (const adminId of adminIds) {
          await saveNotificationToFirestore({
            id: `notif_checkin_adm_${Date.now()}_${adminId}_${booking.id}`,
            userId: adminId,
            type: 'system',
            titleAr: 'تحديث دخول الفعاليات (المسؤول) 🛡️',
            titleEn: 'Event Check-In Update (Admin) 🛡️',
            messageAr: `تم تسجيل دخول زائر لفعالية "${eventTitleAr}". كود الحدث: ${associatedEvent.eventRef}. عدد الحضور الفعلي الحالي: ${actualAttendeesCount} عضو. المعلن: ${booking.userName || 'مستخدم'}.`,
            messageEn: `A guest checked in for "${eventTitleEn}". Event Code: ${associatedEvent.eventRef}. Total actual attendees: ${actualAttendeesCount}. Checked in guest: ${booking.userName || 'User'}.`,
            date: new Date().toISOString(),
            read: false,
            relatedEventId: associatedEvent.id
          });
        }
      } catch (notifErr) {
        console.error('Error sending attendance check-in notifications:', notifErr);
      }
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

  const handleScanSuccess = (decodedText: string) => {
    let extractedId = decodedText;

    try {
      if (decodedText.includes('verify=')) {
        // Handle absolute URL or relative URL with verify param
        const urlStr = decodedText.startsWith('http') ? decodedText : window.location.origin + (decodedText.startsWith('/') ? '' : '/') + decodedText;
        const url = new URL(urlStr);
        const param = url.searchParams.get('verify');
        if (param) extractedId = param;
      }
    } catch {
      // fallback to just using the decoded text
    }

    // Update browser URL dynamically to match the scanned ticket ID
    try {
      window.history.replaceState({}, '', `/?verify=${extractedId}`);
    } catch (e) {}

    setBookingId(extractedId);
    fetchBookingDetails(extractedId);
  };

  const handleClearUrl = () => {
    try {
      window.history.replaceState({ trapped: true }, '', '/');
    } catch (e) {}
    setBookingId(null);
    setBooking(null);
    setError(null);
    setActiveTab('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualInput.trim();
    if (!clean) return;

    setManualSearching(true);
    setError(null);

    let extracted = clean;
    if (clean.includes('verify=')) {
      try {
        const parts = clean.split('verify=');
        if (parts[1]) extracted = parts[1].split('&')[0];
      } catch (e) {}
    }

    try {
      // 1. Try fetching directly by Firestore booking ID
      const docRef = doc(db, 'bookings', extracted);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setBookingId(snap.id);
        fetchBookingDetails(snap.id);
        setManualSearching(false);
        return;
      }

      // 2. Try searching by accessCode or refNumber
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const bCol = collection(db, 'bookings');
      
      let q = query(bCol, where('accessCode', '==', extracted.toUpperCase()));
      let sSnap = await getDocs(q);

      if (sSnap.empty) {
        const refWithHash = extracted.startsWith('#') ? extracted : `#${extracted}`;
        q = query(bCol, where('refNumber', '==', refWithHash));
        sSnap = await getDocs(q);
      }

      if (!sSnap.empty) {
        const foundId = sSnap.docs[0].id;
        setBookingId(foundId);
        fetchBookingDetails(foundId);
      } else {
        setError(
          isArabic 
            ? `❌ لم يتم العثور على تذكرة تطابق الكود المدخل: "${clean}"` 
            : `❌ No ticket found matching code: "${clean}"`
        );
      }
    } catch (err) {
      console.error('Manual booking search failed:', err);
      setError(
        isArabic 
          ? '⚠️ تعذر البحث عن التذكرة. يرجى التأكد من الكود وإعادة المحاولة.' 
          : '⚠️ Search failed. Please check the code and try again.'
      );
    } finally {
      setManualSearching(false);
    }
  };

  const handleImageQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code && code.data) {
              handleScanSuccess(code.data);
            } else {
              alert(
                isArabic 
                  ? '❌ لم نتمكن من قراءة كود QR من هذه الصورة. يمكنك جلب صورة أوضح أو إدخال الكود يدوياً.' 
                  : '❌ Could not detect a valid QR code in this photo. Try a clearer image or enter code manually.'
              );
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error decoding image QR:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-sm text-neutral-400 font-medium">
          {isArabic ? 'جاري فحص وتأكيد بيانات التذكرة...' : 'Verifying ticket passcode & loading details...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Top Header Banner without confusing arrows */}
      <div className="flex items-center justify-between gap-3 mb-6 bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight leading-tight">
              {isArabic ? 'بوابة التحقق ومسح التذاكر' : 'Ticket Gateway Verification'}
            </h2>
            <p className="text-[10px] text-amber-500 font-medium mt-0.5">
              {isArabic ? 'التحقق الرسمي لبوابة الأمن والمنظمين' : 'Official Gate Control Portal'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleClearUrl}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{isArabic ? 'الرئيسية' : 'Home'}</span>
        </button>
      </div>

      {!user && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-xs font-bold text-amber-300">
              {isArabic ? 'يرجى تسجيل الدخول أو إنشاء حساب' : 'Please Login or Register'}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {isArabic ? 'للاستفادة الكاملة من خدمة مسح التذاكر وتأكيد الحضور' : 'To fully use ticket scanning & check-in features'}
            </p>
          </div>
          <button
            onClick={() => openGuestAlert('scan_qr')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md shrink-0"
          >
            {isArabic ? 'إنشاء حساب' : 'Register'}
          </button>
        </div>
      )}

      {error ? (
        <div className="rounded-3xl border-2 border-red-500/20 bg-red-500/5 p-6 text-center space-y-4 shadow-2xl">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-white">{isArabic ? 'خطأ في التحقق' : 'Verification Error'}</h3>
          <p className="text-xs text-neutral-400 leading-relaxed font-sans">{error}</p>

          <div className="flex flex-col gap-2 mt-4">
            <button 
              onClick={() => {
                setError(null);
                setBookingId(null);
                setBooking(null);
                setActiveMethod('camera');
                try {
                  window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                } catch (e) {}
              }}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {isArabic ? 'إعادة المحاولة / مسح باركود آخر' : 'Try Again / Scan QR'}
            </button>
            <button 
              onClick={handleClearUrl}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              {isArabic ? 'العودة للصفحة الرئيسية' : 'Return to Home Page'}
            </button>
          </div>
        </div>
      ) : !bookingId ? (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 text-center space-y-5 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white">
              {isArabic ? 'اختر طريقة التحقق من التذكرة' : 'Select Ticket Verification Method'}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              {isArabic 
                ? 'يمكنك مسح الكاميرا، أو إدخال كود التذكرة/الباركود يدوياً، أو رفع صورة الـ QR.' 
                : 'Use camera scan, manual passcode entry, or upload a QR image file.'}
            </p>
          </div>

          {/* Verification Method Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/60 rounded-2xl border border-neutral-800 text-xs font-bold">
            <button
              onClick={() => setActiveMethod('camera')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeMethod === 'camera' ? 'bg-amber-500 text-neutral-950 shadow-md font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isArabic ? 'الكاميرا' : 'Camera'}</span>
            </button>

            <button
              onClick={() => setActiveMethod('manual')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeMethod === 'manual' ? 'bg-amber-500 text-neutral-950 shadow-md font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isArabic ? 'كود يدوي' : 'Manual Code'}</span>
            </button>

            <button
              onClick={() => setActiveMethod('upload')}
              className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeMethod === 'upload' ? 'bg-amber-500 text-neutral-950 shadow-md font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isArabic ? 'رفع صورة' : 'Upload QR'}</span>
            </button>
          </div>

          {/* 1. Camera View */}
          {activeMethod === 'camera' && (
            <div className="bg-black/50 p-2 rounded-2xl border border-neutral-800">
              <QrScanner 
                onScanSuccess={handleScanSuccess} 
                onSwitchToManual={() => setActiveMethod('manual')}
                onSwitchToUpload={() => setActiveMethod('upload')}
              />
            </div>
          )}

          {/* 2. Manual Code / Passcode Input View */}
          {activeMethod === 'manual' && (
            <form onSubmit={handleManualSearch} className="space-y-4 py-2 text-right">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-400 block">
                  {isArabic ? 'أدخل كود التذكرة أو الـ Passcode:' : 'Enter Ticket Code or Passcode:'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={isArabic ? 'مثال: DWM-1001 أو رقم التذكرة' : 'e.g. DWM-1001 or ticket ID'}
                    className="w-full px-4 py-3 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-center font-mono font-bold text-sm text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 text-center font-sans">
                  {isArabic 
                    ? 'الكود المكون من حروف وأرقام المكتوب أسفل الباركود في حساب التذكرة' 
                    : 'The passcode displayed under the QR code in the ticket profile'}
                </p>
              </div>

              <button
                type="submit"
                disabled={manualSearching || !manualInput.trim()}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-black text-xs rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {manualSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{isArabic ? 'فحص وتأكيد التذكرة' : 'Search & Verify Ticket'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. Image Upload View */}
          {activeMethod === 'upload' && (
            <div className="py-6 px-4 bg-neutral-950 rounded-2xl border-2 border-dashed border-neutral-800 text-center space-y-3">
              <Upload className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">
                  {isArabic ? 'ارفع صورة تذكرة الحضور' : 'Upload Ticket QR Image'}
                </span>
                <span className="text-[11px] text-neutral-400 block font-sans">
                  {isArabic ? 'اختر صورة من الاستوديو لمسح كود الـ QR تلقائياً' : 'Pick a photo from your gallery to auto-decode'}
                </span>
              </div>
              <label className="inline-block py-2.5 px-5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md">
                <span>{isArabic ? 'اختيار صورة' : 'Choose Photo'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageQrUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          )}

          {/* Bottom Return to Home Button */}
          <button 
            type="button"
            onClick={handleClearUrl}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>{isArabic ? 'العودة للصفحة الرئيسية' : 'Return to Home Page'}</span>
          </button>
        </div>
      ) : booking ? (
        <div className="space-y-6">
          {/* Ticket status badge */}
          <div className="flex items-center justify-center">
            {booking.attended ? (
              <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-xs">
                  {isArabic ? 'تم تأكيد الحضور مسبقاً' : 'Already Checked-in'}
                </span>
              </div>
            ) : booking.status === 'approved' ? (
              <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-bold text-xs">
                  {isArabic ? 'تذكرة معتمدة جاهزة للدخول' : 'Valid Ticket Ready'}
                </span>
              </div>
            ) : (
              <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold text-xs">
                  {isArabic ? 'التذكرة غير معتمدة' : 'Ticket not approved'}
                </span>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-md">
            <div className="p-5 space-y-4">
              {/* Event title info */}
              <div className="border-b border-neutral-800/50 pb-3">
                <h3 className="text-base font-bold text-white">
                  {isArabic ? (booking.eventTitleAr || booking.eventTitleEn) : (booking.eventTitleEn || booking.eventTitleAr)}
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

            {/* Bottom confirmation verification details */}
            <div className="p-5 bg-neutral-950/40 border-t border-neutral-800/50">
              {successMessage ? (
                <div className="text-center space-y-4 py-2">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-emerald-400 leading-relaxed">{successMessage}</p>
                  <button 
                    onClick={() => {
                      window.location.href = '/?verify=scan';
                    }}
                    className="w-full py-3 mt-4 bg-neutral-800 text-neutral-200 rounded-xl text-xs font-bold hover:bg-neutral-700 transition-all cursor-pointer"
                  >
                    {isArabic ? 'مسح باركود آخر' : 'Scan another QR code'}
                  </button>
                </div>
              ) : booking.attended ? (
                <div className="text-center space-y-4 py-2">
                  <div className="text-neutral-500 text-xs font-semibold">
                    {isArabic 
                      ? '🔒 تم تأكيد الدخول وقفل هذه التذكرة مسبقاً.' 
                      : '🔒 Booking check-in is finalized and locked.'}
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <button 
                      onClick={() => {
                        setBookingId(null);
                        setBooking(null);
                        setInputRefNumber('');
                        try {
                          window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                        } catch (e) {}
                      }}
                      className="w-full py-3 bg-neutral-800 text-neutral-200 rounded-xl text-xs font-bold hover:bg-neutral-700 transition-all cursor-pointer"
                    >
                      {isArabic ? 'مسح باركود آخر' : 'Scan another QR code'}
                    </button>
                    <button 
                      onClick={handleClearUrl}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Home className="w-4 h-4" />
                      <span>{isArabic ? 'العودة للصفحة الرئيسية' : 'Return to Home Page'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-right">
                  {/* 1. Security Authorization: Event Ref Number */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-amber-500 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'كود الفاعلية (Event Reference Code):' : 'Event Reference Code:'}</span>
                      </span>
                      {!isRefCodeValid && (
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                          ⚠️ {isArabic ? 'مطلوب لتفعيل الزر' : 'Required'}
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={inputRefNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
                        const parsed = val.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString()).replace(/\D/g, '');
                        setInputRefNumber(parsed);
                        sessionStorage.setItem('dwm_event_ref', parsed);
                      }}
                      placeholder={isArabic ? 'أدخل كود الفاعلية هنا' : 'Enter Event Code'}
                      className={`w-full px-4 py-2.5 bg-neutral-900 border-2 rounded-xl text-center font-mono font-black text-lg tracking-widest focus:outline-none transition-all ${
                        !isRefCodeValid 
                          ? 'border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)] text-amber-300' 
                          : 'border-emerald-500/80 text-emerald-400'
                      }`}
                    />
                  </div>

                  {/* 2. Security Staff PIN Input */}
                  <div className="space-y-1.5 p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl text-right">
                    <label className="text-xs font-bold text-amber-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isArabic ? 'الرقم السري لموظف الأمن (4 أرقام):' : 'Security Staff PIN (4 digits):'}</span>
                      </span>
                      {!staffAuthStatus.isAuthorized ? (
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                          ⚠️ {isArabic ? 'مطلوب للتأكيد' : 'Required'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          👮 {staffAuthStatus.scannerName}
                          {staffAuthStatus.gateNumber && (
                            <span className="bg-emerald-500/20 px-1.5 rounded-sm border border-emerald-500/30 text-[9px]">
                              {isArabic ? `بوابة ${staffAuthStatus.gateNumber}` : `Gate ${staffAuthStatus.gateNumber}`}
                            </span>
                          )}
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="\d{4}"
                      inputMode="numeric"
                      value={staffPinInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
                        const parsed = val.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString()).replace(/\D/g, '');
                        setStaffPinInput(parsed);
                        sessionStorage.setItem('dwm_staff_pin', parsed);
                      }}
                      placeholder="****"
                      className={`w-full px-4 py-3 bg-neutral-900 border-2 rounded-xl text-center font-mono font-black text-xl tracking-widest focus:outline-none transition-all ${
                        !staffAuthStatus.isAuthorized
                          ? 'border-amber-500/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'border-emerald-500/80 text-emerald-400'
                      }`}
                    />
                  </div>

                  {/* 3. Real-time Status Banner */}
                  <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                    isCanConfirm 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : !isRefCodeValid
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : staffAuthStatus.isPaused 
                      ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse' 
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="leading-relaxed">
                      {!isRefCodeValid
                        ? (inputRefNumber.trim() === ''
                            ? (isArabic ? '🔒 يرجى إدخال كود الفاعلية المخصص لهذه الحفلة لتفعيل زر التأكيد' : '🔒 Enter Event Reference Code to enable check-in')
                            : (isArabic ? '❌ كود الفاعلية غير صحيح! يرجى إدخال الكود الصحيح المخصص لهذه الحفلة' : '❌ Incorrect Event Code! Please enter authorized code'))
                        : staffAuthStatus.message
                      }
                    </span>
                  </div>

                  {/* 4. Confirm Attendance Button */}
                  <motion.button
                    whileHover={isCanConfirm ? { scale: 1.02 } : {}}
                    whileTap={isCanConfirm ? { scale: 0.98 } : {}}
                    disabled={isConfirming || !isCanConfirm}
                    onClick={handleConfirmAttendance}
                    className={`w-full py-4 font-black text-sm sm:text-base rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isCanConfirm 
                        ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-emerald-500/20 cursor-pointer' 
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                    }`}
                  >
                    {isConfirming ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>
                          {isCanConfirm 
                            ? (isArabic ? `تأكيد دخول الزائر: ${booking.userName}` : `Confirm Check-In: ${booking.userName}`)
                            : !isRefCodeValid
                            ? (inputRefNumber.trim() === ''
                                ? (isArabic ? '🔒 أدخل كود الفاعلية لتأكيد الدخول' : '🔒 Enter Event Code to Enable')
                                : (isArabic ? '❌ كود الفاعلية غير صحيح' : '❌ Incorrect Event Code'))
                            : (!staffPinInput.trim() 
                                ? (isArabic ? '🔒 أدخل الرقم السري لموظف الأمن لتأكيد الدخول' : '🔒 Enter Security PIN to Enable')
                                : (isArabic ? '❌ الرقم السري لموظف الأمن غير صحيح' : '❌ Incorrect Security Staff PIN'))
                          }
                        </span>
                      </>
                    )}
                  </motion.button>

                  {/* Cancel & Return Home button */}
                  <button 
                    type="button"
                    onClick={handleClearUrl}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Home className="w-4 h-4 text-amber-400" />
                    <span>{isArabic ? 'إلغاء والعودة للصفحة الرئيسية' : 'Cancel & Return to Home'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
