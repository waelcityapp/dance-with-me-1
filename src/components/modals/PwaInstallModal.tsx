import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Smartphone, Share, PlusSquare, MoreVertical, Download, CheckCircle, ShieldCheck, Apple, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const { lang, appAssets } = useApp();
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect OS to default tab
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/android/i.test(userAgent)) {
      setActiveTab('android');
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      setActiveTab('ios');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      setDeferredPrompt(null);
    } else {
      alert(lang === 'ar' ? 'يرجى اتباع خطوات التثبيت الموضحة بالأسفل لنظام هاتفك.' : 'Please follow the installation steps shown below for your device OS.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-amber-500/30 bg-neutral-900 shadow-2xl gold-glow max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-950 p-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-lg shrink-0 overflow-hidden">
                <img src={appAssets?.app_icon_url || "/icon.svg?v=20260706"} alt="DWM" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    {lang === 'ar' ? 'تثبيت تطبيق Dance With Me على هاتفك' : 'Install Dance With Me App'}
                  </h3>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    PWA VIP
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {lang === 'ar' ? 'تطبيق سريع ومقاوم للفشل يعمل بدون إنترنت وبدون متجر' : 'Fast offline-ready web app, no app store required'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5">
            {/* Direct Install Banner if Available */}
            {deferredPrompt && !installed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 to-neutral-900 p-4 flex items-center justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Download className="h-5 w-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {lang === 'ar' ? 'التثبيت المباشر متاح لهاتفك الآن!' : 'Direct Install Available Now!'}
                    </h4>
                    <p className="text-xs text-neutral-300">
                      {lang === 'ar' ? 'اضغط لتثبيت التطبيق مباشرة في ثانية واحدة.' : 'Click to install the app directly in one second.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDirectInstall}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-all shadow-md shrink-0"
                >
                  {lang === 'ar' ? 'تثبيت الآن ⚡' : 'Install Now ⚡'}
                </button>
              </motion.div>
            )}

            {/* OS Selection Tabs */}
            <div className="flex rounded-2xl bg-neutral-950 p-1.5 border border-white/5">
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'ios'
                    ? 'bg-amber-500 text-neutral-950 shadow-lg font-extrabold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Apple className="h-4 w-4" />
                <span>{lang === 'ar' ? 'آيفون / آيباد (iOS)' : 'iPhone / iPad (iOS)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'android'
                    ? 'bg-amber-500 text-neutral-950 shadow-lg font-extrabold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>{lang === 'ar' ? 'أندرويد (Android)' : 'Android Devices'}</span>
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'ios' ? (
              <motion.div
                key="ios-guide"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="rounded-2xl bg-neutral-950/80 p-4 border border-white/10 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Apple className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'خطوات التثبيت على أجهزة iPhone و iPad:' : 'Installation Steps for iPhone & iPad:'}</span>
                  </h4>
                  <p className="text-xs text-neutral-300">
                    {lang === 'ar'
                      ? 'بسبب سياسات Apple، يتم تثبيت التطبيقات التقدمية (PWA) بسهولة من خلال متصفح Safari باتباع هذه الخطوات البسيطة:'
                      : 'Due to Apple policies, PWA apps are easily installed via Safari browser using these quick steps:'}
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/90 border border-white/5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">1</div>
                      <div className="text-xs text-neutral-200">
                        <span className="font-bold text-white block mb-0.5">
                          {lang === 'ar' ? 'افتح الموقع عبر متصفح Safari' : 'Open Site in Safari Browser'}
                        </span>
                        {lang === 'ar' ? 'تأكد أنك تتصفح الموقع من خلال Safari (وليس متصفح داخلي لتطبيق آخر مثل فيسبوك أو إنستغرام).' : 'Make sure you are viewing this page in Safari (not an in-app browser like Facebook/IG).'}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/90 border border-white/5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">2</div>
                      <div className="text-xs text-neutral-200">
                        <span className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                          <span>{lang === 'ar' ? 'اضغط على زر المشاركة (Share)' : 'Tap the Share Button'}</span>
                          <Share className="h-3.5 w-3.5 text-amber-400 inline" />
                        </span>
                        {lang === 'ar' ? 'الموجود في الشريط السفلي لمتصفح Safari (أو في الأعلى في الآيباد).' : 'Located in the bottom menu bar of Safari (or top right on iPad).'}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/90 border border-white/5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">3</div>
                      <div className="text-xs text-neutral-200">
                        <span className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                          <span>{lang === 'ar' ? 'اختَر "الإضافة للشاشة الرئيسية"' : 'Select "Add to Home Screen"'}</span>
                          <PlusSquare className="h-3.5 w-3.5 text-amber-400 inline" />
                        </span>
                        {lang === 'ar' ? 'مرر القائمة لأسفل حتى تجد خيار "الإضافة للشاشة الرئيسية" (Add to Home Screen) واضغط عليه.' : 'Scroll down the share sheet until you find "Add to Home Screen" and tap it.'}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/90 border border-white/5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">4</div>
                      <div className="text-xs text-neutral-200">
                        <span className="font-bold text-white block mb-0.5">
                          {lang === 'ar' ? 'اضغط "إضافة" (Add) في أعلى الشاشة' : 'Tap "Add" in top right corner'}
                        </span>
                        {lang === 'ar' ? 'سيتم إضافة أيقونة Dance With Me الذهبية لشاشة هاتفك الرئيسية كأي تطبيق عادي!' : 'The DWM gold icon will appear on your home screen instantly!'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="android-guide"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="rounded-2xl bg-neutral-950/80 p-4 border border-white/10 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'خطوات التثبيت على أجهزة Android (سامسونج، شاومي، وغيرها):' : 'Installation Steps for Android Devices:'}</span>
                  </h4>
                  <p className="text-xs text-neutral-300">
                    {lang === 'ar'
                      ? 'يمكنك تثبيت التطبيق بضغطة واحدة من خلال متصفح Google Chrome أو أي متصفح أندرويد:'
                      : 'You can install the app instantly using Google Chrome or any standard Android browser:'}
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/90 border border-white/5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">1</div>
                      <div className="text-xs text-neutral-200">
                        <span className="font-bold text-white block mb-0.5">
                          {lang === 'ar' ? 'افتح قائمة المتصفح' : 'Open Browser Menu'}
                        </span>
                        {lang === 'ar' ? 'اضغط على أيقونة الثلاث نقاط (⋮) في أعلى زاوية المتصفح.' : 'Tap the three dots icon (⋮) at the top corner of your browser.'}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/90 border border-white/5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">2</div>
                      <div className="text-xs text-neutral-200">
                        <span className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                          <span>{lang === 'ar' ? 'اختَر "تثبيت التطبيق" (Install app)' : 'Select "Install app"'}</span>
                          <Download className="h-3.5 w-3.5 text-amber-400 inline" />
                        </span>
                        {lang === 'ar' ? 'أو قد تظهر باسم "الإضافة إلى الشاشة الرئيسية" (Add to Home screen).' : 'Or it may appear as "Add to Home screen" in some browsers.'}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/90 border border-white/5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">3</div>
                      <div className="text-xs text-neutral-200">
                        <span className="font-bold text-white block mb-0.5">
                          {lang === 'ar' ? 'قم بتأكيد التثبيت' : 'Confirm Installation'}
                        </span>
                        {lang === 'ar' ? 'اضغط "تثبيت" في النافذة المنبثقة، وسيصبح التطبيق جاهزاً على هاتفك!' : 'Tap "Install" on the popup prompt and the app is ready on your phone!'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Benefits Banner */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-amber-400 shrink-0" />
              <div className="text-xs text-neutral-300">
                <span className="font-bold text-white block">
                  {lang === 'ar' ? 'لماذا يفضل التثبيت على الهاتف؟' : 'Why install the PWA app?'}
                </span>
                {lang === 'ar' ? 'سرعة فائقة، وصول فوري لجميع الحفلات والكورسات، عمل بدون إنترنت، وتنبيهات بآخر الخصومات الفاخرة.' : 'Ultra-fast loading, instant access to parties & courses, offline access, and exclusive discount alerts.'}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-neutral-950 p-4 flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-all shadow-lg text-center"
            >
              {lang === 'ar' ? 'فهمت، شكراً لك' : 'Got it, Thanks'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
