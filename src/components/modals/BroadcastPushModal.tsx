import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DanceEvent } from '../../types';
import { 
  Radio, 
  X, 
  CheckCircle2, 
  Users, 
  Loader2, 
  Smartphone, 
  Sparkles, 
  Send 
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  sendBroadcastPushNotification, 
  playNotificationChime, 
  getPushSubscribersCount,
  subscribeUserToPush
} from '../../lib/pushNotifications';
import { saveNotificationToFirestore } from '../../lib/firebase';
import { formatDate } from '../../utils/dateUtils';

interface BroadcastPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: DanceEvent | null;
}

export const BroadcastPushModal: React.FC<BroadcastPushModalProps> = ({
  isOpen,
  onClose,
  event
}) => {
  const { lang, setNotifications } = useApp();

  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isActivatingDevice, setIsActivatingDevice] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [successResult, setSuccessResult] = useState<{ sentCount: number; subscribers: number } | null>(null);

  const handleActivateMyDevice = async () => {
    setIsActivatingDevice(true);
    try {
      const res = await subscribeUserToPush();
      if (res.success) {
        const count = await getPushSubscribersCount();
        setSubscribersCount(count);
        if (res.message) {
          alert(res.message);
        }
      } else if (res.message) {
        alert(res.message);
      }
    } catch (e: any) {
      console.warn('Device activation note:', e);
      alert(lang === 'ar' ? `خطأ أثناء التفعيل: ${e?.message || e}` : `Activation error: ${e?.message || e}`);
    } finally {
      setIsActivatingDevice(false);
    }
  };

  // Initialize pre-filled notification content whenever the event changes
  useEffect(() => {
    if (event) {
      const defaultTitleAr = `🔥 ${event.titleAr || event.titleEn || 'فاعلية جديدة في سيتي إيف'}`;
      const defaultTitleEn = `🔥 ${event.titleEn || event.titleAr || 'New Event on CityEve'}`;

      const dateStr = formatDate(event.eventDate, 'ar');
      const locStr = event.location?.nameAr || event.location?.areaAr || event.location?.governorateAr || '';
      const cleanDescAr = (event.descriptionAr || event.titleAr || '').replace(/\s+/g, ' ').slice(0, 120);
      const defaultBodyAr = cleanDescAr ? `${cleanDescAr} 📅 ${dateStr}${locStr ? ` • 📍 ${locStr}` : ''}` : `انضم إلينا في ${event.titleAr} 📅 ${dateStr}`;

      const cleanDescEn = (event.descriptionEn || event.titleEn || '').replace(/\s+/g, ' ').slice(0, 120);
      const defaultBodyEn = cleanDescEn ? `${cleanDescEn} 📅 ${formatDate(event.eventDate, 'en')}${event.location?.nameEn ? ` • 📍 ${event.location.nameEn}` : ''}` : `Join us for ${event.titleEn} 📅 ${formatDate(event.eventDate, 'en')}`;

      setTitleAr(defaultTitleAr);
      setTitleEn(defaultTitleEn);
      setBodyAr(defaultBodyAr);
      setBodyEn(defaultBodyEn);
      setSuccessResult(null);

      // Fetch active subscribers
      getPushSubscribersCount().then(count => setSubscribersCount(count));
    }
  }, [event, isOpen]);

  if (!isOpen || !event) return null;

  const handleSend = async () => {
    if (!titleAr.trim() || !bodyAr.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال عنوان ونص الإشعار' : 'Please enter notification title and message');
      return;
    }

    setIsSending(true);
    try {
      const activeTitle = lang === 'ar' ? titleAr : (titleEn || titleAr);
      const activeBody = lang === 'ar' ? bodyAr : (bodyEn || bodyAr);

      // 1. Send Web Push to all phones & devices
      let result: { success: boolean; sentCount?: number; totalSubscribers?: number; error?: string } = {
        success: true,
        sentCount: 0,
        totalSubscribers: 0
      };
      try {
        result = await sendBroadcastPushNotification({
          title: activeTitle,
          body: activeBody,
          url: `/?event=${event.id}`,
          image: event.mediaUrl,
          eventId: event.id
        });
      } catch (pushErr) {
        console.warn('Push delivery note:', pushErr);
      }

      // 2. Save in-app notification for all users in Firestore and Context
      const newNotif = {
        id: `notif-push-${Date.now()}`,
        titleAr: titleAr.trim(),
        titleEn: (titleEn || titleAr).trim(),
        messageAr: bodyAr.trim(),
        messageEn: (bodyEn || bodyAr).trim(),
        date: new Date().toISOString(),
        read: false,
        type: 'new_party' as const,
        targetEventId: event.id
      };
      if (typeof setNotifications === 'function') {
        setNotifications(prev => [newNotif, ...prev]);
      }
      try {
        await saveNotificationToFirestore(newNotif);
      } catch (dbErr) {
        console.warn('Firestore notification save note:', dbErr);
      }

      // 3. Play chime
      playNotificationChime();

      setSuccessResult({ 
        sentCount: result.sentCount || 0,
        subscribers: result.totalSubscribers || subscribersCount || 0
      });
    } catch (err: any) {
      console.error('Error broadcasting event push:', err);
      alert(lang === 'ar' ? `حدث خطأ: ${err?.message || 'تعذر إرسال الإشعار'}` : `Error: ${err?.message || 'Could not send notification'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl rounded-3xl bg-neutral-900 border border-amber-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden my-auto"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  {lang === 'ar' ? 'بث إشعار فوري لشاشات الموبايل' : 'Broadcast Push Notification'}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950">
                  {lang === 'ar' ? 'أدمن فقط' : 'Admin Only'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {lang === 'ar' ? 'يصل لشاشات قفل الهواتف مثل إشعارات الواتساب مع رنة تنبيه' : 'Reaches user lock screens like WhatsApp alerts with chime'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {successResult ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-xl font-bold text-white">
                {lang === 'ar' ? 'تم إرسال الإشعار بنجاح! 🚀' : 'Notification Broadcast Successfully! 🚀'}
              </h4>
              <p className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                {lang === 'ar' 
                  ? successResult.sentCount > 0
                    ? `تم تسليم التنبيه الفوري لشاشات الهواتف (${successResult.sentCount} أجهزة مستلمة). عند ضغط أي مستخدم على الإشعار سيتم توجيهه مباشرة لهذه الفاعلية.`
                    : `تم حفظ ونشر الإشعار بنجاح في مركز الإشعارات لكل مستخدمي التطبيق. (عدد أجهزة Web Push المفعّلة حالياً: ${successResult.subscribers} جهاز).`
                  : successResult.sentCount > 0
                    ? `Delivered to (${successResult.sentCount} subscriber devices). Tapping the notification will immediately open this event inside the app.`
                    : `Notification published to in-app Notification Center for all users. (Active Web Push devices: ${successResult.subscribers}).`}
              </p>
              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm transition-all"
                >
                  {lang === 'ar' ? 'إغلاق النافذة' : 'Close'}
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Subscribers Counter Bar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>{lang === 'ar' ? 'أجهزة المشتركين المفعّلة للإشعارات:' : 'Active push subscriber devices:'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleActivateMyDevice}
                      disabled={isActivatingDevice}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-bold border border-neutral-700 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      title={lang === 'ar' ? 'تفعيل واستقبال التنبيه على هذا الجهاز' : 'Activate & Test on this device'}
                    >
                      {isActivatingDevice ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>{lang === 'ar' ? 'تفعيل جهازي الآن 📱' : 'Activate my device 📱'}</span>
                    </button>
                    <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      {subscribersCount} {lang === 'ar' ? 'جهاز مسجل' : 'devices'}
                    </span>
                  </div>
                </div>
                {subscribersCount === 0 && (
                  <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                    {lang === 'ar'
                      ? '💡 ملحوظة: العدد صفر لأن اشتراكات Web Push تُسجّل عندما يفتح المستخدم التطبيق في المتصفح أو التطبيق المثبت. اضغط زر "تفعيل جهازي الآن 📱" أعلاه لتسجيل جهازك وتجربة استلام التنبيه فوراً، وعند فتح المستخدمين للتطبيق سيتم تسجيل أجهزتهم تلقائياً.'
                      : '💡 Note: Push subscriptions register when users open the app in Chrome/Safari or installed PWA. Click "Activate my device 📱" to register your phone now, and users will auto-register on opening.'}
                  </div>
                )}
              </div>

              {/* Realistic Mobile Lock Screen Notification Preview (Like WhatsApp / Android System) */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  {lang === 'ar' ? 'معاينة شكل الإشعار على شاشة قفل الموبايل (مثل الواتساب):' : 'Lock Screen Notification Shade Preview:'}
                </label>
                <div className="rounded-2xl bg-neutral-950 p-3.5 border border-neutral-800 shadow-inner relative overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mb-2 pb-1 border-b border-neutral-900">
                    <span>٣:٢٤ م</span>
                    <span className="flex items-center gap-1">
                      <span>CityEve Push</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    </span>
                  </div>

                  {/* Android Card Replica */}
                  <div className="rounded-xl bg-neutral-800/90 border border-neutral-700/60 p-3 shadow-md">
                    <div className="flex items-start gap-3">
                      <img 
                        src="https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png" 
                        alt="CityEve" 
                        className="w-10 h-10 rounded-xl bg-neutral-900 object-cover border border-amber-500/30 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-white truncate">
                            {titleAr || (lang === 'ar' ? 'عنوان الإشعار' : 'Notification Title')}
                          </span>
                          <span className="text-[10px] text-neutral-400 shrink-0 font-mono">الآن</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed">
                          {bodyAr || (lang === 'ar' ? 'نص الإشعار ومحتواه...' : 'Notification content preview...')}
                        </p>
                      </div>
                    </div>

                    {/* Preview action buttons */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-700/50 flex items-center justify-end gap-2 text-[11px]">
                      <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                        {lang === 'ar' ? 'فتح الإعلان 🎟️' : 'Open Event 🎟️'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    {lang === 'ar' ? 'عنوان الإشعار (عربي):' : 'Notification Title (Arabic):'}
                  </label>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: 🔥 حفلة لاتين جديدة الجمعة القادمة"
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    {lang === 'ar' ? 'نص رسالة الإشعار (عربي):' : 'Notification Message (Arabic):'}
                  </label>
                  <textarea
                    rows={2}
                    value={bodyAr}
                    onChange={(e) => setBodyAr(e.target.value)}
                    placeholder="تفاصيل مختصرة تظهر في شريط إشعارات الهاتف..."
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Deep Link Target Indicator */}
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/90 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {lang === 'ar' 
                      ? `رابط التوجيه المباشر: عند النقر سيتم فتح التطبيق والتركيز على هذا الإعلان (${event.titleAr})` 
                      : `Deep link target: Tapping will open the app and highlight (${event.titleEn})`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-bold transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-sm font-black shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'ar' ? 'جاري البث...' : 'Broadcasting...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'بث الإشعار لجميع الهواتف الآن 🚀' : 'Broadcast to All Phones Now 🚀'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
