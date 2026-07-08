import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Lock, Timer, X, AlertTriangle, Key, ArrowRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyAdminSecretCode, logSecurityViolation } from '../../lib/firebase';

export const AdminLockModal: React.FC = () => {
  const { 
    isAdminLockModalOpen, 
    setIsAdminLockModalOpen, 
    setIsAdminUnlocked, 
    setActiveTab, 
    lang, 
    user 
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0); // in seconds
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attackerData, setAttackerData] = useState<any>(null);

  // Load and enforce lockout on mount and periodically
  useEffect(() => {
    const checkLockout = () => {
      const storedLockout = localStorage.getItem('dwm_lockout_until');
      const storedAttempts = localStorage.getItem('dwm_failed_attempts');
      
      if (storedAttempts) {
        setAttempts(parseInt(storedAttempts, 10));
      }

      if (storedLockout) {
        const until = parseInt(storedLockout, 10);
        const now = Date.now();
        if (until > now) {
          setLockoutTimeLeft(Math.ceil((until - now) / 1000));
        } else {
          // Lockout expired
          localStorage.removeItem('dwm_lockout_until');
          localStorage.removeItem('dwm_failed_attempts');
          setLockoutTimeLeft(0);
          setAttempts(0);
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [isAdminLockModalOpen]);

  // Fetch client IP/Location info proactively in case we need to log a violation
  useEffect(() => {
    if (isAdminLockModalOpen) {
      fetch('https://ipapi.co/json/')
        .then((res) => res.json())
        .then((data) => setAttackerData(data))
        .catch(() => {
          // Fallback to simpler IP service if blocked or slow
          fetch('https://api.ipify.org?format=json')
            .then((res) => res.json())
            .then((data) => setAttackerData({ ip: data.ip }))
            .catch(() => setAttackerData({ ip: 'Unknown IP' }));
        });
    }
  }, [isAdminLockModalOpen]);

  if (!isAdminLockModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimeLeft > 0) {
      setErrorMsg(
        lang === 'ar'
          ? `⚠️ النظام مغلق مؤقتاً. يرجى الانتظار لحين انتهاء الحظر.`
          : `⚠️ System is temporarily locked. Please wait until the lockout ends.`
      );
      return;
    }

    if (!inputCode.trim()) {
      setErrorMsg(lang === 'ar' ? 'الرجاء إدخال الرمز السري' : 'Please enter the secret code');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const isMatched = await verifyAdminSecretCode(inputCode.trim());
      
      if (isMatched) {
        // Success
        localStorage.removeItem('dwm_failed_attempts');
        localStorage.removeItem('dwm_lockout_until');
        setAttempts(0);
        setIsAdminUnlocked(true);
        setIsAdminLockModalOpen(false);
      } else {
        // Failed attempt
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('dwm_failed_attempts', newAttempts.toString());

        if (newAttempts >= 3) {
          // Lock out for 1 minute (60 seconds) for testing as requested
          const lockoutExpiry = Date.now() + 60 * 1000;
          localStorage.setItem('dwm_lockout_until', lockoutExpiry.toString());
          setLockoutTimeLeft(60);

          // Log security violation in Firestore
          await logSecurityViolation(attackerData, newAttempts, user?.email);

          // Trigger simulated WhatsApp alert / provide manual dispatch option
          triggerWhatsAppAlert(newAttempts);

          setErrorMsg(
            lang === 'ar'
              ? '⚠️ تعذر فتح الصفحة! تم تجاوز الحد الأقصى للمحاولات (3 مرات). تم قفل النظام لمدة دقيقة واحدة وتم إرسال بلاغ أمني فوراً بالإحداثيات وعنوان IP الخاص بك إلى الإدارة.'
              : '⚠️ Unable to open page! Maximum attempts (3) exceeded. System locked for 1 minute. A security report with your IP and details has been logged.'
          );
        } else {
          setErrorMsg(
            lang === 'ar'
              ? `❌ تعذر فتح الصفحة! رمز التحقق غير صحيح. متبقي لك ${3 - newAttempts} محاولات قبل الإغلاق التام.`
              : `❌ Unable to open page! Incorrect code. You have ${3 - newAttempts} attempts left before system lockout.`
          );
        }
      }
    } catch (err) {
      setErrorMsg(lang === 'ar' ? 'عذراً، حدث خطأ أثناء التحقق.' : 'Sorry, an error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const triggerWhatsAppAlert = (attemptsCount: number) => {
    const ip = attackerData?.ip || 'Unknown';
    const city = attackerData?.city || 'Unknown';
    const country = attackerData?.country_name || 'Unknown';
    const browser = navigator.userAgent.substring(0, 100);
    const dateStr = new Date().toLocaleString('ar-EG');

    const arabicMessage = `🚨 *تنبيه أمني عاجل من تطبيق Dance With Me* 🚨\n\n` +
      `هناك محاولة اختراق متكررة للوحة الإدارة!\n` +
      `• *عدد المحاولات الخاطئة:* ${attemptsCount} محاولات\n` +
      `• *عنوان الـ IP:* ${ip}\n` +
      `• *الموقع التقريبي:* ${city}، ${country}\n` +
      `• *التوقيت:* ${dateStr}\n` +
      `• *المتصفح/الجهاز:* ${browser}\n\n` +
      `🔐 تم قفل النظام تلقائياً لمنع الدخول لمدة دقيقة واحدة وتسجيل البلاغ الأمني بقاعدة البيانات.`;

    // Store in SessionStorage so user can click to dispatch if needed, or open it
    sessionStorage.setItem('dwm_whatsapp_alert_text', encodeURIComponent(arabicMessage));
  };

  const formatPhoneForWhatsApp = (phoneStr?: string): string => {
    if (!phoneStr) return '201015112185';
    const clean = phoneStr.replace(/\D/g, '');
    if (!clean) return '201015112185';
    if (clean.length === 11 && clean.startsWith('01')) {
      return '2' + clean;
    }
    return clean;
  };

  const sendManualWhatsApp = () => {
    const alertText = sessionStorage.getItem('dwm_whatsapp_alert_text');
    if (alertText) {
      const savedPhone = localStorage.getItem('dwm_admin_whatsapp_phone');
      const targetPhone = formatPhoneForWhatsApp(savedPhone || user?.phone || '201015112185');
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${alertText}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Helper to format remaining lockout time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAdminLockModalOpen(false)}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 p-6 shadow-2xl text-center"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsAdminLockModalOpen(false)}
            className="absolute top-4 right-4 rounded-full border border-white/5 bg-white/5 p-1.5 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Security Shield Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 animate-pulse">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white mb-2 font-sans">
            {lang === 'ar' ? '🔐 جدار الحماية الأمني' : '🔐 Admin Firewall Protection'}
          </h3>
          <p className="text-sm text-neutral-400 mb-6 px-2 leading-relaxed">
            {lang === 'ar' 
              ? 'تتطلب لوحة الإدارة إدخال العبارة أو الرقم السري المخزن في قواعد البيانات للتحقق الثنائي وحماية المعاملات الحساسة.'
              : 'The VIP Admin Panel is strictly protected and requires entering the database secret verification code.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Key className="absolute top-1/2 left-4 -translate-y-1/2 h-5 w-5 text-neutral-500" />
              <input
                type="password"
                placeholder={lang === 'ar' ? 'أدخل العبارة السرية هنا...' : 'Enter secret code...'}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                disabled={lockoutTimeLeft > 0 || loading}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="w-full rounded-2xl border border-white/10 bg-neutral-900/50 py-3.5 pl-12 pr-4 text-center text-sm font-semibold tracking-widest text-white placeholder-neutral-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 text-right leading-relaxed flex items-start gap-2.5"
              >
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span className="flex-1">{errorMsg}</span>
              </motion.div>
            )}

            {/* Lockout Timer Overlay */}
            {lockoutTimeLeft > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                <div className="flex justify-center gap-2 text-amber-400 font-mono font-bold text-lg mb-1 items-center">
                  <Timer className="h-5 w-5 animate-spin" />
                  <span>{formatTime(lockoutTimeLeft)}</span>
                </div>
                <p className="text-xs text-amber-500/80 leading-relaxed font-sans font-medium">
                  {lang === 'ar'
                    ? 'تم حظر جهازك مؤقتاً لتكرار محاولات الدخول الخاطئة. سيفتح الحظر تلقائياً بعد دقيقة واحدة.'
                    : 'Your device is temporarily blocked for security reasons. Wait 1 minute.'}
                </p>

                {/* Simulated/Manual whatsapp alert option */}
                <button
                  type="button"
                  onClick={sendManualWhatsApp}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs py-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'إرسال البلاغ الأمني للواتساب فوراً 📱' : 'Send Alert via WhatsApp'}</span>
                </button>
              </div>
            )}

            {/* Submit & Cancel Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdminLockModalOpen(false)}
                className="rounded-2xl border border-white/5 bg-white/5 py-3 text-xs font-bold text-neutral-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading || lockoutTimeLeft > 0}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs py-3 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
                ) : (
                  <>
                    <span>{lang === 'ar' ? 'تحقق ودخول' : 'Verify & Enter'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
