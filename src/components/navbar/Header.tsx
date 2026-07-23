import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Globe, Sparkles, ShieldAlert, CheckCircle, Sun, Moon, Monitor, Share2, Smartphone, Crown, Mail, ScanLine } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, onOpenAuth, onOpenInstallModal }) => {
  const { lang, setLang, theme, setTheme, unreadCount, setActiveTab, user, openGuestAlert, openSupportModal, isAdminUnlocked, setIsAdminLockModalOpen, appAssets } = useApp();
  const [copied, setCopied] = useState(false);

  const toggleLanguage = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const handleShareApp = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/' : 'https://dance-with-me-697254017828.europe-west2.run.app/';
    const shareData = {
      title: lang === 'ar' ? 'Dance With Me - بوابة الحفلات والكورسات اللاتينية' : 'Dance With Me - Latin Dance Portal',
      text: lang === 'ar' ? 'انضم إلينا في أفضل الحفلات والكورسات اللاتينية!' : 'Join us for the best Latin parties and courses!',
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (e) {}
    }
  };

  const handleContactApp = () => {
    if (!user) {
      openGuestAlert('contact');
      return;
    }
    openSupportModal();
  };

  const handleScanQrClick = () => {
    if (!user) {
      openGuestAlert('scan_qr');
      return;
    }
    window.history.pushState({}, '', '/?verify=scan');
    setActiveTab('verification');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/50 bg-neutral-950/85 backdrop-blur-md transition-all duration-300 py-3 shadow-lg">
      <div className="mx-auto flex flex-col items-center justify-center max-w-5xl px-3 sm:px-6 gap-3">
        {/* Brand Identity & Logo - Centered at Top */}
        <div 
          className="flex items-center justify-center gap-3 sm:gap-4 cursor-pointer py-1"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Dance With Me"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl overflow-hidden border border-amber-500/40 shadow-xl bg-neutral-900 shrink-0"
          >
            <img 
              src={appAssets?.app_icon_url || "/icon.svg?v=20260706"} 
              alt="Dance With Me Logo" 
              className="h-full w-full object-cover"
            />
          </motion.div>
          
          <div className="flex flex-col justify-center">
            <h1 className="font-sans text-xl sm:text-2xl font-bold tracking-tighter bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent leading-tight">
              {appAssets?.appNameEn || appAssets?.appNameAr || "Dance With Me"}
            </h1>
            <span className="font-mono text-[10px] text-amber-500/70 font-semibold tracking-widest leading-none">
              Beta 1.01
            </span>
          </div>
        </div>

        {/* Action Buttons Beneath Logo & Title */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 w-full">
          {/* Top Quick Tools: Theme, Language, Notifications */}
          <div className="flex items-center justify-center gap-1 flex-wrap sm:flex-nowrap">
            {/* Theme Mode Toggle (Light / Dark / Auto) */}
            <div className="flex items-center rounded-md border border-neutral-800 bg-neutral-900/80 p-0.5 text-[9px] shadow-sm">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-all text-[9px] font-bold cursor-pointer ${theme === 'light' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'}`}
                title={lang === 'ar' ? 'وضع نهاري' : 'Light Mode'}
              >
                <Sun className="h-2.5 w-2.5" />
                <span>{lang === 'ar' ? 'نهاري' : 'Day'}</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-all text-[9px] font-bold cursor-pointer ${theme === 'dark' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'}`}
                title={lang === 'ar' ? 'وضع ليلي' : 'Dark Mode'}
              >
                <Moon className="h-2.5 w-2.5" />
                <span>{lang === 'ar' ? 'ليلي' : 'Night'}</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex items-center gap-0.5 px-1 py-0.5 rounded transition-all text-[9px] font-bold cursor-pointer ${theme === 'system' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'}`}
                title={lang === 'ar' ? 'تلقائي' : 'Auto'}
              >
                <Monitor className="h-2.5 w-2.5" />
                <span>{lang === 'ar' ? 'تلقائي' : 'Auto'}</span>
              </button>
            </div>

            {/* Language Toggle: عربي 🌐 EN with Illuminated Active Choice */}
            <div className="flex items-center rounded-md border border-neutral-800 bg-neutral-900/80 p-0.5 text-[9px] shadow-sm">
              <button
                onClick={() => setLang('ar')}
                className={`px-1.5 py-0.5 rounded transition-all font-black text-[9px] cursor-pointer ${
                  lang === 'ar'
                    ? 'bg-amber-500 text-neutral-950 shadow-[0_0_10px_rgba(245,158,11,0.8)] border border-amber-400 ring-1 ring-amber-400/50'
                    : 'text-neutral-400 hover:text-white opacity-70'
                }`}
                title="اللغة العربية"
              >
                عربي
              </button>
              <Globe className="h-3 w-3 mx-0.5 text-amber-400 shrink-0" />
              <button
                onClick={() => setLang('en')}
                className={`px-1.5 py-0.5 rounded transition-all font-black text-[9px] cursor-pointer ${
                  lang === 'en'
                    ? 'bg-amber-500 text-neutral-950 shadow-[0_0_10px_rgba(245,158,11,0.8)] border border-amber-400 ring-1 ring-amber-400/50'
                    : 'text-neutral-400 hover:text-white opacity-70'
                }`}
                title="English Language"
              >
                EN
              </button>
            </div>

            {/* Notifications Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenNotifications}
              className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-3 w-3" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2 items-center justify-center rounded-full bg-red-600 font-mono text-[8px] font-bold text-white animate-pulse">
                </span>
              )}
            </motion.button>
          </div>

          {/* Horizontally Scrollable Action Bar for Mobile & Centered Flex for Desktop */}
          <div className="w-full sm:w-auto overflow-x-auto action-bar-scrollbar pb-1.5 pt-0.5">
            <div className="flex items-center justify-start sm:justify-center gap-1 min-w-max px-0.5">
              {/* App Share Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleShareApp}
                className="flex items-center justify-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-400 transition-all shadow-sm h-6 sm:h-7 whitespace-nowrap cursor-pointer"
                title={lang === 'ar' ? 'مشاركة رابط التطبيق' : 'Share App Link'}
              >
                {copied ? <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> : <Share2 className="h-3 w-3 shrink-0" />}
                <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'مشاركة التطبيق' : 'Share App')}</span>
              </motion.button>

              {/* Message App Button (Envelope Icon) */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleContactApp}
                className="flex items-center justify-center gap-1 rounded-md border border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-blue-300 transition-all shadow-sm h-6 sm:h-7 whitespace-nowrap cursor-pointer"
                title={lang === 'ar' ? 'مراسلة إدارة التطبيق' : 'Message App Support'}
              >
                <Mail className="h-3 w-3 text-blue-400 shrink-0" />
                <span>{lang === 'ar' ? 'مراسلة التطبيق' : 'Message App'}</span>
              </motion.button>

              {/* Scan QR / Barcode Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleScanQrClick}
                className="flex items-center justify-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-300 transition-all shadow-sm h-6 sm:h-7 whitespace-nowrap cursor-pointer"
                title={lang === 'ar' ? 'مسح تذكرة / باركود' : 'Scan Ticket / QR Barcode'}
              >
                <ScanLine className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>{lang === 'ar' ? 'مسح باركود' : 'Scan QR'}</span>
              </motion.button>

              {/* Install on Mobile Button */}
              {onOpenInstallModal && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenInstallModal}
                  className="flex items-center justify-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-300 transition-all shadow-sm h-6 sm:h-7 animate-pulse whitespace-nowrap cursor-pointer"
                  title={lang === 'ar' ? 'تثبيت على موبايلك' : 'Install on Mobile'}
                >
                  <Smartphone className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}</span>
                </motion.button>
              )}

              {/* Admin Panel Button */}
              {user?.isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (isAdminUnlocked) {
                      setActiveTab('admin');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      setIsAdminLockModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-1 rounded-md border border-amber-400 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-neutral-950 transition-all shadow-md h-6 sm:h-7 gold-glow cursor-pointer whitespace-nowrap"
                  title={lang === 'ar' ? 'لوحة تحكم ومراجعة الإعلانات VIP' : 'VIP Ads Admin Panel'}
                >
                  <Crown className="h-3 w-3 stroke-[2.5]" />
                  <span>{lang === 'ar' ? '👑 لوحة الإدارة' : '👑 Admin'}</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
