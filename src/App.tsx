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
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { DanceEvent } from './types';

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
    setSelectedViewsEvent
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
      />

      {/* Top Hero Canvas with Curved Oval Bottom Edge */}
      {(!activeTab || activeTab === 'explore') && (
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
          <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 -mt-8 sm:-mt-10 relative z-10">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsWhyBookOpen(true)}
              className="relative rounded-2xl p-[1.5px] cursor-pointer group overflow-hidden shadow-xl shadow-neutral-900/15 dark:shadow-black/40"
            >
              {/* Continuous subtle spinning gradient */}
              <div 
                className="absolute inset-[-100%] animate-[spin_5s_linear_infinite] opacity-75 group-hover:opacity-100 transition-opacity duration-500 blur-[2px]"
                style={{
                  background: 'conic-gradient(from 0deg, #ef4444, #f59e0b, #ec4899, #ef4444)'
                }} 
              />
              
              {/* Inner Content */}
              <div className="relative flex items-center justify-between bg-white dark:bg-neutral-900 rounded-[14px] p-3.5 sm:p-4 w-full h-full shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 group-hover:rotate-6 transition-transform">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-amber-500 dark:from-red-400 dark:to-amber-400">
                      {lang === 'ar' ? 'ليه تحجز من خلال التطبيق؟' : 'Why book through the app?'}
                    </span>
                    <span className="block text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 font-medium mt-0.5">
                      {lang === 'ar' ? 'اكتشف مميزات التذاكر الفورية والخصومات الحصرية' : 'Discover instant tickets & exclusive discounts'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all shrink-0">
                  {lang === 'ar' ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Body Content */}
      <main className={`flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pb-24 ${(!activeTab || activeTab === 'explore') ? 'pt-6 sm:pt-7' : 'pt-5'}`}>
        {activeTab === 'verification' ? (
          <VerificationView />
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
            {activeTab !== 'profile' && activeTab !== 'create_ad' && activeTab !== 'admin' && activeTab !== 'edit_ad_admin' && (
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

