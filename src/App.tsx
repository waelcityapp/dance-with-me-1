/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
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
import { AdminPanel } from './components/admin/AdminPanel';
import { DanceEvent } from './types';

import { AdminEditEventPage } from './components/admin/AdminEditEventPage';
import { VerificationView } from './components/verification/VerificationView';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, user, openGuestAlert, guestAlertState, closeGuestAlert, isSupportModalOpen, closeSupportModal, setEditingEvent, editingEvent } = useApp();

  // Modal States
  const [selectedMapEvent, setSelectedMapEvent] = useState<DanceEvent | null>(null);
  const [selectedShareEvent, setSelectedShareEvent] = useState<DanceEvent | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPersonalNotifOpen, setIsPersonalNotifOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  const handleOpenCreateAd = () => {
    if (!user) {
      openGuestAlert('post_ad');
    } else {
      setEditingEvent(null);
      setActiveTab('create_ad');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
      {/* Sticky Luxury Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenInstallModal={() => setIsInstallOpen(true)}
      />

      {/* Main Body Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-5 pb-24">
        {new URLSearchParams(window.location.search).get('verify') ? (
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
                onComplete={() => {
                  setActiveTab('explore');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCancel={() => {
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

      <AdminLockModal />
      <BookingModal />
      <CustomAlertModal />
      <CustomConfirmModal />
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

