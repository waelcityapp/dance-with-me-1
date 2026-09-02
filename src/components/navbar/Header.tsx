import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, Sparkles, CheckCircle, Sun, Moon, Monitor, 
  Share2, Smartphone, Crown, Mail, ScanLine, MoreHorizontal, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNotifications, 
  onOpenAuth, 
  onOpenInstallModal 
}) => {
  const { 
    lang, setLang, 
    theme, setTheme, 
    unreadCount, 
    setActiveTab, 
    user, 
    openGuestAlert, 
    openSupportModal, 
    isAdminUnlocked, 
    setIsAdminLockModalOpen, 
    appAssets, 
    feedViewMode, 
    setFeedViewMode 
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const handleShareApp = async () => {
    const shareUrl = 'https://cityeve.online/';
    const shareData = {
      title: lang === 'ar' ? 'CityEve - بوابة الحفلات والفعاليات اللاتينية' : 'CityEve - Latin Dance & Events Portal',
      text: lang === 'ar' ? 'اكتشف أفضل الحفلات والمعارض والكورسات على CityEve!' : 'Discover top parties, expos, and dance courses on CityEve!',
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
    <header className="sticky top-0 z-50 w-full border-b border-[#166fe5] dark:border-neutral-800 bg-[#1877F2] dark:bg-neutral-950/90 backdrop-blur-xl transition-all duration-300 shadow-md dark:shadow-xl text-white">
      <div className="mx-auto flex items-center justify-between max-w-6xl px-3 sm:px-6 h-16 gap-2">
        {/* Brand Logo & Title */}
        <div 
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="CityEve"
        >
          <motion.div 
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl overflow-hidden border border-white/30 dark:border-amber-500/40 shadow-md bg-neutral-900 shrink-0"
          >
            <img 
              src={appAssets?.app_icon_url || "https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png"} 
              alt="CityEve Logo" 
              className="h-full w-full object-cover"
            />
          </motion.div>
          
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="font-sans text-lg sm:text-xl font-black tracking-tight text-white leading-none drop-shadow-sm">
                {appAssets?.appNameEn || appAssets?.appNameAr || "CityEve"}
              </h1>
            </div>
            <span className="font-mono text-[9px] text-blue-100 dark:text-neutral-400 font-bold tracking-wider leading-tight mt-0.5">
              {lang === 'ar' ? 'دليل الفعاليات والسهرات' : 'Events & Nightlife'}
            </span>
          </div>
        </div>

        {/* Right Tools & Actions (Clean, minimal, uncrowded) */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Language Switcher Pill */}
          <div className="flex items-center rounded-xl border border-white/20 dark:border-neutral-800 bg-blue-700/60 dark:bg-neutral-900/90 p-0.5 text-xs text-white">
            <button
              onClick={() => setLang('ar')}
              className={`px-2.5 py-1 rounded-lg transition-all font-black text-[11px] sm:text-xs cursor-pointer ${
                lang === 'ar'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-blue-100 dark:text-neutral-400 hover:text-white'
              }`}
            >
              عربي
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg transition-all font-black text-[11px] sm:text-xs cursor-pointer ${
                lang === 'en'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-blue-100 dark:text-neutral-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Notifications Bell */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenNotifications}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 dark:border-neutral-800 bg-blue-700/60 dark:bg-neutral-900/90 text-white dark:text-neutral-300 hover:bg-blue-600/80 dark:hover:text-white transition-all cursor-pointer shadow-sm"
            aria-label="Notifications"
            title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 end-1.5 flex h-2 w-2 rounded-full bg-red-400 animate-ping" />
            )}
          </motion.button>

          {/* Quick Menu / More Tools Drawer Button */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowToolsMenu(prev => !prev)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer shadow-sm ${
              showToolsMenu 
                ? 'border-amber-400 bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20' 
                : 'border-white/20 dark:border-neutral-800 bg-blue-700/60 dark:bg-neutral-900/90 text-white dark:text-neutral-300 hover:bg-blue-600/80 dark:hover:text-white'
            }`}
            title={lang === 'ar' ? 'أدوات وإعدادات إضافية' : 'More Tools'}
          >
            {showToolsMenu ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
          </motion.button>

          {/* Admin Direct Button (if unlocked) */}
          {user?.isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isAdminUnlocked) {
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setIsAdminLockModalOpen(true);
                }
              }}
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-400 to-yellow-400 text-neutral-950 font-black text-xs shadow-md gold-glow cursor-pointer"
              title={lang === 'ar' ? 'لوحة إدارة التطبيق' : 'Admin Panel'}
            >
              <Crown className="h-3.5 w-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'الإدارة' : 'Admin'}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Expandable Luxury Tools Dropdown (Clean, Organized, Modern) */}
      <AnimatePresence>
        {showToolsMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-neutral-200 dark:border-neutral-800/80 bg-white/98 dark:bg-neutral-950/95 px-3 sm:px-6 py-3.5 overflow-hidden shadow-2xl backdrop-blur-2xl"
          >
            <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-3">
              {/* Actions row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Share App Button */}
                <button
                  onClick={() => {
                    handleShareApp();
                    setShowToolsMenu(false);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
                  <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'مشاركة التطبيق' : 'Share App')}</span>
                </button>

                {/* Contact App Button */}
                <button
                  onClick={() => {
                    handleContactApp();
                    setShowToolsMenu(false);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  <span>{lang === 'ar' ? 'مراسلة الإدارة' : 'Message Support'}</span>
                </button>

                {/* Scan QR Button */}
                <button
                  onClick={() => {
                    handleScanQrClick();
                    setShowToolsMenu(false);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  <ScanLine className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{lang === 'ar' ? 'مسح باركود تذكرة' : 'Scan QR'}</span>
                </button>

                {/* Install on Mobile Button */}
                {onOpenInstallModal && (
                  <button
                    onClick={() => {
                      onOpenInstallModal();
                      setShowToolsMenu(false);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-black transition-all cursor-pointer shadow-sm"
                  >
                    <Smartphone className="h-3.5 w-3.5 text-purple-500" />
                    <span>{lang === 'ar' ? 'تثبيت على الموبايل' : 'Install App'}</span>
                  </button>
                )}
              </div>

              {/* Theme Switcher in Menu */}
              <div className="flex items-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-1 text-xs">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                    theme === 'light' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                  title={lang === 'ar' ? 'وضع نهاري' : 'Light Mode'}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'نهاري' : 'Light'}</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                    theme === 'dark' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                  title={lang === 'ar' ? 'وضع ليلي' : 'Dark Mode'}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'ليلي' : 'Dark'}</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                    theme === 'system' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                  title={lang === 'ar' ? 'تلقائي' : 'Auto'}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'تلقائي' : 'Auto'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
