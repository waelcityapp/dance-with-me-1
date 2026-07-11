import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { DanceCategory, DanceEvent, Language, NotificationItem, TabType, ThemeMode, UserProfile, SupportMessage, DanceStyle } from '../types';
import { isEventExpired } from '../utils/dateUtils';
import { DEFAULT_NEUTRAL_AVATAR } from '../utils/avatars';
import confetti from 'canvas-confetti';
import {
  auth,
  getUserByEmailFromFirestore,
  subscribeToEvents,
  subscribeToNotifications,
  subscribeToSupportMessages,
  saveEventToFirestore,
  deleteEventFromFirestore,
  saveUserToFirestore,
  saveNotificationToFirestore,
  saveSupportMessageToFirestore,
  checkAndSeedEvents,
  isValidMediaUrl,
  cleanUpImagelessAndDuplicateAds,
  logoutWithFirebase,
  checkAndSeedAppAssets,
  updateAppAssets,
  subscribeToAppAssets,
  logAnalyticsEvent
} from '../lib/firebase';

export type GuestAlertReason = 'contact' | 'post_ad' | 'book' | 'favorite' | 'default';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedCategory: DanceCategory;
  setSelectedCategory: (cat: DanceCategory) => void;
  events: DanceEvent[];
  activeEvents: DanceEvent[];
  expiredEvents: DanceEvent[];
  showExpiredArchive: boolean;
  setShowExpiredArchive: (show: boolean) => void;
  user: UserProfile | null;
  loginUser: (name: string, email: string, avatar?: string, customId?: string, password?: string) => void | Promise<void>;
  logoutUser: () => void;
  updateUserFavorites: (styles: any[]) => void;
  updateUserAvatar: (avatar: string) => void;
  updateUserProfile: (name: string, phone: string, favoriteStyles: DanceStyle[]) => void;
  toggleLikeEvent: (eventId: string, eventElement?: HTMLElement) => void;
  bookTicket: (eventId: string) => void;
  addNewEvent: (newEv: Omit<DanceEvent, 'id' | 'likesCount' | 'uploadDate'>) => void;
  updateEvent: (updatedEv: DanceEvent) => void;
  deleteEvent: (eventId: string) => void;
  togglePauseEvent: (eventId: string) => void;
  updateEventPosition: (eventId: string, position: number) => void;
  editingEvent: DanceEvent | null;
  setEditingEvent: (ev: DanceEvent | null) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markAllNotificationsAsRead: () => void;
  pushEnabled: boolean;
  togglePushNotifications: () => void;
  openGuestAlert: (reason?: GuestAlertReason) => void;
  closeGuestAlert: () => void;
  guestAlertState: { isOpen: boolean; reason: GuestAlertReason };
  supportMessages: SupportMessage[];
  sendSupportMessage: (messageText: string) => Promise<{ refNumber: string; msgId: string }>;
  replyToSupportMessage: (msgId: string, replyText: string) => Promise<boolean>;
  openSupportModal: () => void;
  closeSupportModal: () => void;
  isSupportModalOpen: boolean;
  cleanUpDuplicateAds: () => Promise<number>;
  isAdminUnlocked: boolean;
  setIsAdminUnlocked: (val: boolean) => void;
  isAdminLockModalOpen: boolean;
  setIsAdminLockModalOpen: (val: boolean) => void;
  appAssets: any;
  updateBrandingAssets: (assets: any) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EVENTS: 'dwm_events_v1',
  USER: 'dwm_user_v1',
  NOTIFICATIONS: 'dwm_notifs_v1',
  LANG: 'dwm_lang_v1',
  PUSH: 'dwm_push_v1',
  THEME: 'dwm_theme_v1',
  SUPPORT_MESSAGES: 'dwm_support_msgs_v1'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'dark';
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isAdminLockModalOpen, setIsAdminLockModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('explore');

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    logAnalyticsEvent(`tab_${tab}`);
  };

  // Automatically switch tab and close modal once unlocked to prevent race conditions
  useEffect(() => {
    if (isAdminUnlocked) {
      setActiveTab('admin');
      setIsAdminLockModalOpen(false);
    }
  }, [isAdminUnlocked]);

  const [selectedCategory, setSelectedCategory] = useState<DanceCategory>('all');
  const [showExpiredArchive, setShowExpiredArchive] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.PUSH) === 'true';
  });

  const [guestAlertState, setGuestAlertState] = useState<{ isOpen: boolean; reason: GuestAlertReason }>({
    isOpen: false,
    reason: 'default'
  });

  const openGuestAlert = (reason: GuestAlertReason = 'default') => {
    setGuestAlertState({ isOpen: true, reason });
  };

  const closeGuestAlert = () => {
    setGuestAlertState(prev => ({ ...prev, isOpen: false }));
  };

  // Events in state
  const [events, setEvents] = useState<DanceEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load events from storage');
    }
    return [];
  });

  const [editingEvent, setEditingEvent] = useState<DanceEvent | null>(null);

  // User state
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.avatar && parsed.avatar.includes('unsplash.com/photo-')) {
          parsed.avatar = DEFAULT_NEUTRAL_AVATAR;
        }
        return parsed;
      }
    } catch (e) {}
    return null;
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Support Messages & Modal
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPORT_MESSAGES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const openSupportModal = () => setIsSupportModalOpen(true);
  const closeSupportModal = () => setIsSupportModalOpen(false);

  // App Assets / Branding state loaded from Firestore with fallback to default paths
  const [appAssets, setAppAssets] = useState<any>(() => {
    return {
      id: 'current_branding',
      app_icon_url: '/icon.svg',
      app_logo_url: '/logo.svg',
      appNameAr: 'Dance With Me',
      appNameEn: 'Dance With Me',
      whatsappSupport: '201012345678',
      instagramUrl: 'https://instagram.com/dancewithme_luxury'
    };
  });

  const updateBrandingAssets = async (newAssets: any): Promise<boolean> => {
    const success = await updateAppAssets(newAssets);
    if (success) {
      setAppAssets((prev: any) => ({ ...prev, ...newAssets }));
    }
    return success;
  };

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (e) {}
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPORT_MESSAGES, JSON.stringify(supportMessages));
    } catch (e) {}
  }, [supportMessages]);

  // Connect to Firebase Firestore Database for real-time synchronization
  useEffect(() => {
    // Log app loads / page views
    logAnalyticsEvent('total_page_views');

    // Track unique sessions per day using localStorage
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastSessionDate = localStorage.getItem('dwm_session_date');
      if (lastSessionDate !== todayStr) {
        localStorage.setItem('dwm_session_date', todayStr);
        logAnalyticsEvent('unique_sessions');
      }
    } catch (e) {}

    // 1. Check and seed initial data if Firestore database is empty
    checkAndSeedEvents([]);
    checkAndSeedAppAssets().then((seeded) => {
      if (seeded) setAppAssets(seeded);
    });

    // 2. Subscribe to live events collection
    const unsubEvents = subscribeToEvents((liveEvents) => {
      setEvents(liveEvents || []);
    });

    // 2b. Subscribe to live app assets collection
    const unsubAssets = subscribeToAppAssets((liveAssets) => {
      if (liveAssets) setAppAssets(liveAssets);
    });

    // 3. Subscribe to live notifications collection
    const unsubNotifs = subscribeToNotifications((liveNotifs) => {
      setNotifications(liveNotifs || []);
    });

    // 4. Subscribe to live support messages collection
    const unsubSupport = subscribeToSupportMessages((liveMsgs) => {
      setSupportMessages(liveMsgs || []);
    });

    // 5. Listen to Firebase Auth state changes for session persistence across reloads
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const adminEmail = ((import.meta as any).env.VITE_ADMIN_EMAIL?.trim().toLowerCase()) || 'waelvts@gmail.com';
        const isUserAdmin = firebaseUser.email.trim().toLowerCase() === adminEmail;
        const existing = await getUserByEmailFromFirestore(firebaseUser.email);
        if (existing) {
          if (existing.isSuspended) {
            console.warn('Authenticated user is suspended. Signing out.');
            await logoutWithFirebase();
            setUser(null);
            try {
              localStorage.removeItem(STORAGE_KEYS.USER);
            } catch (e) {}
            alert(lang === 'ar' ? '⚠️ هذا الحساب معطل مؤقتاً من قبل الإدارة.' : '⚠️ This account is temporarily suspended by the administration.');
            return;
          }
          if (isUserAdmin || existing.isAdmin) {
            existing.isAdmin = true;
          }
          setUser(existing);
          try {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(existing));
          } catch (e) {}
        } else {
          try {
            const saved = localStorage.getItem(STORAGE_KEYS.USER);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.email?.toLowerCase() === firebaseUser.email.toLowerCase()) {
                if (parsed.isSuspended) {
                  await logoutWithFirebase();
                  setUser(null);
                  localStorage.removeItem(STORAGE_KEYS.USER);
                  return;
                }
                if (isUserAdmin) {
                  parsed.isAdmin = true;
                }
                setUser(parsed);
              }
            }
          } catch (e) {}
        }
      } else {
        // If there's no active Firebase user, we DO NOT clear the localStorage session.
        // This is crucial in iframe environments (like AI Studio previews) where
        // Firebase Auth is often blocked from accessing third-party storage/IndexedDB,
        // and would otherwise repeatedly log the user out on every page reload.
        console.log('Firebase Auth state changed to null. Keeping LocalStorage session if active.');
      }
    });

    return () => {
      unsubEvents();
      unsubAssets();
      unsubNotifs();
      unsubSupport();
      unsubAuth();
    };
  }, []);

  // Update HTML direction and language
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  }, [lang]);

  // Update Theme mode (light / dark / system)
  useEffect(() => {
    const applyTheme = () => {
      let isDark = true;
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  // Filter active vs expired by eventDate (end of event day) and filter out imageless/duplicate clutter
  const activeEvents = useMemo(() => {
    const seen = new Set<string>();
    const isAdminUser = user?.isAdmin;
    const filtered = events.filter(ev => {
      if (ev.isPaused && !isAdminUser) return false;
      const expired = ev.isExpiredBy15DaysRule || isEventExpired(ev.eventDate);
      const hasImg = isValidMediaUrl(ev.mediaUrl) || isValidMediaUrl(ev.thumbnailUrl);
      const key = `${ev.titleAr?.trim()}_${ev.descriptionAr?.trim()}_${ev.eventDate}`;
      if (expired || !hasImg || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return [...filtered].sort((a, b) => {
      const posA = a.position !== undefined && a.position !== null ? a.position : 999999;
      const posB = b.position !== undefined && b.position !== null ? b.position : 999999;
      if (posA !== posB) {
        return posA - posB;
      }
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    });
  }, [events, user]);

  const expiredEvents = useMemo(() => {
    const seen = new Set<string>();
    const isAdminUser = user?.isAdmin;
    const filtered = events.filter(ev => {
      if (ev.isPaused && !isAdminUser) return false;
      const expired = ev.isExpiredBy15DaysRule || isEventExpired(ev.eventDate);
      const hasImg = isValidMediaUrl(ev.mediaUrl) || isValidMediaUrl(ev.thumbnailUrl);
      const key = `${ev.titleAr?.trim()}_${ev.descriptionAr?.trim()}_${ev.eventDate}`;
      if (!expired || !hasImg || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return [...filtered].sort((a, b) => {
      const posA = a.position !== undefined && a.position !== null ? a.position : 999999;
      const posB = b.position !== undefined && b.position !== null ? b.position : 999999;
      if (posA !== posB) {
        return posA - posB;
      }
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    });
  }, [events, user]);

  const cleanUpDuplicateAds = async (): Promise<number> => {
    const count = await cleanUpImagelessAndDuplicateAds();
    setEvents(prev => {
      const seen = new Set<string>();
      return prev.filter(ev => {
        const hasImg = isValidMediaUrl(ev.mediaUrl) || isValidMediaUrl(ev.thumbnailUrl);
        const key = `${ev.titleAr?.trim()}_${ev.descriptionAr?.trim()}_${ev.eventDate}`;
        if (!hasImg || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
    return count;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Actions
  const loginUser = async (name: string, email: string, avatar?: string, customId?: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = ((import.meta as any).env.VITE_ADMIN_EMAIL?.trim().toLowerCase()) || 'waelvts@gmail.com';
    const isUserAdmin = cleanEmail === adminEmail;
    const existing = await getUserByEmailFromFirestore(cleanEmail);
    if (existing) {
      if (existing.isSuspended) {
        const err = new Error(lang === 'ar' ? 'هذا الحساب معطل مؤقتاً من قبل الإدارة' : 'This account is temporarily suspended by the administration.');
        (err as any).code = 'auth/user-suspended';
        throw err;
      }
      const restored: UserProfile = {
        ...existing,
        name: name || existing.name || 'VIP Member',
        avatar: avatar || existing.avatar || DEFAULT_NEUTRAL_AVATAR,
        isAdmin: isUserAdmin || existing.isAdmin ? true : false
      };
      if (password) {
        restored.password = password;
      }
      setUser(restored);
      saveUserToFirestore(restored);
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email?.toLowerCase() === cleanEmail) {
          const restored: UserProfile = {
            ...parsed,
            name: name || parsed.name || 'VIP Member',
            avatar: avatar || parsed.avatar || DEFAULT_NEUTRAL_AVATAR,
            isAdmin: isUserAdmin ? true : parsed.isAdmin
          };
          if (password) {
            restored.password = password;
          }
          setUser(restored);
          saveUserToFirestore(restored);
          return;
        }
      }
    } catch (e) {}

    const newUser: UserProfile = {
      id: customId || `user-${Date.now()}`,
      name: name || 'VIP Member',
      email: cleanEmail,
      phone: '+201000000000',
      avatar: avatar || DEFAULT_NEUTRAL_AVATAR,
      favoriteStyles: ['Salsa', 'Bachata'],
      likedEventIds: [],
      bookedEventIds: [],
      isAdmin: isUserAdmin,
      createdAt: new Date().toISOString()
    };
    if (password) {
      newUser.password = password;
    }
    setUser(newUser);
    saveUserToFirestore(newUser);
  };

  const updateUserAvatar = (avatar: string) => {
    if (!user) return;
    const updated = { ...user, avatar };
    setUser(updated);
    saveUserToFirestore(updated);
  };

  const logoutUser = () => {
    setUser(null);
    logoutWithFirebase().catch(e => console.error('Error during logout:', e));
  };

  const updateUserFavorites = (styles: any[]) => {
    if (!user) return;
    const updated = { ...user, favoriteStyles: styles };
    setUser(updated);
    saveUserToFirestore(updated);
  };

  const updateUserProfile = (name: string, phone: string, favoriteStyles: DanceStyle[]) => {
    if (!user) return;
    const updated = { ...user, name, phone, favoriteStyles };
    setUser(updated);
    saveUserToFirestore(updated);
  };

  const toggleLikeEvent = (eventId: string, eventElement?: HTMLElement) => {
    if (!user) {
      openGuestAlert('favorite');
      return;
    }
    // Fire celebratory confetti!
    if (eventElement) {
      const rect = eventElement.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { x, y },
          colors: ['#f59e0b', '#fbbf24', '#ef4444', '#ffffff']
        });
      } catch (e) {}
    } else {
      try {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ef4444']
        });
      } catch (e) {}
    }

    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const isLiked = user?.likedEventIds.includes(eventId);
        const updatedEv = {
          ...ev,
          likesCount: isLiked ? Math.max(0, ev.likesCount - 1) : ev.likesCount + 1
        };
        saveEventToFirestore(updatedEv);
        return updatedEv;
      }
      return ev;
    }));

    if (user) {
      const isLiked = user.likedEventIds.includes(eventId);
      const updatedLikes = isLiked
        ? user.likedEventIds.filter(id => id !== eventId)
        : [...user.likedEventIds, eventId];
      const updatedUser = { ...user, likedEventIds: updatedLikes };
      setUser(updatedUser);
      saveUserToFirestore(updatedUser);
    }
  };

  const bookTicket = (eventId: string) => {
    if (!user) {
      openGuestAlert('book');
      return;
    }
    try {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#10b981', '#fbbf24', '#ffffff']
      });
    } catch (e) {}

    if (user) {
      if (!user.bookedEventIds.includes(eventId)) {
        const updatedUser = {
          ...user,
          bookedEventIds: [...user.bookedEventIds, eventId]
        };
        setUser(updatedUser);
        saveUserToFirestore(updatedUser);
      }
    }

    // Add confirmation notification
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      const newNotif: NotificationItem = {
        id: `notif-book-${Date.now()}`,
        titleAr: '🎉 تم تأكيد حجزك في الفعالية!',
        titleEn: '🎉 Event Booking Confirmed!',
        messageAr: `تم حجز تذكرتك في "${ev.titleAr}". يرجى التواصل مع المنظم على الواتساب لتأكيد الدفع والاستلام.`,
        messageEn: `Your booking for "${ev.titleEn}" is recorded. Please contact organizer via WhatsApp to finalize tickets.`,
        date: new Date().toISOString(),
        read: false,
        type: 'new_party',
        relatedEventId: eventId
      };
      setNotifications(prev => [newNotif, ...prev]);
      saveNotificationToFirestore(newNotif);
    }
  };

  const addNewEvent = (newEv: Omit<DanceEvent, 'id' | 'likesCount' | 'uploadDate'>) => {
    if (!user) {
      openGuestAlert('post_ad');
      return;
    }
    const createdEvent: DanceEvent = {
      ...newEv,
      id: `ev-${Date.now()}`,
      likesCount: 1,
      uploadDate: new Date().toISOString()
    };
    setEvents(prev => [createdEvent, ...prev]);
    saveEventToFirestore(createdEvent);

    // Send a notification to all subscribers
    const newNotif: NotificationItem = {
      id: `notif-new-${Date.now()}`,
      titleAr: `🔥 إعلان جديد: ${createdEvent.titleAr}`,
      titleEn: `🔥 New Announcement: ${createdEvent.titleEn}`,
      messageAr: createdEvent.descriptionAr.slice(0, 100) + '...',
      messageEn: createdEvent.descriptionEn.slice(0, 100) + '...',
      date: new Date().toISOString(),
      read: false,
      type: 'new_party',
      relatedEventId: createdEvent.id
    };
    setNotifications(prev => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif);
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    deleteEventFromFirestore(eventId);
  };

  const togglePauseEvent = (eventId: string) => {
    setEvents(prev => {
      const updated = prev.map(ev => {
        if (ev.id === eventId) {
          const newEv = { ...ev, isPaused: !ev.isPaused };
          saveEventToFirestore(newEv);
          return newEv;
        }
        return ev;
      });
      return updated;
    });
  };

  const updateEventPosition = (eventId: string, position: number) => {
    setEvents(prev => {
      const updated = prev.map(ev => {
        if (ev.id === eventId) {
          const newEv = { ...ev, position };
          saveEventToFirestore(newEv);
          return newEv;
        }
        return ev;
      });
      return updated;
    });
  };

  const updateEvent = (updatedEv: DanceEvent) => {
    setEvents(prev => prev.map(ev => ev.id === updatedEv.id ? updatedEv : ev));
    saveEventToFirestore(updatedEv);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      updated.forEach(n => saveNotificationToFirestore(n));
      return updated;
    });
  };

  const togglePushNotifications = () => {
    const nextVal = !pushEnabled;
    setPushEnabled(nextVal);
    localStorage.setItem(STORAGE_KEYS.PUSH, nextVal ? 'true' : 'false');
    if (nextVal) {
      try {
        if ('Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission();
        }
      } catch (e) {}
    }
  };

  const sendSupportMessage = async (messageText: string): Promise<{ refNumber: string; msgId: string }> => {
    if (!user) {
      openGuestAlert('contact');
      throw new Error('User not logged in');
    }
    const refNumber = `#DWM-${Math.floor(100000 + Math.random() * 900000)}`;
    const msgId = `sup_${Date.now()}`;
    const newMsg: SupportMessage = {
      id: msgId,
      refNumber,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '01000000000',
      userAvatar: user.avatar,
      message: messageText,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setSupportMessages(prev => [newMsg, ...prev]);
    saveSupportMessageToFirestore(newMsg);

    // Also send an instant confirmation notification to the user's notification box
    const confirmationNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      titleAr: `تم استلام رسالتك برقم مرجعي (${refNumber})`,
      titleEn: `Support Message Received (${refNumber})`,
      messageAr: `مرحباً ${user.name}، تم توجيه رسالتك ومقترحك برقم [${refNumber}] إلى صندوق رسائل الإدارة وسنقوم بالرد عليك قريباً.`,
      messageEn: `Hello ${user.name}, your message [${refNumber}] has been forwarded to admin inbox. We will respond soon.`,
      date: new Date().toISOString(),
      read: false,
      type: 'system',
      refNumber
    };
    setNotifications(prev => [confirmationNotif, ...prev]);
    saveNotificationToFirestore(confirmationNotif);

    return { refNumber, msgId };
  };

  const replyToSupportMessage = async (msgId: string, replyText: string): Promise<boolean> => {
    const targetMsg = supportMessages.find(m => m.id === msgId);
    if (!targetMsg) return false;

    const updatedMsg: SupportMessage = {
      ...targetMsg,
      status: 'replied',
      replyText,
      repliedAt: new Date().toISOString()
    };

    setSupportMessages(prev => prev.map(m => m.id === msgId ? updatedMsg : m));
    await saveSupportMessageToFirestore(updatedMsg);

    // Create a notification directed to the user
    const replyNotif: NotificationItem = {
      id: `notif_rep_${Date.now()}`,
      titleAr: `رد الإدارة على رسالتك (${targetMsg.refNumber})`,
      titleEn: `Admin Reply to Inquiry (${targetMsg.refNumber})`,
      messageAr: `مرحباً ${targetMsg.userName}، رداً على رسالتك ومقترحك [${targetMsg.refNumber}]: "${replyText}". نشكرك على تواصلك مع إدارة Dance With Me.`,
      messageEn: `Hello ${targetMsg.userName}, regarding your inquiry [${targetMsg.refNumber}]: "${replyText}". Thank you for contacting Dance With Me.`,
      date: new Date().toISOString(),
      read: false,
      type: 'support_reply',
      refNumber: targetMsg.refNumber
    };
    setNotifications(prev => [replyNotif, ...prev]);
    saveNotificationToFirestore(replyNotif);

    return true;
  };

  return (
    <AppContext.Provider value={{
      lang,
      setLang,
      theme,
      setTheme,
      activeTab,
      setActiveTab: handleSetActiveTab,
      selectedCategory,
      setSelectedCategory,
      events,
      activeEvents,
      expiredEvents,
      showExpiredArchive,
      setShowExpiredArchive,
      user,
      loginUser,
      logoutUser,
      updateUserFavorites,
      updateUserAvatar,
      updateUserProfile,
      toggleLikeEvent,
      bookTicket,
      addNewEvent,
      updateEvent,
      deleteEvent,
      togglePauseEvent,
      updateEventPosition,
      editingEvent,
      setEditingEvent,
      notifications,
      unreadCount,
      markAllNotificationsAsRead,
      pushEnabled,
      togglePushNotifications,
      openGuestAlert,
      closeGuestAlert,
      guestAlertState,
      supportMessages,
      sendSupportMessage,
      replyToSupportMessage,
      openSupportModal,
      closeSupportModal,
      isSupportModalOpen,
      cleanUpDuplicateAds,
      isAdminUnlocked,
      setIsAdminUnlocked,
      isAdminLockModalOpen,
      setIsAdminLockModalOpen,
      appAssets,
      updateBrandingAssets
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
