const fs = require('fs');

let code = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { COLLECTIONS } from '../../lib/firebase';
import type { EventBooking } from '../../types';

interface ActualAttendanceModalProps {
  eventId: string | null;
  onClose: () => void;
}

export const ActualAttendanceModal: React.FC<ActualAttendanceModalProps> = ({ eventId, onClose }) => {
  const { lang, events } = useApp();
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    
    setLoading(true);
    const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
    const q = query(bookingsRef, where('eventId', '==', eventId), where('status', '==', 'approved'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: EventBooking[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as EventBooking);
      });
      setEventBookings(list);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching actual attendance:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  if (!eventId) return null;

  const event = events.find(e => e.id === eventId);
  const eventTitle = event ? (lang === 'ar' ? event.titleAr : event.titleEn) : '';
  
  // Actually attended
  const attendedBookings = eventBookings.filter(b => b.attended);

  const totalAttendedCount = attendedBookings.reduce((sum, b) => sum + Number(b.numberOfIndividuals || 1), 0);
  const totalBookedCount = eventBookings.reduce((sum, b) => sum + Number(b.numberOfIndividuals || 1), 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 pr-8">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            {lang === 'ar' ? 'الحضور الفعلي' : 'Actual Attendance'}
          </h2>
          <p className="text-sm text-neutral-400 mt-1">{eventTitle}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
            <p className="text-neutral-400 text-sm">
              {lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
                <span className="text-xs text-neutral-500 font-bold block mb-1">
                  {lang === 'ar' ? 'إجمالي الحضور الفعلي' : 'Total Attended'}
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  {totalAttendedCount}
                </span>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
                <span className="text-xs text-neutral-500 font-bold block mb-1">
                  {lang === 'ar' ? 'إجمالي الحجوزات المعتمدة' : 'Total Booked'}
                </span>
                <span className="text-2xl font-black text-amber-400">
                  {totalBookedCount}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {attendedBookings.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  {lang === 'ar' ? 'لا يوجد حضور مسجل حتى الآن.' : 'No actual attendees recorded yet.'}
                </div>
              ) : (
                attendedBookings.map(booking => {
                  const isExpanded = expandedBookingId === booking.id;
                  return (
                    <div 
                      key={booking.id}
                      className={\`border rounded-2xl overflow-hidden transition-all \${
                        booking.attended 
                          ? 'bg-emerald-500/5 border-emerald-500/30' 
                          : 'bg-neutral-950 border-neutral-800'
                      }\`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {booking.attended ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-neutral-700 shrink-0" />
                          )}
                          <div className="text-left">
                            <div className="text-sm font-bold text-white">
                              {booking.userName}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {booking.numberOfIndividuals} {lang === 'ar' ? 'أفراد' : 'individuals'}
                            </div>
                          </div>
                        </div>
                        <div className="text-neutral-500">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 border-t border-white/5 mt-2 space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">{lang === 'ar' ? 'الرقم المرجعي:' : 'Ref Number:'}</span>
                                <span className="font-mono text-white">{booking.refNumber}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">{lang === 'ar' ? 'رقم الهاتف:' : 'Phone:'}</span>
                                <span className="font-mono text-white">{booking.userPhone}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">{lang === 'ar' ? 'حالة الدخول:' : 'Entry Status:'}</span>
                                <span className={booking.attended ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                  {booking.attended 
                                    ? (lang === 'ar' ? 'حضر بالفعل' : 'Attended') 
                                    : (lang === 'ar' ? 'لم يحضر بعد' : 'Not attended yet')}
                                </span>
                              </div>
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
`;
fs.writeFileSync('src/components/modals/ActualAttendanceModal.tsx', code);
console.log('Patched modal with live DB fetch');
