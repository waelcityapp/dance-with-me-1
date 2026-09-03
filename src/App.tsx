/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
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
import { MainHeroHeaderBanner } from './components/home/MainHeroHeaderBanner';
import { WhyBookModal } from './components/modals/WhyBookModal';
import { AboutUsPage } from './components/about/AboutUsPage';
import { Sparkles, ArrowLeft, ArrowRight, Crown, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { DanceEvent, AccountTier } from './types';

import { AdminEditEventPage } from './components/admin/AdminEditEventPage';
import { VerificationView } from './components/verification/VerificationView';
import { AttendeeCheckinHandler } from './components/verification/AttendeeCheckinHandler';

const AppContent: React.FC = () => {
  const { 
    lang, 
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

  // Handle hardware / browser back button on mobile
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    // Check if initial URL contains verification code parameter or install trigger
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verify')) {
      setActiveTab('verification');
    }
    if (
      urlParams.get('install') || 
      urlParams.get('pwa') || 
      urlParams.get('action') === 'install' ||
      window.location.hash === '#install'
    ) {
      setIsInstallOpen(true);
    }
  }, [setActiveTab]);

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

      {/* Admin Quick Action Strip Between Header and Banner */}
      {(user?.isAdmin || user?.email === 'waelvts@gmail.com') && (
        <div className="w-full bg-[#2A0206] border-b border-amber-500/30 px-3 sm:px-6 py-2 shadow-inner z-20">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold text-[#F5E6D8] truncate">
                {lang === 'ar' ? 'وضع المسؤول مفعّل' : 'Admin Mode Enabled'}
              </span>
            </div>
            
            <button
              onClick={() => {
                if (isAdminUnlocked) {
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setIsAdminLockModalOpen(true);
                }
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs sm:text-sm font-black shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border border-amber-300"
            >
              <Crown className="h-4 w-4 stroke-[2.5]" />
              <span>{lang === 'ar' ? 'لوحة التحكم والإدارة' : 'Admin Control Panel'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Hero Canvas with Curved Oval Bottom Edge */}
      {(!activeTab || activeTab === 'explore' || activeTab === 'parties' || activeTab === 'courses' || activeTab === 'trips') && (
        <div className="relative w-full">
          {/* Curved Hero Section matching logo velvet burgundy base with slightly lighter, luminous gradient */}
          <div className="w-full bg-gradient-to-b from-[#6B0D18] via-[#5C0913] to-[#48040C] border-b border-[#8C1626]/60 rounded-b-[32px] sm:rounded-b-[48px] md:rounded-b-[56px] shadow-2xl shadow-black/60 pb-8 sm:pb-10 transition-colors duration-200">
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
          <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 -mt-7 sm:-mt-8 relative z-10">
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
              <div className="relative flex items-center justify-between bg-white dark:bg-neutral-900 rounded-[14px] py-2 sm:py-2.5 px-3 sm:px-4 w-full h-full shadow-xs">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 group-hover:rotate-6 transition-transform">
                    <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </div>
                  <div className="text-right min-w-0">
                    <span className="block text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-amber-500 dark:from-red-400 dark:to-amber-400 truncate">
                      {lang === 'ar' ? 'ليه تحجز من خلال التطبيق؟' : 'Why book through the app?'}
                    </span>
                    <span className="block text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 font-medium leading-tight truncate">
                      {lang === 'ar' ? 'اكتشف مميزات التذاكر الفورية والخصومات الحصرية' : 'Discover instant tickets & exclusive discounts'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shrink-0 ms-2">
                  {lang === 'ar' ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Body Content */}
      <main className={`flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pb-24 ${(!activeTab || activeTab === 'explore' || activeTab === 'parties' || activeTab === 'courses' || activeTab === 'trips') ? 'pt-2.5 sm:pt-3' : 'pt-4'}`}>
        {activeTab === 'verification' ? (
          <VerificationView />
        ) : activeTab === 'about_us' ? (
          <AboutUsPage />
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
            {activeTab === 'admin' && <AdminPanel />}
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
      <MapModal
        event={selectedMapEvent}
        onClose={() => setSelectedMapEvent(null)}
      />

      <ShareModal
        event={selectedShareEvent}
        onClose={() => setSelectedShareEvent(null)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      <PersonalNotificationsModal
        isOpen={isPersonalNotifOpen}
        onClose={() => setIsPersonalNotifOpen(false)}
      />

      <PwaInstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

      <GuestAlertModal
        isOpen={guestAlertState.isOpen}
        reason={guestAlertState.reason}
        onClose={closeGuestAlert}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={closeSupportModal}
      />

      <WhyBookModal
        isOpen={isWhyBookOpen}
        onClose={() => setIsWhyBookOpen(false)}
      />

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

