Warning: truncated output (original token count: 126427)
Total output lines: 8107

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Phone, 
  Eye, 
  Pencil,
  Sparkles, 
  Clock, 
  DollarSign, 
  Calendar, 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  RefreshCw, 
  AlertCircle,
  Check,
  User,
  Users,
  Heart,
  MapPin,
  Search,
  Ban,
  ShieldCheck,
  ShieldAlert,
  Image as ImageIcon,
  PlayCircle,
  Ticket,
  Database,
  Server,
  Plus,
  FilePlus,
  Video,
  Download,
  Activity,
  Layers,
  Table,
  HardDrive,
  Share2,
  Code,
  MessageSquare,
  Send,
  Mail,
  MessageCircle,
  Key,
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Bell,
  Smartphone,
  Globe,
  Maximize2, Minimize2, Languages, Loader2, LayoutDashboard } from 'lucide-react';
import { QrCode, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdSubmission, AdChangeRequest, DanceEvent, UserProfile, getStyleLabel, ALL_DANCE_STYLES, DanceCategory, DanceStyle, AccountTier } from '../../types';
import { EventCard } from '../events/EventCard';
import { ProfileView } from '../profile/ProfileView';
import { 
  subscribeToAdSubmissions, 
  subscribeToAdChangeRequests,
  saveAdSubmissionToFirestore, 
  deleteAdSubmissionFromFirestore, 
  saveEventToFirestore, 
  saveNotificationToFirestore,
  deleteAllNotificationsFromFirestore,
  subscribeToAllUsers,
  deleteUserFromFirestore,
  toggleUserSuspensionInFirestore,
  updateUserTierInFirestore,
  subscribeToSecurityViolations,
  resolvedFirebaseConfig,
  databaseId,
  subscribeToAnalyticsCounters,
  subscribeToDailyAnalytics, reorderAdsStartingFrom20,
  db
} from '../../lib/firebase';
import { reviewAdChangeRequest } from '../../lib/adChangeRequests';

import { compressImage, uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';
import { sendBroadcastPushNotification, getPushSubscribersCount, playNotificationChime } from '../../lib/pushNotifications';
import { isEventExpired } from '../../utils/dateUtils';

export const AdminPanel: React.FC = () => {
  const { 
    lang, 
    setActiveTab, 
    user, 
    addNewEvent, 
    events, 
    expiredEvents,
    deleteEvent, 
    adminSelectedUserId,
    setAdminSelectedUserId,
    notifications, 
    supportMessages, 
    replyToSupportMessage, 
    cleanUpDuplicateAds, 
    appAssets, 
    updateBrandingAssets, 
    pricingConfig, 
    updatePricingConfig,
    bookings,
    approveBooking,
    rejectBooking,
    deleteBooking,
    triggerConfirm
  } = useApp();
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
  const [adChangeRequests, setAdChangeRequests] = useState<AdChangeRequest[]>([]);
  const [submissionView, setSubmissionView] = useState<'new_ads' | 'changes'>('new_ads');
  const [loading, setLoading] = useState(true);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'archived'>('pending');
  const [supportFilter, setSupportFilter] = useState<'all' | 'pending' | 'replied'>('pending');
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bookingsFilter, setBookingsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [bookingsSearch, setBookingsSearch] = useState('');
  const [rejectionReasonMap, setRejectionReasonMap] = useState<Record<string, string>>({});
  const [selectedBookingReceipt, setSelectedBookingReceipt] = useState<string | null>(null);
  const [adminSection, setAdminSection] = useState<'submissions' | 'database' | 'support' | 'users' | 'security' | 'branding' | 'pricing' | 'analytics' | 'create_ad_admin' | 'bookings' | 'send_notifications' | null>(null);
  const [dbSubTab, setDbSubTab] = useState<'events' | 'submissions' | 'notifications' | 'schema'>('events');
  const [selectedJsonDoc, setSelectedJsonDoc] = useState<{ id: string; title: string; data: any } | null>(null);
  const [qrEventDoc, setQrEventDoc] = useState<{ id: string; title: string } | null>(null);
  const [viewingAttendeesEvent, setViewingAttendeesEvent] = useState<DanceEvent | null>(null);
  
  const [submissionPositions, setSubmissionPositions] = useState<Record<string, number | ''>>({});
  
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [usersSubTab, setUsersSubTab] = useState<'search' | 'all'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [usersError, setUsersError] = useState<string | null>(null);

  // Send Notifications States
  const [notifTitleAr, setNotifTitleAr] = useState('');
  const [notifTitleEn, setNotifTitleEn] = useState('');
  const [notifMessageAr, setNotifMessageAr] = useState('');
  const [notifMessageEn, setNotifMessageEn] = useState('');
  const [notifType, setNotifType] = useState<'system' | 'new_party' | 'course_alert' | 'trip' | 'expiry_warning'>('system');
  const [notifSending, setNotifSending] = useState(false);
  const [sendMobilePush, setSendMobilePush] = useState(true);
  const [pushSubscribersCount, setPushSubscribersCount] = useState<number>(0);

  useEffect(() => {
    getPushSubscribersCount().then(count => setPushSubscribersCount(count));
  }, []);

  useEffect(() => subscribeToAdChangeRequests(setAdChangeRequests), []);

  const handleReviewAdChange = async (request: AdChangeRequest, decision: 'approve' | 'reject') => {
    setActionLoading(`change-${request.id}`);
    try {
      await reviewAdChangeRequest(request.id, decision);
      alert(lang === 'ar'
        ? (decision === 'approve' ? 'تم اعتماد التغيير بنفس رقم الإعلان والفعالية الحاليين.' : 'تم رفض طلب التغيير.')
        : (decision === 'approve' ? 'Change approved without changing the ad or event numbers.' : 'Change request rejected.'));
    } catch (error) {
      console.error('Failed to review ad change request:', error);
      alert(lang === 'ar' ? 'تعذر تنفيذ القرار. حاول مرة أخرى.' : 'Unable to complete this decision. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };


  // Security Section States
  const [securityViolations, setSecurityViolations] = useState<any[]>([]);
  const [adminAlertPhone, setAdminAlertPhone] = useState<string>(() => {
    return localStorage.getItem('dwm_admin_alert_phone') || '201201529891';
  });

  const hasAutoCleanedRef = React.useRef(false);

  useEffect(() => {
    if (adminSelectedUserId && allUsers.length > 0) {
      const u = allUsers.find(u => u.id === adminSelectedUserId);
      if (u) {
        setSelectedUserProfile(u);
        setAdminSelectedUserId(null);
      }
    }
  }, [adminSelectedUserId, allUsers, setAdminSelectedUserId]);

  useEffect(() => {
    if (submissions.length === 0 || hasAutoCleanedRef.current) return;
    
    const autoCleanupOldArchives = async () => {
      hasAutoCleanedRef.current = true;
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      
      const oldArchived = submissions.filter(s => {
        let isArchived = s.status === 'archived';
        let archivedTime = s.archivedAt ? new Date(s.archivedAt).getTime() : 0;

        if (!isArchived && s.expiresAt) {
           const exp = new Date(s.expiresAt).getTime();
           if (now >= exp) {
              isArchived = true;
              archivedTime = exp;
           }
        }

        if (!isArchived || !archivedTime) return false;
        return (now - archivedTime) > thirtyDaysMs;
      });

      if (oldArchived.length > 0) {
        console.log(`Auto-cleaning ${oldArchived.length} old archived submissions...`);
        for (const sub of oldArchived) {
          try {
            // Delete media from Cloudinary
            if (sub.mediaUrl) await deleteFromCloudinary(sub.mediaUrl, sub.mediaType || 'image').catch(console.error);
            if (sub.receiptUrl) await deleteFromCloudinary(sub.receiptUrl, 'image').catch(console.error);
            
            // Delete associated Event if exists
            if (sub.eventData?.id) {
               try {
                 const { deleteEventFromFirestore, deleteBookingFromFirestore } = await import('../../lib/firebase');
                 const eventId = sub.eventData.id;
                 await deleteEventFromFirestore(eventId);
                 
                 // Find and delete associated bookings
                 if (bookings) {
                   const associatedBookings = bookings.filter(b => b.eventId === eventId);
                   for (const bkg of associatedBookings) {
                     if (bkg.receiptUrl) {
                       await deleteFromCloudinary(bkg.receiptUrl, 'image').catch(console.error);
                     }
                     await deleteBookingFromFirestore(bkg.id);
                   }
                 }
               } catch (e) {
                 console.error('Failed to delete associated event or bookings', e);
               }
            }
            
            // Delete Ad Submission from Firestore
            await deleteAdSubmissionFromFirestore(sub.id);
          } catch (e) {
            console.error('Error auto-cleaning old archived ad:', e);
          }
        }
      }
    };

    autoCleanupOldArchives();
  }, [submissions, bookings]);

  const handleAlertPhoneChange = (val: string) => {
    setAdminAlertPhone(val);
    localStorage.setItem('dwm_admin_alert_phone', val);
  };

  // Branding & Assets States
  const [formAppNameAr, setFormAppNameAr] = useState('');
  const [formAppNameEn, setFormAppNameEn] = useState('');
  const [formAppIconUrl, setFormAppIconUrl] = useState('');
  const [formAppLogoUrl, setFormAppLogoUrl] = useState('');
  const [formHeroBannerUrl, setFormHeroBannerUrl] = useState('');
  const [formHeroBannerUrlEn, setFormHeroBannerUrlEn] = useState('');
  const [formHeroBannerMobileUrl, setFormHeroBannerMobileUrl] = useState('');
  const [formHeroBannerMobileUrlEn, setFormHeroBannerMobileUrlEn] = useState('');
  const [formWhatsappSupport, setFormWhatsappSupport] = useState('');
  const [formInstagramUrl, setFormInstagramUrl] = useState('');
  const [formPromoTitleAr, setFormPromoTitleAr] = useState('');
  const [formPromoTitleEn, setFormPromoTitleEn] = useState('');
  const [formPromoSubtitleAr, setFormPromoSubtitleAr] = useState('');
  const [formPromoSubtitleEn, setFormPromoSubtitleEn] = useState('');
  const [formPromoBadgeAr, setFormPromoBadgeAr] = useState('');
  const [formPromoBadgeEn, setFormPromoBadgeEn] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHeroBanner, setIsUploadingHeroBanner] = useState(false);
  const [isUploadingHeroBannerEn, setIsUploadingHeroBannerEn] = useState(false);
  const [isUploadingHeroBannerMobile, setIsUploadingHeroBannerMobile] = useState(false);
  const [isUploadingHeroBannerMobileEn, setIsUploadingHeroBannerMobileEn] = useState(false);
  const [localPricingConfig, setLocalPricingConfig] = useState(pricingConfig);
  const [savingPricing, setSavingPricing] = useState(false);
  useEffect(() => { setLocalPricingConfig(pricingConfig); }, [pricingConfig]);

  // Booked Ads Review & Cancellations State
  const [viewingBookedAds, setViewingBookedAds] = useState(false);
  const [selectedBookedAdId, setSelectedBookedAdId] = useState<string | null>(null);
  const [viewingCancellationRequests, setViewingCancellationRequests] = useState(false);

  // Analytics States
  const [analyticsCounters, setAnalyticsCounters] = useState<any>({});
  const [dailyAnalytics, setDailyAnalytics] = useState<any[]>([]);

  // Admin Direct Create Ad States
  const [adminTitleAr, setAdminTitleAr] = useState('');
  const [adminTitleEn, setAdminTitleEn] = useState('');
  const [adminDescAr, setAdminDescAr] = useState('');
  const [adminDescEn, setAdminDescEn] = useState('');
  const [isTranslating, setIsTranslating] = useState<string | null>(null);

  const handleTranslate = async (text: string, targetLang: 'ar' | 'en', setter: (val: string) => void, fieldName: string) => {
    if (!text.trim()) return;
    setIsTranslating(fieldName);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });
      const data = await res.json();
      if (data.translatedText) {
        setter(data.translatedText);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(null);
    }
  };

  const [adminCategory, setAdminCategory] = useState<DanceCategory>('party');
  const [adminMediaType, setAdminMediaType] = useState<'video' | 'image'>('image');
  const [adminMediaUrl, setAdminMediaUrl] = useState('');
  const [adminPriceAr, setAdminPriceAr] = useState('');
  const [adminPriceEn, setAdminPriceEn] = useState('');
  const [adminEventDate, setAdminEventDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [adminPhone, setAdminPhone] = useState('');
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [adminOrganizerName, setAdminOrganizerName] = useState('');
  const [adminLocationNameAr, setAdminLocationNameAr] = useState('');
  const [adminLocationNameEn, setAdminLocationNameEn] = useState('');
  const [adminAddressAr, setAdminAddressAr] = useState('');
  const [adminAddressEn, setAdminAddressEn] = useState('');
  const [adminGovernorateAr, setAdminGovernorateAr] = useState('');
  const [adminGovernorateEn, setAdminGovernorateEn] = useState('');
  const [adminAreaAr, setAdminAreaAr] = useState('');
  const [adminAreaEn, setAdminAreaEn] = useState('');
  const [adminGoogleMapsUrl, setAdminGoogleMapsUrl] = useState('');
  const [adminSelectedStyles, setAdminSelectedStyles] = useState<DanceStyle[]>([]);
  const [adminPosition, setAdminPosition] = useState<string>('');
  const [adminPositionWarningShown, setAdminPositionWarningShown] = useState<boolean>(false);
  const [submissionPositionWarnings, setSubmissionPositionWarnings] = useState<Record<string, boolean>>({});
  const [hasAutoSetPosition, setHasAutoSetPosition] = useState(false);

  useEffect(() => {
    if (!hasAutoSetPosition && events.length > 0) {
      const maxPos = events.reduce((max, ev) => {
        const p = ev.position;
        if (typeof p === 'number' && p !== 999999) {
          return p > max ? p : max;
        }
        return max;
      }, 0);
      setAdminPosition(String(Math.max(20, maxPos + 1)));
      setHasAutoSetPosition(true);
    }
  }, [events, hasAutoSetPosition]);
  const [adminIsWeeklyPromo, setAdminIsWeeklyPromo] = useState(false);
  const [adminIsFeatured, setAdminIsFeatured] = useState(true);
  const [adminShowBookingButton, setAdminShowBookingButton] = useState(true);
  const [adminShowViewsCount, setAdminShowViewsCount] = useState(true);
  const [adminBookingSubtextAr, setAdminBookingSubtextAr] = useState('');
  const [adminBookingSubtextEn, setAdminBookingSubtextEn] = useState('');
  const [adminEventsFilter, setAdminEventsFilter] = useState<'all' | 'empty' | 'paused' | 'active' | 'available'>('all');

  // Auto-save draft functionality
  const DRAFT_KEY = 'dwm_admin_ad_draft';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.adminTitleAr) setAdminTitleAr(draft.adminTitleAr);
        if (draft.adminTitleEn) setAdminTitleEn(draft.adminTitleEn);
        if (draft.adminDescAr) setAdminDescAr(draft.adminDescAr);
        if (draft.adminDescEn) setAdminDescEn(draft.adminDescEn);
        if (draft.adminPriceAr) setAdminPriceAr(draft.adminPriceAr);
        if (draft.adminPriceEn) setAdminPriceEn(draft.adminPriceEn);
        if (draft.adminCategory) setAdminCategory(draft.adminCategory);
        if (draft.adminSelectedStyles) setAdminSelectedStyles(draft.adminSelectedStyles);
        if (draft.adminMediaType) setAdminMediaType(draft.adminMediaType);
        if (draft.adminMediaUrl) setAdminMediaUrl(draft.adminMediaUrl);
        if (draft.adminLocationNameAr) setAdminLocationNameAr(draft.adminLocationNameAr);
        if (draft.adminLocationNameEn) setAdminLocationNameEn(draft.adminLocationNameEn);
        if (draft.adminAddressAr) setAdminAddressAr(draft.adminAddressAr);
        if (draft.adminAddressEn) setAdminAddressEn(draft.adminAddressEn);
        if (draft.adminGovernorateAr) setAdminGovernorateAr(draft.adminGovernorateAr);
        if (draft.adminGovernorateEn) setAdminGovernorateEn(draft.adminGovernorateEn);
        if (draft.adminAreaAr) setAdminAreaAr(draft.adminAreaAr);
        if (draft.adminAreaEn) setAdminAreaEn(draft.adminAreaEn);
        if (draft.adminPhone) setAdminPhone(draft.adminPhone);
        if (draft.adminWhatsapp) setAdminWhatsapp(draft.adminWhatsapp);
        if (draft.adminOrganizerName) setAdminOrganizerName(draft.adminOrganizerName);
        if (draft.adminEventDate) setAdminEventDate(draft.adminEventDate);
        if (draft.adminPosition) setAdminPosition(draft.adminPosition);
        if (typeof draft.adminIsFeatured !== 'undefined') setAdminIsFeatured(draft.adminIsFeatured);
        if (typeof draft.adminIsWeeklyPromo !== 'undefined') setAdminIsWeeklyPromo(draft.adminIsWeeklyPromo);
        if (typeof draft.adminShowBookingButton !== 'undefined') setAdminShowBookingButton(draft.adminShowBookingButton);
        if (typeof draft.adminShowViewsCount !== 'undefined') setAdminShowViewsCount(draft.adminShowViewsCount);
        if (draft.adminBookingSubtextAr) setAdminBookingSubtextAr(draft.adminBookingSubtextAr);
        if (draft.adminBookingSubtextEn) setAdminBookingSubtextEn(draft.adminBookingSubtextEn);
      }
    } catch (e) { console.error('Error loading draft', e); }
  }, []);

  useEffect(() => {
    const draft = {
      adminTitleAr, adminTitleEn, adminDescAr, adminDescEn, adminPriceAr, adminPriceEn,
      adminCategory, adminSelectedStyles, adminMediaType, adminMediaUrl,
      adminLocationNameAr, adminLocationNameEn, adminAddressAr, adminAddressEn, adminGovernorateAr, adminGovernorateEn, adminAreaAr, adminAreaEn, adminGoogleMapsUrl,
      adminPhone, adminWhatsapp, adminOrganizerName, adminEventDate, adminPosition, adminIsFeatured, adminIsWeeklyPromo, adminShowBookingButton, adminShowViewsCount, adminBookingSubtextAr, adminBookingSubtextEn
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    adminTitleAr, adminTitleEn, adminDescAr, adminDescEn, adminPriceAr, adminPriceEn,
    adminCategory, adminSelectedStyles, adminMediaType, adminMediaUrl,
    adminLocationNameAr, adminLocationNameEn, adminAddressAr, adminAddressEn, adminGovernorateAr, adminGovernorateEn, adminAreaAr, adminAreaEn, adminGoogleMapsUrl,
    adminPhone, adminWhatsapp, adminOrganizerName, adminEventDate, adminPosition, adminIsFeatured, adminIsWeeklyPromo, adminShowBookingButton, adminShowViewsCount, adminBookingSubtextAr, adminBookingSubtextEn
  ]);

  
  // Quick Edit States
  const [adminEditingField, setAdminEditingField] = useState<string | null>(null);
  const [adminEditValue, setAdminEditValue] = useState('');
  const [isFullscreenEvents, setIsFullscreenEvents] = useState(false);

  // Media Upload States for Admin Create Ad
  const [adminUploadedFileName, setAdminUploadedFileName] = useState<string | null>(null);
  const [adminIsUploadingMedia, setAdminIsUploadingMedia] = useState(false);
  const [adminUploadProgress, setAdminUploadProgress] = useState<number>(0);
  const [adminUploadError, setAdminUploadError] = useState<string | null>(null);
  const [adminPendingFile, setAdminPendingFile] = useState<File | null>(null);
  const [adminSaveStatus, setAdminSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [adminCreateTab, setAdminCreateTab] = useState<'form' | 'preview'>('form');
  const [previewAlert, setPreviewAlert] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');

  const cloudinaryCloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const adminCameraInputRef = React.useRef<HTMLInputElement>(null);
  const adminFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (appAssets) {
      setFormAppNameAr(appAssets.appNameAr || '');
      setFormAppNameEn(appAssets.appNameEn || '');
      setFormAppIconUrl(appAssets.app_icon_url || '');
      setFormAppLogoUrl(appAssets.app_logo_url || '');
      setFormHeroBannerUrl(appAssets.app_hero_banner_url || '');
      setFormHeroBannerUrlEn(appAssets.app_hero_banner_url_en || '');
      setFormHeroBannerMobileUrl(appAssets.app_hero_banner_mobile_url || '');
      setFormHeroBannerMobileUrlEn(appAssets.app_hero_banner_mobile_url_en || '');
      setFormWhatsappSupport(appAssets.whatsappSupport || '');
      setFormInstagramUrl(appAssets.instagramUrl || '');
      setFormPromoTitleAr(appAssets.promoTitleAr || '');
      setFormPromoTitleEn(appAssets.promoTitleEn || '');
      setFormPromoSubtitleAr(appAssets.promoSubtitleAr || '');
      setFormPromoSubtitleEn(appAssets.promoSubtitleEn || '');
      setFormPromoBadgeAr(appAssets.promoBadgeAr || '');
      setFormPromoBadgeEn(appAssets.promoBadgeEn || '');
    }
  }, [appAssets]);

  useEffect(() => {
    if (adminSection === 'analytics') {
      const unsubCounters = subscribeToAnalyticsCounters((data) => {
        setAnalyticsCounters(data || {});
      });
      const unsubDaily = subscribeToDailyAnalytics((list) => {
        setDailyAnalytics(list || []);
      });
      return () => {
        unsubCounters();
        unsubDaily();
      };
    }
  }, [adminSection]);

  const compressAdminImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (file.size < 300 * 1024) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1080;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            }, 'image/jpeg', 0.82);
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleAdminFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Security check: Validate file type and extension to prevent malicious uploads
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const validVideoExts = ['mp4', 'webm', 'mov'];
      
      const isImage = validImageTypes.includes(file.type) && validImageExts.includes(ext || '');
      const isVideo = validVideoTypes.includes(file.type) && validVideoExts.includes(ext || '');

      if (!isImage && !isVideo) {
        alert(lang === 'ar' ? '⚠️ تحذير أمني: نوع الملف غير مدعوم أو قد يكون خبيثاً. يرجى رفع صورة أو فيديو بصيغة صحيحة.' : '⚠️ Security Warning: Unsupported or potentially malicious file type. Please upload a valid image or video.');
        e.target.value = '';
        return;
      }

      // Check file size (e.g. limit to 50MB) to prevent buffer overflows/denial of service
      if (file.size > 50 * 1024 * 1024) {
        alert(lang === 'ar' ? '⚠️ حجم الملف كبير جداً (أكثر من 50 ميجابايت).' : '⚠️ File is too large (over 50MB).');
        e.target.value = '';
        return;
      }

      const processUpload = async (fileToUpload: File, type: 'video' | 'image') => {
        setAdminUploadedFileName(fileToUpload.name);
        setAdminMediaType(type);
        setAdminMediaUrl(URL.createObjectURL(fileToUpload));
        try {
          const finalUrl = await performAdminMediaUpload(fileToUpload);
          setAdminMediaUrl(finalUrl);
          setAdminPendingFile(null);
        } catch (err: any) {
          alert(lang === 'ar' ? `❌ فشل رفع الوسائط: ${err.message}` : `❌ Media upload failed: ${err.message}`);
          setAdminMediaUrl('');
          setAdminPendingFile(null);
        }
      };

      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 120) {
            alert(lang === 'ar' 
              ? '❌ عذراً، لا يمكن رفع فيديو أطول من دقيقتين. يرجى اختيار فيديو أقصر.' 
              : '❌ Sorry, videos longer than 2 minutes are not allowed. Please choose a shorter video.');
            e.target.value = ''; // clear input
            return;
          }
          // Video is valid duration
          processUpload(file, 'video');
        };
        video.onerror = () => {
          window.URL.revokeObjectURL(video.src);
          alert(lang === 'ar' ? '❌ فشل تحميل بيانات الفيديو. يرجى تجربة ملف آخر.' : '❌ Failed to load video metadata. Please try another file.');
        };
        video.src = URL.createObjectURL(file);
      } else {
        // Handle images normally
        processUpload(file, 'image');
      }
    }
  };

  const performAdminMediaUpload = async (file: File): Promise<string> => {
    setAdminIsUploadingMedia(true);
    setAdminUploadProgress(0);
    setAdminUploadError(null);
    
    try {
      if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
        throw new Error('Cloudinary configuration missing (VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET). Please use the manual URL input below.');
      }
      
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToUpload = await compressAdminImage(file);
        } catch (compressErr) {
          console.error('Image compression failed', compressErr);
        }
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('upload_preset', cloudinaryUploadPreset);

      const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
      
      return await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/${resourceType}/upload`, true);
        
        xhr.upload.onprogress = (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setAdminUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.secure_url) {
                resolve(response.secure_url);
              } else {
                reject(new Error('No secure URL returned'));
              }
            } catch (parseErr) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error(lang === 'ar' ? 'فشل الاتصال بالخادم السحابي' : 'Network connection error'));
        };

        xhr.send(formData);
      });

    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setAdminUploadError(err.message || 'Upload failed');
      throw err;
    } finally {
      setAdminIsUploadingMedia(false);
      setAdminUploadProgress(0);
    }
  };

  const parseAdminCoordinates = (url: string): { lat: number; lng: number } => {
    try {
      if (!url) return { lat: 30.0444, lng: 31.2357 }; // Cairo defaults
      const coordsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = url.match(coordsRegex);
      if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
      
      const queryRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
      const queryMatch = url.match(queryRegex);
      if (queryMatch) {
        return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
      }
      
      const daddrRegex = /[?&]daddr=(-?\d+\.\d+),(-?\d+\.\d+)/;
      const daddrMatch = url.match(daddrRegex);
      if (daddrMatch) {
        return { lat: parseFloat(daddrMatch[1]), lng: parseFloat(daddrMatch[2]) };
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
    return { lat: 30.0444, lng: 31.2357 }; // Cairo defaults
  };

  const handleAdminPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPosition && !adminPositionWarningShown) {
      alert(lang === 'ar' ? '⚠️ الرجاء إدخال الرقم التسلسلي (الترتيب). إذا كنت متأكداً من النشر بدون ترتيب، اضغط على نشر مرة أخرى.' : '⚠️ Please enter a Position number. If you are sure you want to publish without a position, click publish again.');
      setAdminPositionWarningShown(true);
      return;
    }
    if (!adminTitleAr.trim() || !adminTitleEn.trim()) {
      alert(lang === 'ar' ? 'الرجاء إدخال اسم الفعالية بالعربية والإنجليزية' : 'Please input both Arabic and English Titles.');
      return;
    }
    if (!adminDescAr.trim() || !adminDescEn.trim()) {
      alert(lang === 'ar' ? 'الرجاء إدخال وصف الفعالية بالعربية والإنجليزية' : 'Please input both Arabic and English Descriptions.');
      return;
    }
    if (!adminEventDate) {
      alert(lang === 'ar' ? 'الرجاء تحديد تاريخ الفعالية' : 'Please specify the event date.');
      return;
    }

    setAdminSaveStatus('loading');
    try {
      let finalMediaUrl = adminMediaUrl.trim();
      
      if (!finalMediaUrl) {
        finalMediaUrl = 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80';
      }

      // Generate a proper thumbnailUrl for videos from Cloudinary
      let finalThumbnailUrl = finalMediaUrl;
      if (adminMediaType === 'video' && finalMediaUrl.includes('cloudinary.com')) {
        // Cloudinary trick: change .mp4/etc to .jpg to get a thumbnail
        finalThumbnailUrl = finalMediaUrl.replace(/\.[^.]+$/, '.jpg');
      } else if (adminMediaType === 'video') {
        // Fallback for non-cloudinary videos (though we mostly use cloudinary)
        finalThumbnailUrl = 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80';
      }

      
      const coords = parseAdminCoordinates(adminGoogleMapsUrl || '');
      
      let maxRef = 1000;
      const assignedRefs = (events || []).map(e => e?.eventRef).filter((r): r is number => typeof r === 'number');
      if (assignedRefs.length > 0) {
        maxRef = Math.max(...assignedRefs);
      }
      const newEventRef = maxRef + 1;
      
      const newEventId = `ev-adm-${Date.now()}`;

      // Safe date parsing
      let safeDateStr = new Date().toISOString();
      try {
        const d = new Date(adminEventDate);
        if (!isNaN(d.getTime())) {
          safeDateStr = d.toISOString();
        }
      } catch (e) { console.error(e); }

      const createdEvent: DanceEvent = {
        id: newEventId,
        titleAr: (adminTitleAr || '').trim(),
        titleEn: (adminTitleEn || '').trim(),
        descriptionAr: (adminDescAr || '').trim(),
        descriptionEn: (adminDescEn || '').trim(),
        category: adminCategory || 'party',
        styles: adminSelectedStyles || [],
        mediaType: adminMediaType || 'image',
        mediaUrl: finalMediaUrl,
        thumbnailUrl: finalThumbnailUrl,
        uploadDate: new Date().toISOString(),
        eventRef: newEventRef,
        eventDate: safeDateStr,
        priceAr: (adminPriceAr || '').trim(),
        priceEn: (adminPriceEn || '').trim(),
        location: {
          nameAr: adminLocationNameAr.trim(),
          nameEn: adminLocationNameEn.trim(),
          addressAr: adminAddressAr.trim(),
          addressEn: adminAddressEn.trim(),
          googleMapsUrl: (adminGoogleMapsUrl || '').trim(),
          lat: coords.lat,
          lng: coords.lng,
          governorateAr: adminGovernorateAr.trim(),
          governorateEn: adminGovernorateEn.trim(),
          areaAr: adminAreaAr.trim(),
          areaEn: adminAreaEn.trim()
        },
        contact: {
          phone: adminPhone.trim(),
          whatsapp: adminWhatsapp.trim(),
          organizerName: adminOrganizerName.trim()
        },
        likesCount: 15,
        isFeatured: !!adminIsFeatured,
        isWeeklyPromo: !!adminIsWeeklyPromo,
        position: adminPosition ? (Number(adminPosition) || 999999) : 999999,
        showBookingButton: adminShowBookingButton,
        showViewsCount: adminShowViewsCount,
        bookingSubtextAr: adminBookingSubtextAr.trim(),
        bookingSubtextEn: adminBookingSubtextEn.trim()
      };
      
      // Save to Firestore and verify success
      const saveSuccess = await saveEventToFirestore(createdEvent);
      if (!saveSuccess) {
        throw new Error('Failed to save to Firestore');
      }


      // Save notification to Firestore so all clients get pushed
      const newNotifId = `notif-adm-${Date.now()}`;
      const newNotif = {
        id: newNotifId,
        titleAr: `🔥 إعلان جديد: ${createdEvent.titleAr}`,
        titleEn: `🔥 New Announcement: ${createdEvent.titleEn}`,
        messageAr: `تم إضافة حدث جديد في التصنيف "${createdEvent.category === 'party' ? 'سهرة' : createdEvent.category === 'course' ? 'دورة' : 'رحلة'}". تصفحه الآن!`,
        messageEn: `A new ${createdEvent.category} has been published. Explore details now!`,
        date: new Date().toISOString(),
        read: false,
        type: 'new_party' as const,
        relatedEventId: createdEvent.id
      };
      await saveNotificationToFirestore(newNotif);

      // Also create an AdSubmission so the admin can see it in their Profile -> My Ads
      if (user?.id) {
        try {
          const submissionId = `sub-adm-${Date.now()}`;
          await saveAdSubmissionToFirestore({
            id: submissionId,
            eventRef: newEventRef,
            invoiceNumber: `DWM-ADM-${Math.floor(100000 + Math.random() * 900000)}`,
            advertiserId: user.id,
            advertiserName: user.name || 'Admin',
            phone: adminPhone.trim(),
            titleAr: adminTitleAr.trim(),
            titleEn: adminTitleEn.trim(),
            category: adminCategory,
            styles: adminSelectedStyles,
            mediaType: adminMediaType,
            mediaUrl: finalMediaUrl,
            pricing: { days: 30, subtotal: 0, tax: 0, total: 0 },
            status: 'approved',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
            userRead: false,
            reviewedAt: new Date().toISOString(),
            eventData: createdEvent
          } as any);
        } catch (e) {
          console.error('Failed to create admin ad submission link:', e);
        }
      }

      // Send personal notification to all Admins with the event code and initial attendee count (0)
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const adminsCol = collection(db, 'users');
        const adminsQuery = query(adminsCol, where('isAdmin', '==', true));
        const adminsSnapshot = await getDocs(adminsQuery);
        const adminIds: string[] = [];
        adminsSnapshot.forEach(docSnap => {
          adminIds.push(docSnap.id);
        });

        // Ensure current admin's ID is included if not fetched
        if (user?.id && !adminIds.includes(user.id)) {
          adminIds.push(user.id);
        }

        for (const adminId of adminIds) {
          await saveNotificationToFirestore({
            id: `notif_adm_pub_${Date.now()}_${adminId}`,
            userId: adminId,
            type: 'system',
            titleAr: 'تم نشر إعلان إداري بنجاح! 🎉',
            titleEn: 'Your Admin Ad is Published! 🎉',
            messageAr: `تم نشر إعلانك الإداري "${createdEvent.titleAr}" بنجاح. كود الحدث (الرقم المرجعي): ${newEventRef}. عدد الحضور الفعلي حالياً: 0. استخدم هذا الكود لمتابعة الدخول وإدارة الحضور.`,
            messageEn: `Your admin ad "${createdEvent.titleEn}" has been published. Event Code: ${newEventRef}. Actual attendees count: 0. Use this code to manage check-ins.`,
            date: new Date().toISOString(),
            read: false
          });
        }
      } catch (e) {
        console.error('Failed to send admin publication notifications:', e);
      }

      setAdminSaveStatus('success');
      localStorage.removeItem(DRAFT_KEY);
      alert(lang === 'ar' 
        ? `🎉 تم النشر بنجاح! كود الحدث (الرقم المرجعي) الخاص بك هو: ${newEventRef}` 
        : `🎉 Published successfully! Your Event Code is: ${newEventRef}`);
      
      // Reset Admin Form Fields
      setAdminTitleAr('');
      setAdminTitleEn('');
      setAdminDescAr('');
      setAdminDescEn('');
      setAdminMediaUrl('');
      setAdminUploadedFileName(null);
      setAdminPendingFile(null);
      setHasAutoSetPosition(false);
      
      // Navigate to DB inspect
      setAdminSection('database');
      setDbSubTab('events');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Error publishing admin event:', err);
      setAdminSaveStatus('error');
      alert(lang === 'ar' ? '❌ فشل حفظ الإعلان في قاعدة البيانات. يرجى مراجعة الصلاحيات واتصال الإنترنت.' : '❌ Failed to store ad in database. Please check Firestore network connections.');
    }
  };

  const handleUploadBrandingImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'logo' | 'banner' | 'banner_en' | 'banner_mobile' | 'banner_mobile_en') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(lang === 'ar' ? 'الرجاء اختيار صورة.' : 'Please select an image.');
      return;
    }

    if (type === 'icon') {
      setIsUploadingIcon(true);
    } else if (type === 'banner') {
      setIsUploadingHeroBanner(true);
    } else if (type === 'banner_en') {
      setIsUploadingHeroBannerEn(true);
    } else if (type === 'banner_mobile') {
      setIsUploadingHeroBannerMobile(true);
    } else if (type === 'banner_mobile_en') {
      setIsUploadingHeroBannerMobileEn(true);
    } else {
      setIsUploadingLogo(true);
    }

    try {
      const compressedFile = await compressImage(file);
      const url = await uploadToCloudinary(compressedFile);

      if (url) {
        if (type === 'icon') {
          // Delete old icon if it's on Cloudinary
          if (formAppIconUrl && formAppIconUrl.includes('cloudinary.com') && formAppIconUrl !== appAssets?.app_icon_url) {
             deleteFromCloudinary(formAppIconUrl, 'image').catch(console.error);
          }
          setFormAppIconUrl(url);
        } else if (type === 'banner') {
          if (formHeroBannerUrl && formHeroBannerUrl.includes('cloudinary.com') && formHeroBannerUrl !== appAssets?.app_hero_banner_url) {
             deleteFromCloudinary(formHeroBannerUrl, 'image').catch(console.error);
          }
          setFormHeroBannerUrl(url);
        } else if (type === 'banner_en') {
          if (formHeroBannerUrlEn && formHeroBannerUrlEn.includes('cloudinary.com') && formHeroBannerUrlEn !== appAssets?.app_hero_banner_url_en) {
             deleteFromCloudinary(formHeroBannerUrlEn, 'image').catch(console.error);
          }
          setFormHeroBannerUrlEn(url);
        } else if (type === 'banner_mobile') {
          if (formHeroBannerMobileUrl && formHeroBannerMobileUrl.includes('cloudinary.com') && formHeroBannerMobileUrl !== appAssets?.app_hero_banner_mobile_url) {
            deleteFromCloudinary(formHeroBannerMobileUrl, 'image').catch(console.error);
          }
          setFormHeroBannerMobileUrl(url);
        } else if (type === 'banner_mobile_en') {
          if (formHeroBannerMobileUrlEn && formHeroBannerMobileUrlEn.includes('cloudinary.com') && formHeroBannerMobileUrlEn !== appAssets?.app_hero_banner_mobile_url_en) {
            deleteFromCloudinary(formHeroBannerMobileUrlEn, 'image').catch(console.error);
          }
          setFormHeroBannerMobileUrlEn(url);
        } else {
          // Delete old logo if it's on Cloudinary
          if (formAppLogoUrl && formAppLogoUrl.includes('cloudinary.com') && formAppLogoUrl !== appAssets?.app_logo_url) {
             deleteFromCloudinary(formAppLogoUrl, 'image').catch(console.error);
          }
          setFormAppLogoUrl(url);
        }
      } else {
        alert(lang === 'ar' ? 'فشل رفع الصورة.' : 'Failed to upload image.');
      }
    } catch (err) {
      console.error('Error uploading branding image:', err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء رفع الصورة.' : 'An error occurred during upload.');
    } finally {
      setIsUploadingIcon(false);
      setIsUploadingLogo(false);
      setIsUploadingHeroBanner(false);
      setIsUploadingHeroBannerEn(false);
      setIsUploadingHeroBannerMobile(false);
      setIsUploadingHeroBannerMobileEn(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    const updated = {
      appNameAr: formAppNameAr.trim(),
      appNameEn: formAppNameEn.trim(),
      app_icon_url: formAppIconUrl.trim(),
      app_logo_url: formAppLogoUrl.trim(),
      app_hero_banner_url: formHeroBannerUrl.trim(),
      app_hero_banner_url_en: formHeroBannerUrlEn.trim(),
      app_hero_banner_mobile_url: formHeroBannerMobileUrl.trim(),
      app_hero_banner_mobile_url_en: formHeroBannerMobileUrlEn.trim(),
      whatsappSupport: formWhatsappSupport.trim(),
      instagramUrl: formInstagramUrl.trim(),
      promoTitleAr: formPromoTitleAr.trim(),
      promoTitleEn: formPromoTitleEn.trim(),
      promoSubtitleAr: formPromoSubtitleAr.trim(),
      promoSubtitleEn: formPromoSubtitleEn.trim(),
      promoBadgeAr: formPromoBadgeAr.trim(),
      promoBadgeEn: formPromoBadgeEn.trim()
    };
    const ok = await updateBrandingAssets(updated);
    setSavingBranding(false);
    if (ok) {
      alert(lang === 'ar' ? '🎉 تم تحديث شعارات وهوية التطبيق وتخزينها في كوليكشن app_assets بنجاح!' : '🎉 App branding assets and links have been updated in "app_assets" collection successfully!');
    } else {
      alert(lang === 'ar' ? '❌ فشل تحديث البيانات في قاعدة البيانات.' : '❌ Failed to save changes to Firestore.');
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const query = userSearchQuery.trim().toLowerCase();
    if (!query) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers(
      (users) => {
        setAllUsers(users);
        setUsersError(null);
      },
      (err) => {
        setUsersError(err.message || String(err));
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (adminSection === 'security') {
      const unsubscribe = subscribeToSecurityViolations((violations) => {
        setSecurityViolations(violations);
      });
      return () => unsubscribe();
    }
  }, [adminSection]);

  const handleCleanUpClutter = async () => {
    setCleaningUp(true);
    try {
      const dbCount = await cleanUpDuplicateAds();
      alert(lang === 'ar' ? `تم فحص وتنظيف ${dbCount} من الإعلانات المكررة وبدون صور بنجاح لتقليل الزحمة!` : `Successfully cleaned up ${dbCount} duplicate and imageless ads!`);
    } catch (e) {
      console.error(e);
    } finally {
      setCleaningUp(false);
    }
  };

  const handleReorderAds = async () => {
    const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من إعادة ترتيب كل الإعلانات لتبدأ من 20 (مع الاحتفاظ بالبانر رقم 1)؟' : 'Are you sure you want to reorder all ads to start from 20 (keeping banner #1)?');
    if (!confirmed) return;
    try {
      await reorderAdsStartingFrom20();
      alert(lang === 'ar' ? 'تمت إعادة ترتيب الإعلانات بنجاح. قد تحتاج لتحديث الصفحة لرؤية التغييرات.' : 'Ads reordered successfully. You may need to refresh the page to see changes.');
    } catch (error) {
      console.error(error);
      alert('Error reordering ads.');
    }
  };

  const handleAssignAllAdsToAdmin = async () => {
    if (!user) return;
    const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من تعيين جميع الإعلانات لك كمسؤول؟' : 'Are you sure you want to assign all ads to yourself as admin?');
    if (!confirmed) return;
    
    setCleaningUp(true);
    try {
      const { collection, getDocs, updateDoc, writeBatch } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      
      const batch = writeBatch(db);
      
      // Update ad_submissions
      const subsSnap = await getDocs(collection(db, 'ad_submissions'));
      const existingSubEventIds = new Set<string>();
      
      subsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.eventData && data.eventData.id) {
          existingSubEventIds.add(data.eventData.id);
        } else if (data.id && (data.id.startsWith('ev-') || data.id.startsWith('ad_'))) {
          existingSubEventIds.add(data.id);
        }
        
        batch.update(doc.ref, {
          'eventData.createdByAdmin': true,
          'eventData.creatorId': user.id,
          'eventData.creatorName': user.name,
          'eventData.contact.organizerName': user.name,
          advertiserId: user.id,
          advertiserName: user.name
        });
      });

      // Update events and create missing submissions
      const eventsSnap = await getDocs(collection(db, 'events'));
      const { doc: firestoreDoc } = await import('firebase/firestore');
      
      eventsSnap.docs.forEach(docSnap => {
        batch.update(docSnap.ref, {
          createdByAdmin: true,
          creatorId: user.id,
          creatorName: user.name,
          'contact.organizerName': user.name
        });
        
        const evData = docSnap.data();
        if (!existingSubEventIds.has(docSnap.id)) {
           // Create a dummy ad submission so it shows in the admin's profile
           const newSubRef = firestoreDoc(collection(db, 'ad_submissions'));
           batch.set(newSubRef, {
             id: newSubRef.id,
             invoiceNumber: `INV-ADM-${Date.now().toString().slice(-4)}`,
             advertiserId: user.id,
             advertiserName: user.name,
             phone: evData.contact?.phone || user.phone || '201011223344',
             titleAr: evData.titleAr || 'إعلان أدمن',
             titleEn: evData.titleEn || 'Admin Ad',
             category: evData.category || 'party',
             styles: evData.styles || ['Salsa'],
             mediaType: evData.mediaType || 'image',
             mediaUrl: evData.mediaUrl || '',
             pricing: { days: 30, subtotal: 0, videoSurcharge: 0, total: 0 },
             status: 'approved',
             submittedAt: evData.uploadDate || new Date().toISOString(),
             eventData: {
               ...evData,
               createdByAdmin: true,
               creatorId: user.id,
               creatorName: user.name,
               contact: {
                 ...evData.contact,
                 organizerName: user.name
               }
             }
           });
        }
      });

      await batch.commit();

      // Update local events array
      events.forEach(ev => {
        ev.createdByAdmin = true;
        ev.creatorId = user.id;
        ev.creatorName = user.name;
        if (ev.contact) {
          ev.contact.organizerName = user.name;
        }
      });
      
      alert(lang === 'ar' ? 'تم تعيين الإعلانات لك بنجاح.' : 'Ads assigned to you successfully.');
    } catch (e) {
      console.error(e);
      alert(lang === 'ar' ? 'حدث خطأ.' : 'An error occurred.');
    } finally {
      setCleaningUp(false);
    }
  };

  useEffect(() => {
    const loadLocal = (): AdSubmission[] => {
      try {
        const local = JSON.parse(localStorage.getItem('dwm_ad_submissions') || '[]');
        return local as AdSubmission[];
      } catch (e) {
        return [];
      }
    };

    const mergeAndSet = (firebaseList: AdSubmission[]) => {
      const localList = loadLocal();
      const map = new Map<string, AdSubmission>();
      localList.forEach(item => map.set(item.id, item));
      firebaseList.forEach(item => map.set(item.id, item));
      
      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setSubmissions(merged);
      setLoading(false);
    };

    const initialLocal = loadLocal();
    if (initialLocal.length > 0) {
      setSubmissions(initialLocal);
      setLoading(false);
    }

    const unsubscribe = subscribeToAdSubmissions(
      (list) => {
        mergeAndSet(list);
      },
      user?.id,
      true
    );
    return () => unsubscribe();
  }, []);

  const handleManualRefresh = () => {
    if (manualRefreshing) return;
    setManualRefreshing(true);
    setLoading(true);
    
    const unsubscribe = subscribeToAdSubmissions(
      (list) => {
        const loadLocal = (): AdSubmission[] => {
        try {
          const local = JSON.parse(localStorage.getItem('dwm_ad_submissions') || '[]');
          return local as AdSubmission[];
        } catch (e) {
          return [];
        }
      };

      const localList = loadLocal();
      const map = new Map<string, AdSubmission>();
      localList.forEach(item => map.set(item.id, item));
      list.forEach(item => map.set(item.id, item));
      
      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setSubmissions(merged);
      setLoading(false);
      setManualRefreshing(false);
    });

    // Fallback/Safety timeout to clear loading if Firestore has no updates or is offline
    setTimeout(() => {
      setLoading(false);
      setManualRefreshing(false);
      unsubscribe();
    }, 2000);
  };

  const updateLocalStorageItem = (updatedSub: AdSubmission | null, deleteId?: string) => {
    try {
      let local: AdSubmission[] = JSON.parse(localStorage.getItem('dwm_ad_submissions') || '[]');
      if (deleteId) {
        local = local.filter(item => item.id !== deleteId);
      } else if (updatedSub) {
        const index = local.findIndex(item => item.id === updatedSub.id);
        if (index >= 0) {
          local[index] = updatedSub;
        } else {
          local.unshift(updatedSub);
        }
      }
      localStorage.setItem('dwm_ad_submissions', JSON.stringify(local));
      
      // Update state immediately
      setSubmissions(prev => {
        if (deleteId) return prev.filter(item => item.id !== deleteId);
        if (updatedSub) {
          const exists = prev.some(item => item.id === updatedSub.id);
          if (exists) return prev.map(item => item.id === updatedSub.id ? updatedSub : item);
          return [updatedSub, ...prev];
        }
        return prev;
      });
    } catch (e) {}
  };

  const handleApprove = async (sub: AdSubmission) => {
    setActionLoading(sub.id);
    try {
      const positionValue = submissionPositions[sub.id] !== undefined && submissionPositions[sub.id] !== '' 
        ? (Number(submissionPositions[sub.id]) || 999999) 
        : (sub.eventData?.position || Number(adminPosition) || 999999);

      // 1. Create and publish the actual event
      let maxRef = 1000;
      const assignedRefs = events.map(e => e.eventRef).filter((r): r is number => typeof r === 'number');
      if (assignedRefs.length > 0) {
        maxRef = Math.max(...assignedRefs);
      }
      const newEventRef = maxRef + 1;
      
      const eventId = sub.eventData?.id || `ev_${sub.adType || 'vip'}_${Date.now()}`;
      const promoDays = sub.pricing?.days || 30;
      
      let safeEventDate = sub.eventData?.eventDate;
      if (!safeEventDate || isNaN(new Date(safeEventDate).getTime()) || isEventExpired(safeEventDate)) {
        safeEventDate = new Date(Date.now() + promoDays * 86400000).toISOString();
      }

      const mediaUrlToUse = (sub.mediaUrl || sub.eventData?.mediaUrl || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80').trim();
      let thumbUrlToUse = (sub.thumbnailUrl || sub.eventData?.thumbnailUrl || mediaUrlToUse).trim();
      if (sub.mediaType === 'video' && mediaUrlToUse.includes('cloudinary.com')) {
        thumbUrlToUse = mediaUrlToUse.replace(/\.[^.]+$/, '.jpg');
      }

      const publishedEvent: DanceEvent = {
        id: eventId,
        titleAr: sub.eventData?.titleAr || sub.titleAr || 'إعلان جديد',
        titleEn: sub.eventData?.titleEn || sub.titleEn || 'New Published Ad',
        descriptionAr: sub.eventData?.descriptionAr || sub.descriptionAr || 'تفاصيل الإعلان والفعالية',
        descriptionEn: sub.eventData?.descriptionEn || sub.descriptionEn || 'Ad & Event details',
        category: sub.eventData?.category || sub.category || 'party',
        styles: sub.eventData?.styles || sub.styles || ['Salsa'],
        mediaType: sub.mediaType || sub.eventData?.mediaType || 'image',
        mediaUrl: mediaUrlToUse,
        thumbnailUrl: thumbUrlToUse,
        uploadDate: new Date().toISOString(),
        createdSource: 'approved_submission',
        eventDate: safeEventDate,
        priceAr: sub.eventData?.priceAr?.trim() || '',
        priceEn: sub.eventData?.priceEn?.trim() || '',
        location: sub.eventData?.location || {
          nameAr: 'القاهرة، مصر',
          nameEn: 'Cairo, Egypt',
          addressAr: 'القاهرة، مصر',
          addressEn: 'Cairo, Egypt',
          googleMapsUrl: '',
          lat: 30.0444,
          lng: 31.2357,
          governorateAr: 'القاهرة',
          governorateEn: 'Cairo',
          areaAr: 'القاهرة',
          areaEn: 'Cairo'
        },
        contact: sub.eventData?.contact || {
          organizerName: sub.advertiserName || 'المعلن',
          phone: sub.phone || '',
          whatsapp: sub.phone || ''
        },
        eventRef: newEventRef,
        likesCount: 15,
        viewsCount: 1,
        isFeatured: (sub.adType as string) === 'vip' || sub.eventData?.adType === 'vip',
        isWeeklyPromo: positionValue === 1,
        position: positionValue,
        adType: sub.adType || sub.eventData?.adType || 'standard',
        creatorId: sub.advertiserId || sub.eventData?.creatorId,
        creatorName: sub.advertiserName || sub.eventData?.creatorName,
        isEmpty: false
      };

      // Persist the event first and verify success before approving the submission.
      const eventSaved = await saveEventToFirestore(publishedEvent);
      if (!eventSaved) {
        throw new Error('Failed to publish event to Firestore; submission remains pending.');
      }
      // Keep local state in sync after the Firestore write succeeds.
      addNewEvent(publishedEvent);

      // 2. Update submission status in Firestore with expiration timestamp
      const expiresAtDate = new Date(Date.now() + promoDays * 86400000).toISOString();
      
      const updated: AdSubmission = { 
        ...sub,
        eventRef: newEventRef,
        status: 'approved',
        userRead: false,
        reviewedAt: new Date().toISOString(),
        expiresAt: expiresAtDate,
        eventData: publishedEvent
      };
      
      updateLocalStorageItem(updated);
      await saveAdSubmissionToFirestore(updated);
      
      // Send personal notification to the user with the event code and attendance count (initially 0)
      if (sub.advertiserId) {
        try {
          const { saveNotificationToFirestore } = await import('../../lib/firebase');
          await saveNotificationToFirestore({
            id: `notif_appr_${Date.now()}_${sub.id}`,
            userId: sub.advertiserId,
            type: 'system',
            titleAr: 'تم تفعيل إعلانك بنجاح! 🎉',
            titleEn: 'Your Ad is Approved! 🎉',
            messageAr: `تمت الموافقة على نشر إعلانك "${sub.titleAr}". كود الحدث (الرقم المرجعي) الخاص بك هو: ${newEventRef}. عدد الحضور الفعلي حالياً: 0. استخدم هذا الكود للبحث عن إعلانك أو لمشاركته مع الآخرين.`,
            messageEn: `Your ad "${sub.titleEn}" has been published. Your Event Code is: ${newEventRef}. Actual attendees count: 0. Use this code to search or share your ad.`,
            date: new Date().toISOString(),
            read: false
          });
        } catch (e) {
          console.error('Failed to send personal approval notification:', e);
        }
      }

      // Also send approval notification to all Admins containing Event Code, Advertiser, and Attendance Count
      try {
        const { saveNotificationToFirestore } = await import('../../lib/firebase');
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const adminsCol = collection(db, 'users');
        const adminsQuery = query(adminsCol, where('isAdmin', '==', true));
        const adminsSnapshot = await getDocs(adminsQuery);
        const adminIds: string[] = [];
        adminsSnapshot.forEach(docSnap => {
          adminIds.push(docSnap.id);
        });

        for (const adminId of adminIds) {
          await saveNotificationToFirestore({
            id: `notif_appr_adm_${Date.now()}_${adminId}_${sub.id}`,
            userId: adminId,
            type: 'system',
            titleAr: 'تمت الموافقة على إعلان ونشره! 📢',
            titleEn: 'Ad Approved & Published! 📢',
            messageAr: `تمت الموافقة على نشر إعلان "${sub.titleAr}". كود الحدث (الرقم المرجعي) الخاص به هو: ${newEventRef}. عدد الحضور الفعلي حالياً: 0. المعلن: ${sub.advertiserName || 'مستخدم'}.`,
            messageEn: `The ad "${sub.titleEn}" has been approved. Event Code: ${newEventRef}. Actual attendees count: 0. Advertiser: ${sub.advertiserName || 'User'}.`,
            date: new Date().toISOString(),
            read: false
          });
        }
      } catch (e) {
        console.error('Failed to send admin approval notification:', e);
      }

      alert(lang === 'ar' ? `✅ تم قبول ونشر الإعلان "${publishedEvent.titleAr}" بنجاح!` : `✅ Ad "${publishedEvent.titleEn}" approved and published successfully!`);
    } catch (err) {
      console.error('Error approving ad:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (sub: AdSubmission) => {
    setActionLoading(sub.id);
    try {
      const updated: AdSubmission = {
        ...sub,
        status: 'archived',
        archivedAt: new Date().toISOString()
      };
      
      await saveAdSubmissionToFirestore(updated);

    } finally {
      setActionLoading(null);
    }
  };

  const handleAutoScanExpired = async () => {
    const activeAds = submissions.filter(s => s.status === 'approved');
    let archivedCount = 0;
    for (const sub of activeAds) {
      const expired = sub.expiresAt ? new Date(sub.expiresAt).getTime() <= Date.now() : false;
      if (expired) {
        await handleArchive(sub);
        archivedCount++;
      }
    }
    if (archivedCount > 0) {
      alert(lang === 'ar' ? `تم نقل ${archivedCount} إعلان منقضي إلى الأرشيف وإرسال التنبيهات للمعلنين!` : `Successfully archived ${archivedCount} expired ads and notified advertisers!`);
    } else {
      alert(lang === 'ar' ? 'لا توجد إعلانات منتهية الصلاحية حالياً في قائمة المفعلة.' : 'No expired ads found in currently approved list.');
    }
  };

  const handleReject = async (sub: AdSubmission) => {
    setActionLoading(sub.id);
    try {
      const updated: AdSubmission = {
        ...sub,
        status: 'rejected',
        userRead: false,
        reviewedAt: new Date().toISOString()
      };
      
      await saveAdSubmissionToFirestore(updated);

    } finally {
      setActionLoading(null);
    }
  };

  const handlePurgeEventCompletely = async (eventId: string, eventTitle: string) => {
    const confirmed = await triggerConfirm(
      lang === 'ar' 
        ? `هل أنت متأكد من حذف الفعالية "${eventTitle}" وكل حجوزاتها المتعلقة بها بالكامل لتوفير المساحة؟ هذا الإجراء لا يمكن التراجع عنه!`
        : `Are you sure you want to completely delete the event "${eventTitle}" and ALL its related bookings to save space? This action cannot be undone!`
    );

    if (confirmed) {
      setActionLoading(eventId);
      try {
        const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');

        // 1. Delete all bookings
        const bookingsCol = collection(db, 'bookings');
        const bQuery = query(bookingsCol, where('eventId', '==', eventId));
        const bSnap = await getDocs(bQuery);
        for (const bDoc of bSnap.docs) {
          await deleteDoc(bDoc.ref);
        }

        // 2. Clear out the event and its media (preserves the position slot)
        deleteEvent(eventId);

        // 3. Delete associated ad submission if any
        const ev = events.find(e => e.id === eventId);
        if (ev && ev.eventRef) {
          const adsCol = collection(db, 'ad_submissions');
          const adsQuery = query(adsCol, where('eventRef', '==', ev.eventRef));
          const adsSnap = await getDocs(adsQuery);
          for (const adDoc of adsSnap.docs) {
            await deleteDoc(adDoc.ref);
          }
        }

        alert(lang === 'ar' ? 'تم مسح الفعالية وكل المتعلقات بها بنجاح.' : 'Event and all related data purged successfully.');
      } catch (err) {
        console.error('Error purging event:', err);
        alert(lang === 'ar' ? 'حدث خطأ أثناء مسح البيانات.' : 'Error purging data.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const sub = submissions.find(s => s.id === id);
    const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا السجل وجميع البيانات المرتبطة به نهائياً؟' : 'Are you sure you want to delete this record and all associated data permanently?');
    if (confirmed) {
      updateLocalStorageItem(null, id);
      
      if (sub) {
        // Delete media from Cloudinary
        if (sub.mediaUrl) {
          await deleteFromCloudinary(sub.mediaUrl, sub.mediaType || 'image').catch(console.error);
        }
        if (sub.receiptUrl) {
          await deleteFromCloudinary(sub.receiptUrl, 'image').catch(console.error);
        }
        
        // Delete associated Event if it exists
        if (sub.eventData?.id) {
          try {
            const { deleteEventFromFirestore, deleteBookingFromFirestore } = await import('../../lib/firebase');
            const eventId = sub.eventData.id;
            await deleteEventFromFirestore(eventId);
            
            // Delete associated bookings
            if (bookings) {
              const associatedBookings = bookings.filter(b => b.eventId === eventId);
              for (const bkg of associatedBookings) {
                if (bkg.receiptUrl) {
                  await deleteFromCloudinary(bkg.receiptUrl, 'image').catch(console.error);
                }
                await deleteBookingFromFirestore(bkg.id);
              }
            }
          } catch (e) {
            console.error('Failed to delete associated event or bookings', e);
          }
        }
      }
      
      await deleteAdSubmissionFromFirestore(id);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      project: resolvedFirebaseConfig.projectId || 'Unknown',
      firestoreDbId: databaseId || '(default)',
      exportedAt: new Date().toISOString(),
      collections: {
        events: events,
        ad_submissions: submissions,
        notifications: notifications
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dwm_firebase_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });


  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitleAr || !notifTitleEn || !notifMessageAr || !notifMessageEn) {
      alert(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setNotifSending(true);
    try {
      await saveNotificationToFirestore({
        id: `notif_admin_${Date.now()}`,
        titleAr: notifTitleAr,
        titleEn: notifTitleEn,
        messageAr: notifMessageAr,
        messageEn: notifMessageEn,
        type: notifType,
        date: new Date().toISOString(),
        read: false
      });

      let pushStatusMsg = '';
      if (sendMobilePush) {
        const pushRes = await sendBroadcastPushNotification({
          title: notifTitleAr,
          body: notifMessageAr,
          url: '/'
        });
        if (pushRes.success) {
          pushStatusMsg = lang === 'ar' 
            ? `\n📱 وتم إرسال إشعار فوري للشاشات (${pushRes.sentCount || 0} جهاز متصل)`
            : `\n📱 Push alert delivered to (${pushRes.sentCount || 0} devices)`;
        }
      }

      playNotificationChime();
      alert((lang === 'ar' ? 'تم إرسال الإشعار بنجاح!' : 'Notification sent successfully!') + pushStatusMsg);
      setNotifTitleAr('');
      setNotifTitleEn('');
      setNotifMessageAr('');
      setNotifMessageEn('');
    } catch (err) {
      console.error('Error sending notification:', err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء إرسال الإشعار' : 'Error sending notification');
    } finally {
      setNotifSending(false);
    }
  };

  const handleDeleteAllNotifications = async () => {
    const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من حذف جميع الإشعارات السابقة من قاعدة البيانات؟ لا يمكن التراجع عن هذه العملية.' : 'Are you sure you want to delete all previous notifications from the database? This cannot be undone.');
    if (confirmed) {
      setNotifSending(true);
      try {
        await deleteAllNotificationsFromFirestore();
        alert(lang === 'ar' ? 'تم حذف جميع الإشعارات السابقة بنجاح' : 'All previous notifications deleted successfully');
      } catch (err) {
        console.error('Error deleting notifications:', err);
        alert(lang === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting notifications');
      } finally {
        setNotifSending(false);
      }
    }
  };
  return (
    <div className="w-full max-w-5xl mx-auto pt-2 pb-36 sm:pb-44" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Receipt & JSON Preview Modals */}
      <AnimatePresence>
        {viewingAttendeesEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative max-w-4xl w-full max-h-[85vh] rounded-3xl overflow-hidden bg-neutral-900 border border-indigo-500/40 p-5 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-indigo-400" />
                  <span className="font-extrabold text-white text-base">
                    {lang === 'ar' ? '🎟️ سجل حضور وحجوزات الفعالية:' : '🎟️ Event Guest & Attendance Sheet:'} <strong className="text-amber-400">{lang === 'ar' ? viewingAttendeesEvent.titleAr : viewingAttendeesEvent.titleEn}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setViewingAttendeesEvent(null)}
                  className="p-1.5 rounded-full bg-neutral-800 text-white hover:bg-red-500 transition-colors cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Stats Bar */}
              {(() => {
                const eventBookings = bookings?.filter(b => b.eventId === viewingAttendeesEvent.id) || [];
                const totalBookedCount = eventBookings.reduce((sum, b) => sum + (b.numberOfIndividuals || 1), 0);
                const actualAttendedCount = eventBookings
                  .filter(b => b.status === 'approved' && b.attended === true)
                  .reduce((sum, b) => sum + (b.numberOfIndividuals || 1), 0);
                const totalRevenue = eventBookings
                  .filter(b => b.status === 'approved' && b.attended === true)
                  .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

                return (
                  <div className="space-y-3 my-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-center">
                        <span className="text-neutral-500 text-[10px] block font-bold uppercase">{lang === 'ar' ? 'إجمالي الحجوزات' : 'Total Registered'}</span>
                        <span className="text-white text-lg font-black">{totalBookedCount}</span>
                      </div>
                      <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-center">
                        <span className="text-neutral-500 text-[10px] block font-bold uppercase">{lang === 'ar' ? 'الحضور الفعلي' : 'Actual Check-in'}</span>
                        <span className="text-emerald-400 text-lg font-black">{actualAttendedCount}</span>
                      </div>
                      <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-center">
                        <span className="text-neutral-500 text-[10px] block font-bold uppercase">{lang === 'ar' ? 'المستحقات المحسوبة' : 'Revenue Collected'}</span>
                        <span className="text-indigo-400 text-lg font-black font-mono">{totalRevenue} EGP</span>
                      </div>
                    </div>

                    {/* Staff Security Status Bar for Admin */}
                    <div className="bg-neutral-950 p-3 rounded-2xl border border-indigo-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span className="font-bold text-neutral-300">
                          {lang === 'ar' ? 'إعدادات أمن البوابة:' : 'Gate Security Mode:'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px]">
                          {viewingAttendeesEvent.staffSettings?.mode === 'restricted' 
                            ? (lang === 'ar' ? '🔒 موظفين محددين برقم سري' : '🔒 Restricted (PIN required)')
                            : (lang === 'ar' ? '🔓 السماح لأي شخص بالمسح' : '🔓 Anyone authorized')}
                        </span>
                      </div>

                      {viewingAttendeesEvent.staffSettings?.mode === 'restricted' && viewingAttendeesEvent.staffSettings?.staffList && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {viewingAttendeesEvent.staffSettings.staffList.map((s, idx) => (
                            <span 
                              key={idx}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                                s.isActive 
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
                                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
                              }`}
                            >
                              <span>{s.name}</span>
                              <span className="text-amber-400 font-bold">({s.pin})</span>
                              <span>{s.isActive ? '🟢' : '🔴'}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Table / List */}
              <div className="flex-1 overflow-auto bg-neutral-950 rounded-2xl p-4 border border-white/5">
                {(() => {
                  const eventBookings = bookings?.filter(b => b.eventId === viewingAttendeesEvent.id) || [];
                  if (eventBookings.length === 0) {
                    return (
                      <div className="text-center py-10 text-neutral-500 text-xs font-bold">
                        {lang === 'ar' ? 'لا توجد حجوزات مسجلة لهذه الفعالية بعد.' : 'No reservations registered for this event yet.'}
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-800 text-neutral-500 text-[10px] uppercase font-bold text-start">
                          <th className="pb-2.5 text-start">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                          <th className="pb-2.5 text-start">{lang === 'ar' ? 'الهاتف' : 'Phone'}</th>
                          <th className="pb-2.5 text-center">{lang === 'ar' ? 'الأفراد' : 'Guests'}</th>
                          <th className="pb-2.5 text-end">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                          <th className="pb-2.5 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                          <th className="pb-2.5 text-end">{lang === 'ar' ? 'تأكيد الحضور البوابة' : 'Check-In Gate'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {eventBookings.map((b) => (
                          <tr key={b.id} className="text-neutral-300 hover:bg-neutral-900/50">
                            <td className="py-3 font-semibold text-white">{b.userName}</td>
                            <td className="py-3 font-mono">{b.userPhone}</td>
                            <td className="py-3 text-center font-bold text-neutral-100">{String(b.numberOfIndividuals || 1)}</td>
                            <td className="py-3 text-end font-mono font-bold text-amber-500">{String(b.totalAmount || 0)} ج.م</td>
                            <td className="py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                b.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                b.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {lang === 'ar' ? 
                                  (b.status === 'approved' ? 'مقبول' : b.status === 'rejected' ? 'مرفوض' : 'معلق') :
                                  b.status
                                }
                              </span>
                            </td>
                            <td className="py-3 text-end">
                              {b.attended ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-emerald-400 font-extrabold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    {lang === 'ar' ? 'حضر' : 'Attended'}
                                  </span>
                                  {b.attendedByStaffName && (
                                    <span className="text-[10px] text-indigo-300 font-bold mt-0.5 flex items-center gap-1">
                                      👮 {b.attendedByStaffName}
                                      {b.attendedByGateNumber && (
                                        <span className="text-neutral-400 bg-neutral-800/50 px-1 rounded-sm">
                                          ({lang === 'ar' ? 'بوابة' : 'Gate'} {b.attendedByGateNumber})
                                        </span>
                                      )}
                                    </span>
                                  )}
                                  {b.attendedAt && (
                                    <span className="text-[9px] text-neutral-500 font-mono mt-0.5">
                                      {new Date(b.attendedAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-neutral-500 text-[10px]">
                                  {lang === 'ar' ? 'لم يحضر بعد' : 'Not arrived yet'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}

        {selectedJsonDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative max-w-3xl w-full max-h-[85vh] rounded-3xl overflow-hidden bg-neutral-900 border border-blue-500/40 p-4 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 px-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-400" />
                  <span className="font-bold text-white text-sm font-mono">
                    {selectedJsonDoc.title} ({selectedJsonDoc.id})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedJsonDoc(null)}
                  className="p-1.5 rounded-full bg-neutral-800 text-white hover:bg-red-500 transition-colors cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-neutral-950 rounded-2xl my-3 border border-white/5 font-mono text-xs text-blue-300 leading-relaxed text-left" dir="ltr">
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(selectedJsonDoc.data, null, 2)}</pre>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedJsonDoc.data, null, 2));
                    alert(lang === 'ar' ? 'تم نسخ الـ JSON للحافظة!' : 'JSON copied to clipboard!');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'نسخ الكود (Copy JSON)' : 'Copy JSON'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative max-w-2xl w-full max-h-[85vh] rounded-3xl overflow-hidden bg-neutral-900 border border-amber-500/40 p-3 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 px-2 border-b border-white/10">
                <span className="font-bold text-white text-sm">
                  {lang === 'ar' ? 'إيصال التحويل البنكي أو إنستاباي' : 'Bank Transfer Receipt'}
                </span>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-full bg-neutral-800 text-white hover:bg-red-500 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
                <img src={selectedReceipt} alt="Receipt" className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-lg" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Admin Quick Navigation Tabs (Pills) */}
      <div className="mb-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-1.5 shadow-sm sticky top-14 sm:top-18 z-30 transition-all">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {[
            {
              id: null,
              label: lang === 'ar' ? 'الرئيسية' : 'Overview',
              icon: LayoutDashboard,
              badge: null,
            },
            {
              id: 'submissions',
              label: lang === 'ar' ? 'طلبات الإعلانات' : 'Ads Submissions',
              icon: Crown,
              badge: submissions.filter(s => s.status === 'pending').length || null,
              badgeColor: 'bg-amber-500 text-neutral-950',
            },
            {
              id: 'bookings',
              label: lang === 'ar' ? 'حجوزات التذاكر' : 'Bookings',
              icon: Ticket,
              badge: bookings.filter(b => b.status === 'pending').length || null,
              badgeColor: 'bg-emerald-500 text-neutral-950',
            },
            {
              id: 'create_ad_admin',
              label: lang === 'ar' ? 'إنشاء إعلان' : 'Create Ad',
              icon: Plus,
              badge: null,
            },
            {
              id: 'users',
              label: lang === 'ar' ? 'المستخدمين' : 'Users',
              icon: Users,
              badge: allUsers.length > 0 ? allUsers.length : null,
              badgeColor: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30',
            },
            {
              id: 'support',
              label: lang === 'ar' ? 'الدعم والمقترحات' : 'Support',
              icon: MessageSquare,
              badge: supportMessages.filter(m => !m.reply).length || null,
              badgeColor: 'bg-emerald-500 text-neutral-950',
            },
            {
              id: 'analytics',
              label: lang === 'ar' ? 'الإحصائيات' : 'Analytics',
              icon: BarChart3,
              badge: null,
            },
            {
              id: 'database',
              label: lang === 'ar' ? 'قاعدة البيانات' : 'Database',
              icon: Database,
              badge: null,
            },
            {
              id: 'pricing',
              label: lang === 'ar' ? 'الأسعار' : 'Pricing',
              icon: DollarSign,
              badge: null,
            },
            {
              id: 'branding',
              label: lang === 'ar' ? 'الهوية والشعارات' : 'Branding',
              icon: Sparkles,
              badge: null,
            },
            {
              id: 'security',
              label: lang === 'ar' ? 'الأمان والاختراق' : 'Security',
              icon: ShieldAlert,
              badge: null,
            },
            {
              id: 'send_notifications',
              label: lang === 'ar' ? 'إرسال تنبيه' : 'Alerts',
              icon: Bell,
              badge: null,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminSection === tab.id;
            return (
              <button
                key={tab.id || 'overview'}
                onClick={() => {
                  setAdminSection(tab.id as any);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 shadow-sm font-black'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'stroke-[2.5]' : 'opacity-70'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight ${
                    isActive ? 'bg-neutral-950 text-amber-400' : (tab.badgeColor || 'bg-amber-500 text-neutral-950')
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Admin Section View Header or welcome dashboard menu */}
      {adminSection !== null ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
              adminSection === 'submissions' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400' :
              adminSection === 'database' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400' :
              adminSection === 'support' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400' :
              adminSection === 'security' ? 'bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400' :
              adminSection === 'branding' ? 'bg-pink-500/10 border border-pink-500/30 text-pink-500 dark:text-pink-400' :
              adminSection === 'pricing' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400' :
              adminSection === 'analytics' ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 dark:text-cyan-400' :
              adminSection === 'create_ad_admin' ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400' :
              adminSection === 'bookings' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400' :
              adminSection === 'send_notifications' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400' :
              'bg-purple-500/10 border border-purple-500/30 text-purple-500 dark:text-purple-400'
            }`}>
              {adminSection === 'submissions' && <Crown className="h-5 w-5" />}
              {adminSection === 'database' && <Database className="h-5 w-5 animate-pulse" />}
              {adminSection === 'support' && <MessageSquare className="h-5 w-5" />}
              {adminSection === 'users' && <Users className="h-5 w-5" />}
              {adminSection === 'security' && <ShieldAlert className="h-5 w-5" />}
              {adminSection === 'branding' && <Sparkles className="h-5 w-5 animate-pulse" />}
              {adminSection === 'pricing' && <DollarSign className="h-5 w-5" />}
              {adminSection === 'analytics' && <BarChart3 className="h-5 w-5" />}
              {adminSection === 'create_ad_admin' && <FilePlus className="h-5 w-5 animate-pulse" />}
              {adminSection === 'bookings' && <FileText className="h-5 w-5" />}
              {adminSection === 'send_notifications' && <Bell className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                  {adminSection === 'submissions' && (lang === 'ar' ? 'مراجعة طلبات الإعلانات VIP' : 'VIP Ad Submissions')}
                  {adminSection === 'database' && (lang === 'ar' ? 'مستكشف قاعدة البيانات المباشر' : 'Live Database Inspector')}
                  {adminSection === 'support' && (lang === 'ar' ? 'صندوق رسائل ومقترحات التطبيق' : 'Support Messages & Feedback')}
                  {adminSection === 'users' && (lang === 'ar' ? 'إدارة ومراقبة مستخدمي التطبيق' : 'App Users Management')}
                  {adminSection === 'security' && (lang === 'ar' ? 'إدارة الأمان وجدار الحماية' : 'Security Firewall & Logs')}
                  {adminSection === 'branding' && (lang === 'ar' ? 'هوية التطبيق والشعارات' : 'App Identity & Assets')}
                  {adminSection === 'pricing' && (lang === 'ar' ? 'التحكم في أسعار الإعلانات' : 'Manage Ad Prices')}
                  {adminSection === 'analytics' && (lang === 'ar' ? 'إحصائيات زوار الموقع والتفاعل' : 'Real-time Analytics')}
                  {adminSection === 'create_ad_admin' && (lang === 'ar' ? 'إنشاء إعلان / حفلة جديدة فوراً' : 'Create & Publish Event (Admin)')}
                  {adminSection === 'bookings' && (lang === 'ar' ? 'مراجعة وتأكيد حجوزات التذاكر' : 'Ticket Bookings Panel')}
                  {adminSection === 'send_notifications' && (lang === 'ar' ? 'إرسال التنبيهات لجميع الأعضاء' : 'Broadcast Push Alerts')}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold text-[10px] hidden sm:inline-block">
                  SECTION
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                {adminSection === 'submissions' && (lang === 'ar' ? 'مراجعة وتفعيل الإعلانات الفاخرة وتتبع إيصالات التحويل البنكي.' : 'Manage premium ad campaigns, analyze bank receipts, and activate VIP slots.')}
                {adminSection === 'database' && (lang === 'ar' ? 'استعراض البيانات والفعاليات والإشعارات وحذف المخلفات بشكل مباشر.' : 'Real-time viewer of live Firestore collections, schemas, and events.')}
                {adminSection === 'support' && (lang === 'ar' ? 'التواصل المباشر وحل المشاكل التقنية للأعضاء وإرسال الردود الرسمية.' : 'Read user feedback and inquiries directly and send notifications.')}
                {adminSection === 'users' && (lang === 'ar' ? 'البحث عن الحسابات بالأرقام السرية أو الإيميل، تجميد أو حذف الأعضاء.' : 'Audit member profiles, passwords, registration dates, suspend or delete records.')}
                {adminSection === 'security' && (lang === 'ar' ? 'تغيير العبارة السرية، مراقبة محاولات الاختراق، عناوين الـ IP للمهاجمين.' : 'Update VIP secret code, monitor unauthorized access logs, and block IPs.')}
                {adminSection === 'branding' && (lang === 'ar' ? 'تعديل وتخصيص أسماء التطبيق وشعاراته وأيقوناته وروابط الاتصال.' : 'Modify app names, icons, brand logos, support contact phone, and other static assets.')}
                {adminSection === 'pricing' && (lang === 'ar' ? 'تعديل وتحديد قيمة حجز الإعلان المميز والعادي لكل أسبوع أو يوم.' : 'Configure prices for VIP and Standard ads per week/day, and set video surcharge.')}
                {adminSection === 'analytics' && (lang === 'ar' ? 'تحليل حركة المرور الحية، واهتمامات الراقصين بالأنماط المختلفة.' : 'Live traffic insights, style-specific popularity heatmaps, and click rates.')}
                {adminSection === 'create_ad_admin' && (lang === 'ar' ? 'نموذج لوحة الإدارة المتكامل لإنشاء ونشر الفعاليات وتثبيتها وتحديد ترتيب ظهورها.' : 'Admin panel integrated form to compose, publish, pin, and prioritize events directly.')}
                {adminSection === 'bookings' && (lang === 'ar' ? 'التحقق من إيصالات تحويل فودافون كاش وإنستاباي ومطابقة المبالغ وإصدار الباركود.' : 'Verify transfer receipts, match paid amounts, and activate barcodes/entry keys.')}
                {adminSection === 'send_notifications' && (lang === 'ar' ? 'إرسال إشعار فوري في جرس التنبيهات لجميع أعضاء التطبيق.' : 'Broadcast real-time push alert to the notification bell for all members.')}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setAdminSection(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 px-3.5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer self-start sm:self-center shrink-0 shadow-xs"
          >
            <ArrowLeft className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span>{lang === 'ar' ? 'الرجوع للمركز الرئيسي' : 'Back to Overview'}</span>
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Top Banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 p-4 sm:p-5 shadow-md relative overflow-hidden transition-all text-white"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-neutral-950 shadow-md shrink-0">
                  <Crown className="h-6 w-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      {lang === 'ar' ? 'مركز قيادة لوحة التحكم' : 'Executive Admin Dashboard'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-neutral-950 font-black text-[10px] uppercase">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 font-medium mt-0.5">
                    {lang === 'ar' 
                      ? 'إدارة متكاملة لاعتماد الإعلانات، تأكيد حجوزات التذاكر، مراقبة المستخدمين، والأمان' 
                      : 'Integrated management for ad approvals, ticket bookings, user audit, and security'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap justify-end">
                <button
                  onClick={handleAssignAllAdsToAdmin}
                  disabled={cleaningUp}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-purple-500/30 px-3 py-2 text-xs font-bold text-purple-300 transition-all cursor-pointer shadow-xs"
                  title="نقل جميع الإعلانات الحالية لملفك الشخصي (أدمن)"
                >
                  <User className={`h-3.5 w-3.5 ${cleaningUp ? 'animate-spin' : ''}`} />
                  <span>{cleaningUp ? (lang === 'ar' ? 'جاري النقل...' : 'Transferring...') : (lang === 'ar' ? 'نقل الإعلانات لي' : 'Assign to Me')}</span>
                </button>

                <button
                  onClick={handleCleanUpClutter}
                  disabled={cleaningUp}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 transition-all cursor-pointer shadow-xs"
                  title="حذف الإعلانات المكررة وبدون صور لتقليل الزحمة"
                >
                  <Trash2 className={`h-3.5 w-3.5 ${cleaningUp ? 'animate-spin' : ''}`} />
                  <span>{cleaningUp ? (lang === 'ar' ? 'تنظيف الزحمة' : 'Clean Clutter') : (lang === 'ar' ? '🧹 تنظيف الزحمة' : '🧹 Clean Clutter')}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('explore');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 px-3.5 py-2 text-xs font-bold text-neutral-200 hover:text-white transition-all border border-neutral-700/60 shadow-xs cursor-pointer"
                >
                  <ArrowLeft className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  <span>{lang === 'ar' ? 'الرئيسية' : 'Explore'}</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Interactive KPI Quick Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div 
              onClick={() => { setAdminSection('submissions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 hover:border-amber-500 dark:hover:border-amber-500/60 p-3 sm:p-3.5 text-center shadow-xs cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                <span>{lang === 'ar' ? 'طلبات إعلانات معلقة' : 'Pending Ads'}</span>
                <Crown className="h-3.5 w-3.5 text-amber-500 opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {submissions.filter(s => s.status === 'pending').length}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">/ {submissions.length}</span>
              </div>
            </div>

            <div 
              onClick={() => { setAdminSection('bookings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 hover:border-emerald-500 dark:hover:border-emerald-500/60 p-3 sm:p-3.5 text-center shadow-xs cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                <span>{lang === 'ar' ? 'حجوزات تذاكر معلقة' : 'Pending Bookings'}</span>
                <Ticket className="h-3.5 w-3.5 text-emerald-500 opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {bookings.filter(b => b.status === 'pending').length}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">/ {bookings.length}</span>
              </div>
            </div>

            <div 
              onClick={() => { setAdminSection('support'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 hover:border-cyan-500 dark:hover:border-cyan-500/60 p-3 sm:p-3.5 text-center shadow-xs cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                <span>{lang === 'ar' ? 'رسائل دعم معلقة' : 'Unreplied Support'}</span>
                <MessageSquare className="h-3.5 w-3.5 text-cyan-500 opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  {supportMessages.filter(m => !m.reply).length}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">/ {supportMessages.length}</span>
              </div>
            </div>

            <div 
              onClick={() => { setAdminSection('database'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 hover:border-blue-500 dark:hover:border-blue-500/60 p-3 sm:p-3.5 text-center shadow-xs cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                <span>{lang === 'ar' ? 'فعاليات بالقاعدة' : 'Live Events'}</span>
                <Database className="h-3.5 w-3.5 text-blue-500 opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {events.length}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">{lang === 'ar' ? 'فعالية' : 'events'}</span>
              </div>
            </div>
          </div>

          {/* Urgent Attention Banner (If pending items exist) */}
          {(submissions.some(s => s.status === 'pending') || bookings.some(b => b.status === 'pending') || supportMessages.some(m => !m.reply)) && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-200">
                    {lang === 'ar' ? 'تنبيه: لديك عناصر معلقة تتطلب الإجراء الآن' : 'Attention: Pending items require your review'}
                  </h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    {lang === 'ar' 
                      ? `${submissions.filter(s => s.status === 'pending').length} إعلان معلق • ${bookings.filter(b => b.status === 'pending').length} حجز تذاكر معلق • ${supportMessages.filter(m => !m.reply).length} رسالة دعم`
                      : `${submissions.filter(s => s.status === 'pending').length} pending ads • ${bookings.filter(b => b.status === 'pending').length} pending bookings • ${supportMessages.filter(m => !m.reply).length} unreplied support`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {submissions.some(s => s.status === 'pending') && (
                  <button
                    onClick={() => { setAdminSection('submissions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-black transition-colors cursor-pointer shadow-xs"
                  >
                    {lang === 'ar' ? 'مراجعة الإعلانات ➔' : 'Review Ads ➔'}
                  </button>
                )}
                {bookings.some(b => b.status === 'pending') && (
                  <button
                    onClick={() => { setAdminSection('bookings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
                  >
                    {lang === 'ar' ? 'مراجعة الحجوزات ➔' : 'Review Bookings ➔'}
                  </button>
                )}
                {supportMessages.some(m => !m.reply) && (
                  <button
                    onClick={() => { setAdminSection('support'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
                  >
                    {lang === 'ar' ? 'صندوق الدعم ➔' : 'Support Inbox ➔'}
                  </button>
                )}
              </div>
            </div>
          )}

          {usersError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3.5 text-red-900 dark:text-red-200 text-xs space-y-1.5 shadow-xs">
              <p className="font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>
                  {lang === 'ar' 
                    ? '⚠️ تنبيه قاعدة البيانات: فشل تحميل قائمة المستخدمين بسبب صلاحيات الوصول!' 
                    : '⚠️ Database Warning: Failed to load user profiles due to permissions!'}
                </span>
              </p>
              <p className="opacity-90 text-[11px] leading-relaxed">
                {lang === 'ar'
                  ? 'لم يستجب خادم Firebase بعرض بيانات الأعضاء لأنك غير مسجل الدخول ببريد المسؤول المعتمد (waelvts@gmail.com) في نظام التوثيق. يرجى الانتقال إلى قسم "حسابي" وتسجيل الدخول ببريد المسؤول أولاً.'
                  : 'Firebase rejected reading the users collection because your session is not authenticated as the designated admin email (waelvts@gmail.com). Please sign in using the admin email.'}
              </p>
            </div>
          )}

          {/* Compact Modern Dashboard Grid (11 Modules) */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                {lang === 'ar' ? 'أقسام ووحدات التحكم' : 'Control Modules'}
              </h3>
              <span className="text-[11px] font-bold text-neutral-400">
                11 {lang === 'ar' ? 'وحدة متكاملة' : 'Modules'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {[
                {
                  id: 'submissions',
                  title: lang === 'ar' ? 'طلبات الإعلانات VIP' : 'VIP Ad Submissions',
                  desc: lang === 'ar' ? 'اعتماد الإعلانات وفحص الإيصالات' : 'Approve ads & check receipts',
                  icon: Crown,
                  color: 'amber',
                  badge: submissions.filter(s => s.status === 'pending').length > 0 
                    ? `${submissions.filter(s => s.status === 'pending').length} ${lang === 'ar' ? 'معلق' : 'Pending'}` 
                    : null,
                  badgeType: 'amber'
                },
                {
                  id: 'bookings',
                  title: lang === 'ar' ? 'حجوزات التذاكر' : 'Ticket Bookings',
                  desc: lang === 'ar' ? 'مطابقة إيصالات فودافون كاش وتأكيد الباركود' : 'Match receipts & issue barcodes',
                  icon: Ticket,
                  color: 'emerald',
                  badge: bookings.filter(b => b.status === 'pending').length > 0 
                    ? `${bookings.filter(b => b.status === 'pending').length} ${lang === 'ar' ? 'معلق' : 'Pending'}` 
                    : null,
                  badgeType: 'emerald'
                },
                {
                  id: 'create_ad_admin',
                  title: lang === 'ar' ? 'إنشاء إعلان فوري' : 'Create Event (Admin)',
                  desc: lang === 'ar' ? 'نشر مباشر وتثبيت وترتيب الفعاليات' : 'Instant publish & pin order',
                  icon: Plus,
                  color: 'indigo',
                  badge: 'ADMIN',
                  badgeType: 'indigo'
                },
                {
                  id: 'users',
                  title: lang === 'ar' ? 'مستخدمي التطبيق' : 'App Users Audit',
                  desc: lang === 'ar' ? 'بحث بالحسابات، تجميد وحذف الأعضاء' : 'Search profiles & suspend users',
                  icon: Users,
                  color: 'purple',
                  badge: allUsers.length > 0 ? `${allUsers.length} ${lang === 'ar' ? 'عضو' : 'Users'}` : null,
                  badgeType: 'purple'
                },
                {
                  id: 'support',
                  title: lang === 'ar' ? 'رسائل ومقترحات الدعم' : 'Support Inbox',
                  desc: lang === 'ar' ? 'الرد على الأعضاء وإرسال التنبيهات' : 'Reply & send system alerts',
                  icon: MessageSquare,
                  color: 'cyan',
                  badge: supportMessages.filter(m => !m.reply).length > 0 
                    ? `${supportMessages.filter(m => !m.reply).length} ${lang === 'ar' ? 'جديد' : 'New'}` 
                    : null,
                  badgeType: 'cyan'
                },
                {
                  id: 'analytics',
                  title: lang === 'ar' ? 'الإحصائيات والتفاعل' : 'Real-time Analytics',
                  desc: lang === 'ar' ? 'زوار الموقع واهتمامات الجمهور' : 'Traffic, styles interest, clicks',
                  icon: BarChart3,
                  color: 'teal',
                  badge: 'LIVE',
                  badgeType: 'teal'
                },
                {
                  id: 'database',
                  title: lang === 'ar' ? 'مستكشف قاعدة البيانات' : 'Database Inspector',
                  desc: lang === 'ar' ? 'مستندات Firestore الحية وتعديلها' : 'Inspect & export Firestore collections',
                  icon: Database,
                  color: 'blue',
                  badge: 'FIRESTORE',
                  badgeType: 'blue'
                },
                {
                  id: 'pricing',
                  title: lang === 'ar' ? 'أسعار الإعلانات' : 'Manage Ad Prices',
                  desc: lang === 'ar' ? 'تعديل أسعار الإعلانات الأسبوعية واليومية' : 'Configure ad rates & video surcharges',
                  icon: DollarSign,
                  color: 'emerald',
                  badge: 'CONFIG',
                  badgeType: 'neutral'
                },
                {
                  id: 'branding',
                  title: lang === 'ar' ? 'الهوية والشعارات' : 'Visual Branding',
                  desc: lang === 'ar' ? 'اسم التطبيق، الشعار، وأيقونات العرض' : 'App title, logos, assets',
                  icon: Sparkles,
                  color: 'pink',
                  badge: 'ASSETS',
                  badgeType: 'pink'
                },
                {
                  id: 'security',
                  title: lang === 'ar' ? 'الأمان وجدار الحماية' : 'Security & Firewall',
                  desc: lang === 'ar' ? 'تعديل العبارة السرية وسجلات الاختراق' : 'Secret phrase & attack logs',
                  icon: ShieldAlert,
                  color: 'red',
                  badge: 'SECURE',
                  badgeType: 'red'
                },
                {
                  id: 'send_notifications',
                  title: lang === 'ar' ? 'إرسال تنبيه عام' : 'Broadcast Push',
                  desc: lang === 'ar' ? 'إشعار فوري لجميع الأعضاء بالجرس' : 'Instant bell push to all members',
                  icon: Bell,
                  color: 'amber',
                  badge: 'PUSH',
                  badgeType: 'amber'
                },
              ].map((ite…66427 tokens truncated…                </div>
                </div>

                {/* Section 2: Category & Dance Styles */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    <span>{lang === 'ar' ? '🏷️ تصنيف وموديل الرقص' : '🏷️ Category & Dance Styles'}</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-300">
                      {lang === 'ar' ? 'تصنيف الفعالية الرئيسي' : 'Main Event Category'}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['party', 'course', 'trip'] as DanceCategory[]).map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setAdminCategory(cat)}
                          className={`py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                            adminCategory === cat
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 font-extrabold shadow-md'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {cat === 'party' 
                            ? (lang === 'ar' ? '🎉 سهرة / حفلة' : '🎉 Party / Social') 
                            : cat === 'course' 
                              ? (lang === 'ar' ? '🎓 كورس / تدريب' : '🎓 Course / Workshop') 
                              : (lang === 'ar' ? '✈️ رحلة / مهرجان' : '✈️ Trip / Festival')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-300">
                      {lang === 'ar' ? 'أنماط الرقص المتوفرة (اختر نمطاً واحداً أو أكثر)' : 'Styles / Dance Genres (Multi-select)'}
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ALL_DANCE_STYLES.map((style) => {
                        const isSelected = adminSelectedStyles.includes(style);
                        return (
                          <button
                            type="button"
                            key={style}
                            onClick={() => {
                              if (isSelected) {
                                setAdminSelectedStyles(prev => prev.filter(s => s !== style));
                              } else {
                                setAdminSelectedStyles(prev => [...prev, style]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-500 text-white border border-indigo-400 shadow-md shadow-indigo-500/20' 
                                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                            }`}
                          >
                            {getStyleLabel(style, lang)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 3: Time & Price & Contact */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <span>{lang === 'ar' ? '🕒 الوقت والأسعار ومعلومات التواصل' : '🕒 Schedule, Prices & Outreach'}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Event Date */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'تاريخ الفعالية *' : 'Event Date *'}
                      </label>
                      <input
                        type="date"
                        required
                        value={adminEventDate}
                        onChange={(e) => setAdminEventDate(e.target.value)}
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>

                    {/* Price Arabic */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'السعر المقترح بالعربية' : 'Price text (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={adminPriceAr}
                        onChange={(e) => setAdminPriceAr(e.target.value)}
                        placeholder="مثال: 250 ج.م شامل المشروب"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    {/* Price English */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'السعر المقترح بالإنجليزية' : 'Price text (English)'}
                      </label>
                      <input
                        type="text"
                        value={adminPriceEn}
                        onChange={(e) => setAdminPriceEn(e.target.value)}
                        placeholder="e.g. 250 EGP (Includes Soft Drink)"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300 font-mono">
                        {lang === 'ar' ? 'رقم هاتف المنظم' : 'Organizer Phone'}
                      </label>
                      <input
                        type="tel"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="+201011223344"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300 font-mono">
                        {lang === 'ar' ? 'رقم واتساب (بدون أصفار أو علامة +)' : 'WhatsApp (Clean format)'}
                      </label>
                      <input
                        type="text"
                        value={adminWhatsapp}
                        onChange={(e) => setAdminWhatsapp(e.target.value)}
                        placeholder="201011223344"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>

                    {/* Organizer Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'اسم منظم الفعالية' : 'Organizer Name'}
                      </label>
                      <input
                        type="text"
                        value={adminOrganizerName}
                        onChange={(e) => setAdminOrganizerName(e.target.value)}
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Booking Button & Price Subtext ON / OFF Toggle */}
                  <div className="pt-3 border-t border-neutral-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                      <div>
                        <h5 className="text-xs font-black text-white flex items-center gap-2">
                          <span>🎟️ {lang === 'ar' ? 'إظهار زر "احجز الآن" والسعر/العروض المصاحبة' : 'Show "Book Now" Button & Price/Promo Info'}</span>
                        </h5>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          {lang === 'ar'
                            ? 'عند اختيار (أون) يظهر زر احجز الآن والسعر/العرض المصاحب له بالصفحة الرئيسية. عند (أوف) يتم إخفاء زر احجز الآن وتفاصيل السعر تماماً من الإعلان.'
                            : 'Toggle whether the "Book Now" button and accompanying price/discount text appear on the main feed.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAdminShowBookingButton(true)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            adminShowBookingButton
                              ? 'bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/20 font-extrabold'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>ON ({lang === 'ar' ? 'مفعّل' : 'Show'})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAdminShowBookingButton(false)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            !adminShowBookingButton
                              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 font-extrabold'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-red-400"></span>
                          <span>OFF ({lang === 'ar' ? 'معطّل' : 'Hide'})</span>
                        </button>
                      </div>
                    </div>

                    {/* Custom Subtext Input Field below the button */}
                    {adminShowBookingButton && (
                      <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-3 animate-fadeIn">
                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                            <span>✏️ {lang === 'ar' ? 'النص المصاحب أسفل زر احجز الآن (بالعربية):' : 'Booking Subtext below button (Arabic):'}</span>
                          </label>
                          <input
                            type="text"
                            value={adminBookingSubtextAr}
                            onChange={e => setAdminBookingSubtextAr(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: 500 بدل 700 أو احجز واحصل على 10% خصم' : 'e.g. 500 بدل 700'}
                            className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold transition-all"
                          />
                          <p className="text-[11px] text-neutral-500">
                            {lang === 'ar'
                              ? 'إذا تركته فارغاً، يظهر السعر فقط إذا أدخلته في حقل السعر أعلاه.'
                              : 'If left empty, the price appears only if entered in the price field above.'}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-amber-400/90 flex items-center gap-1.5">
                            <span>✏️ {lang === 'ar' ? 'النص المصاحب أسفل زر احجز الآن (بالإنجليزية):' : 'Booking Subtext below button (English):'}</span>
                          </label>
                          <input
                            type="text"
                            value={adminBookingSubtextEn}
                            onChange={e => setAdminBookingSubtextEn(e.target.value)}
                            placeholder="e.g. 500 instead of 700 or Book & Get 10% OFF"
                            className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold transition-all text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ad Views Count Toggle Setting */}
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                          <Eye className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>{lang === 'ar' ? 'إظهار عداد المشاهدات لمستخدمي التطبيق' : 'Show Views Count to App Users'}</span>
                        </h5>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          {lang === 'ar'
                            ? 'عند اختيار (أون) يظهر زر المشاهدات مع العداد لكافة مستخدمي التطبيق. عند (أوف) يتم إخفاء العداد عن الجمهور ويبقى متاحاً لك وللإدارة فقط.'
                            : 'Toggle whether the views counter badge is publicly visible to users or private for admin/organizer.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAdminShowViewsCount(true)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            adminShowViewsCount
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-extrabold'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></span>
                          <span>ON ({lang === 'ar' ? 'مفعّل' : 'Show'})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAdminShowViewsCount(false)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            !adminShowViewsCount
                              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 font-extrabold'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-red-400"></span>
                          <span>OFF ({lang === 'ar' ? 'معطّل' : 'Hide'})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Location details */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-400" />
                    <span>{lang === 'ar' ? '📍 تفاصيل الموقع الجغرافي والخرائط' : '📍 Geographic Location & Maps'}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Location Name Ar */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'اسم قاعة المكان / الاستوديو بالعربية' : 'Venue/Studio Name (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={adminLocationNameAr}
                        onChange={(e) => setAdminLocationNameAr(e.target.value)}
                        placeholder="مثال: أستوديو الرقص بالزمالك"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    {/* Location Name En */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'اسم قاعة المكان / الاستوديو بالإنجليزية' : 'Venue/Studio Name (English)'}
                      </label>
                      <input
                        type="text"
                        value={adminLocationNameEn}
                        onChange={(e) => setAdminLocationNameEn(e.target.value)}
                        placeholder="e.g. Dance Studio - Zamalek"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Address Ar */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'العنوان التفصيلي بالعربية' : 'Detailed Address (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={adminAddressAr}
                        onChange={(e) => setAdminAddressAr(e.target.value)}
                        placeholder="مثال: الزمالك، عمارة المرعشلي، الدور الرابع"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    {/* Address En */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'العنوان التفصيلي بالإنجليزية' : 'Detailed Address (English)'}
                      </label>
                      <input
                        type="text"
                        value={adminAddressEn}
                        onChange={(e) => setAdminAddressEn(e.target.value)}
                        placeholder="e.g. Zamalek, El-Maraashly St, 4th Floor"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                    {/* Governorate Ar */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-amber-400">
                        {lang === 'ar' ? '📍 المحافظة (بالعربية) - مثل: القاهرة، الإسكندرية' : 'Governorate (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={adminGovernorateAr}
                        onChange={(e) => setAdminGovernorateAr(e.target.value)}
                        placeholder="مثال: القاهرة"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    {/* Governorate En */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-amber-400">
                        {lang === 'ar' ? '📍 المحافظة (بالإنجليزية)' : 'Governorate (English)'}
                      </label>
                      <input
                        type="text"
                        value={adminGovernorateEn}
                        onChange={(e) => setAdminGovernorateEn(e.target.value)}
                        placeholder="e.g. Cairo"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Area Ar */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-amber-400">
                        {lang === 'ar' ? '📍 المنطقة / الحي (بالعربية) - مثل: الزمالك، سموحة' : 'Area / District (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={adminAreaAr}
                        onChange={(e) => setAdminAreaAr(e.target.value)}
                        placeholder="مثال: الزمالك"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    {/* Area En */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-amber-400">
                        {lang === 'ar' ? '📍 المنطقة / الحي (بالإنجليزية)' : 'Area / District (English)'}
                      </label>
                      <input
                        type="text"
                        value={adminAreaEn}
                        onChange={(e) => setAdminAreaEn(e.target.value)}
                        placeholder="e.g. Zamalek"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Google Maps Link */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-300 flex items-center gap-1.5">
                      <span>{lang === 'ar' ? 'رابط خرائط جوجل (Google Maps Link)' : 'Google Maps Link'}</span>
                      <span className="text-[10px] text-neutral-500 font-mono font-normal">({lang === 'ar' ? 'لتحميل الإحداثيات تلقائياً' : 'autodetects lat/lng coords'})</span>
                    </label>
                    <input
                      type="url"
                      value={adminGoogleMapsUrl}
                      onChange={(e) => setAdminGoogleMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono animate-pulse"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Media Uploads, Priority, & Pinned (Featured) Settings */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Section A: Banner Media File / Video / Image */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-indigo-400" />
                    <span>{lang === 'ar' ? '🖼️ صورة أو فيديو الإعلان' : '🖼️ Event Flyer / Video'}</span>
                  </h4>

                  {/* Media type toggle (Image/Video) like the user form */}
                  <div className="flex bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setAdminMediaType('image')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                        adminMediaType === 'image'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'صورة إعلان' : 'Image Ad'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminMediaType('video')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                        adminMediaType === 'video'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'فيديو إعلان' : 'Video Ad'}</span>
                    </button>
                  </div>

                  {/* Media upload area */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border-2 border-dashed border-neutral-800 hover:border-indigo-500/50 bg-neutral-950 p-4 transition-all text-center relative overflow-hidden group">
                      
                      {adminIsUploadingMedia ? (
                        <div className="py-8 space-y-3">
                          <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
                          <p className="text-xs text-indigo-300 font-bold">
                            {lang === 'ar' ? `جاري ضغط ورفع الملف... ${adminUploadProgress}%` : `Uploading... ${adminUploadProgress}%`}
                          </p>
                          <div className="h-1.5 w-3/4 bg-neutral-900 rounded-full mx-auto overflow-hidden border border-neutral-800">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${adminUploadProgress}%` }} />
                          </div>
                        </div>
                      ) : adminMediaUrl ? (
                        <div className="space-y-3">
                          {adminMediaType === 'video' ? (
                            <video src={adminMediaUrl} className="max-h-48 w-full rounded-xl object-cover bg-neutral-950" controls />
                          ) : (
                            <img src={adminMediaUrl} alt="Flyer Preview" className="max-h-48 w-full rounded-xl object-cover bg-neutral-950" referrerPolicy="no-referrer" />
                          )}
                          <div className="flex items-center justify-between gap-2 px-2">
                            <span className="text-[10px] text-neutral-500 truncate max-w-[150px] font-mono">
                              {adminUploadedFileName || 'Uploaded File'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminMediaUrl('');
                                setAdminUploadedFileName(null);
                                setAdminPendingFile(null);
                              }}
                              className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
                            >
                              {lang === 'ar' ? 'إزالة' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 space-y-2">
                          <p className="text-xs text-neutral-400">
                            {lang === 'ar' ? 'اختر ملف الصورة أو الفيديو للنشر المباشر' : 'Upload custom flyer or video presentation'}
                          </p>
                          <div className="flex justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => adminFileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/20 transition-all cursor-pointer"
                            >
                              {lang === 'ar' ? '📁 تصفح المعرض' : '📁 Choose File'}
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-600 font-mono">Max size 50MB (Images compressed automatically)</p>
                        </div>
                      )}

                      <input
                        type="file"
                        ref={adminFileInputRef}
                        onChange={handleAdminFileSelect}
                        accept={adminMediaType === 'video' ? 'video/*' : 'image/*'}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Display Position & Sorting Priority */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                    <span>{lang === 'ar' ? '🔢 أولوية وترتيب ظهور الإعلان' : '🔢 Display Sort Position'}</span>
                  </h4>

                  <div className="space-y-3">
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'الرقم التسلسلي للإعلان' : 'Homepage Display Sort Order'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={adminPosition}
                        onChange={(e) => setAdminPosition(e.target.value)}
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm font-mono font-bold text-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors text-right"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed text-right">
                      {lang === 'ar' 
                        ? '💡 الأرقام الصغيرة تظهر أولاً (مثال: الإعلانات ذات الرقم 1 أو 2 أو 3 تظهر دائماً في بداية الصفحة الرئيسية وتتفوق على الإعلانات العادية).' 
                        : '💡 Lower numbers appear first. Setting this to 1, 2, or 3 will force this ad to remain pinned at the very top of the homepage.'}
                    </p>
                  </div>
                </div>

                {/* Section C: VIP & Banner Placement Flags */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <Crown className="h-4 w-4 text-indigo-400" />
                    <span>{lang === 'ar' ? '⭐ مميزات ومواضع ظهور الـ VIP' : '⭐ Premium VIP Toggles'}</span>
                  </h4>

                  <div className="space-y-3.5">
                    {/* Weekly Promo Toggle */}
                    <label className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-indigo-500/30 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adminIsWeeklyPromo}
                        onChange={(e) => setAdminIsWeeklyPromo(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-neutral-800 text-indigo-500 bg-neutral-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-white">
                          {lang === 'ar' ? 'تثبيت في البنر العلوي كإعلان VIP مميز' : 'Pin to VIP Banner Slider'}
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          {lang === 'ar' ? 'سيعرض هذا الإعلان في شريط العرض الدائري الرئيسي في هيدر الموقع.' : 'Showcases this ad inside the dynamic sliding header on the home feed.'}
                        </p>
                      </div>
                    </label>

                    {/* Featured Status Toggle */}
                    <label className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-indigo-500/30 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adminIsFeatured}
                        onChange={(e) => setAdminIsFeatured(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-neutral-800 text-indigo-500 bg-neutral-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-white">
                          {lang === 'ar' ? 'تفعيل كإعلان VIP نشط ومميز' : 'Activate as VIP Featured Card'}
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          {lang === 'ar' ? 'يمنح الإعلان إطاراً ذهبياً ووسم VIP متوهجاً لزيادة جذب انتباه الراقصين.' : 'Surrounds the event card with an glowing border and golden VIP badges.'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

              </div>
            </div>
          )}

            {adminCreateTab === 'preview' && (
              <div className="space-y-6 animate-fadeIn text-right" dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                
                {/* Preview Controls Header Block */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-right">
                      <h4 className="text-base sm:text-lg font-black text-white flex items-center justify-start gap-2">
                        <Eye className="h-5 w-5 text-indigo-400 animate-pulse" />
                        <span>
                          {lang === 'ar' 
                            ? '📱 المعاينة التفاعلية الكاملة كما يظهر للجمهور' 
                            : '📱 Complete Interactive Public Preview'}
                        </span>
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        {lang === 'ar' 
                          ? 'هذا عرض حقيقي ومطابق تماماً لكيفية ظهور إعلانك للجمهور في صفحة الخلاصة والبحث. جميع الأزرار والروابط تعمل للمعاينة والتدقيق.' 
                          : 'This is a high-fidelity real-time simulation of your event exactly as visitors will see it. Test interactive components instantly.'}
                      </p>
                    </div>

                    {/* Language Switcher for Preview Card rendering */}
                    <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 shrink-0 self-center">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider px-2 font-mono">
                        {lang === 'ar' ? 'لغة المعاينة:' : 'Preview Lang:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewLang('ar');
                          setPreviewAlert(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          previewLang === 'ar'
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        العربية (AR)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewLang('en');
                          setPreviewAlert(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          previewLang === 'en'
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        English (EN)
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Simulation Toast */}
                  {previewAlert && (
                    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs font-bold text-indigo-300 flex items-center gap-2.5 animate-fadeIn">
                      <Sparkles className="h-4 w-4 text-indigo-400 animate-spin" />
                      <span>{previewAlert}</span>
                      <button 
                        type="button" 
                        onClick={() => setPreviewAlert(null)} 
                        className="mr-auto text-neutral-400 hover:text-white cursor-pointer font-sans text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid Layout containing Simulated Device Frame & Checkpoint details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
                  
                  {/* LEFT: Feed Card Preview */}
                  <div className="lg:col-span-6 flex flex-col items-center justify-start space-y-4">
                    <span className="text-[11px] font-black tracking-wider uppercase text-neutral-500 font-mono">
                      {lang === 'ar' ? '🔍 مظهر الإعلان في بطاقة الخلاصة والشبكة:' : '🔍 Live feed card representation:'}
                    </span>
                    
                    {/* Phone-sized Viewport for maximum realistic feeling */}
                    <div className="w-full max-w-[430px] rounded-[36px] bg-neutral-950 border border-neutral-800 p-4 shadow-2xl relative overflow-hidden ring-4 ring-neutral-900/50">
                      
                      {/* Interactive Camera notch indicator */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-28 bg-neutral-900 rounded-b-2xl border-x border-b border-neutral-800/80 z-40 flex items-center justify-center pointer-events-none">
                        <div className="h-1.5 w-1.5 rounded-full bg-neutral-800 mr-2" />
                        <div className="h-1 w-8 rounded bg-neutral-800" />
                      </div>
                      
                    <div className="pt-4 relative group/media">
                        {/* Quick Media Edit Button */}
                        <div className={`absolute top-10 z-50 ${lang === 'ar' ? 'right-10' : 'left-10'} animate-pulse`}>
                          <label className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-black cursor-pointer hover:bg-indigo-500 transition-all shadow-[0_0_30px_rgba(79,70,229,0.8)] backdrop-blur-md border-2 border-white/20">
                            <Pencil className="h-5 w-5" />
                            <span>{lang === 'ar' ? 'تعديل الصورة' : 'Edit Image'}</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept={adminMediaType === 'video' ? 'video/*' : 'image/*'}
                              onChange={handleAdminFileSelect}
                            />
                          </label>
                        </div>
                        <EventCard
                          event={{
                            id: 'preview-id',
                            titleAr: adminTitleAr.trim() || (lang === 'ar' ? 'سهرة سالسا فخمة في الزمالك' : 'Luxury Salsa Night in Zamalek'),
                            titleEn: adminTitleEn.trim() || 'Luxury Salsa Night in Zamalek',
                            descriptionAr: adminDescAr.trim() || (lang === 'ar' ? 'اكتب تفاصيل الفعالية، المدربين، نوع الموسيقى، شروط الحضور...' : 'Event details and description goes here...'),
                            descriptionEn: adminDescEn.trim() || 'Event details and description goes here...',
                            category: adminCategory,
                            styles: adminSelectedStyles,
                            mediaType: adminMediaType,
                            mediaUrl: adminMediaUrl.trim() || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?q=80&w=1200',
                            thumbnailUrl: adminMediaType === 'video' ? 
                              (adminMediaUrl.includes('cloudinary.com') ? adminMediaUrl.trim().replace(/\.[^.]+$/, '.jpg') : 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?q=80&w=1200')
                              : adminMediaUrl.trim() || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?q=80&w=1200',
                            uploadDate: new Date().toISOString(),
                            eventDate: adminEventDate ? new Date(adminEventDate).toISOString() : new Date().toISOString(),
                            priceAr: adminPriceAr.trim(),
                            priceEn: adminPriceEn.trim(),
                            showBookingButton: adminShowBookingButton,
                            showViewsCount: adminShowViewsCount,
                            location: {
                              nameAr: adminLocationNameAr.trim() || 'أستوديو الرقص - الزمالك',
                              nameEn: adminLocationNameEn.trim() || 'Dance Studio - Zamalek',
                              addressAr: adminAddressAr.trim() || 'القاهرة، مصر',
                              addressEn: adminAddressEn.trim() || 'Cairo, Egypt',
                              googleMapsUrl: adminGoogleMapsUrl.trim(),
                              lat: 30.0444,
                              lng: 31.2357
                            },
                            contact: {
                              phone: adminPhone.trim() || '+201011223344',
                              whatsapp: adminWhatsapp.trim() || '201011223344',
                              organizerName: adminOrganizerName.trim() || 'الإدارة'
                            },
                            likesCount: 15,
                            isFeatured: adminIsFeatured,
                            isWeeklyPromo: adminIsWeeklyPromo,
                            position: Number(adminPosition) || 999999
                          }}
                          index={0}
                          onOpenMap={(ev) => setPreviewAlert(
                            previewLang === 'ar' 
                              ? `📍 [محاكاة الخريطة]: تم التعرف على رابط العنوان والخرائط لـ "${ev.location.nameAr}" بنجاح!` 
                              : `📍 [Maps Simulation]: Handled click for location link "${ev.location.nameEn}" successfully!`
                          )}
                          onOpenShare={(ev) => setPreviewAlert(
                            previewLang === 'ar' 
                              ? `🔗 [محاكاة المشاركة]: تم توليد رابط ومستند المشاركة التفاعلي للإعلان!` 
                              : `🔗 [Share Simulation]: Generated share prompt payload and copied link to workspace.`
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Checklist, Metadata & Direct Publishing Summary */}
                  <div className="lg:col-span-6 space-y-6">
                    <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
                      <h5 className="text-xs font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center justify-start gap-2">
                        <Activity className="h-4 w-4 text-indigo-400" />
                        <span>
                          {lang === 'ar' ? '🔍 فحص الجاهزية والبيانات الفنية للإعلان' : '🔍 Composed Blueprint & Verification'}
                        </span>
                      </h5>

                      <div className="space-y-3.5 text-xs text-neutral-300">
                        {/* Rendered Language title */}
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className={`flex items-center gap-3 ${lang === 'ar' ? 'flex-row' : 'flex-row'}`}>
                            <button 
                              type="button"
                              onClick={() => { setAdminEditingField('titleAr'); setAdminEditValue(adminTitleAr); }}
                              className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                              title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'الاسم (عربي):' : 'Title (Ar):'}</span>
                          </div>
                          {adminEditingField === 'titleAr' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                              <input 
                                type="text" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-xs outline-none w-32 px-1"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setAdminTitleAr(adminEditValue); setAdminEditingField(null); } }}
                              />
                              <button type="button" onClick={() => { setAdminTitleAr(adminEditValue); setAdminEditingField(null); }} className="text-emerald-400 hover:text-emerald-300">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setAdminEditingField(null)} className="text-neutral-500 hover:text-white">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-extrabold text-white truncate max-w-[220px]">{adminTitleAr || '⚠️ غير مكتمل / Empty'}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => { setAdminEditingField('titleEn'); setAdminEditValue(adminTitleEn); }}
                              className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0"
                              title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'الاسم (إنجليزي):' : 'Title (En):'}</span>
                          </div>
                          {adminEditingField === 'titleEn' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                              <input 
                                type="text" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-xs outline-none w-32 px-1"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setAdminTitleEn(adminEditValue); setAdminEditingField(null); } }}
                              />
                              <button type="button" onClick={() => { setAdminTitleEn(adminEditValue); setAdminEditingField(null); }} className="text-emerald-400 hover:text-emerald-300">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setAdminEditingField(null)} className="text-neutral-500 hover:text-white">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-extrabold text-white truncate max-w-[220px]">{adminTitleEn || '⚠️ غير مكتمل / Empty'}</span>
                          )}
                        </div>

                        {/* Venue details */}
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => { 
                                setAdminEditingField('location'); 
                                setAdminEditValue(previewLang === 'ar' ? adminLocationNameAr : adminLocationNameEn); 
                              }}
                              className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                              title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'الموقع:' : 'Venue:'}</span>
                          </div>
                          {adminEditingField === 'location' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                              <input 
                                type="text" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-xs outline-none w-32 px-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (previewLang === 'ar') setAdminLocationNameAr(adminEditValue);
                                    else setAdminLocationNameEn(adminEditValue);
                                    setAdminEditingField(null);
                                  }
                                }}
                              />
                              <button type="button" onClick={() => { 
                                if (previewLang === 'ar') setAdminLocationNameAr(adminEditValue);
                                else setAdminLocationNameEn(adminEditValue);
                                setAdminEditingField(null);
                              }} className="text-emerald-400 hover:text-emerald-300">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setAdminEditingField(null)} className="text-neutral-500 hover:text-white">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-extrabold text-indigo-300">
                              {previewLang === 'ar' ? adminLocationNameAr : adminLocationNameEn}
                            </span>
                          )}
                        </div>

                        {/* Price rendering */}
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => { 
                                setAdminEditingField('price'); 
                                setAdminEditValue(previewLang === 'ar' ? adminPriceAr : adminPriceEn); 
                              }}
                              className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                              title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'السعر:' : 'Price:'}</span>
                          </div>
                          {adminEditingField === 'price' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                              <input 
                                type="text" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-xs outline-none w-24 px-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (previewLang === 'ar') setAdminPriceAr(adminEditValue);
                                    else setAdminPriceEn(adminEditValue);
                                    setAdminEditingField(null);
                                  }
                                }}
                              />
                              <button type="button" onClick={() => { 
                                if (previewLang === 'ar') setAdminPriceAr(adminEditValue);
                                else setAdminPriceEn(adminEditValue);
                                setAdminEditingField(null);
                              }} className="text-emerald-400 hover:text-emerald-300">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setAdminEditingField(null)} className="text-neutral-500 hover:text-white">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                              {previewLang === 'ar' ? adminPriceAr : adminPriceEn}
                            </span>
                          )}
                        </div>

                        {/* Scheduled Date */}
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => { setAdminEditingField('date'); setAdminEditValue(adminEventDate); }}
                              className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                              title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                          </div>
                          {adminEditingField === 'date' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                              <input 
                                type="date" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-[10px] outline-none px-1"
                                autoFocus
                              />
                              <button type="button" onClick={() => { setAdminEventDate(adminEditValue); setAdminEditingField(null); }} className="text-emerald-400 hover:text-emerald-300">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setAdminEditingField(null)} className="text-neutral-500 hover:text-white">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono font-black text-white">{adminEventDate || '⚠️ لم يحدد بعد / Missing'}</span>
                          )}
                        </div>

                        {/* Description Ar */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => { setAdminEditingField('descAr'); setAdminEditValue(adminDescAr); }}
                                className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                                title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'الوصف (عربي):' : 'Desc (Ar):'}</span>
                            </div>
                          </div>
                          {adminEditingField === 'descAr' ? (
                            <div className="flex flex-col gap-2 bg-neutral-900 border border-indigo-500/50 p-2 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 w-full">
                              <textarea 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-[11px] outline-none w-full min-h-[80px] resize-none"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 border-t border-neutral-800 pt-2">
                                <button type="button" onClick={() => setAdminEditingField(null)} className="text-xs text-neutral-500 hover:text-white px-2 py-1">
                                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => { setAdminDescAr(adminEditValue); setAdminEditingField(null); }} 
                                  className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-md font-bold"
                                >
                                  {lang === 'ar' ? 'حفظ' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400 leading-relaxed text-right line-clamp-2">
                              {adminDescAr || '⚠️ غير مكتمل / Empty'}
                            </span>
                          )}
                        </div>

                        {/* Description En */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => { setAdminEditingField('descEn'); setAdminEditValue(adminDescEn); }}
                                className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                                title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'الوصف (إنجليزي):' : 'Desc (En):'}</span>
                            </div>
                          </div>
                          {adminEditingField === 'descEn' ? (
                            <div className="flex flex-col gap-2 bg-neutral-900 border border-indigo-500/50 p-2 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 w-full">
                              <textarea 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-[11px] outline-none w-full min-h-[80px] resize-none"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 border-t border-neutral-800 pt-2">
                                <button type="button" onClick={() => setAdminEditingField(null)} className="text-xs text-neutral-500 hover:text-white px-2 py-1">
                                  {lang === 'ar' ? 'Cancel' : 'إلغاء'}
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => { setAdminDescEn(adminEditValue); setAdminEditingField(null); }} 
                                  className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-md font-bold"
                                >
                                  {lang === 'ar' ? 'Save' : 'حفظ'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                              {adminDescEn || '⚠️ Empty / غير مكتمل'}
                            </span>
                          )}
                        </div>

                        {/* Category */}
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => { setAdminEditingField('category'); setAdminEditValue(adminCategory); }}
                              className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                              title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'النوع:' : 'Category:'}</span>
                          </div>
                          {adminEditingField === 'category' ? (
                            <div className="flex items-center gap-1 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl">
                              {(['party', 'course', 'trip', 'exhibition'] as DanceCategory[]).map((cat) => (
                                <button
                                  type="button"
                                  key={cat}
                                  onClick={() => { setAdminCategory(cat); setAdminEditingField(null); }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                    adminCategory === cat ? 'bg-indigo-500 text-white' : 'text-neutral-400 hover:bg-neutral-800'
                                  }`}
                                >
                                  {cat === 'party' ? '🎉' : cat === 'course' ? '🎓' : cat === 'trip' ? '🌴' : '🏛️'}
                                </button>
                              ))}
                              <button type="button" onClick={() => setAdminEditingField(null)} className="text-neutral-500 hover:text-white ml-1">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase">
                              {adminCategory}
                            </span>
                          )}
                        </div>

                        {/* Styles */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => { setAdminEditingField('styles'); setAdminEditValue(adminSelectedStyles.join(', ')); }}
                                className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                                title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'الأنماط:' : 'Styles:'}</span>
                            </div>
                          </div>
                          {adminEditingField === 'styles' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl w-full">
                              <input 
                                type="text" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                placeholder="Salsa, Bachata, ..."
                                className="bg-transparent text-white text-[10px] outline-none w-full px-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const styles = adminEditValue.split(',').map(s => s.trim()) as DanceStyle[];
                                    setAdminSelectedStyles(styles.filter(s => s.length > 0));
                                    setAdminEditingField(null);
                                  }
                                }}
                              />
                              <button type="button" onClick={() => { 
                                const styles = adminEditValue.split(',').map(s => s.trim()) as DanceStyle[];
                                setAdminSelectedStyles(styles.filter(s => s.length > 0));
                                setAdminEditingField(null);
                              }} className="text-emerald-400">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {adminSelectedStyles.map(s => (
                                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Organizer Name */}
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => { setAdminEditingField('organizer'); setAdminEditValue(adminOrganizerName); }}
                              className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                              title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'المنظم:' : 'Organizer:'}</span>
                          </div>
                          {adminEditingField === 'organizer' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                              <input 
                                type="text" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-xs outline-none w-32 px-1"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setAdminOrganizerName(adminEditValue); setAdminEditingField(null); } }}
                              />
                              <button type="button" onClick={() => { setAdminOrganizerName(adminEditValue); setAdminEditingField(null); }} className="text-emerald-400">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-extrabold text-white truncate max-w-[150px]">{adminOrganizerName}</span>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => { setAdminEditingField('phone'); setAdminEditValue(adminPhone); }}
                              className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                              title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                          </div>
                          {adminEditingField === 'phone' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                              <input 
                                type="tel" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-xs outline-none w-32 px-1 font-mono"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setAdminPhone(adminEditValue); setAdminEditingField(null); } }}
                              />
                              <button type="button" onClick={() => { setAdminPhone(adminEditValue); setAdminEditingField(null); }} className="text-emerald-400">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-white">{adminPhone}</span>
                          )}
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => { setAdminEditingField('whatsapp'); setAdminEditValue(adminWhatsapp); }}
                              className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                              title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'واتساب:' : 'WhatsApp:'}</span>
                          </div>
                          {adminEditingField === 'whatsapp' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                              <input 
                                type="text" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-xs outline-none w-32 px-1 font-mono"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setAdminWhatsapp(adminEditValue); setAdminEditingField(null); } }}
                              />
                              <button type="button" onClick={() => { setAdminWhatsapp(adminEditValue); setAdminEditingField(null); }} className="text-emerald-400">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-white">{adminWhatsapp}</span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => { setAdminEditingField('addressAr'); setAdminEditValue(adminAddressAr); }}
                                className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                                title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'العنوان (عربي):' : 'Address (Ar):'}</span>
                            </div>
                          </div>
                          {adminEditingField === 'addressAr' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl w-full">
                              <input 
                                type="text" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-[10px] outline-none w-full px-1"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setAdminAddressAr(adminEditValue); setAdminEditingField(null); } }}
                              />
                              <button type="button" onClick={() => { setAdminAddressAr(adminEditValue); setAdminEditingField(null); }} className="text-emerald-400">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-400 text-right">{adminAddressAr || '⚠️ غير مكتمل'}</span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group text-left hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => { setAdminEditingField('addressEn'); setAdminEditValue(adminAddressEn); }}
                                className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                                title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'العنوان (إنجليزي):' : 'Address (En):'}</span>
                            </div>
                          </div>
                          {adminEditingField === 'addressEn' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl w-full">
                              <input 
                                type="text" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-[10px] outline-none w-full px-1"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setAdminAddressEn(adminEditValue); setAdminEditingField(null); } }}
                              />
                              <button type="button" onClick={() => { setAdminAddressEn(adminEditValue); setAdminEditingField(null); }} className="text-emerald-400">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-400">{adminAddressEn || '⚠️ Empty'}</span>
                          )}
                        </div>

                        {/* Location map coordinates status */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 group hover:border-indigo-500/50 transition-all">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => { setAdminEditingField('mapsUrl'); setAdminEditValue(adminGoogleMapsUrl); }}
                                className="p-2 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all cursor-pointer shrink-0 animate-pulse-slow"
                                title={lang === 'ar' ? 'تعديل سريع' : 'Quick Edit'}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <span className="text-neutral-200 font-black text-sm">{lang === 'ar' ? 'الخريطة:' : 'Map:'}</span>
                            </div>
                            {adminGoogleMapsUrl ? (
                              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                OK ✔
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                MISSING
                              </span>
                            )}
                          </div>
                          {adminEditingField === 'mapsUrl' ? (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-indigo-500/50 p-1 rounded-lg shadow-xl w-full">
                              <input 
                                type="url" 
                                value={adminEditValue}
                                onChange={(e) => setAdminEditValue(e.target.value)}
                                className="bg-transparent text-white text-[10px] outline-none w-full px-1 font-mono"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setAdminGoogleMapsUrl(adminEditValue); setAdminEditingField(null); } }}
                              />
                              <button type="button" onClick={() => { setAdminGoogleMapsUrl(adminEditValue); setAdminEditingField(null); }} className="text-emerald-400">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] text-neutral-500 truncate font-mono">{adminGoogleMapsUrl || 'No Link Provided'}</span>
                          )}
                        </div>

                        {/* Featured Toggles details */}
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60 group">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400">{lang === 'ar' ? 'المظهر الإداري الخاص (VIP):' : 'VIP featured options:'}</span>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => setAdminIsFeatured(!adminIsFeatured)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                adminIsFeatured ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                              }`}
                            >
                              Featured VIP
                            </button>
                            <button 
                              onClick={() => setAdminIsWeeklyPromo(!adminIsWeeklyPromo)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                adminIsWeeklyPromo ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                              }`}
                            >
                              Slide Banner
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Helper tips and direct save prompt */}
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5 text-xs text-neutral-400 leading-relaxed space-y-2">
                      <p className="font-bold text-white">
                        {lang === 'ar' ? '💡 هل كل شيء يبدو ممتازاً وجاهزاً؟' : '💡 Everything looks clean?'}
                      </p>
                      <p>
                        {lang === 'ar' 
                          ? 'بإمكانك المراجعة والتعديل اللانهائي. إذا كانت الأبعاد والألوان والنصوص صحيحة ومضبوطة تماماً، يمكنك النقر مباشرة على زر النشر الملون بالأسفل لبث هذا الإعلان فوراً وبشكل حي لكافة المستخدمين وتنبيههم!' 
                          : 'Verify spacing and text fitting. If you are satisfied with both translations, you can hit the Publish button below to instantly write the ad to Firestore and broadcast notifications.'}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Bottom Action Footer Bar */}
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setAdminSection(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-center"
              >
                {lang === 'ar' ? '❌ إلغاء' : '❌ Cancel'}
              </button>

              <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setAdminCreateTab(adminCreateTab === 'form' ? 'preview' : 'form');
                    setPreviewAlert(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 rounded-2xl py-2.5 px-6 text-xs sm:text-sm font-bold bg-neutral-950 text-indigo-400 border border-indigo-500/30 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2.5 shadow-xl"
                >
                  <Eye className="h-4.5 w-4.5" />
                  <span>
                    {adminCreateTab === 'form' 
                      ? (lang === 'ar' ? 'معاينة الإعلان (Live)' : 'Live Preview Ad') 
                      : (lang === 'ar' ? 'العودة للتعديل' : 'Back to Editing')}
                  </span>
                </button>

                <button
                  type="submit"
                  disabled={adminSaveStatus === 'loading' || adminIsUploadingMedia}
                  className="flex-[2] px-10 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {adminSaveStatus === 'loading' ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
                      </div>
                      {adminUploadProgress > 0 && adminUploadProgress < 100 && (
                        <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white transition-all duration-300" 
                            style={{ width: `${adminUploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{lang === 'ar' ? '🚀 نشر الإعلان فوراً' : '🚀 Publish Now'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {adminSection === 'send_notifications' && (
        <div className="space-y-6 animate-fadeIn" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-neutral-900 border border-amber-500/30 p-6 rounded-3xl shadow-xl">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {lang === 'ar' ? '🔔 إرسال تنبيهات لجميع الأعضاء' : '🔔 Send Alerts to All Members'}
              </h3>
              <p className="text-sm text-neutral-400">
                {lang === 'ar' ? 'الإشعار سيظهر فوراً في جرس التنبيهات أعلى الموقع لجميع المستخدمين.' : 'Notification will appear immediately in the top bell icon for all users.'}
              </p>
            </div>
            <button
              onClick={handleDeleteAllNotifications}
              disabled={notifSending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-bold">{lang === 'ar' ? 'حذف جميع الإشعارات السابقة' : 'Delete All Old Notifications'}</span>
            </button>
          </div>

          <form onSubmit={handleSendNotification} className="bg-neutral-900 border border-white/5 p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-300">{lang === 'ar' ? 'عنوان الإشعار (عربي) *' : 'Title (Arabic) *'}</label>
                <input
                  type="text"
                  required
                  value={notifTitleAr}
                  onChange={(e) => setNotifTitleAr(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder={lang === 'ar' ? 'مثال: خصم جديد على الحفلات' : 'Example: New discount on events'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-300">{lang === 'ar' ? 'عنوان الإشعار (إنجليزي) *' : 'Title (English) *'}</label>
                <input
                  type="text"
                  required
                  value={notifTitleEn}
                  onChange={(e) => setNotifTitleEn(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder={lang === 'ar' ? 'مثال: New Party Discount' : 'Example: New Party Discount'}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-300">{lang === 'ar' ? 'محتوى الإشعار (عربي) *' : 'Message (Arabic) *'}</label>
                <textarea
                  required
                  rows={3}
                  value={notifMessageAr}
                  onChange={(e) => setNotifMessageAr(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  placeholder={lang === 'ar' ? 'اكتب تفاصيل الإشعار هنا...' : 'Type notification details here...'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-300">{lang === 'ar' ? 'محتوى الإشعار (إنجليزي) *' : 'Message (English) *'}</label>
                <textarea
                  required
                  rows={3}
                  value={notifMessageEn}
                  onChange={(e) => setNotifMessageEn(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  placeholder={lang === 'ar' ? 'Type notification details here...' : 'Type notification details here...'}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-neutral-300">{lang === 'ar' ? 'نوع الإشعار (يحدد الأيقونة واللون)' : 'Notification Type (determines icon & color)'}</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="system">{lang === 'ar' ? 'تنبيه نظام عام (رمادي)' : 'General System (Gray)'}</option>
                  <option value="new_party">{lang === 'ar' ? 'حفلة جديدة (بنفسجي)' : 'New Party (Purple)'}</option>
                  <option value="course_alert">{lang === 'ar' ? 'تنبيه كورس (أزرق)' : 'Course Alert (Blue)'}</option>
                  <option value="trip">{lang === 'ar' ? 'رحلة / مهرجان (أخضر)' : 'Trip / Festival (Green)'}</option>
                  <option value="expiry_warning">{lang === 'ar' ? 'تنبيه هام / انتهاء (أصفر)' : 'Warning / Expiry (Yellow)'}</option>
                </select>
              </div>

              {/* Mobile Push Notification Broadcast Switch */}
              <div className="md:col-span-2 bg-neutral-950/60 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {lang === 'ar' ? 'إرسال إشعار فوري لشاشات الهواتف (Web Push)' : 'Broadcast Live Phone Push Notification'}
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                        {lang === 'ar' ? `${pushSubscribersCount} مشترك مسجل` : `${pushSubscribersCount} subscribers`}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {lang === 'ar' ? 'يصل مباشرة على شاشة قفل الموبايل مع رنة مميزة واهتزاز حتى لو التطبيق مغلق' : 'Reaches user lock screens with custom chime & vibration even if app is closed'}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={sendMobilePush}
                    onChange={(e) => setSendMobilePush(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={notifSending}
              className="w-full py-4 rounded-xl font-black text-lg bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 mt-4"
            >
              {notifSending ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>{lang === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</span>
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5" />
                  <span>{lang === 'ar' ? 'إرسال الإشعار لجميع الأعضاء الآن' : 'Broadcast to All Members Now'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}


      {/* Fullscreen Events List Overlay */}
      {isFullscreenEvents && (
        <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col">
          <div className="p-4 bg-neutral-900 border-b border-white/10 flex items-center justify-between shadow-md shrink-0">
             <div className="flex items-center gap-4">
               <h2 className="text-xl font-black text-amber-500">
                 {lang === 'ar' ? 'إدارة الإعلانات (عرض مكبر)' : 'Ads Management (Expanded)'}
               </h2>
               <div className="flex gap-3">
                 <div className="bg-neutral-800 rounded-lg px-3 py-1 flex items-center gap-2">
                   <span className="text-blue-400 font-bold">{events.length}</span>
                   <span className="text-xs text-neutral-400">{lang === 'ar' ? 'إجمالي' : 'Total'}</span>
                 </div>
                 <div className="bg-neutral-800 rounded-lg px-3 py-1 flex items-center gap-2">
                   <span className="text-red-400 font-bold">{events.filter(e => e.isEmpty).length}</span>
                   <span className="text-xs text-neutral-400">{lang === 'ar' ? 'مفرغ' : 'Empty'}</span>
                 </div>
               </div>
             </div>
             <button
               onClick={() => setIsFullscreenEvents(false)}
               className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white hover:bg-red-500/80 transition-all"
             >
               <Minimize2 className="h-6 w-6" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {events.map((ev) => (
                  <div key={ev.id} className={`flex flex-col gap-4 p-5 sm:p-6 rounded-3xl bg-neutral-900/90 border ${ev.isEmpty ? 'border-red-500/40 opacity-70' : 'border-white/10 hover:border-blue-500/40'} transition-all shadow-xl`}>
                    <div className="flex items-start gap-4">
                      {ev.isEmpty ? (
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-neutral-800 border-2 border-red-500/20 flex flex-col items-center justify-center shrink-0 shadow-lg">
                           <span className="text-xs font-bold text-red-400 mb-1">فارغ</span>
                           <span className="text-[10px] text-neutral-500">Deleted</span>
                        </div>
                      ) : (
                        <img src={ev.thumbnailUrl || ev.mediaUrl} alt="" className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border border-white/10 shrink-0 shadow-lg" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="px-3 py-1.5 rounded-lg text-sm sm:text-base font-black bg-indigo-600 text-white border border-indigo-400 font-mono shadow-md" title={lang === 'ar' ? 'الرقم التسلسلي' : 'Serial Number'}>
                             #{ev.position && ev.position !== 999999 ? ev.position : '-'}
                          </span>
                          <span className="font-mono text-[10px] sm:text-xs text-neutral-500 font-bold select-all">{ev.id}</span>
                        </div>
                        <h4 className="font-bold text-white text-base sm:text-lg leading-tight line-clamp-2">
                           {ev.isEmpty ? (lang === 'ar' ? 'مساحة إعلان فارغة (تم المسح)' : 'Empty Ad Slot (Deleted)') : (lang === 'ar' ? ev.titleAr : ev.titleEn)}
                        </h4>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                           <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-neutral-800 text-neutral-300 uppercase tracking-wider">{ev.category}</span>
                           {((ev.isFeatured || (typeof ev.position === 'number' && ev.position <= 19))) && !ev.isEmpty && <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">VIP</span>}
                        </div>
                      </div>
                    </div>
                    
                    {!ev.isEmpty && (
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-neutral-400 bg-neutral-950/50 p-3 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5">{lang === 'ar' ? 'السعر' : 'Price'}</span>
                           <span className="font-bold text-emerald-400 truncate">{lang === 'ar' ? ev.priceAr : ev.priceEn}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5">{lang === 'ar' ? 'المكان' : 'Location'}</span>
                           <span className="text-white truncate">{lang === 'ar' ? ev.location?.nameAr : ev.location?.nameEn}</span>
                        </div>
                        <div className="flex flex-col mt-1">
                           <span className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5">{lang === 'ar' ? 'التفاعل' : 'Engagement'}</span>
                           <span className="text-pink-400 font-bold">❤️ {String(ev.likesCount || 0)} {lang === 'ar' ? 'إعجاب' : 'likes'}</span>
                        </div>
                        <div className="flex flex-col mt-1">
                           <span className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5">{lang === 'ar' ? 'التاريخ' : 'Date'}</span>
                           <span className="text-blue-300 truncate">{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : '-'}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                      <button
                        onClick={() => setQrEventDoc({ id: ev.id, title: lang === 'ar' ? ev.titleAr : ev.titleEn })}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-amber-500/30 shadow-sm"
                        title={lang === 'ar' ? 'QR الدخول' : 'Check-in QR'}
                      >
                        <QrCode className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedJsonDoc({ id: ev.id, title: lang === 'ar' ? ev.titleAr : ev.titleEn, data: ev })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-blue-300 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-blue-500/30 shadow-sm"
                      >
                        <Code className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'عرض وثيقة JSON' : 'Inspect Doc'}</span>
                      </button>
                      <button
                        onClick={async () => {
                          const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من مسح بيانات هذه الفعالية بالكامل وتفريغ الخانة؟ لن تظهر للمستخدمين بعد الآن.' : 'Are you sure you want to delete this event data and empty the slot? It will no longer show to users.');
                          if (confirmed) {
                            deleteEvent(ev.id);
                            alert(lang === 'ar' ? 'تم مسح الإعلان بنجاح وتفريغ الخانة! لن يظهر للمستخدمين.' : 'Ad deleted and slot emptied successfully! It is now hidden from users.');
                          }
                        }}
                        className="p-2.5 sm:p-3 rounded-xl bg-neutral-800 text-neutral-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer shadow-sm"
                        title={lang === 'ar' ? 'حذف من القاعدة' : 'Delete Document'}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* User Profile View Modal */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-[9999] bg-neutral-950 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 min-h-screen">
            <ProfileView 
              onOpenCreateModal={() => {}}
              onOpenAuth={() => {}}
              onOpenMap={() => {}}
              onOpenShare={() => {}}
              adminViewUser={selectedUserProfile}
              onCloseAdminView={() => setSelectedUserProfile(null)}
            />
          </div>
        </div>
      )}

      {/* QR Code Modal for Event Check-in */}
      {qrEventDoc && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-5 relative shadow-2xl">
            <button
              onClick={() => setQrEventDoc(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-1 pt-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                {lang === 'ar' ? 'باركود الدخول للفعالية' : 'Event Check-in QR'}
              </span>
              <h3 className="text-base font-extrabold text-white line-clamp-1">
                {qrEventDoc.title}
              </h3>
              <p className="text-[10px] text-zinc-400 font-sans px-2">
                {lang === 'ar' 
                  ? 'اطبع هذا الباركود أو اعرضه ليقوم الحاضرون بمسحه عبر هواتفهم لتسجيل الدخول السريع.' 
                  : 'Print or display this QR code so attendees can scan it to check in.'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-4 border-amber-500 shadow-2xl mx-auto w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&color=245-158-11&data=${encodeURIComponent(
                  'https://cityeve.online' + '/?eventCheckin=' + qrEventDoc.id
                )}`}
                className="w-full h-full object-contain"
                alt="Event Check-in QR"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
