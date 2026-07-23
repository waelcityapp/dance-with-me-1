import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, CheckCircle, ChevronDown, ChevronUp, Loader2, Clock, Ticket } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { EventBooking, AdSubmission } from '../../types';

interface ActualAttendanceModalProps {
  eventId: string | null;
  sub?: AdSubmission | null;
  onClose: () => void;
}

export const ActualAttendanceModal: React.FC<ActualAttendanceModalProps> = ({ eventId, sub, onClose }) => {
  const { lang, events, bookings: contextBookings, userAdSubmissions, user } = useApp();
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [firestoreBookings, setFirestoreBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'attended' | 'pending'>('attended');

  const isAdmin = Boolean(user?.isAdmin);

  // Listen to Firestore bookings collection directly in real-time
  useEffect(() => {
    if (!eventId && !sub) return;
    
    setLoading(true);
    const bookingsRef = collection(db, 'bookings');
    
    const unsubscribe = onSnapshot(bookingsRef, (snapshot) => {
      const list: EventBooking[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as EventBooking;
        if (data) {
          list.push({ ...data, id: docSnap.id || data.id });
        }
      });
      setFirestoreBookings(list);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching actual attendance from Firestore:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, sub]);

  // Find target sub from userAdSubmissions if not provided directly
  const targetSub = useMemo(() => {
    if (sub) return sub;
    return userAdSubmissions?.find(s => 
      s.id === eventId || 
      s.eventData?.id === eventId || 
      (s.eventRef && String(s.eventRef) === String(eventId))
    ) || null;
  }, [sub, eventId, userAdSubmissions]);

  // Derive candidate event identifiers
  const targetEventIds = useMemo(() => {
    const ids = new Set<string>();
    if (eventId) ids.add(eventId);
    if (sub?.id) ids.add(sub.id);
    if (sub?.eventData?.id) ids.add(sub.eventData.id);
    if (sub?.eventRef) ids.add(String(sub.eventRef));
    if (targetSub?.id) ids.add(targetSub.id);
    if (targetSub?.eventData?.id) ids.add(targetSub.eventData.id);
    if (targetSub?.eventRef) ids.add(String(targetSub.eventRef));
    
    const matched = events.find(e => 
      e.id === eventId || 
      e.id === sub?.eventData?.id || 
      e.id === sub?.id ||
      e.id === targetSub?.id ||
      e.id === targetSub?.eventData?.id ||
      (e.eventRef && (e.eventRef === sub?.eventRef || e.eventRef === targetSub?.eventRef)) ||
      (e.titleAr && (e.titleAr.trim() === sub?.titleAr?.trim() || e.titleAr.trim() === targetSub?.titleAr?.trim()))
    );
    if (matched?.id) ids.add(matched.id);
    if (matched?.eventRef) ids.add(String(matched.eventRef));
    
    return Array.from(ids);
  }, [eventId, sub, targetSub, events]);

  // Combine Firestore live data with AppContext fallback data seamlessly
  const matchingBookings = useMemo(() => {
    const bookingMap = new Map<string, EventBooking>();
    if (contextBookings) {
      contextBookings.forEach(b => { if (b && (b.id || b.refNumber)) bookingMap.set(b.id || String(b.refNumber), b); });
    }
    if (firestoreBookings) {
      firestoreBookings.forEach(b => { if (b && (b.id || b.refNumber)) bookingMap.set(b.id || String(b.refNumber), b); });
    }
    const combined = Array.from(bookingMap.values());
    
    const effectiveSub = sub || targetSub;
    const subTitleAr = effectiveSub?.titleAr || effectiveSub?.eventData?.titleAr;
    const subTitleEn = effectiveSub?.titleEn || effectiveSub?.eventData?.titleEn;

    const matchedEvent = events.find(e => targetEventIds.includes(e.id));
    const eventTitleAr = matchedEvent?.titleAr || subTitleAr;
    const eventTitleEn = matchedEvent?.titleEn || subTitleEn;

    return combined.filter(b => {
      if (!b) return false;
      if (b.status === 'rejected' || b.status === 'cancelled') return false;

      const isMatchingId = (b.eventId && targetEventIds.includes(b.eventId)) || 
                           (b.refNumber && targetEventIds.includes(String(b.refNumber))) ||
                           (b.eventTitleAr && eventTitleAr && b.eventTitleAr.trim().toLowerCase() === eventTitleAr.trim().toLowerCase()) ||
                           (b.eventTitleEn && eventTitleEn && b.eventTitleEn.trim().toLowerCase() === eventTitleEn.trim().toLowerCase());

      return isMatchingId;
    });
  }, [firestoreBookings, contextBookings, targetEventIds, sub, targetSub, events]);

  if (!eventId && !sub) return null;

  const event = events.find(e => targetEventIds.includes(e.id));
  const eventTitle = event ? (lang === 'ar' ? event.titleAr : event.titleEn) : (sub ? (lang === 'ar' ? sub.titleAr : sub.titleEn) : '');

  const attendedBookings = matchingBookings.filter(b => b.attended === true);
  const pendingBookings = matchingBookings.filter(b => !b.attended);

  const totalAttendedCount = attendedBookings.reduce((sum, b) => sum + Number(b.numberOfIndividuals || 1), 0);
  const totalAttendedRevenue = attendedBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const totalBookedCount = matchingBookings.reduce((sum, b) => sum + Number(b.numberOfIndividuals || 1), 0);

  // Non-admin users are strictly shown actual attended bookings
  const displayedBookings = !isAdmin 
    ? attendedBookings 
    : filterTab === 'attended' 
    ? attendedBookings 
    : filterTab === 'pending' 
    ? pendingBookings 
    : matchingBookings;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/70 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl relative max-h-[88vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-all z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 pr-2">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>{lang === 'ar' ? 'سجل الحضور الفعلي للفعالية' : 'Actual Event Attendance Log'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 line-clamp-1">{eventTitle || (lang === 'ar' ? 'إعلان VIP' : 'VIP Ad')}</p>
        </div>

        {loading && firestoreBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
            <p className="text-neutral-400 text-sm">
              {lang === 'ar' ? 'جاري جلب بيانات الحضور من قاعدة البيانات...' : 'Fetching attendance data from database...'}
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 gap-3 mb-5 shrink-0">
              <div className="bg-neutral-950 border border-emerald-500/30 rounded-2xl p-3.5 text-center shadow-inner">
                <span className="text-[11px] text-neutral-400 font-bold block mb-1">
                  {lang === 'ar' ? 'إجمالي الحضور الفعلي' : 'Total Actual Attended'}
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {totalAttendedCount}
                </span>
                <span className="text-[10px] text-neutral-500 block mt-0.5">
                  {lang === 'ar' ? 'أفراد تأكد دخولهم' : 'Checked-in individuals'}
                </span>
              </div>

              {isAdmin ? (
                <div className="bg-neutral-950 border border-amber-500/20 rounded-2xl p-3.5 text-center shadow-inner">
                  <span className="text-[11px] text-neutral-400 font-bold block mb-1">
                    {lang === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
                  </span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {totalBookedCount}
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    {lang === 'ar' ? 'إجمالي أفراد الحجز' : 'Total booked individuals'}
                  </span>
                </div>
              ) : (
                <div className="bg-neutral-950 border border-indigo-500/20 rounded-2xl p-3.5 text-center shadow-inner">
                  <span className="text-[11px] text-neutral-400 font-bold block mb-1">
                    {lang === 'ar' ? 'عمليات الدخول' : 'Verified Check-ins'}
                  </span>
                  <span className="text-2xl font-black text-indigo-400 font-mono">
                    {attendedBookings.length}
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    {lang === 'ar' ? 'تأكيد دخول' : 'check-ins count'}
                  </span>
                </div>
              )}
            </div>

            {/* Filter Tabs or Admin indicator */}
            {isAdmin ? (
              <div className="flex items-center gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl mb-4 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                    filterTab === 'all' 
                      ? 'bg-neutral-800 text-white shadow' 
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {lang === 'ar' ? `الكل (${matchingBookings.length})` : `All (${matchingBookings.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('attended')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                    filterTab === 'attended' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {lang === 'ar' ? `الحاضرون 🟢 (${attendedBookings.length})` : `Attended (${attendedBookings.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('pending')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                    filterTab === 'pending' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {lang === 'ar' ? `لم يحضروا 🟡 (${pendingBookings.length})` : `Pending (${pendingBookings.length})`}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl mb-4 text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {lang === 'ar' ? 'قائمة الحضور المؤكد فقط' : 'Verified Attendance List Only'}
                </span>
                <span className="text-neutral-400 font-mono text-[11px]">
                  {attendedBookings.length} {lang === 'ar' ? 'عمليات دخول' : 'check-ins'}
                </span>
              </div>
            )}

            {/* Attendees List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {displayedBookings.length === 0 ? (
                <div className="text-center py-10 text-neutral-500 text-sm bg-neutral-950/50 rounded-2xl border border-neutral-800/80 p-6">
                  <Ticket className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-50" />
                  <p>
                    {filterTab === 'attended'
                      ? (lang === 'ar' ? 'لا يوجد حضور مؤكد مسجل حتى الآن.' : 'No verified check-ins yet.')
                      : filterTab === 'pending'
                      ? (lang === 'ar' ? 'جميع المترددين قاموا بتأكيد الحضور!' : 'All bookings have checked in!')
                      : (lang === 'ar' ? 'لا توجد حجوزات مسجلة لهذه الفعالية بعد.' : 'No bookings found for this event yet.')}
                  </p>
                </div>
              ) : (
                displayedBookings.map(booking => {
                  const isExpanded = expandedBookingId === booking.id;
                  const isAttended = booking.attended === true;

                  return (
                    <div 
                      key={booking.id}
                      className={`border rounded-2xl overflow-hidden transition-all ${
                        isAttended 
                          ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50' 
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                        className="w-full flex items-center justify-between p-3.5 cursor-pointer hover:bg-white/5 transition-colors text-right"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isAttended ? (
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 text-amber-400" />
                            </div>
                          )}
                          
                          <div className="truncate text-right">
                            <div className="text-sm font-extrabold text-white truncate flex items-center gap-2">
                              <span>{booking.userName || (lang === 'ar' ? 'عميل' : 'Customer')}</span>
                              {isAdmin && booking.userPhone && (
                                <span className="text-xs font-mono text-amber-300 font-semibold dir-ltr">({booking.userPhone})</span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-amber-400 font-bold">
                                {booking.numberOfIndividuals || 1} {lang === 'ar' ? 'أفراد' : 'people'}
                              </span>
                              <span className="text-neutral-600">•</span>
                              <span className="font-mono text-neutral-300 text-[11px]">#{booking.refNumber}</span>
                              {isAttended && (booking.attendedAt || booking.submittedAt) && (
                                <>
                                  <span className="text-neutral-600">•</span>
                                  <span className="font-mono text-emerald-400 text-[11px]">
                                    🕒 {new Date(booking.attendedAt || booking.submittedAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                            isAttended 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {isAttended 
                              ? (lang === 'ar' ? 'حضر بالفعل' : 'Attended') 
                              : (lang === 'ar' ? 'لم يحضر' : 'Pending')}
                          </span>
                          <div className="text-neutral-500">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-black/40 border-t border-white/5"
                          >
                            <div className="p-4 space-y-2.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-500">{lang === 'ar' ? 'اسم العميل:' : 'Customer Name:'}</span>
                                <span className="font-bold text-white">{booking.userName}</span>
                              </div>
                              {isAdmin && (
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-500">{lang === 'ar' ? 'رقم الهاتف:' : 'Phone:'}</span>
                                  <span className="font-mono text-amber-300 font-bold">{booking.userPhone}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-500">{lang === 'ar' ? 'الرقم المرجعي:' : 'Ref Number:'}</span>
                                <span className="font-mono text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">{booking.refNumber}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-500">{lang === 'ar' ? 'عدد الأفراد:' : 'Individuals Count:'}</span>
                                <span className="font-bold text-white">{booking.numberOfIndividuals || 1}</span>
                              </div>
                              {isAdmin && (
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-500">{lang === 'ar' ? 'إجمالي المبلغ:' : 'Total Amount:'}</span>
                                  <span className="font-bold text-emerald-400 font-mono">{booking.totalAmount || 0} {lang === 'ar' ? 'جنيه' : 'EGP'}</span>
                                </div>
                              )}
                              {isAttended && booking.attendedAt && (
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                  <span className="text-neutral-500">{lang === 'ar' ? 'تاريخ ووقت تأكيد الدخول:' : 'Check-in Timestamp:'}</span>
                                  <span className="font-mono text-emerald-300 text-[11px]">
                                    {new Date(booking.attendedAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                                  </span>
                                </div>
                              )}
                              {isAttended && (
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                  <span className="text-neutral-500">{lang === 'ar' ? 'تم المسح بواسطة (موظف الأمن):' : 'Scanned by (Security Staff):'}</span>
                                  <span className="font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 text-[11px] flex items-center gap-1">
                                    👮 {booking.attendedByStaffName || (lang === 'ar' ? 'صاحب الإعلان / المنظم' : 'Organizer')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
