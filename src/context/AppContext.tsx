import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { DanceCategory, DanceEvent, Language, NotificationItem, TabType, ThemeMode, UserProfile, SupportMessage, DanceStyle, EventBooking, AdSubmission } from '../types';
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
  deleteAllBookingsForEvent,
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
  checkAndSeedPricingConfig,
  updatePricingConfigToFirestore,
  subscribeToPricingConfig, fetchPricingConfigOnce,
  DEFAULT_PRICING_CONFIG,
  logAnalyticsEvent,
  saveBookingToFirestore,
  subscribeToBookings,
  subscribeToAdSubmissions,
  deleteBookingFromFirestore
} from '../lib/firebase';
import { PricingConfig } from '../types';

export type GuestAlertReason = 'contact' | 'post_ad' | 'book' | 'favorite' | 'scan_qr' | 'default';

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
  clearAllLikedEvents: () => void;
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
  pricingConfig: PricingConfig;
  updatePricingConfig: (config: PricingConfig) => Promise<boolean>;
  loadPricingConfig: () => Promise<void>;
  bookings: EventBooking[];
  userAdSubmissions: AdSubmission[];
  submitBooking: (bookingData: {
    eventId: string;
    eventTitleAr: string;
    eventTitleEn: string;
    eventPrice: number;
    userName: string;
    userPhone: string;
    numberOfIndividuals: number;
    totalAmount: number;
    receiptImage: string;
    eventDate?: string;
  }) => Promise<EventBooking | null>;
  approveBooking: (bookingId: string, barcodeUrl: string, accessCode: string, discountAmount: number, adminNotes?: string) => Promise<boolean>;
  rejectBooking: (bookingId: string, adminNotes?: string) => Promise<boolean>;
  deleteBooking: (bookingId: string) => Promise<boolean>;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  deleteAllBookings: () => Promise<boolean>;
  selectedBookingEvent: DanceEvent | null;
  setSelectedBookingEvent: (event: DanceEvent | null) => void;
  customAlert: {
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  };
  triggerAlert: (msg: string) => void;
  closeCustomAlert: () => void;
  customConfirm: {
    isOpen: boolean;
    message: string;
    resolve: ((val: boolean) => void) | null;
  };
  triggerConfirm: (msg: string) => Promise<boolean>;
  isLoadingEvents: boolean;
  loadingEventsError: 'slow' | 'offline' | null;
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

  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const [customConfirm, setCustomConfirm] = useState<{
    isOpen: boolean;
    message: string;
    resolve: ((val: boolean) => void) | null;
  }>({
    isOpen: false,
    message: '',
    resolve: null
  });

  const triggerConfirm = (msg: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setCustomConfirm({
        isOpen: true,
        message: msg,
        resolve: (val: boolean) => {
          resolve(val);
          setCustomConfirm({
            isOpen: false,
            message: '',
            resolve: null
          });
        }
      });
    });
  };

  const triggerAlert = (msg: string) => {
    let type: 'success' | 'error' | 'info' = 'info';
    const lowerMsg = msg.toLowerCase();
    if (
      msg.includes('✅') || 
      msg.includes('🎉') || 
      msg.includes('نجاح') || 
      msg.includes('بنجاح') || 
      msg.includes('تم ') || 
      lowerMsg.includes('success') || 
      lowerMsg.includes('done') || 
      lowerMsg.includes('saved') || 
      lowerMsg.includes('published')
    ) {
      type = 'success';
    } else if (
      msg.includes('❌') || 
      msg.includes('⚠️') || 
      msg.includes('فشل') || 
      msg.includes('خطأ') || 
      msg.includes('عذراً') || 
      lowerMsg.includes('fail') || 
      lowerMsg.includes('error') || 
      lowerMsg.includes('warn') || 
      lowerMsg.includes('invalid')
    ) {
      type = 'error';
    }
    setCustomAlert({
      isOpen: true,
      message: msg,
      type
    });
  };

  const closeCustomAlert = () => {
    setCustomAlert(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg: any) => {
      triggerAlert(String(msg));
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Events in state
  const [events, setEvents] = useState<DanceEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [loadingEventsError, setLoadingEventsError] = useState<'slow' | 'offline' | null>(null);

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

  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [userAdSubmissions, setUserAdSubmissions] = useState<AdSubmission[]>([]);
  const [selectedBookingEvent, setSelectedBookingEvent] = useState<DanceEvent | null>(null);

  // App Assets / Branding state loaded from Firestore with fallback to default paths
  const [appAssets, setAppAssets] = useState<any>(() => {
    return {
      id: 'current_branding',
      app_icon_url: '/icon.svg',
      app_logo_url: '/logo.svg',
      appNameAr: 'Dance With Me',
      appNameEn: 'Dance With Me',
      whatsappSupport: '201012345678',
      instagramUrl: 'https://instagram.com/dancewithme_luxury',
      promoTitleAr: 'فيديو الأسبوع الحصري المميز VIP',
      promoTitleEn: 'EXCLUSIVE WEEKLY VIP FEATURED VIDEO',
      promoSubtitleAr: 'إعلان خاص',
      promoSubtitleEn: 'SPECIAL AD',
      promoBadgeAr: 'فيديو الأسبوع الحصري',
      promoBadgeEn: 'Weekly Featured Video'
    };
  });

  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);

  const updateBrandingAssets = async (newAssets: any): Promise<boolean> => {
    const success = await updateAppAssets(newAssets);
    if (success) {
      setAppAssets((prev: any) => ({ ...prev, ...newAssets }));
    }
    return success;
  };

  
  const loadPricingConfig = async () => {
    const config = await fetchPricingConfigOnce();
    if (config) {
      setPricingConfig(config);
    }
  };

  const updatePricingConfig = async (newConfig: PricingConfig): Promise<boolean> => {
    const success = await updatePricingConfigToFirestore(newConfig);
    if (success) {
      setPricingConfig(newConfig);
    }
    return success;
  };

  // Save other state to localStorage whenever state changes

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

    // Clean up stale events cache
    try {
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
    } catch (e) {}

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
    

    let isInitialLoad = true;
    let loadingTimeout = setTimeout(() => {
      setLoadingEventsError(!navigator.onLine ? 'offline' : 'slow');
    }, 8000);

    // 2. Subscribe to live events collection
    const unsubEvents = subscribeToEvents((liveEvents) => {
      clearTimeout(loadingTimeout);
      setEvents(liveEvents || []);
      setIsLoadingEvents(false);
      setLoadingEventsError(null);
      
      // Auto assign reference numbers starting from 1001 for any events that do not have one
      if (liveEvents && liveEvents.length > 0) {
        const missing = liveEvents.filter(e => !e.eventRef && !e.isEmpty);
        if (missing.length > 0) {
          const assignedRefs = liveEvents.map(e => e.eventRef).filter((r): r is number => typeof r === 'number');
          let maxRef = assignedRefs.length > 0 ? Math.max(...assignedRefs) : 1000;
          if (maxRef < 1000) maxRef = 1000;
          
          // Sort missing by uploadDate (oldest first)
          const sortedMissing = [...missing].sort((a, b) => new Date(a.uploadDate || 0).getTime() - new Date(b.uploadDate || 0).getTime());
          
          sortedMissing.forEach(async (ev) => {
            maxRef += 1;
            const updatedEv = { ...ev, eventRef: maxRef };
            await saveEventToFirestore(updatedEv);
          });
        }
      }
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
          const updatedUser = { ...existing, isAdmin: isUserAdmin || existing.isAdmin };
          setUser(updatedUser);
          try {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
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
                const updatedParsed = { ...parsed, isAdmin: isUserAdmin || parsed.isAdmin };
                setUser(updatedParsed);
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
      clearTimeout(loadingTimeout);
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

  // 5b. Subscribe to live bookings based on the logged-in user
  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }
    const unsubBookings = subscribeToBookings(
      (liveBookings) => {
        setBookings(liveBookings || []);
      },
      user.id,
      true
    );
    const unsubAds = subscribeToAdSubmissions((ads) => setUserAdSubmissions(ads || []), user.id, false);
    return () => {
      unsubBookings();
      unsubAds();
    };
  }, [user]);

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
      const posA = a.position !== undefined && a.position !== null && a.position > 0 ? a.position : 999999;
      const posB = b.position !== undefined && b.position !== null && b.position > 0 ? b.position : 999999;
      
      const aIsVip = posA < 20;
      const bIsVip = posB < 20;

      if (aIsVip && !bIsVip) return -1;
      if (!aIsVip && bIsVip) return 1;
      
      if (aIsVip && bIsVip) {
        if (posA !== posB) {
          return posA - posB;
        }
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
      const posA = a.position !== undefined && a.position !== null && a.position > 0 ? a.position : 999999;
      const posB = b.position !== undefined && b.position !== null && b.position > 0 ? b.position : 999999;
      
      const aIsVip = posA < 20;
      const bIsVip = posB < 20;

      if (aIsVip && !bIsVip) return -1;
      if (!aIsVip && bIsVip) return 1;
      
      if (aIsVip && bIsVip) {
        if (posA !== posB) {
          return posA - posB;
        }
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
      name: name.trim() || (lang === 'ar' ? 'عضو جديد' : 'New Member'),
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
    const isAlreadyLiked = user.likedEventIds.includes(eventId);
    
    // Fire celebratory confetti only if adding to favorites
    if (!isAlreadyLiked) {
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

  const clearAllLikedEvents = () => {
    if (!user || !user.likedEventIds || user.likedEventIds.length === 0) return;
    
    // Decrement likesCount for all currently liked events
    setEvents(prev => prev.map(ev => {
      if (user.likedEventIds.includes(ev.id)) {
        const updatedEv = {
          ...ev,
          likesCount: Math.max(0, (ev.likesCount || 0) - 1)
        };
        saveEventToFirestore(updatedEv);
        return updatedEv;
      }
      return ev;
    }));

    const updatedUser = { ...user, likedEventIds: [] };
    setUser(updatedUser);
    saveUserToFirestore(updatedUser);
  };

  const bookTicket = (eventId: string) => {
    if (!user) {
      openGuestAlert('book');
      return;
    }
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      setSelectedBookingEvent(ev);
    }
  };

  const submitBooking = async (bookingData: {
    eventId: string;
    eventTitleAr: string;
    eventTitleEn: string;
    eventPrice: number;
    userName: string;
    userPhone: string;
    numberOfIndividuals: number;
    totalAmount: number;
    receiptImage: string;
    eventDate?: string;
  }): Promise<EventBooking | null> => {
    if (!user) {
      openGuestAlert('book');
      return null;
    }

    const refNumber = `DWM-BKG-${Math.floor(100000 + Math.random() * 900000)}`;
    const id = `booking_${Date.now()}`;

    const newBooking: EventBooking = {
      id,
      eventId: bookingData.eventId,
      eventTitleAr: bookingData.eventTitleAr,
      eventTitleEn: bookingData.eventTitleEn,
      eventPrice: bookingData.eventPrice,
      userId: user.id,
      userName: bookingData.userName,
      userPhone: bookingData.userPhone,
      numberOfIndividuals: bookingData.numberOfIndividuals,
      totalAmount: bookingData.totalAmount,
      receiptImage: bookingData.receiptImage,
      status: 'pending',
      refNumber,
      submittedAt: new Date().toISOString(),
      eventDate: bookingData.eventDate
    };

    const success = await saveBookingToFirestore(newBooking);
    if (success) {
      setBookings(prev => {
        if (prev.some(b => b.id === newBooking.id || (b.refNumber && b.refNumber === newBooking.refNumber))) {
          return prev;
        }
        return [newBooking, ...prev];
      });

      // Add to user's booked event IDs
      if (!user.bookedEventIds.includes(bookingData.eventId)) {
        const updatedUser = {
          ...user,
          bookedEventIds: [...user.bookedEventIds, bookingData.eventId]
        };
        setUser(updatedUser);
        saveUserToFirestore(updatedUser);
      }


      // Create notification for the admin
      const adminNotif: NotificationItem = {
        id: `notif_admin_bkg_${Date.now()}`,
        titleAr: '🎟️ طلب حجز تذاكر جديد قيد المراجعة',
        titleEn: '🎟️ New Ticket Booking Under Review',
        messageAr: `قام العميل ${bookingData.userName} بطلب حجز لـ ${bookingData.numberOfIndividuals} أفراد في "${bookingData.eventTitleAr}". يرجى مراجعته في لوحة التحكم.`,
        messageEn: `Customer ${bookingData.userName} requested booking for ${bookingData.numberOfIndividuals} people for "${bookingData.eventTitleEn}". Please review in control panel.`,
        date: new Date().toISOString(),
        read: false,
        type: 'system'
      };
      saveNotificationToFirestore(adminNotif);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      return newBooking;
    }
    return null;
  };

  const approveBooking = async (
    bookingId: string, 
    barcodeUrl: string, 
    accessCode: string, 
    discountAmount: number, 
    adminNotes?: string
  ): Promise<boolean> => {
    if (!user || !user.isAdmin) return false;

    const bkg = bookings.find(b => b.id === bookingId);
    if (!bkg) return false;

    const finalAmount = Math.max(0, bkg.totalAmount - discountAmount);

    const updatedBooking: EventBooking = {
      ...bkg,
      status: 'approved',
        userRead: false,
      barcodeUrl,
      accessCode: accessCode || `DWM-AC-${Math.floor(1000 + Math.random() * 9000)}`,
      discountAmount,
      adminNotes,
      reviewedAt: new Date().toISOString()
    };

    const success = await saveBookingToFirestore(updatedBooking);
    if (success) {
      setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));

      

      return true;
    }
    return false;
  };

  const rejectBooking = async (bookingId: string, adminNotes?: string): Promise<boolean> => {
    if (!user || !user.isAdmin) return false;

    const bkg = bookings.find(b => b.id === bookingId);
    if (!bkg) return false;

    const updatedBooking: EventBooking = {
      ...bkg,
      status: 'rejected',
        userRead: false,
      adminNotes,
      reviewedAt: new Date().toISOString()
    };

    const success = await saveBookingToFirestore(updatedBooking);
    if (success) {
      setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));

      

      return true;
    }
    return false;
  };

  const deleteBooking = async (bookingId: string): Promise<boolean> => {
    if (!user) return false;
    const bkg = bookings.find(b => b.id === bookingId);
    if (!bkg) return false;

    const success = await deleteBookingFromFirestore(bookingId);
    if (success) {
      setBookings(prev => prev.filter(b => b.id !== bookingId));

      // Check if there are other bookings for the same event
      const otherBookings = bookings.filter(b => b.id !== bookingId && b.userId === user.id && b.eventId === bkg.eventId);
      if (otherBookings.length === 0) {
        const updatedUser = {
          ...user,
          bookedEventIds: user.bookedEventIds.filter(id => id !== bkg.eventId)
        };
        setUser(updatedUser);
        saveUserToFirestore(updatedUser);
      }
      return true;
    }
    return false;
  };

  const cancelBooking = async (bookingId: string): Promise<boolean> => {
    if (!user) return false;
    const bkg = bookings.find(b => b.id === bookingId);
    if (!bkg) return false;

    const updatedBooking: EventBooking = {
      ...bkg,
      status: 'cancelled',
      userRead: false,
      cancelledAt: new Date().toISOString()
    };

    const success = await saveBookingToFirestore(updatedBooking);
    if (success) {
      setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
      return true;
    }
    return false;
  };

  const deleteAllBookings = async (): Promise<boolean> => {
    if (!user) return false;
    const myBookings = bookings.filter(b => b.userId === user.id);
    if (myBookings.length === 0) return true;

    let allSuccess = true;
    for (const bkg of myBookings) {
      const success = await deleteBookingFromFirestore(bkg.id);
      if (!success) {
        allSuccess = false;
      }
    }

    if (allSuccess) {
      setBookings(prev => prev.filter(b => b.userId !== user.id));
      const updatedUser = {
        ...user,
        bookedEventIds: []
      };
      setUser(updatedUser);
      saveUserToFirestore(updatedUser);
      return true;
    }
    return false;
  };

  const addNewEvent = (newEv: Omit<DanceEvent, 'id' | 'likesCount' | 'uploadDate'>): DanceEvent | undefined => {
    if (!user) {
      openGuestAlert('post_ad');
      return;
    }
    
    // Calculate new eventRef
    let maxRef = 1000;
    const assignedRefs = events.map(e => e.eventRef).filter((r): r is number => typeof r === 'number');
    if (assignedRefs.length > 0) {
      maxRef = Math.max(...assignedRefs);
    }
    const newEventRef = maxRef + 1;

    const createdEvent: DanceEvent = {
      ...newEv,
      id: `ev-${Date.now()}`,
      eventRef: newEventRef,
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
    return createdEvent;
  };

  const deleteEvent = async (eventId: string) => {
    const evToDelete = events.find(e => e.id === eventId);
    if (evToDelete && evToDelete.mediaUrl && evToDelete.mediaUrl.includes('cloudinary.com')) {
       try {
         await fetch('/api/delete-media', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ url: evToDelete.mediaUrl, resourceType: evToDelete.mediaType })
         });
       } catch (err) {
         console.error('Failed to delete media for deleted event:', err);
       }
    }
    // Instead of deleting the event document entirely, we clear its data and mark it as empty
    // to preserve its `position` (serial number).
    if (evToDelete) {
      const emptyEv = {
        ...evToDelete,
        titleAr: '',
        titleEn: '',
        descriptionAr: '',
        descriptionEn: '',
        mediaUrl: '',
        thumbnailUrl: '',
        isEmpty: true,
      };
      saveEventToFirestore(emptyEv);
      setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));
      deleteAllBookingsForEvent(eventId);
      setBookings(prev => prev.filter(b => b.eventId !== eventId));
    } else {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      deleteEventFromFirestore(eventId);
    }
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

    

    return { refNumber, msgId };
  };

  const replyToSupportMessage = async (msgId: string, replyText: string): Promise<boolean> => {
    const targetMsg = supportMessages.find(m => m.id === msgId);
    if (!targetMsg) return false;

    const updatedMsg: SupportMessage = {
      ...targetMsg,
      status: 'replied',
      userRead: false,
      replyText,
      repliedAt: new Date().toISOString()
    };

    setSupportMessages(prev => prev.map(m => m.id === msgId ? updatedMsg : m));
    await saveSupportMessageToFirestore(updatedMsg);

    

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
      clearAllLikedEvents,
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
      updateBrandingAssets,
      pricingConfig,
      updatePricingConfig,
      loadPricingConfig,
      bookings,
      userAdSubmissions,
      submitBooking,
      approveBooking,
      rejectBooking,
      deleteBooking,
      cancelBooking,
      deleteAllBookings,
      selectedBookingEvent,
      setSelectedBookingEvent,
      customAlert,
      triggerAlert,
      closeCustomAlert,
      customConfirm,
      triggerConfirm,
      isLoadingEvents,
      loadingEventsError
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
