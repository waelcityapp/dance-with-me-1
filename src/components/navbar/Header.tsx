import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Globe, Sparkles, ShieldAlert, CheckCircle2, Sun, Moon, Monitor, Share2, Smartphone, Crown, Mail } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, onOpenAuth, onOpenInstallModal }) => {
  const { lang, setLang, theme, setTheme, unreadCount, setActiveTab, user, openGuestAlert, openSupportModal, isAdminUser } = useApp();
  const [copied, setCopied] = useState(false);

  const toggleLanguage = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const handleShareApp = async () => {
    const shareUrl = 'https://dance-with-me-697254017828.europe-west2.run.app/';
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
              src="/icon.svg?v=20260706" 
              alt="Dance With Me Logo" 
              className="h-full w-full object-cover"
            />
          </motion.div>
          
          <div className="flex flex-col justify-center">
            <h1 className="font-sans text-xl sm:text-2xl font-bold tracking-tighter bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent leading-tight">
              Dance With Me
            </h1>
            <span className="font-mono text-[10px] text-amber-500/70 font-semibold tracking-widest leading-none">
              Beta 1.01
            </span>
          </div>
        </div>

        {/* Action Buttons Beneath Logo & Title */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
          {/* Theme Mode Toggle (Light / Dark / Auto) */}
          <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-900/80 p-0.5 text-xs shadow-sm">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-amber-500 text-neutral-950 font-bold shadow-md' : 'text-neutral-400 hover:text-white'}`}
              title={lang === 'ar' ? 'وضع نهاري' : 'Light Mode'}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'نهاري' : 'Day'}</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-amber-500 text-neutral-950 font-bold shadow-md' : 'text-neutral-400 hover:text-white'}`}
              title={lang === 'ar' ? 'وضع ليلي' : 'Dark Mode'}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'ليلي' : 'Night'}</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-amber-500 text-neutral-950 font-bold shadow-md' : 'text-neutral-400 hover:text-white'}`}
              title={lang === 'ar' ? 'تلقائي' : 'Auto'}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'تلقائي' : 'Auto'}</span>
            </button>
          </div>

          {/* Language Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:border-neutral-700 hover:text-white transition-colors h-9"
            title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-amber-400 border-b border-amber-400 pb-0.5">{lang === 'ar' ? 'AR' : 'EN'}</span>
          </motion.button>

          {/* Notifications Bell */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenNotifications}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-600 font-mono text-[9px] font-bold text-white animate-pulse">
              </span>
            )}
          </motion.button>

          {/* Grouped Action Row: Share, Message App (Envelope), and Install on Mobile */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 max-w-full flex-wrap sm:flex-nowrap">
            {/* App Share Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShareApp}
              className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-2 py-1.5 sm:px-2.5 text-[11px] sm:text-xs font-bold text-amber-400 transition-all shadow-sm h-8 sm:h-9 whitespace-nowrap cursor-pointer"
              title={lang === 'ar' ? 'مشاركة رابط التطبيق' : 'Share App Link'}
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" /> : <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />}
              <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'مشاركة التطبيق' : 'Share App')}</span>
            </motion.button>

            {/* Message App Button (Envelope Icon) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContactApp}
              className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25 px-2 py-1.5 sm:px-2.5 text-[11px] sm:text-xs font-bold text-blue-300 transition-all shadow-sm h-8 sm:h-9 whitespace-nowrap cursor-pointer"
              title={lang === 'ar' ? 'مراسلة إدارة التطبيق' : 'Message App Support'}
            >
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 shrink-0" />
              <span>{lang === 'ar' ? 'مراسلة التطبيق' : 'Message App'}</span>
            </motion.button>

            {/* Install on Mobile Button */}
            {onOpenInstallModal && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenInstallModal}
                className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-2 py-1.5 sm:px-2.5 text-[11px] sm:text-xs font-bold text-emerald-300 transition-all shadow-sm h-8 sm:h-9 animate-pulse whitespace-nowrap cursor-pointer"
                title={lang === 'ar' ? 'تثبيت على موبايلك' : 'Install on Mobile'}
              >
                <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
                <span>{lang === 'ar' ? 'تثبيت على موبايلك' : 'Install App'}</span>
              </motion.button>
            )}
          </div>

          {/* Admin Panel Button */}
          {isAdminUser && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 px-3 py-1.5 text-xs font-black text-neutral-950 transition-all shadow-md h-9 gold-glow cursor-pointer"
              title={lang === 'ar' ? 'لوحة تحكم ومراجعة الإعلانات VIP' : 'VIP Ads Admin Panel'}
            >
              <Crown className="h-4 w-4 stroke-[2.5]" />
              <span>{lang === 'ar' ? '👑 لوحة الإدارة والفواتير' : '👑 Admin Panel'}</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};
