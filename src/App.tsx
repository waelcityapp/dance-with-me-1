/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/navbar/Header';
import { BottomNav } from './components/navbar/BottomNav';
import { HomeFeed } from './components/home/HomeFeed';
import { ProfileView } from './components/profile/ProfileView';
import { CreateEventPage } from './components/events/CreateEventPage';
import { MapModal } from './components/modals/MapModal';
import { ShareModal } from './components/modals/ShareModal';
import { AuthModal } from './components/modals/AuthModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { PersonalNotificationsModal } from './components/modals/PersonalNotificationsModal';
import { PwaInstallModal } from './components/modals/PwaInstallModal';
import { GuestAlertModal } from './components/modals/GuestAlertModal';
import { SupportModal } from './components/modals/SupportModal';
import { AdminLockModal } from './components/modals/AdminLockModal';
import { BookingModal } from './components/modals/BookingModal';
import { CustomAlertModal } from './components/modals/CustomAlertModal';
import { CustomConfirmModal } from './components/modals/CustomConfirmModal';
import { PushPermissionPrompt } from './components/pwa/PushPermissionPrompt';
import { FloatingNotificationBanner } from './components/pwa/FloatingNotificationBanner';
import { AdViewsDetailsModal } from './components/modals/AdViewsDetailsModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { MarketersManagement } from './components/admin/MarketersManagement';
import { MarketerWalletPage } from './components/marketer/MarketerWalletPage';
import { MainHeroHeaderBanner } from './components/home/MainHeroHeaderBanner';
import { WhyBookModal } from './components/modals/WhyBookModal';
import { AboutUsPage } from './components/about/AboutUsPage';
import { Megaphone, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { DanceEvent, AccountTier, DanceCategory } from './types';

import { AdminEditEventPage } from './components/admin/AdminEditEventPage';
import { VerificationView } from './components/verification/VerificationView';
import { AttendeeCheckinHandler } from './components/verification/AttendeeCheckinHandler';

const AppContent: React.FC = () => {
  const { 
    lang, 
    setLang,
    setSelectedCategory,
    activeTab, 
    setActiveTab, 
    user, 
    openGuestAlert, 
    guestAlertState, 
    closeGuestAlert, 
    isSupportModalOpen, 
    closeSupportModal, 
    setEditingEvent, 
    editingEvent,
    feedViewMode,
    activePushToast,
    setActivePushToast,
    selectedViewsEvent,
    setSelectedViewsEvent,
    isAdminUnlocked,
    setIsAdminLockModalOpen
  } = useApp();

  const [adminWorkspace, setAdminWorkspace] = useState<'main' | 'marketers'>('main');
  const [marketersGridTarget, setMarketersGridTarget] = useState<HTMLElement | null>(null);
  const [marketerWalletOpen, setMarketerWalletOpen] = useState(false);

  // Handle hardware / browser back button on mobile
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    // Check if initial URL contains verification code parameter or install trigger
    const urlParams = new URLSearchParams(window.location.search);
    const requestedLang = urlParams.get('lang');
    if (requestedLang === 'ar' || requestedLang === 'en') {
      setLang(requestedLang);
    }
    const requestedCategory = urlParams.get('category') as DanceCategory | null;
    const validCategories: DanceCategory[] = ['all', 'party', 'course', 'trip', 'exhibition', 'services', 'jobs'];
    if (requestedCategory && validCategories.includes(requestedCategory)) {
      setSelectedCategory(requestedCategory);
      setActiveTab('explore');
    }
    if (urlParams.get('verify')) {
      setActiveTab('verification');
    }
    if (urlParams.get('event')) {
      setActiveTab('explore');
    }
    if (
      urlParams.get('install') || 
      urlParams.get('pwa') || 
      urlParams.get('action') === 'install' ||
      window.location.hash === '#install'
    ) {
      setIsInstallOpen(true);
    }
  }, [setActiveTab, setLang, setSelectedCategory]);

  useEffect(() => {
    const openWallet = () => {
      setMarketerWalletOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('OPEN_MARKETER_WALLET', openWallet);
    return () => window.removeEventListener('OPEN_MARKETER_WALLET', openWallet);
  }, []);

  useEffect(() => {
    if (activeTab !== 'profile' && marketerWalletOpen) {
      setMarketerWalletOpen(false);
    }
  }, [activeTab, marketerWalletOpen]);

  useEffect(() => {
    if (activeTab !== 'admin' && adminWorkspace !== 'main') {
      setAdminWorkspace('main');
    }
  }, [activeTab, adminWorkspace]);

  useEffect(() => {
    if (activeTab !== 'admin' || adminWorkspace !== 'main' || !user?.isAdmin) {
      setMarketersGridTarget(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const locateModulesGrid = () => {
      if (cancelled) return;
      const headings = Array.from(document.querySelectorAll('h3'));
      const heading = headings.find((node) => {
        const text = node.textContent?.trim() || '';
        return text === 'أقسام ووحدات التحكم' || text === 'Control Modules';
      });
      const section = heading?.parentElement?.parentElement;
      const grid = section ? Array.from(section.children).find((el) => el.classList.contains('grid')) as HTMLElement | undefined : undefined;
      if (grid) {
        setMarketersGridTarget(grid);
        const countLabel = heading?.parentElement?.querySelector('span');
        if (countLabel) {
          countLabel.textContent = lang === 'ar' ? '12 وحدة متكاملة' : '12 Modules';
        }
        return;
      }
      attempts += 1;
      if (attempts < 20) window.setTimeout(locateModulesGrid, 100);
    };

    window.setTimeout(locateModulesGrid, 0);
    return () => {
      cancelled = true;
    };
  }, [activeTab, adminWorkspace, user?.isAdmin, lang]);

  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== 'explore') {
        setActiveTab('explore');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab, setActiveTab]);

  // Modal States
  const [selectedMapEvent, setSelectedMapEvent] = useState<DanceEvent | null>(null);
  const [selectedShareEvent, setSelectedShareEvent] = useState<DanceEvent | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPersonalNotifOpen, setIsPersonalNotifOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isWhyBookOpen, setIsWhyBookOpen] = useState(false);
  const [createAdInitialType, setCreateAdInitialType] = useState<'vip' | 'standard' | 'free' | null>(null);

  const handleOpenCreateAd = (type?: 'vip' | 'standard' | 'free' | null) => {
    if (!user) {
      openGuestAlert('post_ad');
    } else {
      setEditingEvent(null);
      setCreateAdInitialType(type || null);
      setActiveTab('create_ad');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const marketersModuleCard = marketersGridTarget ? createPortal(
    <motion.div
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => {
        setAdminWorkspace('marketers');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/70 dark:hover:border-orange-400/60 bg-white dark:bg-neutral-900 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group h-auto min-h-[96px] sm:min-h-[108px]"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 bg-orange-500/10 text-orange-500">
          <Megaphone className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md leading-tight bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300">
          {lang === 'ar' ? 'تسويق' : 'MARKETING'}
        </span>
      </div>
      <div className="mt-2">
        <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-tight">
          {lang === 'ar' ? 'قسم المسوقين' : 'Marketers Section'}
        </h4>
        <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
          {lang === 'ar' ? 'البحث عن المسوقين وتفعيل أو إيقاف الحسابات' : 'Search, activate & pause marketer accounts'}
        </p>
      </div>
      <div className="mt-1 flex items-center justify-end text-[10px] font-black text-orange-600 dark:text-orange-400 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>{lang === 'ar' ? 'فتح ➔' : 'Open ➔'}</span>
      </div>
    </motion.div>,
    marketersGridTarget
  ) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-600 dark:selection:text-amber-300 transition-colors duration-200">
      {/* Sticky Luxury Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenInstallModal={() => setIsInstallOpen(true)}
        onOpenAboutUs={() => {
          setActiveTab('about_us');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Top Hero Canvas with Curved Oval Bottom Edge */}
      {(!activeTab || activeTab === 'explore' || activeTab === 'parties' || activeTab === 'courses' || activeTab === 'trips') && (
        <div className="relative w-full">
          {/* Curved Hero Section starting with header beige (#FBF3E2) and fading downwards */}
          <div className="w-full bg-gradient-to-b from-[#FBF3E2] via-[#8C1626] to-transparent dark:to-neutral-950/0 border-b border-[#D4AF37]/30 rounded-b-[32px] sm:rounded-b-[48px] md:rounded-b-[56px] shadow-xl pb-8 sm:pb-10 transition-colors duration-200">
            <MainHeroHeaderBanner
              onExploreClick={() => {
                const el = document.getElementById('search-section') || document.getElementById('events-feed');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }
              }}
              onPostAdClick={() => handleOpenCreateAd()}
            />
          </div>

          {/* Why Book Container - Overlapping the curved oval blue edge */}
          <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 -mt-8 sm:-mt-9 relative z-10">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsWhyBookOpen(true)}
              className="relative rounded-2xl p-[1.5px] cursor-pointer group overflow-hidden shadow-md shadow-neutral-900/10 dark:shadow-black/30"
            >
              {/* Continuous subtle spinning gradient */}
              <div 
                className="absolute inset-[-100%] animate-[spin_5s_linear_infinite] opacity-75 group-hover:opacity-100 transition-opacity duration-500 blur-[2px]"
                style={{
                  background: 'conic-gradient(from 0deg, #ef4444, #f59e0b, #ec4899, #ef4444)'
                }} 
              /> 
              {/* Inner Content */}
              <div className="relative flex items-center justify-between bg-white dark:bg-neutral-900 rounded-[14px] py-1.5 sm:py-2 px-2.5 sm:px-3.5 w-full h-full shadow-xs">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 group-hover:rotate-6 transition-transform">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="text-right min-w-0">
                    <span className="block text-[11px] sm:text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-amber-500 dark:from-red-400 dark:to-amber-400 truncate">
                      {lang === 'ar' ? 'ليه تحجز من خلال التطبيق؟' : 'Why book through the app?'}
                    </span>
                    <span className="block text-[10px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-tight truncate">
                      {lang === 'ar' ? 'اكتشف مميزات التذاكر الفورية والخصومات الحصرية' : 'Discover instant tickets & exclusive discounts'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shrink-0 ms-2">
                  {lang === 'ar' ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Body Content */}
      <main className={`flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 pb-20 ${(!activeTab || activeTab === 'explore' || activeTab === 'parties' || activeTab === 'courses' || activeTab === 'trips') ? 'pt-1.5 sm:pt-2' : 'pt-2.5'}`}>
        {activeTab === 'verification' ? (
          <VerificationView />
        ) : activeTab === 'about_us' ? (
          <AboutUsPage />
        ) : marketerWalletOpen ? (
          <MarketerWalletPage onBack={() => {
            setMarketerWalletOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} />
        ) : (
          <>
            {activeTab === 'profile' && (
              <ProfileView
                onOpenCreateModal={handleOpenCreateAd}
                onOpenAuth={() => setIsAuthOpen(true)}
                onOpenMap={(ev) => setSelectedMapEvent(ev)}
                onOpenShare={(ev) => setSelectedShareEvent(ev)}
              />
            )}
            {activeTab === 'create_ad' && (
              <CreateEventPage
                key={createAdInitialType || 'create_ad'}
                initialAdType={createAdInitialType}
                onComplete={() => {
                  setCreateAdInitialType(null);
                  setActiveTab('explore');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCancel={() => {
                  setCreateAdInitialType(null);
                  setActiveTab('explore');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
            {activeTab === 'admin' && (
              adminWorkspace === 'marketers' ? (
                <MarketersManagement onBack={() => setAdminWorkspace('main')} />
              ) : (
                <>
                  <AdminPanel />
                  {marketersModuleCard}
                </>
              )
            )}
            {activeTab === 'edit_ad_admin' && (
              <AdminEditEventPage
                key={editingEvent?.id || 'edit_ad'}
                onComplete={() => {
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCancel={() => {
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
            {activeTab !== 'profile' && activeTab !== 'create_ad' && activeTab !== 'admin' && activeTab !== 'edit_ad_admin' && activeTab !== 'about_us' && (
              <HomeFeed
                onOpenMap={(ev) => setSelectedMapEvent(ev)}
                onOpenShare={(ev) => setSelectedShareEvent(ev)}
                onOpenCreate={handleOpenCreateAd}
                onOpenInstallModal={() => setIsInstallOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* iOS-Style Floating Bottom Navigation Bar */}
      <BottomNav onOpenPersonalNotifications={() => setIsPersonalNotifOpen(true)} />

      {/* Interactive Modals */}
      <MapModal event={selectedMapEvent} onClose={() => setSelectedMapEvent(null)} />
      <ShareModal event={selectedShareEvent} onClose={() => setSelectedShareEvent(null)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <PersonalNotificationsModal isOpen={isPersonalNotifOpen} onClose={() => setIsPersonalNotifOpen(false)} />
      <PwaInstallModal isOpen={isInstallOpen} onClose={() => setIsInstallOpen(false)} />
      <GuestAlertModal isOpen={guestAlertState.isOpen} reason={guestAlertState.reason} onClose={closeGuestAlert} onOpenAuth={() => setIsAuthOpen(true)} />
      <SupportModal isOpen={isSupportModalOpen} onClose={closeSupportModal} />
      <WhyBookModal isOpen={isWhyBookOpen} onClose={() => setIsWhyBookOpen(false)} />
      <AdminLockModal />
      <BookingModal />
      <CustomAlertModal />
      <CustomConfirmModal />
      <PushPermissionPrompt />
      <FloatingNotificationBanner 
        notification={activePushToast} 
        onClose={() => setActivePushToast(null)} 
        onOpenNotification={(notif) => {
          if (notif.relatedEventId || notif.targetEventId) {
            window.location.search = `?event=${notif.relatedEventId || notif.targetEventId}`;
          }
        }}
      />
      {user?.isAdmin && (
        <AdViewsDetailsModal
          isOpen={!!selectedViewsEvent}
          event={selectedViewsEvent}
          onClose={() => setSelectedViewsEvent(null)}
          onShare={(ev) => setSelectedShareEvent(ev)}
        />
      )}
      <AttendeeCheckinHandler />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
