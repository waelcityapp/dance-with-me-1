import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, Sparkles, CheckCircle, Sun, Moon, Monitor, 
  Share2, Smartphone, Crown, Mail, ScanLine, Settings, X,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenInstallModal?: () => void;
  onOpenAboutUs?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNotifications, 
  onOpenAuth, 
  onOpenInstallModal,
  onOpenAboutUs
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
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    if (showToolsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolsMenu]);

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
    <header className="sticky top-0 z-50 w-full border-b border-[#78101F]/50 bg-gradient-to-r from-[#4E040D] via-[#5E0713] to-[#4E040D] backdrop-blur-xl transition-all duration-300 shadow-2xl text-white">
      <div className="mx-auto flex items-center justify-between max-w-6xl px-3 sm:px-6 h-16 gap-2 relative">
        {/* Brand Logo & Title */}
        <div 
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="CityEve"
        >
          <motion.div 
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl overflow-hidden border border-[#D4AF37]/50 shadow-md bg-[#42030A] shrink-0"
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
            <span className="font-mono text-[9px] text-[#E8D3C0] font-bold tracking-wider leading-tight mt-0.5">
              {lang === 'ar' ? 'دليل الفعاليات والسهرات' : 'Events & Nightlife'}
            </span>
          </div>
        </div>

        {/* Center: About Us Button with White Text */}
        {onOpenAboutUs && (
          <div className="flex items-center justify-center mx-auto px-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAboutUs}
              className="flex items-center justify-center px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 text-white transition-all cursor-pointer text-xs sm:text-sm font-bold whitespace-nowrap shadow-xs backdrop-blur-sm"
              title={lang === 'ar' ? 'عن التطبيق والمنصة' : 'About Platform'}
            >
              <span className="text-white drop-shadow-xs">{lang === 'ar' ? 'من نحن' : 'About Us'}</span>
            </motion.button>
          </div>
        )}

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Language Switcher Pill */}
          <div className="flex items-center rounded-xl border border-[#78101F]/60 bg-[#3D0309]/90 p-0.5 text-xs text-white">
            <button
              onClick={() => setLang('ar')}
              className={`px-2.5 py-1 rounded-lg transition-all font-black text-[11px] sm:text-xs cursor-pointer ${
                lang === 'ar'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-[#E8D3C0] hover:text-white'
              }`}
            >
              عربي
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg transition-all font-black text-[11px] sm:text-xs cursor-pointer ${
                lang === 'en'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-[#E8D3C0] hover:text-white'
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
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#78101F]/60 bg-[#3D0309]/90 text-[#F5E6D8] hover:text-white transition-all cursor-pointer shadow-sm"
            aria-label="Notifications"
            title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 end-1.5 flex h-2 w-2 rounded-full bg-red-400 animate-ping" />
            )}
          </motion.button>

          {/* Settings & Tools Dropdown Button Wrapper */}
          <div className="relative" ref={toolsMenuRef}>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowToolsMenu(prev => !prev)}
              className={`group flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer shadow-sm ${
                showToolsMenu 
                  ? 'border-amber-400 bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20' 
                  : 'border-[#78101F]/60 bg-[#3D0309]/90 text-[#F5E6D8] hover:text-white hover:border-amber-500/50'
              }`}
              title={lang === 'ar' ? 'الإعدادات والأدوات' : 'Settings & Tools'}
            >
              {showToolsMenu ? (
                <X className="h-4 w-4 stroke-[2.5]" />
              ) : (
                <Settings className="h-4 w-4 stroke-[2.2] transition-transform duration-300 group-hover:rotate-45" />
              )}
            </motion.button>

            {/* Floating Dropdown Menu */}
            <AnimatePresence>
              {showToolsMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute end-0 top-full mt-2 w-72 sm:w-84 max-h-[min(80vh,560px)] flex flex-col rounded-2xl border-2 border-amber-400/40 bg-gradient-to-b from-[#4A030C]/98 via-[#380208]/98 to-[#240105]/98 text-white p-3 shadow-2xl backdrop-blur-2xl z-50 ring-1 ring-black/40 overflow-hidden"
                >
                  {/* Decorative ambient background glow */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-[#78101F]/30 rounded-full blur-2xl pointer-events-none" />

                  {/* Dropdown Header (Pinned at Top) */}
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#78101F]/60 mb-2 relative z-10 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        <Settings className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-black text-white tracking-wide">
                        {lang === 'ar' ? 'الإعدادات والأدوات' : 'Settings & Tools'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold">
                      CityEve
                    </span>
                  </div>

                  {/* Scrollable Content Container (Scrolls Up & Down seamlessly) */}
                  <div 
                    className="flex-1 overflow-y-auto overscroll-contain pr-1 pl-1 space-y-2.5 relative z-10 [scrollbar-width:thin] [scrollbar-color:rgba(245,158,11,0.4)_transparent]"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(245, 158, 11, 0.4) transparent'
                    }}
                  >
                    {/* Section 1: Appearance & Theme */}
                    <div className="p-2 rounded-xl bg-[#240105]/70 border border-[#78101F]/50 shadow-inner">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#E8D3C0] mb-1.5 px-1">
                        <span>{lang === 'ar' ? 'مظهر التطبيق' : 'Appearance'}</span>
                        <span className="text-[10px] text-amber-300/80 font-mono font-bold">
                          {theme === 'light' ? (lang === 'ar' ? 'نهاري' : 'Light') : theme === 'dark' ? (lang === 'ar' ? 'ليلي' : 'Dark') : (lang === 'ar' ? 'تلقائي' : 'Auto')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#180104] border border-[#78101F]/60 text-xs">
                        <button
                          onClick={() => setTheme('light')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                            theme === 'light'
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow-md'
                              : 'text-[#E8D3C0] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Sun className="h-3.5 w-3.5" />
                          <span className="text-[11px]">{lang === 'ar' ? 'نهاري' : 'Light'}</span>
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow-md'
                              : 'text-[#E8D3C0] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Moon className="h-3.5 w-3.5" />
                          <span className="text-[11px]">{lang === 'ar' ? 'ليلي' : 'Dark'}</span>
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                            theme === 'system'
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow-md'
                              : 'text-[#E8D3C0] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Monitor className="h-3.5 w-3.5" />
                          <span className="text-[11px]">{lang === 'ar' ? 'تلقائي' : 'Auto'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Section 2: Quick Tools & Actions */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-amber-400/70 uppercase tracking-wider px-1 pt-1">
                        {lang === 'ar' ? 'أدوات المنصة' : 'Platform Tools'}
                      </div>

                      {/* Share App Item */}
                      <button
                        onClick={() => {
                          handleShareApp();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left rtl:text-right transition-all hover:bg-amber-400/10 hover:border-amber-400/30 border border-transparent group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 group-hover:scale-105 transition-transform">
                            {copied ? <Check className="h-4 w-4 text-emerald-400 stroke-[3]" /> : <Share2 className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                              {copied ? (lang === 'ar' ? 'تم نسخ الرابط!' : 'Link Copied!') : (lang === 'ar' ? 'مشاركة التطبيق' : 'Share App')}
                            </div>
                            <div className="text-[10px] text-[#E8D3C0]/70">
                              {lang === 'ar' ? 'مشاركة المنصة مع الأصدقاء' : 'Share platform with friends'}
                            </div>
                          </div>
                        </div>
                        {lang === 'ar' ? (
                          <ChevronLeft className="h-3.5 w-3.5 text-[#E8D3C0]/50 group-hover:text-amber-300 group-hover:-translate-x-0.5 transition-all" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-[#E8D3C0]/50 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </button>

                      {/* Contact App Item */}
                      <button
                        onClick={() => {
                          handleContactApp();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left rtl:text-right transition-all hover:bg-amber-400/10 hover:border-amber-400/30 border border-transparent group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 group-hover:scale-105 transition-transform">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                              {lang === 'ar' ? 'مراسلة الإدارة والدعم' : 'Message Support'}
                            </div>
                            <div className="text-[10px] text-[#E8D3C0]/70">
                              {lang === 'ar' ? 'تواصل مع فريق CityEve' : 'Contact CityEve team'}
                            </div>
                          </div>
                        </div>
                        {lang === 'ar' ? (
                          <ChevronLeft className="h-3.5 w-3.5 text-[#E8D3C0]/50 group-hover:text-amber-300 group-hover:-translate-x-0.5 transition-all" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-[#E8D3C0]/50 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </button>

                      {/* Scan QR Item */}
                      <button
                        onClick={() => {
                          handleScanQrClick();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left rtl:text-right transition-all hover:bg-amber-400/10 hover:border-amber-400/30 border border-transparent group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 group-hover:scale-105 transition-transform">
                            <ScanLine className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                              {lang === 'ar' ? 'مسح باركود التذكرة' : 'Scan Ticket QR'}
                            </div>
                            <div className="text-[10px] text-[#E8D3C0]/70">
                              {lang === 'ar' ? 'التحقق من تذاكر الفعاليات' : 'Verify entry tickets'}
                            </div>
                          </div>
                        </div>
                        {lang === 'ar' ? (
                          <ChevronLeft className="h-3.5 w-3.5 text-[#E8D3C0]/50 group-hover:text-amber-300 group-hover:-translate-x-0.5 transition-all" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-[#E8D3C0]/50 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </button>

                      {/* Install App on Device Item */}
                      {onOpenInstallModal && (
                        <button
                          onClick={() => {
                            onOpenInstallModal();
                            setShowToolsMenu(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-left rtl:text-right transition-all hover:bg-amber-400/10 hover:border-amber-400/30 border border-transparent group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 group-hover:scale-105 transition-transform">
                              <Smartphone className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                                {lang === 'ar' ? 'تثبيت التطبيق على جهازك' : 'Install App on Device'}
                              </div>
                              <div className="text-[10px] text-[#E8D3C0]/70">
                                {lang === 'ar' ? 'تثبيت سريع للوصول المباشر' : 'Add to home screen'}
                              </div>
                            </div>
                          </div>
                          {lang === 'ar' ? (
                            <ChevronLeft className="h-3.5 w-3.5 text-[#E8D3C0]/50 group-hover:text-amber-300 group-hover:-translate-x-0.5 transition-all" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-[#E8D3C0]/50 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Section 3: Admin & Management (if user is admin) */}
                    {user?.isAdmin && (
                      <div className="space-y-1 pt-1 border-t border-[#78101F]/40">
                        <div className="text-[10px] font-black text-amber-400/70 uppercase tracking-wider px-1">
                          {lang === 'ar' ? 'الإدارة والتحكم' : 'Management'}
                        </div>
                        <button
                          onClick={() => {
                            if (isAdminUnlocked) {
                              setActiveTab('admin');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                              setIsAdminLockModalOpen(true);
                            }
                            setShowToolsMenu(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-left rtl:text-right transition-all bg-gradient-to-r from-amber-500/15 to-transparent hover:from-amber-500/25 border border-amber-400/30 group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-400 text-neutral-950 font-black shadow-md group-hover:scale-105 transition-transform">
                              <Crown className="h-4 w-4 stroke-[2.5]" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-amber-300 group-hover:text-amber-200 transition-colors">
                                {lang === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Control Panel'}
                              </div>
                              <div className="text-[10px] text-[#E8D3C0]/80">
                                {lang === 'ar' ? 'إدارة الإعلانات والمستخدمين' : 'Manage platform & users'}
                              </div>
                            </div>
                          </div>
                          {lang === 'ar' ? (
                            <ChevronLeft className="h-3.5 w-3.5 text-amber-300 group-hover:-translate-x-0.5 transition-all" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-amber-300 group-hover:translate-x-0.5 transition-all" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
    </header>
  );
};

