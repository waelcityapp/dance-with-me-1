import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, UserPlus, Trash2, Power, Lock, CheckCircle, AlertCircle, Info, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, saveEventToFirestore, saveAdSubmissionToFirestore } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { DanceEvent, AdSubmission, SecurityStaffSettings, TicketStaffMember } from '../../types';

interface StaffManagementModalProps {
  event?: DanceEvent | null;
  adSubmission?: AdSubmission | null;
  onClose: () => void;
  onSaved?: (newSettings: SecurityStaffSettings) => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  event,
  adSubmission,
  onClose,
  onSaved,
}) => {
  const { lang, events, userAdSubmissions } = useApp();
  const isArabic = lang === 'ar';

  const currentEvent = event || (adSubmission?.eventData as DanceEvent) || null;
  const currentSub = adSubmission || null;

  // Initial staff settings
  const initialSettings: SecurityStaffSettings = currentEvent?.staffSettings || currentSub?.staffSettings || {
    mode: 'restricted',
    staffList: []
  };

  const [mode, setMode] = useState<'restricted'>('restricted');
  const [staffList, setStaffList] = useState<TicketStaffMember[]>(initialSettings.staffList || []);

  // Form states for new staff
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffGateNumber, setNewStaffGateNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const eventTitle = currentEvent 
    ? (isArabic ? currentEvent.titleAr : currentEvent.titleEn) 
    : (currentSub ? (isArabic ? currentSub.titleAr : currentSub.titleEn) : '');

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const name = newStaffName.trim();
    const pin = newStaffPin.trim();
    const gateNumber = newStaffGateNumber.trim();

    if (!name) {
      setErrorMsg(isArabic ? 'يرجى إدخال اسم موظف الأمن.' : 'Please enter staff name.');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setErrorMsg(isArabic ? 'الرقم السري يجب أن يتكون من 4 أرقام فقط (مثال: 1234).' : 'PIN must be exactly 4 digits (e.g. 1234).');
      return;
    }

    if (staffList.length >= 2) {
      setErrorMsg(isArabic ? 'الخطة المجانية الحالية تسمح بتعيين موظفين 2 فقط بحد أقصى.' : 'Free plan allows a maximum of 2 staff members.');
      return;
    }

    // Check if pin is unique
    if (staffList.some(s => s.pin === pin)) {
      setErrorMsg(isArabic ? 'هذا الرقم السري مستخدم بالفعل لموظف آخر!' : 'This PIN is already used by another staff member.');
      return;
    }

    const newMember: TicketStaffMember = {
      id: `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      pin,
      gateNumber: gateNumber || undefined,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setStaffList(prev => [...prev, newMember]);
    setNewStaffName('');
    setNewStaffPin('');
    setNewStaffGateNumber('');
  };

  const handleToggleStaffStatus = (id: string) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleDeleteStaff = (id: string) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(false);

    const updatedSettings: SecurityStaffSettings = {
      mode,
      staffList
    };

    try {
      // 1. Update ad submission document if exists
      if (currentSub?.id) {
        const fullSubData: AdSubmission = {
          ...currentSub,
          staffSettings: updatedSettings,
          eventData: currentSub.eventData ? {
            ...currentSub.eventData,
            staffSettings: updatedSettings
          } : undefined
        };
        await saveAdSubmissionToFirestore(fullSubData);
      }

      // 2. Update event document in 'events' collection
      let actualEventId = currentEvent?.id;
      if (!actualEventId && currentSub) {
        const matchingEv = events.find(e => e.eventRef === currentSub.eventRef);
        if (matchingEv) actualEventId = matchingEv.id;
      }
      const targetEventId = actualEventId || currentSub?.eventData?.id || currentSub?.id;
      if (targetEventId) {
        try {
          const evDocRef = doc(db, 'events', targetEventId);
          const evSnap = await getDoc(evDocRef);
          if (evSnap.exists()) {
            await saveEventToFirestore({
              ...(evSnap.data() as DanceEvent),
              id: evSnap.id,
              staffSettings: updatedSettings
            });
          } else if (currentEvent) {
            await saveEventToFirestore({
              ...currentEvent,
              staffSettings: updatedSettings
            });
          }
        } catch (e) {
          console.warn('Could not sync staffSettings to events collection:', e);
        }
      }

      // 3. Sync to local storage for instant offline UI reactivity
      try {
        const localAds: AdSubmission[] = JSON.parse(localStorage.getItem('dwm_ad_submissions') || '[]');
        const updatedLocalAds = localAds.map(s => {
          if (s.id === currentSub?.id || s.id === targetEventId) {
            return {
              ...s,
              staffSettings: updatedSettings,
              eventData: s.eventData ? { ...s.eventData, staffSettings: updatedSettings } : undefined
            };
          }
          return s;
        });
        localStorage.setItem('dwm_ad_submissions', JSON.stringify(updatedLocalAds));
      } catch (e) {}

      // Trigger callback instantly
      onSaved?.(updatedSettings);

      setSuccessMsg(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error saving staff settings:', err);
      setErrorMsg(isArabic ? 'حدث خطأ أثناء حفظ الإعدادات، يرجى إعادة المحاولة.' : 'Error saving settings, please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col text-right"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 pr-2">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="text-xl font-black text-white">
              {isArabic ? 'تعيين موظفي مسح التذاكر (الأمن)' : 'Manage Gate Security Staff'}
            </h2>
          </div>
          <p className="text-xs text-neutral-400 line-clamp-1">
            {eventTitle || (isArabic ? 'إعلان الفاعلية' : 'Event Ad')}
          </p>
        </div>

        {/* Free Plan Limit Notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-5 flex items-start gap-2 text-xs text-amber-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isArabic 
              ? '💡 في الخطة المجانية الحالية، يمكنك تعيين حتى 2 موظفين أمن برقم سري مكون من 4 أرقام لكل موظف لمسح التذاكر.' 
              : '💡 Free plan allows assigning up to 2 specific security staff members with 4-digit PINs.'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar">
          {/* Security Staff Management */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>{isArabic ? 'قائمة موظفي الأمن المعتمدين:' : 'Designated Security Staff List:'}</span>
              </span>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {staffList.length} / 2 {isArabic ? 'موظفين' : 'staff'}
              </span>
            </div>

              {/* Staff Members List */}
              {staffList.length === 0 ? (
                <div className="text-center py-6 px-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                  {isArabic ? 'لم يتم إضافة موظفي أمن بعد. أضف موظفاً بالأسفل.' : 'No staff added yet. Add a staff member below.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {staffList.map((staff, idx) => (
                    <div 
                      key={staff.id} 
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        staff.isActive 
                          ? 'bg-neutral-950 border-emerald-500/40 shadow-sm' 
                          : 'bg-neutral-950/60 border-red-500/30 opacity-75'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white">{idx + 1}. {staff.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            staff.isActive 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {staff.isActive ? (isArabic ? 'مفعل 🟢' : 'Active') : (isArabic ? 'موقوف مؤقتاً 🔴' : 'Paused')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono dir-ltr">
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>PIN: {staff.pin}</span>
                          </span>
                          {staff.gateNumber && (
                            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                              <span className="bg-neutral-800 px-1.5 rounded border border-neutral-700">
                                {isArabic ? `بوابة ${staff.gateNumber}` : `Gate ${staff.gateNumber}`}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Staff Actions */}
                      <div className="flex items-center gap-2">
                        {/* Toggle Active Status */}
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(staff.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            staff.isActive 
                              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                          }`}
                          title={staff.isActive ? (isArabic ? 'إيقاف مؤقت' : 'Pause') : (isArabic ? 'تفعيل' : 'Activate')}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{staff.isActive ? (isArabic ? 'إيقاف' : 'Pause') : (isArabic ? 'تفعيل' : 'Activate')}</span>
                        </button>

                        {/* Delete Staff */}
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition cursor-pointer border border-red-500/20"
                          title={isArabic ? 'حذف نهائي' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Staff Form (Only if < 2) */}
              {staffList.length < 2 && (
                <form onSubmit={handleAddStaff} className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-3">
                  <span className="text-xs font-bold text-amber-400 block flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'إضافة موظف أمن جديد:' : 'Add New Security Staff:'}</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">
                        {isArabic ? 'اسم الموظف' : 'Staff Name'}
                      </label>
                      <input 
                        type="text"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder={isArabic ? 'مثال: أحمد محمود' : 'e.g. Ahmed Mahfouz'}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">
                        {isArabic ? 'الرقم السري (4 أرقام فقط)' : '4-Digit PIN'}
                      </label>
                      <input 
                        type="password"
                        maxLength={4}
                        pattern="\d{4}"
                        value={newStaffPin}
                        onChange={(e) => {
                          const val = e.target.value;
                          const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
                          const parsed = val.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString()).replace(/\D/g, '');
                          setNewStaffPin(parsed);
                        }}
                        placeholder="1234"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono font-bold text-amber-300 text-center tracking-widest placeholder-neutral-600 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">
                        {isArabic ? 'رقم البوابة (اختياري)' : 'Gate No. (Optional)'}
                      </label>
                      <input 
                        type="text"
                        value={newStaffGateNumber}
                        onChange={(e) => setNewStaffGateNumber(e.target.value)}
                        placeholder={isArabic ? 'مثال: 1' : 'e.g. 1'}
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isArabic ? 'إضافة القائمة' : 'Add to List'}</span>
                  </button>
                </form>
              )}
            </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{isArabic ? 'تم حفظ إعدادات الموظفين بنجاح!' : 'Staff settings saved successfully!'}</span>
            </div>
          )}
        </div>

        {/* Save & Close Actions */}
        <div className="pt-4 mt-2 border-t border-neutral-800 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-black text-xs rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            {saving ? (
              <span>{isArabic ? 'جاري الحفظ...' : 'Saving...'}</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{isArabic ? 'حفظ التغييرات' : 'Save Staff Settings'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
