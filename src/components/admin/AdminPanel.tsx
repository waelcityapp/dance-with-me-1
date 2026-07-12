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
  MousePointerClick
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdSubmission, DanceEvent, UserProfile, getStyleLabel, ALL_DANCE_STYLES, DanceCategory, DanceStyle } from '../../types';
import { EventCard } from '../events/EventCard';
import { 
  subscribeToAdSubmissions, 
  saveAdSubmissionToFirestore, 
  deleteAdSubmissionFromFirestore, 
  saveEventToFirestore, 
  saveNotificationToFirestore,
  subscribeToAllUsers,
  deleteUserFromFirestore,
  toggleUserSuspensionInFirestore,
  getAdminSecretCodes,
  updateAdminSecretCode,
  subscribeToSecurityViolations,
  resolvedFirebaseConfig,
  databaseId,
  subscribeToAnalyticsCounters,
  subscribeToDailyAnalytics
} from '../../lib/firebase';

export const AdminPanel: React.FC = () => {
  const { 
    lang, 
    setActiveTab, 
    user, 
    addNewEvent, 
    events, 
    deleteEvent, 
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
    rejectBooking
  } = useApp();
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
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
  const [adminSection, setAdminSection] = useState<'submissions' | 'database' | 'support' | 'users' | 'security' | 'branding' | 'pricing' | 'analytics' | 'create_ad_admin' | 'bookings' | null>(null);
  const [dbSubTab, setDbSubTab] = useState<'events' | 'submissions' | 'notifications' | 'schema'>('events');
  const [selectedJsonDoc, setSelectedJsonDoc] = useState<{ id: string; title: string; data: any } | null>(null);
  
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usersSubTab, setUsersSubTab] = useState<'search' | 'all'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [usersError, setUsersError] = useState<string | null>(null);

  // Security Section States
  const [securityViolations, setSecurityViolations] = useState<any[]>([]);
  const [currentSecretCodes, setCurrentSecretCodes] = useState<string[]>([]);
  const [newSecretCode, setNewSecretCode] = useState('');
  const [secretChangeStatus, setSecretChangeStatus] = useState('');
  const [updatingSecretCode, setUpdatingSecretCode] = useState(false);
  const [adminAlertPhone, setAdminAlertPhone] = useState<string>(() => {
    return localStorage.getItem('dwm_admin_whatsapp_phone') || user?.phone || '201015112185';
  });

  const handleAlertPhoneChange = (val: string) => {
    setAdminAlertPhone(val);
    localStorage.setItem('dwm_admin_whatsapp_phone', val);
  };

  // Branding & Assets States
  const [formAppNameAr, setFormAppNameAr] = useState('');
  const [formAppNameEn, setFormAppNameEn] = useState('');
  const [formAppIconUrl, setFormAppIconUrl] = useState('');
  const [formAppLogoUrl, setFormAppLogoUrl] = useState('');
  const [formWhatsappSupport, setFormWhatsappSupport] = useState('');
  const [formInstagramUrl, setFormInstagramUrl] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);
  const [localPricingConfig, setLocalPricingConfig] = useState(pricingConfig);
  const [savingPricing, setSavingPricing] = useState(false);
  useEffect(() => { setLocalPricingConfig(pricingConfig); }, [pricingConfig]);

  // Analytics States
  const [analyticsCounters, setAnalyticsCounters] = useState<any>({});
  const [dailyAnalytics, setDailyAnalytics] = useState<any[]>([]);

  // Admin Direct Create Ad States
  const [adminTitleAr, setAdminTitleAr] = useState('');
  const [adminTitleEn, setAdminTitleEn] = useState('');
  const [adminDescAr, setAdminDescAr] = useState('');
  const [adminDescEn, setAdminDescEn] = useState('');
  const [adminCategory, setAdminCategory] = useState<DanceCategory>('party');
  const [adminMediaType, setAdminMediaType] = useState<'video' | 'image'>('image');
  const [adminMediaUrl, setAdminMediaUrl] = useState('');
  const [adminPriceAr, setAdminPriceAr] = useState('250 ج.م');
  const [adminPriceEn, setAdminPriceEn] = useState('250 EGP');
  const [adminEventDate, setAdminEventDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [adminPhone, setAdminPhone] = useState('+201011223344');
  const [adminWhatsapp, setAdminWhatsapp] = useState('201011223344');
  const [adminOrganizerName, setAdminOrganizerName] = useState('الإدارة / Admin');
  const [adminLocationNameAr, setAdminLocationNameAr] = useState('أستوديو الرقص - الزمالك');
  const [adminLocationNameEn, setAdminLocationNameEn] = useState('Dance Studio - Zamalek');
  const [adminAddressAr, setAdminAddressAr] = useState('القاهرة، مصر');
  const [adminAddressEn, setAdminAddressEn] = useState('Cairo, Egypt');
  const [adminGoogleMapsUrl, setAdminGoogleMapsUrl] = useState('https://maps.google.com/?q=30.0444,31.2357');
  const [adminSelectedStyles, setAdminSelectedStyles] = useState<DanceStyle[]>(['Salsa', 'Bachata']);
  const [adminPosition, setAdminPosition] = useState<number>(1);
  const [adminIsWeeklyPromo, setAdminIsWeeklyPromo] = useState(false);
  const [adminIsFeatured, setAdminIsFeatured] = useState(true);
  
  // Quick Edit States
  const [adminEditingField, setAdminEditingField] = useState<string | null>(null);
  const [adminEditValue, setAdminEditValue] = useState('');

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
      setFormWhatsappSupport(appAssets.whatsappSupport || '');
      setFormInstagramUrl(appAssets.instagramUrl || '');
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

  const handleAdminFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
          setAdminPendingFile(file);
          setAdminUploadedFileName(file.name);
          setAdminMediaType('video');
          const previewUrl = URL.createObjectURL(file);
          setAdminMediaUrl(previewUrl);
        };
        video.onerror = () => {
          window.URL.revokeObjectURL(video.src);
          alert(lang === 'ar' ? '❌ فشل تحميل بيانات الفيديو. يرجى تجربة ملف آخر.' : '❌ Failed to load video metadata. Please try another file.');
        };
        video.src = URL.createObjectURL(file);
      } else {
        // Handle images normally
        setAdminPendingFile(file);
        setAdminUploadedFileName(file.name);
        setAdminMediaType('image');
        
        // Create local preview URL
        const previewUrl = URL.createObjectURL(file);
        setAdminMediaUrl(previewUrl);
      }
    }
  };

  const performAdminMediaUpload = async (file: File): Promise<string> => {
    setAdminIsUploadingMedia(true);
    setAdminUploadProgress(0);
    setAdminUploadError(null);
    
    try {
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
      
      // Perform actual upload only now if there is a pending file
      if (adminPendingFile) {
        try {
          finalMediaUrl = await performAdminMediaUpload(adminPendingFile);
          setAdminMediaUrl(finalMediaUrl);
          setAdminPendingFile(null); // Clear pending file after successful upload
        } catch (uploadErr: any) {
          console.error('Failed to upload media during publish:', uploadErr);
          setAdminSaveStatus('error');
          alert(lang === 'ar' ? `❌ فشل رفع الوسائط: ${uploadErr.message}` : `❌ Media upload failed: ${uploadErr.message}`);
          return;
        }
      }

      if (!finalMediaUrl) {
        finalMediaUrl = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200';
      }

      // Generate a proper thumbnailUrl for videos from Cloudinary
      let finalThumbnailUrl = finalMediaUrl;
      if (adminMediaType === 'video' && finalMediaUrl.includes('cloudinary.com')) {
        // Cloudinary trick: change .mp4/etc to .jpg to get a thumbnail
        finalThumbnailUrl = finalMediaUrl.replace(/\.[^.]+$/, '.jpg');
      } else if (adminMediaType === 'video') {
        // Fallback for non-cloudinary videos (though we mostly use cloudinary)
        finalThumbnailUrl = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200';
      }

      const coords = parseAdminCoordinates(adminGoogleMapsUrl);
      
      const newEventId = `ev-adm-${Date.now()}`;

      const createdEvent: DanceEvent = {
        id: newEventId,
        titleAr: adminTitleAr.trim(),
        titleEn: adminTitleEn.trim(),
        descriptionAr: adminDescAr.trim(),
        descriptionEn: adminDescEn.trim(),
        category: adminCategory,
        styles: adminSelectedStyles,
        mediaType: adminMediaType,
        mediaUrl: finalMediaUrl,
        thumbnailUrl: finalThumbnailUrl,
        uploadDate: new Date().toISOString(),
        eventDate: new Date(adminEventDate).toISOString(),
        priceAr: adminPriceAr.trim() || '250 ج.م',
        priceEn: adminPriceEn.trim() || '250 EGP',
        location: {
          nameAr: adminLocationNameAr.trim() || 'أستوديو الرقص - الزمالك',
          nameEn: adminLocationNameEn.trim() || 'Dance Studio - Zamalek',
          addressAr: adminAddressAr.trim() || 'القاهرة، مصر',
          addressEn: adminAddressEn.trim() || 'Cairo, Egypt',
          googleMapsUrl: adminGoogleMapsUrl.trim(),
          lat: coords.lat,
          lng: coords.lng
        },
        contact: {
          phone: adminPhone.trim() || '+201011223344',
          whatsapp: adminWhatsapp.trim() || '201011223344',
          organizerName: adminOrganizerName.trim() || 'الإدارة / Admin'
        },
        likesCount: 15,
        isFeatured: adminIsFeatured,
        isWeeklyPromo: adminIsWeeklyPromo,
        position: Number(adminPosition) || 999999
      };

      // Save to Firestore
      await saveEventToFirestore(createdEvent);

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

      setAdminSaveStatus('success');
      alert(lang === 'ar' ? '🎉 تم إنشاء ونشر الإعلان فوراً وربطه بالتنبيهات العامة بنجاح!' : '🎉 Ad has been published and broadcasted via real-time alerts successfully!');
      
      // Reset Admin Form Fields
      setAdminTitleAr('');
      setAdminTitleEn('');
      setAdminDescAr('');
      setAdminDescEn('');
      setAdminMediaUrl('');
      setAdminUploadedFileName(null);
      setAdminPendingFile(null);
      setAdminPosition(1);
      
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

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    const updated = {
      appNameAr: formAppNameAr.trim(),
      appNameEn: formAppNameEn.trim(),
      app_icon_url: formAppIconUrl.trim(),
      app_logo_url: formAppLogoUrl.trim(),
      whatsappSupport: formWhatsappSupport.trim(),
      instagramUrl: formInstagramUrl.trim()
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
    const password = (u.password || '').toLowerCase();
    return name.includes(query) || email.includes(query) || password.includes(query);
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
      getAdminSecretCodes().then((codes) => {
        setCurrentSecretCodes(codes);
      }).catch(err => console.error("Error loading admin codes:", err));

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
      // 1. Create or save the actual event if eventData exists
      if (sub.eventData) {
        const eventId = `ev_vip_${Date.now()}`;
        const newEv: DanceEvent = {
          id: eventId,
          titleAr: sub.eventData.titleAr || sub.titleAr,
          titleEn: sub.eventData.titleEn || sub.titleEn,
          descriptionAr: sub.eventData.descriptionAr || 'سهرة سالسا وباتشاتا ملكية مميزة تحت إشراف أفضل المدربين.',
          descriptionEn: sub.eventData.descriptionEn || 'Royal Latin Salsa & Bachata social night with top instructors.',
          category: (sub.eventData.category || sub.category || 'party') as any,
          styles: sub.eventData.styles || sub.styles || ['Salsa', 'Bachata'],
          mediaType: sub.eventData.mediaType || sub.mediaType || 'image',
          mediaUrl: sub.eventData.mediaUrl || sub.mediaUrl || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl: sub.eventData.thumbnailUrl || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80',
          uploadDate: new Date().toISOString(),
          eventDate: sub.eventData.eventDate || new Date(Date.now() + 86400000 * 3).toISOString(),
          priceAr: sub.eventData.priceAr || '250 جنيه',
          priceEn: sub.eventData.priceEn || '250 EGP',
          location: sub.eventData.location || {
            nameAr: 'نادي القاهرة اللاتيني VIP',
            nameEn: 'Cairo Latin Club VIP',
            addressAr: 'القاهرة، مصر',
            addressEn: 'Cairo, Egypt',
            googleMapsUrl: 'https://maps.google.com/?q=30.0444,31.2357',
            lat: 30.0444,
            lng: 31.2357
          },
          contact: sub.eventData.contact || {
            phone: sub.phone,
            whatsapp: sub.phone,
            organizerName: sub.advertiserName
          },
          likesCount: 15,
          isFeatured: true,
          isWeeklyPromo: true
        };

        // Add to state and save to Firestore
        addNewEvent(newEv);
        await saveEventToFirestore(newEv);
      } else if (sub.eventData) {
        const newEv: DanceEvent = {
          ...sub.eventData,
          id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          uploadDate: new Date().toISOString(),
          likesCount: 15,
          isFeatured: sub.adType === 'vip' || sub.eventData?.adType === 'vip',
          isWeeklyPromo: sub.adType === 'vip' || sub.eventData?.adType === 'vip',
          adType: sub.adType || sub.eventData?.adType || 'standard'
        } as DanceEvent;
        addNewEvent(newEv);
        await saveEventToFirestore(newEv);
      }

      // 2. Update submission status in Firestore with expiration timestamp
      const promoDays = sub.pricing?.days || 3;
      const expiresAtDate = new Date(Date.now() + promoDays * 86400000).toISOString();
      const updated: AdSubmission = {
        ...sub,
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        expiresAt: expiresAtDate
      };
      updateLocalStorageItem(updated);
      await saveAdSubmissionToFirestore(updated);

      // 3. Send notification in Firestore
      await saveNotificationToFirestore({
        id: `notif_app_${Date.now()}`,
        titleAr: '🎉 تم تفعيل إعلانك VIP بنجاح!',
        titleEn: '🎉 Your VIP Ad is Now Live!',
        messageAr: `تم مراجعة وقبول الفاتورة رقم ${sub.invoiceNumber} وتم نشر إعلانك على التطبيق ليراه جميع الأعضاء والمتابعين! سينتهي العرض في ${new Date(expiresAtDate).toLocaleDateString('ar-EG')}.`,
        messageEn: `Invoice ${sub.invoiceNumber} approved. Your VIP event is now live! Expiring on ${new Date(expiresAtDate).toLocaleDateString('en-US')}.`,
        date: new Date().toISOString(),
        read: false,
        type: 'new_party'
      });
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
      updateLocalStorageItem(updated);
      await saveAdSubmissionToFirestore(updated);

      await saveNotificationToFirestore({
        id: `notif_arch_${Date.now()}`,
        titleAr: '📦 تنبيه: نقل إعلانك إلى الأرشيف (بحد أقصى شهر)',
        titleEn: '📦 Notice: Your Ad Moved to 30-Day Archive',
        messageAr: `تم انتهاء فترة عرض الإعلان (فاتورة ${sub.invoiceNumber}) ونقله إلى الأرشيف في قاعدة البيانات بحد أقصى شهر (30 يوماً). يمكنك تجديد الإعلان أو تعديله من ملفك الشخصي قبل حذفه نهائياً.`,
        messageEn: `Your ad promo period (${sub.invoiceNumber}) has ended and moved to Archive for max 30 days. You can renew or edit it from your profile before permanent deletion.`,
        date: new Date().toISOString(),
        read: false,
        type: 'expiry_warning'
      });
    } catch (err) {
      console.error('Error archiving ad:', err);
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
        reviewedAt: new Date().toISOString()
      };
      updateLocalStorageItem(updated);
      await saveAdSubmissionToFirestore(updated);

      await saveNotificationToFirestore({
        id: `notif_rej_${Date.now()}`,
        titleAr: '⚠️ إشعار بخصوص الفاتورة رقم ' + sub.invoiceNumber,
        titleEn: '⚠️ Notice regarding invoice ' + sub.invoiceNumber,
        messageAr: `عذراً، تعذر تفعيل الإعلان للفاتورة رقم ${sub.invoiceNumber}. سيتم التواصل معك عبر الواتساب أو استرداد المبلغ حسب السياسة.`,
        messageEn: `Sorry, ad publication was rejected for invoice ${sub.invoiceNumber}. Our team will contact you via WhatsApp.`,
        date: new Date().toISOString(),
        read: false,
        type: 'system'
      });
    } catch (err) {
      console.error('Error rejecting ad:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) {
      updateLocalStorageItem(null, id);
      await deleteAdSubmissionFromFirestore(id);
    }
  };

  const openWhatsAppChat = (phone: string, sub: AdSubmission) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('20') ? cleanPhone : (cleanPhone.startsWith('0') ? `20${cleanPhone.substring(1)}` : `20${cleanPhone}`);
    const msg = encodeURIComponent(
      lang === 'ar'
        ? `مرحباً بك ${sub.advertiserName} 💃🕺\nنتواصل معك من إدارة تطبيق Dance With Me بخصوص طلب إعلان VIP (فاتورة رقم ${sub.invoiceNumber}).`
        : `Hello ${sub.advertiserName} 💃🕺\nWe are contacting you from Dance With Me admin regarding your VIP ad submission (Invoice ${sub.invoiceNumber}).`
    );
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
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

  return (
    <div className="w-full max-w-5xl mx-auto pt-2 pb-36 sm:pb-44" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Receipt & JSON Preview Modals */}
      <AnimatePresence>
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

      {/* Main Admin Section View Header or welcome dashboard menu */}
      {adminSection !== null ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              adminSection === 'submissions' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' :
              adminSection === 'database' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' :
              adminSection === 'support' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
              adminSection === 'security' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
              adminSection === 'branding' ? 'bg-pink-500/10 border border-pink-500/30 text-pink-400' :
              adminSection === 'pricing' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
              adminSection === 'analytics' ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' :
              adminSection === 'create_ad_admin' ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400' :
              'bg-purple-500/10 border border-purple-500/30 text-purple-400'
            }`}>
              {adminSection === 'submissions' && <Crown className="h-6 w-6" />}
              {adminSection === 'database' && <Database className="h-6 w-6 animate-pulse" />}
              {adminSection === 'support' && <MessageSquare className="h-6 w-6" />}
              {adminSection === 'users' && <Users className="h-6 w-6" />}
              {adminSection === 'security' && <ShieldAlert className="h-6 w-6" />}
              {adminSection === 'branding' && <Sparkles className="h-6 w-6 animate-pulse" />}
              {adminSection === 'pricing' && <DollarSign className="h-6 w-6" />}
              {adminSection === 'analytics' && <BarChart3 className="h-6 w-6" />}
              {adminSection === 'create_ad_admin' && <FilePlus className="h-6 w-6 animate-pulse" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {adminSection === 'submissions' && (lang === 'ar' ? '📋 مراجعة طلبات الإعلانات VIP' : '📋 VIP Ad Submissions')}
                {adminSection === 'database' && (lang === 'ar' ? '🗄️ مستكشف قاعدة البيانات المباشر (Firestore)' : '🗄️ Live Database Inspector (Firestore)')}
                {adminSection === 'support' && (lang === 'ar' ? '💬 صندوق رسائل ومقترحات التطبيق' : '💬 Support Messages & Feedback')}
                {adminSection === 'users' && (lang === 'ar' ? '👥 إدارة ومراقبة مستخدمي التطبيق' : '👥 App Users Management')}
                {adminSection === 'security' && (lang === 'ar' ? '🔒 إدارة الأمان وجدار الحماية وسجلات الاختراق' : '🔒 Security Firewall & Violation Logs')}
                {adminSection === 'branding' && (lang === 'ar' ? '🎨 هوية التطبيق وتطوير المظهر والشعارات' : '🎨 App Identity & Visual Branding')}
                {adminSection === 'pricing' && (lang === 'ar' ? '💰 التحكم في أسعار الإعلانات' : '💰 Manage Ad Prices')}
                
      {adminSection === 'pricing' && (
        <div className="space-y-6 animate-fadeIn text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="rounded-3xl border border-emerald-500/30 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/20 p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-lg sm:text-xl font-extrabold text-white mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400 animate-pulse" />
              <span>{lang === 'ar' ? '💰 التحكم في أسعار الإعلانات' : '💰 Manage Ad Prices'}</span>
            </h3>
            
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* VIP Pricing Form */}
              <div className="bg-neutral-950 p-5 rounded-2xl border border-amber-500/30">
                <h4 className="text-amber-400 font-bold flex items-center gap-2 mb-4">
                  <Crown className="h-4 w-4" />
                  {lang === 'ar' ? 'أسعار الإعلان المميز (VIP)' : 'VIP Ad Pricing'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'السعر الأساسي (لأول أسبوع/7 أيام)' : 'Base Price (First 7 days)'}
                    </label>
                    <input 
                      type="number"
                      value={localPricingConfig?.vip?.basePrice || 100}
                      onChange={(e) => setLocalPricingConfig({ ...localPricingConfig, vip: { ...localPricingConfig?.vip, basePrice: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'سعر كل يوم زيادة' : 'Extra Day Price'}
                    </label>
                    <input 
                      type="number"
                      value={localPricingConfig?.vip?.extraDayPrice || 20}
                      onChange={(e) => setLocalPricingConfig({ ...localPricingConfig, vip: { ...localPricingConfig?.vip, extraDayPrice: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'نسبة الزيادة لإعلان الفيديو (%)' : 'Video Surcharge Percentage (%)'}
                    </label>
                    <input 
                      type="number"
                      value={localPricingConfig?.vip?.videoSurchargePercentage || 20}
                      onChange={(e) => setLocalPricingConfig({ ...localPricingConfig, vip: { ...localPricingConfig?.vip, videoSurchargePercentage: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Standard Pricing Form */}
              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-700">
                <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4" />
                  {lang === 'ar' ? 'أسعار الإعلان العادي (Standard)' : 'Standard Ad Pricing'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'السعر الأساسي (لأول أسبوع/7 أيام)' : 'Base Price (First 7 days)'}
                    </label>
                    <input 
                      type="number"
                      value={localPricingConfig?.standard?.basePrice || 50}
                      onChange={(e) => setLocalPricingConfig({ ...localPricingConfig, standard: { ...localPricingConfig?.standard, basePrice: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'سعر كل يوم زيادة' : 'Extra Day Price'}
                    </label>
                    <input 
                      type="number"
                      value={localPricingConfig?.standard?.extraDayPrice || 10}
                      onChange={(e) => setLocalPricingConfig({ ...localPricingConfig, standard: { ...localPricingConfig?.standard, extraDayPrice: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      {lang === 'ar' ? 'نسبة الزيادة لإعلان الفيديو (%)' : 'Video Surcharge Percentage (%)'}
                    </label>
                    <input 
                      type="number"
                      value={localPricingConfig?.standard?.videoSurchargePercentage || 10}
                      onChange={(e) => setLocalPricingConfig({ ...localPricingConfig, standard: { ...localPricingConfig?.standard, videoSurchargePercentage: Number(e.target.value) }})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={async () => {
                  setSavingPricing(true);
                  await updatePricingConfig(localPricingConfig as any);
                  setSavingPricing(false);
                }}
                disabled={savingPricing}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {savingPricing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {lang === 'ar' ? 'حفظ الأسعار في قاعدة البيانات' : 'Save Prices to Database'}
              </button>
            </div>
          </div>
        </div>
      )}

{adminSection === 'analytics' && (lang === 'ar' ? '📊 إحصائيات زوار الموقع الحقيقيين واهتمام الجمهور' : '📊 Real-time Analytics & Audience Interest')}
                {adminSection === 'create_ad_admin' && (lang === 'ar' ? '➕ إنشاء إعلان / حفلة جديدة فوراً بواسطة الإدارة' : '➕ Create & Publish Event Immediately (Admin)')}
                {adminSection === 'bookings' && (lang === 'ar' ? '🎟️ مراجعة وتأكيد حجوزات التذاكر والحفلات' : '🎟️ Review & Confirm Ticket Bookings')}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {adminSection === 'submissions' && (lang === 'ar' ? 'مراجعة وتفعيل الإعلانات الفاخرة وتتبع إيصالات التحويل البنكي.' : 'Manage premium ad campaigns, analyze bank receipts, and activate VIP slots.')}
                {adminSection === 'database' && (lang === 'ar' ? 'استعراض البيانات والفعاليات والإشعارات وحذف المخلفات بشكل مباشر.' : 'Real-time viewer of live Firestore collections, schemas, and events.')}
                {adminSection === 'support' && (lang === 'ar' ? 'التواصل المباشر وحل المشاكل التقنية للأعضاء وإرسال الردود الرسمية.' : 'Read user feedback and inquiries directly and send notifications.')}
                {adminSection === 'users' && (lang === 'ar' ? 'البحث عن الحسابات بالأرقام السرية أو الإيميل، تجميد أو حذف الأعضاء.' : 'Audit member profiles, passwords, registration dates, suspend or delete records.')}
                {adminSection === 'security' && (lang === 'ar' ? 'تغيير العبارة السرية، مراقبة محاولات الاختراق، عناوين الـ IP للمهاجمين، وإعداد بلاغات أمنية.' : 'Update VIP secret code, monitor unauthorized access logs, block IPs, and prepare security reports.')}
                {adminSection === 'branding' && (lang === 'ar' ? 'تعديل وتخصيص أسماء التطبيق وشعاراته وأيقوناته وروابط الاتصال بقاعدة البيانات في الوقت الفعلي.' : 'Modify app names, icons, brand logos, support contact phone, and other static assets.')}
                {adminSection === 'pricing' && (lang === 'ar' ? 'تعديل وتحديد قيمة حجز الإعلان المميز والعادي لكل أسبوع أو يوم، مع تحديد نسبة الزيادة الخاصة بإعلانات الفيديو.' : 'Configure prices for VIP and Standard ads per week/day, and set video surcharge percentage.')}
                {adminSection === 'analytics' && (lang === 'ar' ? 'تحليل حركة المرور الحية، واهتمامات الراقصين بالأنماط المختلفة، ونسب استخدام أزرار التواصل والخريطة.' : 'Live traffic insights, style-specific popularity heatmaps, and call-to-action click rates.')}
                {adminSection === 'create_ad_admin' && (lang === 'ar' ? 'نموذج لوحة الإدارة المتكامل لإنشاء ونشر الفعاليات وتثبيتها وتحديد ترتيب ظهورها مباشرة دون انتظار أو دفع.' : 'Admin panel integrated form to compose, publish, pin, and prioritize events directly in real-time.')}
                {adminSection === 'bookings' && (lang === 'ar' ? 'لوحة المسؤولين للتحقق من إيصالات تحويل فودافون كاش ومطابقة المبالغ وإصدار أكواد الدخول والباركود للحضور.' : 'Verify transfer receipts, match paid amounts, and activate barcodes/entry keys for guests.')}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setAdminSection(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 px-4 py-2.5 text-xs font-bold text-neutral-200 transition-all cursor-pointer self-start sm:self-center shrink-0"
          >
            <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span>{lang === 'ar' ? 'الرجوع للوحة التحكم الرئيسية' : 'Back to Admin Dashboard'}</span>
          </button>
        </motion.div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-amber-500/50 bg-neutral-900 dark:bg-gradient-to-r dark:from-neutral-900 dark:via-neutral-900/95 dark:to-amber-950/40 p-6 sm:p-8 shadow-2xl gold-glow relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-neutral-950 shadow-lg gold-glow shrink-0">
                  <Crown className="h-8 w-8 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {lang === 'ar' ? 'لوحة تحكم ومراجعة الإعلانات الفاخرة' : 'VIP Ads Admin Panel'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-black text-xs">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-300 font-medium mt-1">
                    {lang === 'ar' 
                      ? 'مراجعة وتفعيل إعلانات وفواتير المدربين والمنظمين المشتركين، وإشعارهم فورياً عبر فايبر بيز وواتساب.' 
                      : 'Review and approve VIP event submissions and invoices from instructors and organizers.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                <button
                  onClick={handleCleanUpClutter}
                  disabled={cleaningUp}
                  className="flex items-center gap-2 rounded-xl bg-neutral-800 border border-red-500/30 px-3.5 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:border-red-500 transition-all cursor-pointer shadow-md"
                  title="حذف الإعلانات المكررة وبدون صور لتقليل الزحمة"
                >
                  <Trash2 className={`h-4 w-4 ${cleaningUp ? 'animate-spin' : ''}`} />
                  <span>{cleaningUp ? (lang === 'ar' ? 'جاري التنظيف...' : 'Cleaning...') : (lang === 'ar' ? '🧹 تنظيف الزحمة والمكرر' : '🧹 Clean Clutter')}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('explore');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 px-4 py-2.5 text-xs font-bold text-neutral-300 hover:text-white transition-all border border-neutral-700/60"
                >
                  <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  <span>{lang === 'ar' ? 'الرجوع للرئيسية' : 'Return to Explore'}</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Glowing Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-center">
              <span className="text-xs text-neutral-400 block font-medium">{lang === 'ar' ? 'إجمالي طلبات الإعلانات' : 'Total Ad Submissions'}</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block font-mono">{submissions.length}</span>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-center">
              <span className="text-xs text-neutral-400 block font-medium">{lang === 'ar' ? 'المستخدمين المسجلين' : 'Registered Users'}</span>
              <span className="text-2xl font-black text-purple-400 mt-1 block font-mono">{allUsers.length}</span>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-center">
              <span className="text-xs text-neutral-400 block font-medium">{lang === 'ar' ? 'الرسائل المعلقة' : 'Unreplied Support'}</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">
                {supportMessages.filter(m => !m.reply).length}
              </span>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-center">
              <span className="text-xs text-neutral-400 block font-medium">{lang === 'ar' ? 'الفعاليات بقاعدة البيانات' : 'Total Database Events'}</span>
              <span className="text-2xl font-black text-blue-400 mt-1 block font-mono">{events.length}</span>
            </div>
          </div>

          {usersError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200 text-xs sm:text-sm space-y-2">
              <p className="font-bold flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
                <span>
                  {lang === 'ar' 
                    ? '⚠️ تنبيه قاعدة البيانات: فشل تحميل قائمة المستخدمين بسبب صلاحيات الوصول!' 
                    : '⚠️ Database Warning: Failed to load user profiles due to permissions!'}
                </span>
              </p>
              <p className="opacity-90 leading-relaxed text-xs sm:text-sm">
                {lang === 'ar'
                  ? 'لم يستجب خادم Firebase بعرض بيانات الأعضاء لأنك غير مسجل الدخول ببريد المسؤول المعتمد (waelvts@gmail.com) في نظام التوثيق. يرجى الانتقال إلى قسم "حسابي" وتسجيل الدخول ببريد المسؤول أولاً وتفعيل حسابك.'
                  : 'Firebase rejected reading the users collection because your session is not authenticated as the designated admin email (waelvts@gmail.com) in Firebase Auth. Please navigate to the "Account" tab and sign in using the admin email.'}
              </p>
              <p className="text-[10px] opacity-70 font-mono select-text">{usersError}</p>
            </div>
          )}

          {/* Categories Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card 1: Submissions */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('submissions');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-amber-500/30 hover:border-amber-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-amber-950/20 p-6 shadow-xl hover:shadow-amber-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Crown className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black font-mono">
                    {submissions.filter(s => s.status === 'pending').length} {lang === 'ar' ? 'معلق' : 'Pending'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '📋 مراجعة طلبات الإعلانات' : '📋 VIP Ad Submissions'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'اعتماد وتفعيل إعلانات VIP، مراجعة إيصالات الدفع، إرسال إشعارات التفعيل التلقائية.'
                    : 'Approve or decline premium advertisement slots, review bank transfer documents, and notify advertisers.'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-black text-amber-400 gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                <span>{lang === 'ar' ? 'دخول القسم ➔' : 'Enter Section ➔'}</span>
              </div>
            </motion.div>

            {/* Card 2: Database */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('database');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-blue-500/30 hover:border-blue-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/20 p-6 shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Database className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black font-mono">
                    LIVE
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '🗄️ مستكشف قاعدة البيانات' : '🗄️ Live Database Inspector'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'استعراض مستندات ومجموعات Firestore الحية، تعديل وحذف البيانات يدوياً وتصدير النسخ الاحتياطية.'
                    : 'Inspect live Firestore collections directly, modify data, delete duplicate records, and download backups.'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-black text-blue-400 gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                <span>{lang === 'ar' ? 'دخول القسم ➔' : 'Enter Section ➔'}</span>
              </div>
            </motion.div>

            {/* Card 3: Support */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('support');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-emerald-500/30 hover:border-emerald-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/20 p-6 shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <MessageSquare className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black font-mono">
                    {supportMessages.filter(m => !m.reply).length} {lang === 'ar' ? 'معلق' : 'Unreplied'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '💬 رسائل ومقترحات التطبيق' : '💬 Support Messages & Feedback'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'قراءة استفسارات المستخدمين والرد عليها، وإرسال تنبيهات رسمية تظهر مباشرة في حساباتهم.'
                    : 'Read community feedback, respond to inquiries, and notify users of official system updates.'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-black text-emerald-400 gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                <span>{lang === 'ar' ? 'دخول القسم ➔' : 'Enter Section ➔'}</span>
              </div>
            </motion.div>

            {/* Card 4: Users */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('users');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-purple-500/30 hover:border-purple-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-purple-950/20 p-6 shadow-xl hover:shadow-purple-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Users className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black font-mono">
                    {allUsers.length} {lang === 'ar' ? 'مستخدم' : 'Users'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '👥 مستخدمي التطبيق' : '👥 App Users Management'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'مراقبة حسابات الأعضاء والبحث المتقدم بالرمز السري أو الاسم مع إمكانية التجميد والحذف.'
                    : 'Monitor registered users, search details instantly by email/password, suspend access or delete.'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-black text-purple-400 gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                <span>{lang === 'ar' ? 'دخول القسم ➔' : 'Enter Section ➔'}</span>
              </div>
            </motion.div>

            {/* Card 5: Security Firewall */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('security');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-red-500/30 hover:border-red-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-red-950/20 p-6 shadow-xl hover:shadow-red-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                    <ShieldAlert className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-black font-mono">
                    SECURE
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '🔒 الأمان وسجلات الاختراق' : '🔒 Security & Hack Attempts'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'تعديل الرقم السري الثنائي للوحة، مراقبة محاولات الاختراق، عناوين الـ IP للأجهزة لعمل البلاغات.'
                    : 'Manage firewall access codes, check blocked hacker IPs, locations, and copy reports.'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-black text-red-400 gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                <span>{lang === 'ar' ? 'دخول القسم ➔' : 'Enter Section ➔'}</span>
              </div>
            </motion.div>

            {/* Card 6: Branding & App Assets */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('branding');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-pink-500/30 hover:border-pink-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-pink-950/20 p-6 shadow-xl hover:shadow-pink-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                    <Sparkles className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-black font-mono">
                    ASSETS
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '🎨 هوية التطبيق والشعارات' : '🎨 App Identity & Assets'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'التحكم باسم التطبيق، شعار الهوية (Logo)، أيقونة العرض، روابط الدعم المباشرة وتطوير المظهر.'
                    : 'Manage application title, branding logos, visual icons, custom social links, and contact settings.'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-black text-pink-400 gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                <span>{lang === 'ar' ? 'دخول القسم ➔' : 'Enter Section ➔'}</span>
              </div>
            </motion.div>

                        {/* Card X: Pricing Config */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('pricing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-emerald-500/30 hover:border-emerald-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/20 p-6 shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <DollarSign className="h-6 w-6 stroke-[2]" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '💰 التحكم في أسعار الإعلانات' : '💰 Manage Ad Prices'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'تعديل وتحديد قيمة حجز الإعلان المميز والعادي لكل أسبوع أو يوم، مع تحديد نسبة الزيادة الخاصة بإعلانات الفيديو.'
                    : 'Configure prices for VIP and Standard ads per week/day, and set video surcharge percentage.'}
                </p>
              </div>
            </motion.div>

{/* Card 7: Live App Analytics & Traffic */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('analytics');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-cyan-500/30 hover:border-cyan-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-cyan-950/20 p-6 shadow-xl hover:shadow-cyan-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <BarChart3 className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black font-mono">
                    REALTIME
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '📊 إحصائيات زوار الموقع واهتمام الجمهور' : '📊 Realtime Analytics & Interest'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'مراقبة عدد الزوار الفعليين، مشاهدات الأقسام، واهتمام الجمهور بكل رقصة (سالسا، باتشاتا، إلخ) وتتبع النقرات بشكل حي مجاني.'
                    : 'Track actual site visitors, active session metrics, style interests (Salsa, Bachata) and contact button click rates in real-time, 100% free.'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-black text-cyan-400 gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                <span>{lang === 'ar' ? 'دخول القسم ➔' : 'Enter Section ➔'}</span>
              </div>
            </motion.div>

            {/* Card 8: Create Event / Ad (Admin) */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('create_ad_admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-indigo-500/30 hover:border-indigo-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-indigo-950/20 p-6 shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <FilePlus className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black font-mono">
                    ADMIN ONLY
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '➕ إنشاء إعلان بواسطة الإدارة' : '➕ Create Event (Admin Mode)'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'إنشاء ونشر الفعاليات الفورية مع التحكم في ترتيب الظهور (الترتيب الرقمي) لتثبيت وعرض أي إعلان أولاً.'
                    : 'Compose and publish active events instantly. Define exact custom display priority (numerical order) to pin ads.'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-black text-indigo-400 gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                <span>{lang === 'ar' ? 'دخول القسم ➔' : 'Enter Section ➔'}</span>
              </div>
            </motion.div>

            {/* Card 9: Bookings Management (Ticket reservations) */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('bookings');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-emerald-500/30 hover:border-emerald-400 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/20 p-6 shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
            >
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500" />
              <div>
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="h-6 w-6 stroke-[2]" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black font-mono">
                    {bookings.filter(b => b.status === 'pending').length} {lang === 'ar' ? 'معلق' : 'Pending'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-4">
                  {lang === 'ar' ? '🎟️ إدارة وحجوزات التذاكر' : '🎟️ Ticket Bookings Panel'}
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {lang === 'ar'
                    ? 'التحقق من تحويلات فودافون كاش ومطابقة الإيصالات، وتأكيد حجز التذاكر وإصدار الباركود وكود الدخول للحضور.'
                    : 'Match Instapay/Vodafone Cash receipts, activate attendee tickets, and issue check-in gate barcodes.'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-black text-emerald-400 gap-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1">
                <span>{lang === 'ar' ? 'دخول القسم ➔' : 'Enter Section ➔'}</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {adminSection === 'bookings' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Section Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-center">
              <span className="text-xs text-neutral-400 block font-medium">
                {lang === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
              </span>
              <span className="text-xl font-black text-amber-400 mt-1 block font-mono">
                {bookings ? bookings.length : 0}
              </span>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-center">
              <span className="text-xs text-neutral-400 block font-medium">
                {lang === 'ar' ? '🎟️ تذاكر قيد المراجعة' : '🎟️ Pending Review'}
              </span>
              <span className="text-xl font-black text-yellow-400 mt-1 block font-mono">
                {bookings ? bookings.filter(b => b.status === 'pending').length : 0}
              </span>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-center">
              <span className="text-xs text-neutral-400 block font-medium">
                {lang === 'ar' ? '✅ الحجوزات المقبولة' : '✅ Approved Bookings'}
              </span>
              <span className="text-xl font-black text-emerald-400 mt-1 block font-mono">
                {bookings ? bookings.filter(b => b.status === 'approved').length : 0}
              </span>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-center">
              <span className="text-xs text-neutral-400 block font-medium">
                {lang === 'ar' ? '❌ طلبات مرفوضة' : '❌ Rejected Bookings'}
              </span>
              <span className="text-xl font-black text-red-400 mt-1 block font-mono">
                {bookings ? bookings.filter(b => b.status === 'rejected').length : 0}
              </span>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Tab Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setBookingsFilter(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      bookingsFilter === tab
                        ? 'bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/15'
                        : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/60'
                    }`}
                  >
                    {tab === 'all' && (lang === 'ar' ? '📋 الكل' : '📋 All')}
                    {tab === 'pending' && (lang === 'ar' ? '⏳ معلق' : '⏳ Pending')}
                    {tab === 'approved' && (lang === 'ar' ? '✅ مقبول' : '✅ Approved')}
                    {tab === 'rejected' && (lang === 'ar' ? '❌ مرفوض' : '❌ Rejected')}
                  </button>
                ))}
              </div>

              {/* Search Field */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={
                    lang === 'ar' 
                      ? 'البحث برقم الحجز، اسم العميل، الموبايل...' 
                      : 'Search by booking ID, customer name, mobile...'
                  }
                  value={bookingsSearch}
                  onChange={(e) => setBookingsSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
                {bookingsSearch && (
                  <button
                    onClick={() => setBookingsSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {(() => {
              const list = bookings || [];
              const filtered = list.filter((b) => {
                // Status Filter
                if (bookingsFilter !== 'all' && b.status !== bookingsFilter) return false;

                // Search Filter
                if (bookingsSearch.trim()) {
                  const query = bookingsSearch.toLowerCase();
                  const refNum = b.refNumber.toLowerCase();
                  const name = b.userName.toLowerCase();
                  const phone = b.userPhone.toLowerCase();
                  const titleAr = (b.eventTitleAr || '').toLowerCase();
                  const titleEn = (b.eventTitleEn || '').toLowerCase();

                  return (
                    refNum.includes(query) ||
                    name.includes(query) ||
                    phone.includes(query) ||
                    titleAr.includes(query) ||
                    titleEn.includes(query)
                  );
                }

                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-3xl border border-dashed border-neutral-800 bg-neutral-900/20 p-12 text-center">
                    <p className="text-neutral-400 text-sm">
                      {lang === 'ar' 
                        ? '🚫 لا توجد طلبات حجز مطابقة للخيارات الحالية.' 
                        : '🚫 No bookings match your selected filters.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filtered.map((b) => {
                    return (
                      <motion.div
                        key={b.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
                      >
                        {/* Status bar top */}
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4 mb-4">
                          <div>
                            <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                              {lang === 'ar' ? 'رقم حجز مرجعي' : 'REFERENCE NUMBER'}
                            </span>
                            <h4 className="text-base font-black text-emerald-400 tracking-wider mt-0.5 select-all font-mono">
                              {b.refNumber}
                            </h4>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-[11px] font-black ${
                            b.status === 'approved' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : b.status === 'rejected'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300 animate-pulse'
                          }`}>
                            {b.status === 'approved' && (lang === 'ar' ? '✅ مقبول' : 'Approved')}
                            {b.status === 'rejected' && (lang === 'ar' ? '❌ مرفوض' : 'Rejected')}
                            {b.status === 'pending' && (lang === 'ar' ? '⏳ قيد المراجعة' : 'Pending Review')}
                          </span>
                        </div>

                        {/* Booking Details */}
                        <div className="space-y-4 flex-1">
                          {/* Attendee details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-neutral-400 block font-bold">
                                {lang === 'ar' ? '👤 اسم العميل (كامل بالبطاقة)' : '👤 Full Customer Name'}
                              </span>
                              <span className="text-sm font-extrabold text-white mt-1 block">
                                {b.userName}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-neutral-400 block font-bold">
                                {lang === 'ar' ? '📞 رقم الموبايل للتواصل' : '📞 Contact Phone'}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono font-bold text-white select-all">
                                  {b.userPhone}
                                </span>
                                <a
                                  href={`tel:${b.userPhone}`}
                                  className="h-6 w-6 rounded-md bg-neutral-800 hover:bg-neutral-750 flex items-center justify-center text-neutral-300 hover:text-white transition-all"
                                  title="اتصال مباشر"
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a
                                  href={`https://wa.me/${b.userPhone.replace('+', '').replace(/^0/, '20')}`}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="h-6 w-6 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-all"
                                  title="مراسلة واتساب"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Event details */}
                          <div className="rounded-2xl bg-neutral-950 p-3.5 space-y-2 border border-neutral-800/50">
                            <div>
                              <span className="text-[10px] text-neutral-400 block font-bold">
                                {lang === 'ar' ? '🎟️ الفعالية المطلوبة' : '🎟️ Reserved Event'}
                              </span>
                              <span className="text-xs font-extrabold text-neutral-200 mt-1 block line-clamp-1">
                                {lang === 'ar' ? b.eventTitleAr : b.eventTitleEn}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-900 text-center">
                              <div>
                                <span className="text-[9px] text-neutral-400 block font-bold">
                                  {lang === 'ar' ? 'عدد الأفراد' : 'Guests'}
                                </span>
                                <span className="text-xs font-extrabold text-amber-400 mt-0.5 block">
                                  {b.numberOfIndividuals} {lang === 'ar' ? 'أفراد' : 'people'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-neutral-400 block font-bold">
                                  {lang === 'ar' ? 'سعر الفرد' : 'Price / Individual'}
                                </span>
                                <span className="text-xs font-extrabold text-neutral-300 mt-0.5 block font-mono">
                                  {b.eventPrice} ج.م
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-neutral-400 block font-bold">
                                  {lang === 'ar' ? 'الإجمالي المطلوب' : 'Grand Total'}
                                </span>
                                <span className="text-xs font-black text-emerald-400 mt-0.5 block font-mono">
                                  {b.totalAmount} ج.م
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Receipt Image */}
                          {b.receiptImage && (
                            <div>
                              <span className="text-[10px] text-neutral-400 block font-bold mb-1.5">
                                {lang === 'ar' ? '📄 إيصال تحويل فودافون كاش / انستاباي' : '📄 Payment Receipt Screenshot'}
                              </span>
                              <div 
                                onClick={() => setSelectedBookingReceipt(b.receiptImage)}
                                className="relative rounded-2xl overflow-hidden border border-neutral-800 h-28 bg-neutral-950 hover:border-emerald-500/50 transition-all cursor-zoom-in group"
                              >
                                <img
                                  src={b.receiptImage}
                                  alt="Payment Receipt"
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {lang === 'ar' ? 'تكبير وعرض الإيصال' : 'View full size'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Status timestamps / codes */}
                          <div className="text-[10px] text-neutral-400 space-y-1 pt-1">
                            <div className="flex justify-between">
                              <span>{lang === 'ar' ? 'تاريخ تقديم الحجز:' : 'Submitted At:'}</span>
                              <span className="font-mono text-neutral-300">
                                {new Date(b.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                              </span>
                            </div>
                            {b.status === 'approved' && b.accessCode && (
                              <div className="flex justify-between bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10">
                                <span className="text-emerald-300 font-bold">{lang === 'ar' ? 'كود الدخول المعتمد:' : 'Access Code Issued:'}</span>
                                <span className="font-mono font-black text-emerald-400 select-all tracking-wider">{b.accessCode}</span>
                              </div>
                            )}
                            {b.status === 'rejected' && b.adminNotes && (
                              <div className="bg-red-500/5 px-2 py-1 rounded-md border border-red-500/10 text-red-300">
                                <span className="font-bold">{lang === 'ar' ? 'سبب الرفض:' : 'Rejection Note:'} </span>
                                <span>{b.adminNotes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        {b.status === 'pending' && (
                          <div className="border-t border-neutral-800 pt-4 mt-4 space-y-3">
                            {/* Rejection input toggle */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder={lang === 'ar' ? 'أضف ملاحظات أو سبب الرفض هنا...' : 'Enter rejection notes here...'}
                                value={rejectionReasonMap[b.id] || ''}
                                onChange={(e) => {
                                  setRejectionReasonMap(prev => ({
                                    ...prev,
                                    [b.id]: e.target.value
                                  }));
                                }}
                                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-all"
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={async () => {
                                  if (actionLoading) return;
                                  setActionLoading(b.id);
                                  // Rejection reason
                                  const reason = rejectionReasonMap[b.id] || (lang === 'ar' ? 'لم يتم استلام المبلغ بالكامل أو الإيصال غير صالح.' : 'Amount not received or receipt is invalid.');
                                  await rejectBooking(b.id, reason);
                                  setActionLoading(null);
                                }}
                                disabled={actionLoading !== null}
                                className="flex-1 bg-neutral-800 hover:bg-red-500/20 hover:text-red-300 text-neutral-300 border border-neutral-700/60 hover:border-red-500/40 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <XCircle className="h-4 w-4 shrink-0" />
                                <span>{lang === 'ar' ? 'رفض الحجز' : 'Decline Booking'}</span>
                              </button>

                              <button
                                onClick={async () => {
                                  if (actionLoading) return;
                                  setActionLoading(b.id);
                                  const code = `DWM-${b.refNumber.replace('#', '')}`;
                                  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(code)}`;
                                  await approveBooking(b.id, qr, code, 0, rejectionReasonMap[b.id] || '');
                                  setActionLoading(null);
                                }}
                                disabled={actionLoading !== null}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <span>{lang === 'ar' ? 'تأكيد الحجز وإصدار التذكرة' : 'Confirm & Issue Ticket'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Booking Receipt Lightbox Modal Overlay */}
      <AnimatePresence>
        {selectedBookingReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBookingReceipt(null)}
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setSelectedBookingReceipt(null)}
              className="absolute top-4 right-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full p-2"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={selectedBookingReceipt}
              alt="Expanded Payment Receipt Screenshot"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-neutral-800"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {adminSection === 'database' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Firebase Connection Card */}
          <div className="rounded-3xl border border-blue-500/30 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/40 p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                  <Database className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-extrabold text-white">
                      {lang === 'ar' ? 'قاعدة بيانات Google Cloud Firestore الخاصة بك' : 'Your Google Cloud Firestore Database'}
                    </h3>
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-mono">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      CONNECTED (Realtime Sync)
                    </span>
                  </div>
                  <div className="text-xs font-mono text-neutral-400 mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1">
                    <span>Project ID: <strong className="text-blue-300 select-all">{resolvedFirebaseConfig.projectId || 'Unknown'}</strong></span>
                    <span>Database ID: <strong className="text-blue-300 select-all">{databaseId || '(default)'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                {(() => {
                  const isDefaultDb = !databaseId || databaseId === '(default)' || databaseId === 'default';
                  const firebaseConsoleUrl = isDefaultDb
                    ? `https://console.firebase.google.com/project/${resolvedFirebaseConfig.projectId || 'Unknown'}/firestore/data`
                    : `https://console.firebase.google.com/project/${resolvedFirebaseConfig.projectId || 'Unknown'}/firestore/databases/${databaseId}/data`;
                  const cloudConsoleUrl = `https://console.cloud.google.com/firestore/databases/${isDefaultDb ? '(default)' : databaseId}/data?project=${resolvedFirebaseConfig.projectId || 'Unknown'}`;

                  return (
                    <>
                      <a
                        href={firebaseConsoleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer border border-blue-400/30"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'فتح في كونسول Firebase الرسمي 🚀' : 'Open Firebase Console 🚀'}</span>
                      </a>

                      <a
                        href={cloudConsoleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-all border border-white/10"
                      >
                        <ExternalLink className="h-4 w-4 text-neutral-400" />
                        <span>{lang === 'ar' ? 'Google Cloud Console ☁️' : 'Cloud Console ☁️'}</span>
                      </a>
                    </>
                  );
                })()}

                <button
                  onClick={handleExportBackup}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer border border-emerald-400/30 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'تصدير نسخة JSON 📥' : 'Export JSON Backup 📥'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Collection Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-neutral-900 border border-neutral-800">
            <button
              onClick={() => setDbSubTab('events')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dbSubTab === 'events' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Table className="h-4 w-4" />
              <span className="font-mono">events/</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">{events.length}</span>
            </button>

            <button
              onClick={() => setDbSubTab('submissions')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dbSubTab === 'submissions' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Table className="h-4 w-4" />
              <span className="font-mono">ad_submissions/</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">{submissions.length}</span>
            </button>

            <button
              onClick={() => setDbSubTab('notifications')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dbSubTab === 'notifications' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Table className="h-4 w-4" />
              <span className="font-mono">notifications/</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">{notifications.length}</span>
            </button>

            <button
              onClick={() => setDbSubTab('schema')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dbSubTab === 'schema' ? 'bg-indigo-600 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{lang === 'ar' ? '🛡️ هيكل القاعدة والأمان (Rules & Blueprint)' : '🛡️ Schema & ABAC Rules'}</span>
            </button>
          </div>

          {/* Tab 1: events/ */}
          {dbSubTab === 'events' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-2">
                <span>{lang === 'ar' ? `مجموعة الفعاليات والحفلات المخزنة (${events.length} وثيقة في Firestore)` : `Stored Events Collection (${events.length} docs in Firestore)`}</span>
                <span className="font-mono text-[11px] text-blue-400 select-all">/databases/(default)/documents/events</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {events.map((ev) => (
                  <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-blue-500/40 transition-all shadow-md">
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <img src={ev.thumbnailUrl || ev.mediaUrl} alt="" className="h-14 w-14 rounded-xl object-cover border border-white/10 shrink-0 shadow" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-blue-400 font-bold select-all">{ev.id}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-neutral-800 text-neutral-300 uppercase">{ev.category}</span>
                          {ev.isFeatured && <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">VIP</span>}
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1 truncate">{lang === 'ar' ? ev.titleAr : ev.titleEn}</h4>
                        <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span>💰 <strong className="text-white">{lang === 'ar' ? ev.priceAr : ev.priceEn}</strong></span>
                          <span>❤️ <strong className="text-white">{ev.likesCount}</strong> {lang === 'ar' ? 'إعجاب' : 'likes'}</span>
                          <span>📍 {lang === 'ar' ? ev.location?.nameAr : ev.location?.nameEn}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => setSelectedJsonDoc({ id: ev.id, title: lang === 'ar' ? ev.titleAr : ev.titleEn, data: ev })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-blue-300 font-bold text-xs transition-all cursor-pointer border border-blue-500/30"
                      >
                        <Code className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'عرض وثيقة JSON' : 'Inspect Doc'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الفعالية من قاعدة البيانات؟' : 'Are you sure you want to delete this event from DB?')) {
                            deleteEvent(ev.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                        title={lang === 'ar' ? 'حذف من القاعدة' : 'Delete Document'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: ad_submissions/ */}
          {dbSubTab === 'submissions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-2">
                <span>{lang === 'ar' ? `طلبات وفواتير إعلانات VIP (${submissions.length} وثيقة في Firestore)` : `Stored Ad Submissions (${submissions.length} docs in Firestore)`}</span>
                <span className="font-mono text-[11px] text-blue-400 select-all">/databases/(default)/documents/ad_submissions</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-blue-500/40 transition-all shadow-md">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-amber-400 font-bold select-all">INV: #{sub.invoiceNumber}</span>
                        <span className="font-mono text-[11px] text-neutral-500 select-all">ID: {sub.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sub.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          sub.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          sub.status === 'archived' ? 'bg-amber-600/20 text-amber-300 border border-amber-600/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-1.5">{sub.titleAr} <span className="text-neutral-400 font-normal">({sub.advertiserName})</span></h4>
                      <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span>📱 <strong className="text-white font-mono">{sub.phone}</strong></span>
                        <span>💵 <strong className="text-emerald-400 font-mono">{sub.amount} EGP</strong></span>
                        <span>📅 {new Date(sub.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => setSelectedJsonDoc({ id: sub.id, title: `Invoice #${sub.invoiceNumber}`, data: sub })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-blue-300 font-bold text-xs transition-all cursor-pointer border border-blue-500/30"
                      >
                        <Code className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'عرض وثيقة JSON' : 'Inspect Doc'}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: notifications/ */}
          {dbSubTab === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-2">
                <span>{lang === 'ar' ? `إشعارات النظام المخزنة (${notifications.length} وثيقة)` : `Stored Notifications (${notifications.length} docs)`}</span>
                <span className="font-mono text-[11px] text-blue-400 select-all">/databases/(default)/documents/notifications</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-blue-500/40 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-400 font-bold select-all">{notif.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300">{notif.type || 'system'}</span>
                        {notif.read ? <span className="text-neutral-500 text-[10px]">Read ✓</span> : <span className="text-amber-400 text-[10px] font-bold">Unread •</span>}
                      </div>
                      <h4 className="font-bold text-white text-sm mt-1">{lang === 'ar' ? notif.titleAr : notif.titleEn}</h4>
                      <p className="text-xs text-neutral-300 mt-0.5">{lang === 'ar' ? notif.messageAr : notif.messageEn}</p>
                      <span className="text-[10px] text-neutral-500 font-mono mt-1 block">{new Date(notif.date).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => setSelectedJsonDoc({ id: notif.id, title: lang === 'ar' ? notif.titleAr : notif.titleEn, data: notif })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-blue-300 font-bold text-xs transition-all cursor-pointer border border-blue-500/30 shrink-0"
                    >
                      <Code className="h-3.5 w-3.5" />
                      <span>JSON</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: schema/ */}
          {dbSubTab === 'schema' && (
            <div className="rounded-3xl bg-neutral-900 border border-white/10 p-6 space-y-6 text-left dir-ltr">
              <div>
                <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  <span>Zero-Trust ABAC Firestore Security & Schema Blueprint</span>
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  This application utilizes Google Cloud Firestore with real-time WebSocket synchronization and offline persistence. Below is the configured architectural blueprint and security validation model.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5 font-mono text-xs space-y-2">
                  <div className="text-indigo-400 font-bold">// 1. Collection: /events/ (DanceEvent Schema)</div>
                  <div className="text-neutral-300">
                    Fields: id (string), titleAr/En (string), category (enum: party|course|trip), styles (list&lt;string&gt;), priceAr/En (string), location (map), likesCount (int), isFeatured (bool)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5 font-mono text-xs space-y-2">
                  <div className="text-amber-400 font-bold">// 2. Collection: /ad_submissions/ (VIP Ad Invoices Schema)</div>
                  <div className="text-neutral-300">
                    Fields: id (string), titleAr/En (string), invoiceNumber (string), advertiserName (string), phone (string), amount (number), status (enum: pending|approved|rejected|archived), receiptUrl (string), submittedAt (timestamp)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5 font-mono text-xs space-y-2">
                  <div className="text-emerald-400 font-bold">// 3. Collection: /notifications/ (System & Ad Alerts Schema)</div>
                  <div className="text-neutral-300">
                    Fields: id (string), titleAr/En (string), messageAr/En (string), date (timestamp), read (bool), type (enum: system|promo|ad_status)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {adminSection === 'submissions' && (
        <div>
          {/* Filter Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-bold w-full lg:w-auto">
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === 'pending' ? 'bg-amber-500 text-neutral-950 shadow-md font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                  {submissions.filter(s => s.status === 'pending').length}
                </span>
              </button>

              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === 'approved' ? 'bg-emerald-500 text-neutral-950 shadow-md font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'المفعلة (مقبول)' : 'Approved'}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                  {submissions.filter(s => s.status === 'approved').length}
                </span>
              </button>

              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === 'rejected' ? 'bg-red-500 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'المرفوضة' : 'Rejected'}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                  {submissions.filter(s => s.status === 'rejected').length}
                </span>
              </button>

              <button
                onClick={() => setFilter('archived')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === 'archived' ? 'bg-amber-600 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'الأرشيف (بحد أقصى شهر)' : 'Archived (Max 1 Mo)'}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                  {submissions.filter(s => s.status === 'archived').length}
                </span>
              </button>

              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  filter === 'all' ? 'bg-neutral-700 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>{lang === 'ar' ? 'الكل' : 'All'}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                  {submissions.length}
                </span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleAutoScanExpired}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-extrabold text-xs hover:from-amber-400 hover:to-amber-500 shadow-md gold-glow transition-all cursor-pointer w-full sm:w-auto"
                title="Scan approved ads and move expired ones to archive with instant advertiser alert"
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{lang === 'ar' ? '⚡ فحص ونقل المنتهي للأرشيف وتنبيه المعلن' : '⚡ Auto-Archive Expired & Notify'}</span>
              </button>

              <button
                onClick={handleManualRefresh}
                disabled={manualRefreshing || loading}
                title={lang === 'ar' ? 'تحديث ومزامنة البيانات من فليستور الآن' : 'Force refresh data from Firestore now'}
                className="text-xs text-neutral-300 font-mono flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800/60 hover:bg-neutral-800 hover:border-amber-500/30 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${(loading || manualRefreshing) ? 'animate-spin' : ''}`} />
                <span>
                  {manualRefreshing 
                    ? (lang === 'ar' ? 'جاري التحديث...' : 'Syncing...') 
                    : (lang === 'ar' ? 'تحديث تلقائي لحظي' : 'Live Firebase Sync')}
                </span>
              </button>
            </div>
          </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-20 text-center text-neutral-400">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-amber-400 mb-3" />
          <p className="text-sm font-bold">{lang === 'ar' ? 'جاري جلب الفواتير وطلبات الإعلانات من فايبر بيز...' : 'Loading submissions from Firebase...'}</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-12 text-center text-neutral-400">
          <FileText className="h-12 w-12 mx-auto text-neutral-600 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">
            {lang === 'ar' ? 'لا توجد طلبات في هذه القائمة' : 'No submissions found in this list'}
          </h3>
          <p className="text-xs text-neutral-500">
            {lang === 'ar' ? 'عندما يرسل المدربون والمنظمون إعلانات ومراجعة فواتير، ستظهر هنا فوراً.' : 'When organizers submit ads and invoices, they will appear here instantly.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                sub.status === 'pending'
                  ? 'border-amber-500/40 bg-gradient-to-r from-neutral-900 to-amber-950/20 shadow-lg'
                  : sub.status === 'approved'
                  ? 'border-emerald-500/30 bg-neutral-900/80'
                  : 'border-red-500/30 bg-neutral-900/50 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                    sub.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : sub.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}>
                    {sub.invoiceNumber}
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    sub.status === 'pending' ? 'bg-amber-500 text-neutral-950 animate-pulse' :
                    sub.status === 'approved' ? 'bg-emerald-500 text-neutral-950' : 'bg-red-500 text-white'
                  }`}>
                    {sub.status === 'pending' ? (lang === 'ar' ? 'قيد المراجعة' : 'Pending') :
                     sub.status === 'approved' ? (lang === 'ar' ? 'مفعل ومقبول' : 'Approved') :
                     (lang === 'ar' ? 'مرفوض' : 'Rejected')}
                  </span>
                </div>

                <div className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  <span>{new Date(sub.submittedAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-1">
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-medium">
                    <User className="h-3.5 w-3.5 text-amber-400" />
                    <span>{lang === 'ar' ? 'اسم المعلن:' : 'Advertiser Name:'}</span>
                  </span>
                  <span className="text-sm font-bold text-white block">{sub.advertiserName}</span>
                  <span className="text-xs font-mono text-neutral-400 block">{sub.phone}</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-1">
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>{lang === 'ar' ? 'عنوان ونوع الإعلان:' : 'Ad Title & Type:'}</span>
                  </span>
                  <span className="text-sm font-bold text-white block truncate">
                    {lang === 'ar' ? sub.titleAr : sub.titleEn}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      sub.adType === 'vip' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'bg-neutral-800 text-neutral-300 border-neutral-600'
                    }`}>
                      {sub.adType === 'vip' ? (lang === 'ar' ? 'VIP مميز' : 'VIP Ad') : (lang === 'ar' ? 'عادي' : 'Standard')}
                    </span>
                    <span className="text-xs text-amber-300 font-medium block">
                      {sub.pricing?.days || 3} {lang === 'ar' ? 'أيام ترويج' : 'Days Promo'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-1">
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-medium">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'ar' ? 'المبلغ المطلوب:' : 'Total Amount:'}</span>
                  </span>
                  <span className="text-lg font-black text-emerald-400 block">
                    {sub.pricing?.total || 250} {lang === 'ar' ? 'جنيه مصري' : 'EGP'}
                  </span>
                </div>
              </div>

              {/* Visual Ad Media Preview */}
              {(sub.mediaUrl || sub.eventData?.mediaUrl) && (
                <div className="mb-5 p-4 rounded-xl bg-neutral-950/60 border border-white/5">
                  <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-bold mb-2.5">
                    <ImageIcon className="h-4 w-4 text-amber-400" />
                    <span>{lang === 'ar' ? '🖼️ الصورة أو الفيديو الإعلاني المرفق:' : '🖼️ Attached Ad Image / Video:'}</span>
                  </span>
                  
                  <div className="relative max-w-xs aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-950 border border-white/10 group/media shadow-md">
                    {(sub.mediaType === 'video' || sub.eventData?.mediaType === 'video') ? (
                      <video 
                        src={sub.mediaUrl || sub.eventData?.mediaUrl} 
                        className="h-full w-full object-cover" 
                        controls 
                        muted 
                        playsInline
                      />
                    ) : (
                      <img 
                        src={sub.mediaUrl || sub.eventData?.mediaUrl} 
                        alt="Attached Ad Media" 
                        className="h-full w-full object-cover" 
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 flex items-center justify-center transition-all pointer-events-none">
                      <span className="px-3 py-1.5 rounded-full bg-neutral-900/95 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        {lang === 'ar' ? 'معاينة الإعلان الفني' : 'Media Preview'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Preview & Actions */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-3 border-t border-white/5">
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                  {sub.receiptImage ? (
                    <button
                      onClick={() => setSelectedReceipt(sub.receiptImage || null)}
                      className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-all text-xs font-bold cursor-pointer w-full sm:w-auto"
                    >
                      <ImageIcon className="h-4 w-4 shrink-0" />
                      <span>{lang === 'ar' ? 'عرض إيصال التحويل البنكي' : 'View Transfer Receipt'}</span>
                      <Eye className="h-3.5 w-3.5 ml-1 shrink-0" />
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-500 italic py-2 text-center sm:text-left">
                      {lang === 'ar' ? 'لم يتم إرفاق صورة إيصال' : 'No receipt image attached'}
                    </span>
                  )}

                  <button
                    onClick={() => openWhatsAppChat(sub.phone, sub)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all text-xs font-bold cursor-pointer w-full sm:w-auto"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{lang === 'ar' ? 'مراسلة المعلن واتساب' : 'WhatsApp Advertiser'}</span>
                  </button>
                </div>

                {/* Admin Approval Buttons */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto justify-end">
                  {sub.status === 'pending' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={actionLoading === sub.id}
                        onClick={() => handleApprove(sub)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-black text-xs hover:bg-emerald-400 shadow-md transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                      >
                        <Check className="h-4 w-4 stroke-[3] shrink-0" />
                        <span>{actionLoading === sub.id ? '...' : (lang === 'ar' ? 'قبول ونشر الإعلان فوراً' : 'Approve & Publish Ad')}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={actionLoading === sub.id}
                        onClick={() => handleReject(sub)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-600/20 text-red-300 border border-red-500/40 font-bold text-xs hover:bg-red-600/30 transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                      >
                        <XCircle className="h-4 w-4 shrink-0" />
                        <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                      </motion.button>
                    </>
                  )}

                  {sub.status === 'approved' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={actionLoading === sub.id}
                      onClick={() => handleArchive(sub)}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs hover:bg-amber-500/30 transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                      title={lang === 'ar' ? 'نقل للأرشيف بحد أقصى شهر مع تنبيه المعلن' : 'Move to Archive (Max 1 Mo) & Alert Advertiser'}
                    >
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{actionLoading === sub.id ? '...' : (lang === 'ar' ? '📦 نقل للأرشيف (انتهاء الصلاحية)' : '📦 Move to Archive')}</span>
                    </motion.button>
                  )}

                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-neutral-800 text-neutral-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer w-full sm:w-auto"
                    title={lang === 'ar' ? 'حذف السجل' : 'Delete'}
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    <span className="inline sm:hidden text-xs font-bold ml-1">{lang === 'ar' ? 'حذف السجل' : 'Delete Record'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
        </div>
      )}

      {adminSection === 'support' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card */}
          <div className="rounded-3xl border border-emerald-500/30 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/40 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {lang === 'ar' ? 'صندوق رسائل ومقترحات وشكاوى المستخدمين' : 'User Support & Feedback Inbox'}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                    {lang === 'ar'
                      ? 'مراجعة الرسائل والمقترحات المباشرة، وتوجيه الرد الرسمي ليتم إشعاره في ملف المستخدم الشخصي.'
                      : 'Review direct feedback and send official replies notified directly to the user profile.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 w-fit">
            <button
              onClick={() => setSupportFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                supportFilter === 'all' ? 'bg-emerald-500 text-neutral-950 shadow-md font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{lang === 'ar' ? 'الكل' : 'All'}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">{supportMessages.length}</span>
            </button>
            <button
              onClick={() => setSupportFilter('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                supportFilter === 'pending' ? 'bg-amber-500 text-neutral-950 shadow-md font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{lang === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">
                {supportMessages.filter(m => m.status === 'pending').length}
              </span>
            </button>
            <button
              onClick={() => setSupportFilter('replied')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                supportFilter === 'replied' ? 'bg-blue-600 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>{lang === 'ar' ? 'تم الرد' : 'Replied'}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">
                {supportMessages.filter(m => m.status === 'replied').length}
              </span>
            </button>
          </div>

          {/* Messages List */}
          {supportMessages.length === 0 ? (
            <div className="rounded-3xl bg-neutral-900/60 border border-neutral-800 p-12 text-center text-neutral-400 font-medium">
              {lang === 'ar' ? 'لا توجد رسائل دعم ومقترحات واردة حتى الآن.' : 'No support messages received yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {supportMessages
                .filter(m => supportFilter === 'all' ? true : m.status === supportFilter)
                .map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl border p-6 transition-all ${
                      msg.status === 'pending'
                        ? 'bg-neutral-900 border-amber-500/40 shadow-lg'
                        : 'bg-neutral-900/80 border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                      <div className="flex items-center gap-3">
                        <img
                          src={msg.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={msg.userName}
                          className="h-12 w-12 rounded-full object-cover border border-amber-500/30"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">{msg.userName}</h4>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold shadow-inner">
                              {msg.refNumber}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 mt-1 font-mono">
                            <span>📧 {msg.userEmail}</span>
                            <span>📱 {msg.userPhone}</span>
                            <span>🕒 {new Date(msg.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {msg.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/40">
                            <Clock className="h-3.5 w-3.5" />
                            {lang === 'ar' ? 'بانتظار الرد' : 'Pending Reply'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {lang === 'ar' ? 'تم الرد الرسمي' : 'Replied Official'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="py-4 space-y-2">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {lang === 'ar' ? '💬 نص الشكوى / المقترح:' : '💬 User Message:'}
                      </span>
                      <p className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 leading-relaxed">
                        {msg.message}
                      </p>
                    </div>

                    {/* Previous Reply if exists */}
                    {msg.status === 'replied' && msg.replyText && (
                      <div className="py-2 space-y-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {lang === 'ar' ? `📢 رد الإدارة المُرسل للإشعارات (${msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString() : ''}):` : '📢 Sent Admin Reply:'}
                        </span>
                        <p className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-sm text-emerald-300 leading-relaxed font-medium">
                          {msg.replyText}
                        </p>
                      </div>
                    )}

                    {/* Reply Action Form */}
                    <div className="pt-4 border-t border-neutral-800/80 space-y-3">
                      <label className="block text-xs font-bold text-neutral-300">
                        {lang === 'ar'
                          ? (msg.status === 'replied' ? 'تحديث الرد أو إرسال رد إضافي للمستخدم:' : 'توجيه الرد إلى قسم الإشعارات في ملف المستخدم:')
                          : 'Send official reply to user profile notifications:'}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={replyInputMap[msg.id] || ''}
                          onChange={(e) => setReplyInputMap({ ...replyInputMap, [msg.id]: e.target.value })}
                          placeholder={
                            lang === 'ar'
                              ? `اكتب الرد الرسمي على (${msg.userName}) هنا...`
                              : `Write official reply to (${msg.userName})...`
                          }
                          className="flex-1 rounded-xl bg-neutral-950 px-4 py-3 text-sm text-white placeholder-neutral-500 border border-neutral-800 focus:border-emerald-500 focus:outline-none transition-all"
                        />
                        <button
                          onClick={async () => {
                            const text = replyInputMap[msg.id]?.trim();
                            if (!text) {
                              alert(lang === 'ar' ? 'يرجى كتابة نص الرد أولاً' : 'Please enter reply text first');
                              return;
                            }
                            const success = await replyToSupportMessage(msg.id, text);
                            if (success) {
                              setReplyInputMap({ ...replyInputMap, [msg.id]: '' });
                              alert(lang === 'ar' ? '✅ تم توجيه الرد بنجاح إلى صندوق الإشعارات في ملف المستخدم الشخصي!' : '✅ Reply sent and user notified successfully!');
                            }
                          }}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-xs font-bold text-black shadow-lg hover:from-emerald-400 hover:to-teal-500 transition-all shrink-0 cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                          <span>{lang === 'ar' ? 'إرسال الرد وإشعار المستخدم' : 'Send Reply & Notify'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      )}

      {adminSection === 'users' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card */}
          <div className="rounded-3xl border border-purple-500/30 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-purple-950/40 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                  <Users className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {lang === 'ar' ? 'إدارة ومراقبة مستخدمي التطبيق' : 'App Users Management & Monitoring'}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                    {lang === 'ar'
                      ? 'مراقبة حسابات الأعضاء والمنظمين، البحث عن بياناتهم، إيقاف الحسابات المؤذيّة أو حذفها بالكامل.'
                      : 'Monitor member and organizer accounts, search user details, suspend temporary access or delete completely.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tabs Selector */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 w-fit">
            <button
              onClick={() => {
                setUsersSubTab('all');
                setUserSearchQuery('');
              }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                usersSubTab === 'all' ? 'bg-purple-600 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Table className="h-4 w-4" />
                {lang === 'ar' ? 'جميع مستخدمي التطبيق' : 'All App Users'}
              </span>
            </button>
            <button
              onClick={() => setUsersSubTab('search')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                usersSubTab === 'search' ? 'bg-purple-600 text-white shadow-md font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Search className="h-4 w-4" />
                {lang === 'ar' ? 'البحث عن مستخدم' : 'Search for a User'}
              </span>
            </button>
          </div>

          {/* Search View Specific Inputs */}
          {usersSubTab === 'search' && (
            <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 shadow-lg">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Search className="h-4 w-4 text-purple-400" />
                {lang === 'ar' ? 'البحث بالاسم، البريد الإلكتروني أو الرقم السري' : 'Search by Name, Email, or Password'}
              </h4>
              <div className="relative">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'اكتب بريد المستخدم، اسمه، أو الرقم السري هنا للبحث المباشر...'
                      : 'Type user email, name, or password to search instantly...'
                  }
                  className="w-full rounded-2xl bg-neutral-950 px-5 py-4 pl-12 text-sm text-white placeholder-neutral-500 border border-neutral-800 focus:border-purple-500 focus:outline-none transition-all font-medium"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
              </div>
            </div>
          )}

          {/* Display Users Table / List */}
          <div className="rounded-3xl bg-neutral-900/60 border border-neutral-800 shadow-xl overflow-hidden">
            {usersError ? (
              <div className="p-8 text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h4 className="text-base font-extrabold text-red-400">
                    {lang === 'ar' ? '⚠️ فشل تحميل المستخدمين من قاعدة البيانات' : '⚠️ Failed to load users from Firestore'}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    {lang === 'ar'
                      ? 'تم حظر عملية قراءة كوليكشن المستخدمين بسبب صلاحيات الحماية بـ Firebase Rules. لعرض الحسابات وإدارتها، يجب أولاً تسجيل الدخول ببريد المسؤول waelvts@gmail.com في قسم "حسابي".'
                      : 'This read query is restricted by Firebase Security Rules. To review, search, and manage registered members, please sign in with your official admin email (waelvts@gmail.com) in the "Account" tab.'}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-500 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 mt-2 select-text">
                    {usersError}
                  </p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-neutral-400 font-medium">
                {lang === 'ar' 
                  ? 'لا يوجد مستخدمون متطابقون مع شروط البحث أو قاعدة البيانات فارغة.' 
                  : 'No users matching search criteria or database is empty.'}
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                <table className="w-full border-collapse text-right select-none">
                  <thead>
                    <tr className="bg-neutral-900/90 border-b border-neutral-800 text-neutral-400 font-bold text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 text-right">{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                      <th className="px-6 py-4 text-right">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                      <th className="px-6 py-4 text-right">{lang === 'ar' ? 'الرمز السري' : 'Password'}</th>
                      <th className="px-6 py-4 text-right">{lang === 'ar' ? 'تاريخ الإنشاء' : 'Creation Date'}</th>
                      <th className="px-6 py-4 text-right">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                      <th className="px-6 py-4 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredUsers.map((u) => {
                      const isOwner = u.id === user?.id;
                      return (
                        <tr 
                          key={u.id} 
                          className={`hover:bg-neutral-900/30 transition-all ${
                            u.isSuspended ? 'bg-red-950/10' : ''
                          }`}
                        >
                          {/* User Column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                                alt={u.name}
                                className="h-10 w-10 rounded-full object-cover border border-purple-500/30"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-white text-sm">{u.name}</span>
                                  {u.isAdmin && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black font-mono">
                                      ADMIN
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-neutral-400 font-mono block mt-0.5 select-all">
                                  ID: {u.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-300 select-all">
                            {u.email}
                          </td>

                          {/* Password Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-300 select-all">
                            {u.password ? (
                              <span className="bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 text-pink-400 text-xs font-semibold">
                                {u.password}
                              </span>
                            ) : (
                              <span className="text-neutral-500 italic text-xs">
                                {lang === 'ar' ? 'جوجل / خارجي' : 'Google/OAuth'}
                              </span>
                            )}
                          </td>

                          {/* Date Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                          </td>

                          {/* Status Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold">
                            {u.isSuspended ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                                <Ban className="h-3 w-3" />
                                {lang === 'ar' ? 'موقوف مؤقتاً' : 'Suspended'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck className="h-3 w-3" />
                                {lang === 'ar' ? 'نشط' : 'Active'}
                              </span>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Toggle Suspension button */}
                              <button
                                onClick={async () => {
                                  if (isOwner) {
                                    alert(lang === 'ar' ? '❌ لا يمكنك إيقاف حسابك الأساسي!' : '❌ You cannot suspend your own main account!');
                                    return;
                                  }
                                  const confirmMsg = u.isSuspended
                                    ? (lang === 'ar' ? `هل أنت متأكد من تفعيل حساب (${u.name})؟` : `Are you sure you want to activate (${u.name})'s account?`)
                                    : (lang === 'ar' ? `هل أنت متأكد من إيقاف حساب (${u.name}) مؤقتاً؟` : `Are you sure you want to temporarily suspend (${u.name})'s account?`);
                                  
                                  if (window.confirm(confirmMsg)) {
                                    const success = await toggleUserSuspensionInFirestore(u.id, !u.isSuspended);
                                    if (success) {
                                      alert(lang === 'ar' ? '✅ تم تحديث حالة المستخدم بنجاح!' : '✅ User status updated successfully!');
                                    }
                                  }
                                }}
                                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                  u.isSuspended
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500'
                                }`}
                                title={u.isSuspended ? (lang === 'ar' ? 'تفعيل الحساب' : 'Activate User') : (lang === 'ar' ? 'إيقاف الحساب' : 'Suspend User')}
                              >
                                <Ban className="h-4 w-4" />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={async () => {
                                  if (isOwner) {
                                    alert(lang === 'ar' ? '❌ لا يمكنك حذف حسابك الأساسي!' : '❌ You cannot delete your own main account!');
                                    return;
                                  }
                                  if (window.confirm(lang === 'ar' ? `⚠️ تحذير: هل أنت متأكد تماماً من حذف حساب (${u.name}) نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء!` : `⚠️ Warning: Are you absolutely sure you want to permanently delete (${u.name})'s account from the database? This action cannot be undone!`)) {
                                    const success = await deleteUserFromFirestore(u.id);
                                    if (success) {
                                      alert(lang === 'ar' ? '✅ تم حذف الحساب بنجاح!' : '✅ User deleted successfully!');
                                    }
                                  }
                                }}
                                className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all cursor-pointer"
                                title={lang === 'ar' ? 'حذف نهائي' : 'Delete permanently'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {adminSection === 'security' && (
        <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
          {/* Active Codes & Code update card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-400" />
                  <span>{lang === 'ar' ? 'الرمز السري الحالي' : 'Current Active Code'}</span>
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  {lang === 'ar' 
                    ? 'الرموز الحالية المستخدمة لحماية دخول لوحة الإدارة.' 
                    : 'The current verification code used to secure the admin entrance.'}
                </p>
                <div className="space-y-2">
                  {currentSecretCodes.length > 0 ? (
                    currentSecretCodes.map((code, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl bg-neutral-950 border border-neutral-800 p-3">
                        <span className="text-xs text-neutral-400 font-mono">CODE #{idx + 1}</span>
                        <span className="text-sm font-black font-mono text-amber-400 select-all tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{code}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-500 italic py-2">
                      {lang === 'ar' ? 'جاري التحميل...' : 'Loading codes...'}
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-white/5 pt-4 mt-4 text-[10px] text-amber-500/70 leading-relaxed">
                ℹ️ {lang === 'ar' 
                  ? 'يتم توليد الرمز الافتراضي (123456) تلقائياً عند أول إعداد للتطبيق.' 
                  : 'A default code (123456) is generated upon first setup.'}
              </div>
            </div>

            {/* Change secret code form */}
            <div className="lg:col-span-4 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-purple-400" />
                  <span>{lang === 'ar' ? 'تحديث الرمز السري' : 'Update Secret Code'}</span>
                </h3>
                <p className="text-xs text-neutral-400 mb-6">
                  {lang === 'ar'
                    ? 'يمكنك تغيير العبارة السرية هنا في أي وقت لحظر المتطفلين فوراً.'
                    : 'You can update the bypass phrase here to lock out intruders.'}
                </p>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newSecretCode.trim()) {
                    alert(lang === 'ar' ? 'الرجاء كتابة العبارة السرية الجديدة أولاً!' : 'Please enter new secret code!');
                    return;
                  }
                  setUpdatingSecretCode(true);
                  setSecretChangeStatus('');
                  try {
                    const success = await updateAdminSecretCode(currentSecretCodes[0] || '', newSecretCode.trim());
                    if (success) {
                      setSecretChangeStatus('success');
                      setNewSecretCode('');
                      // Refresh code list
                      const updated = await getAdminSecretCodes();
                      setCurrentSecretCodes(updated);
                    } else {
                      setSecretChangeStatus('error');
                    }
                  } catch (err) {
                    setSecretChangeStatus('error');
                  } finally {
                    setUpdatingSecretCode(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-2">{lang === 'ar' ? 'الرمز السري الجديد' : 'New Secret Code'}</label>
                    <input
                      type="text"
                      required
                      placeholder={lang === 'ar' ? 'مثال: SalsaVIP2026! أو 889911' : 'e.g. SalsaVIP2026! or 889911'}
                      value={newSecretCode}
                      onChange={(e) => setNewSecretCode(e.target.value)}
                      dir="ltr"
                      className="w-full text-left rounded-2xl border border-white/10 bg-neutral-950 py-3 px-4 text-sm font-semibold text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>

                  {secretChangeStatus === 'success' && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 text-right">
                      ✅ {lang === 'ar' ? 'تم تحديث الرمز السري بنجاح في قواعد البيانات!' : 'Secret code updated in Firestore!'}
                    </div>
                  )}
                  {secretChangeStatus === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-right">
                      ❌ {lang === 'ar' ? 'عذراً، فشل تحديث الرمز السري.' : 'Failed to update code.'}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={updatingSecretCode}
                    className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 font-extrabold text-xs px-6 py-3 transition-all cursor-pointer"
                  >
                    {updatingSecretCode ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? '💾 حفظ الرمز السري الجديد' : '💾 Save New Secret Code')}
                  </button>
                </form>
              </div>
            </div>

            {/* WhatsApp security alerts configuration card */}
            <div className="lg:col-span-4 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-400" />
                  <span>{lang === 'ar' ? 'رقم واتساب الإشعارات الأمنية' : 'WhatsApp Security Alerts Phone'}</span>
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  {lang === 'ar' 
                    ? 'الرقم الذي سيتم توجيه تقارير وبلاغات الاختراق والشرطة إليه مباشرة عبر واتساب.' 
                    : 'The target WhatsApp phone number that will receive firewall alert reports and system logs.'}
                </p>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-neutral-300 block">{lang === 'ar' ? 'رقم الهاتف المعتمد (مع كود الدولة):' : 'Phone Number (with Country Code):'}</label>
                  <input
                    type="text"
                    value={adminAlertPhone}
                    onChange={(e) => handleAlertPhoneChange(e.target.value)}
                    placeholder="e.g. 201015112185"
                    className="w-full text-center rounded-2xl border border-white/10 bg-neutral-950 py-3 px-4 text-sm font-semibold text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <p className="text-[10px] text-neutral-500 leading-relaxed">
                    {lang === 'ar' 
                      ? '⚠️ يرجى التأكد من كتابة الرقم بدون فواصل أو علامة + (مثال لمصر: 201015112185).' 
                      : '⚠️ Enter digits only with country code, no + or spaces (e.g., 201015112185).'}
                  </p>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4 mt-4 text-[10px] text-emerald-500/70 leading-relaxed font-bold">
                ✅ {lang === 'ar' ? 'تم الحفظ والمزامنة تلقائياً مع جدار الحماية!' : 'Automatically saved and synced with Firewall!'}
              </div>
            </div>
          </div>

          {/* Security Violations Log Table */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-xl text-right">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
                  <span>{lang === 'ar' ? 'سجلات محاولات الاختراق وجدار الحماية' : 'Firewall & Intrusion Attempts Log'}</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {lang === 'ar' 
                    ? 'قائمة بجميع المحاولات الفاشلة التي تجاوزت 3 مرات وتم رصدها وحظرها تلقائياً مع تفاصيل الأجهزة وعناوين الـ IP.'
                    : 'Real-time record of blocked intrusion attempts, failing more than 3 times, with detailed metadata.'}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black font-mono">
                {securityViolations.length} {lang === 'ar' ? 'محاولة اختراق معزولة' : 'Attempts Blocked'}
              </span>
            </div>

            {securityViolations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
                <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-neutral-400 font-bold">{lang === 'ar' ? 'النظام آمن تماماً!' : 'The system is 100% secure!'}</p>
                <p className="text-xs text-neutral-500 mt-1">{lang === 'ar' ? 'لا توجد أي محاولات دخول خاطئة مسجلة في جدار الحماية حتى الآن.' : 'No failed login violations recorded on the firewall yet.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-neutral-800/80 bg-neutral-950/40">
                <table className="w-full border-collapse text-right select-none" dir="rtl">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 text-xs font-bold bg-neutral-900/40">
                      <th className="px-6 py-3 text-right">{lang === 'ar' ? 'التوقيت' : 'Timestamp'}</th>
                      <th className="px-6 py-3 text-right">{lang === 'ar' ? 'العنوان والموقع' : 'IP & Location'}</th>
                      <th className="px-6 py-3 text-left">{lang === 'ar' ? 'المتصفح/الجهاز' : 'Browser/Device'}</th>
                      <th className="px-6 py-3 text-center">{lang === 'ar' ? 'المحاولات' : 'Attempts'}</th>
                      <th className="px-6 py-3 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {securityViolations.map((v) => {
                      const policeReport = `🚨 --- تقرير بلاغ أمني عاجل للشرطة أو تكنولوجيا المعلومات 🚨 ---\n` +
                        `• التوقيت: ${v.timestamp ? new Date(v.timestamp).toLocaleString('ar-EG') : '-'}\n` +
                        `• عنوان الـ IP المهاجم: ${v.ip || 'غير معروف'}\n` +
                        `• الموقع التقريبي: ${v.city || 'غير محدد'}، ${v.country || 'غير محدد'}\n` +
                        `• مزود الخدمة (ISP): ${v.org || 'غير معروف'}\n` +
                        `• عدد المحاولات الفاشلة قبل القفل: ${v.attempts || 3}\n` +
                        `• المتصفح/الجهاز المستخدم: ${v.userAgent || 'غير معروف'}\n` +
                        `• الإيميل المشتبه به: ${v.userEmail || 'زائر غير مسجل'}\n` +
                        `-----------------------------------------\n` +
                        `تم قفل جدار الحماية تلقائياً وعزل عنوان الـ IP عن الدخول.`;

                      return (
                        <tr key={v.id} className="hover:bg-neutral-900/30 transition-all">
                          {/* Timestamp */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-400">
                            {v.timestamp ? new Date(v.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                          </td>

                          {/* IP & Location */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-white font-mono select-all">{v.ip}</span>
                              <span className="text-[10px] text-neutral-500 font-sans">
                                {v.city || 'Unknown'}, {v.country || 'Unknown'} {v.org ? `(${v.org})` : ''}
                              </span>
                            </div>
                          </td>

                          {/* Device Agent */}
                          <td className="px-6 py-4 max-w-xs truncate text-xs text-neutral-400 font-mono select-all text-left" dir="ltr" title={v.userAgent}>
                            {v.userAgent || '-'}
                          </td>

                          {/* Attempts */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black font-mono">
                              {v.attempts || 3} / 3
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Copy report */}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(policeReport);
                                  alert(lang === 'ar' ? '📋 تم نسخ التقرير الأمني بالكامل إلى الحافظة لعمل بلاغ أمني!' : '📋 Security report copied to clipboard successfully!');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-700/60"
                                title="نسخ تفاصيل بلاغ أمني"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>{lang === 'ar' ? 'نسخ البلاغ' : 'Copy Report'}</span>
                              </button>

                              {/* Direct WhatsApp report */}
                              <button
                                onClick={() => {
                                  const rawPhone = adminAlertPhone || '201015112185';
                                  const cleanPhone = rawPhone.replace(/\D/g, '');
                                  const formattedPhone = (cleanPhone.length === 11 && cleanPhone.startsWith('01')) ? '2' + cleanPhone : cleanPhone;
                                  const encodedMsg = encodeURIComponent(policeReport);
                                  window.open(`https://api.whatsapp.com/send?phone=${formattedPhone || '201015112185'}&text=${encodedMsg}`, '_blank');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500 text-xs font-bold transition-all cursor-pointer"
                                title="إرسال البلاغ فوراً للواتساب"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {adminSection === 'branding' && (
        <div className="space-y-6 animate-fadeIn text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="rounded-3xl border border-pink-500/30 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-pink-950/20 p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-lg sm:text-xl font-extrabold text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
              <span>{lang === 'ar' ? '🎨 إدارة الهوية والشعارات والأصول بقاعدة البيانات' : '🎨 Live Identity & Assets Manager'}</span>
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              {lang === 'ar'
                ? 'تحكم في المظهر والشعارات واسم التطبيق وأي صور قديمة عبر استبدالها بروابط صور ويب حية. يتم تخزين وتحديث هذه الروابط فورياً في كوليكشن app_assets وتحت مستند باسم current_branding لتسهيل الهجرة والتحكم المستقبلي.'
                : 'Control application branding, logos, display names, and local images by converting them to online links. All changes are stored under the "app_assets" collection with document ID "current_branding".'}
            </p>

            <form onSubmit={handleSaveBranding} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* App Name */}
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-300 block">
                    {lang === 'ar' ? 'اسم التطبيق الموحد (بالإنكليزية أو العربية دون ترجمة):' : 'Unified App Name (No translation, used for all languages):'}
                  </label>
                  <input
                    type="text"
                    value={formAppNameEn}
                    onChange={(e) => {
                      setFormAppNameEn(e.target.value);
                      setFormAppNameAr(e.target.value);
                    }}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 text-white border border-neutral-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm transition-all outline-none"
                    placeholder="Dance With Me"
                  />
                </div>

                {/* App Icon URL */}
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-300 block">
                    {lang === 'ar' ? 'رابط أيقونة التطبيق (App Icon URL):' : 'App Icon Image URL:'}
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="url"
                      value={formAppIconUrl}
                      onChange={(e) => setFormAppIconUrl(e.target.value)}
                      required
                      className="flex-1 px-4 py-3 rounded-xl bg-neutral-950 text-white border border-neutral-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-xs font-mono transition-all outline-none"
                      placeholder="https://.../icon.svg"
                      dir="ltr"
                    />
                    <div className="h-12 w-12 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center p-1 shrink-0">
                      <img
                        src={formAppIconUrl || "/icon.svg"}
                        alt="Icon Preview"
                        className="h-full w-full object-cover rounded-xl"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/icon.svg'; }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    {lang === 'ar' ? '💡 الأيقونة المربعة المستخدمة في واجهة التطبيق، الهيدر وبانر التثبيت PWA.' : '💡 Square icon used in app navbar header, install prompts and banners.'}
                  </p>
                </div>

                {/* App Logo URL */}
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-300 block">
                    {lang === 'ar' ? 'رابط شعار العلامة الكامل (App Logo URL):' : 'App Full Logo Image URL:'}
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="url"
                      value={formAppLogoUrl}
                      onChange={(e) => setFormAppLogoUrl(e.target.value)}
                      required
                      className="flex-1 px-4 py-3 rounded-xl bg-neutral-950 text-white border border-neutral-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-xs font-mono transition-all outline-none"
                      placeholder="https://.../logo.svg"
                      dir="ltr"
                    />
                    <div className="h-12 w-32 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center p-1 shrink-0">
                      <img
                        src={formAppLogoUrl || "/logo.svg"}
                        alt="Logo Preview"
                        className="h-full w-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg'; }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    {lang === 'ar' ? '💡 الشعار المستطيل الكامل المستخدم في صفحات الدخول والبانرات الاحترافية.' : '💡 Full rectangle brand logo used in premium banners and auth landing pages.'}
                  </p>
                </div>

                {/* WhatsApp Support Number */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-300 block">
                    {lang === 'ar' ? 'رقم الدعم الفني للواتساب (بدون كود الدولة أو رموزه):' : 'WhatsApp Support Number (Raw, digits only):'}
                  </label>
                  <input
                    type="text"
                    value={formWhatsappSupport}
                    onChange={(e) => setFormWhatsappSupport(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 text-white border border-neutral-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm font-mono transition-all outline-none"
                    placeholder="201012345678"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-neutral-500">
                    {lang === 'ar' ? '💡 الرقم الموجه له زر الاستفسار عبر الواتساب للأعضاء.' : '💡 The WhatsApp phone number used for general member inquiries and complaints.'}
                  </p>
                </div>

                {/* Instagram URL */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-300 block">
                    {lang === 'ar' ? 'رابط حساب إنستجرام الرسمي:' : 'Official Instagram Account URL:'}
                  </label>
                  <input
                    type="url"
                    value={formInstagramUrl}
                    onChange={(e) => setFormInstagramUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 text-white border border-neutral-800 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm font-mono transition-all outline-none"
                    placeholder="https://instagram.com/..."
                    dir="ltr"
                  />
                  <p className="text-[10px] text-neutral-500">
                    {lang === 'ar' ? '💡 رابط حساب إنستجرام الرسمي لتثبيت المتابعين والوصول إليه.' : '💡 Instagram account URL for official social integration.'}
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setAdminSection(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-3 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white font-bold text-sm transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingBranding}
                  className="px-6 py-3 rounded-xl bg-pink-600 text-white hover:bg-pink-500 font-extrabold text-sm transition-all flex items-center gap-2 shadow-lg hover:shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${savingBranding ? 'animate-spin' : ''}`} />
                  <span>{lang === 'ar' ? (savingBranding ? 'جاري الحفظ...' : 'حفظ التغييرات بقاعدة البيانات') : (savingBranding ? 'Saving...' : 'Save Changes to Firestore')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adminSection === 'analytics' && (
        <div className="space-y-6 animate-fadeIn text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {/* Summary KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Unique Sessions */}
            <div className="rounded-3xl border border-cyan-500/20 bg-neutral-900/60 p-5 shadow-lg relative overflow-hidden group text-right">
              <div className="absolute left-3 top-3 opacity-10 group-hover:scale-110 transition-transform text-cyan-400">
                <Users className="h-10 w-10" />
              </div>
              <p className="text-[11px] font-bold text-neutral-400 tracking-wider">
                {lang === 'ar' ? '👥 زوار فريدون (نشاط الأجهزة)' : '👥 UNIQUE VISITORS'}
              </p>
              <h4 className="text-3xl font-black text-white mt-2 font-mono">
                {analyticsCounters.unique_sessions || 0}
              </h4>
              <p className="text-[10px] text-cyan-400 mt-2 font-medium">
                {lang === 'ar' ? '✨ تحديث مباشر فوري مجاني' : '✨ Live real-time & completely free'}
              </p>
            </div>

            {/* KPI 2: Total Page Views */}
            <div className="rounded-3xl border border-pink-500/20 bg-neutral-900/60 p-5 shadow-lg relative overflow-hidden group text-right">
              <div className="absolute left-3 top-3 opacity-10 group-hover:scale-110 transition-transform text-pink-400">
                <Eye className="h-10 w-10" />
              </div>
              <p className="text-[11px] font-bold text-neutral-400 tracking-wider">
                {lang === 'ar' ? '📊 إجمالي مشاهدات التطبيق' : '📊 TOTAL PAGE VIEWS'}
              </p>
              <h4 className="text-3xl font-black text-white mt-2 font-mono">
                {analyticsCounters.total_page_views || 0}
              </h4>
              <p className="text-[10px] text-pink-400 mt-2 font-medium">
                {lang === 'ar' ? '🔥 نشاط تصفح ومشاركات حقيقي' : '🔥 Active browser impressions'}
              </p>
            </div>

            {/* KPI 3: Engagement Factor */}
            <div className="rounded-3xl border border-amber-500/20 bg-neutral-900/60 p-5 shadow-lg relative overflow-hidden group text-right">
              <div className="absolute left-3 top-3 opacity-10 group-hover:scale-110 transition-transform text-amber-400">
                <TrendingUp className="h-10 w-10" />
              </div>
              <p className="text-[11px] font-bold text-neutral-400 tracking-wider">
                {lang === 'ar' ? '⚡ متوسط التفاعل بالجلسة' : '⚡ ENGAGEMENT METRIC'}
              </p>
              <h4 className="text-3xl font-black text-white mt-2 font-mono">
                {((analyticsCounters.total_page_views || 0) / (analyticsCounters.unique_sessions || 1)).toFixed(1)}
              </h4>
              <p className="text-[10px] text-amber-400 mt-2 font-medium">
                {lang === 'ar' ? '🔄 معدل زيارة الصفحات لكل مستخدم' : '🔄 Page views per active session'}
              </p>
            </div>

            {/* KPI 4: Outbound Contacts */}
            <div className="rounded-3xl border border-emerald-500/20 bg-neutral-900/60 p-5 shadow-lg relative overflow-hidden group text-right">
              <div className="absolute left-3 top-3 opacity-10 group-hover:scale-110 transition-transform text-emerald-400">
                <MousePointerClick className="h-10 w-10" />
              </div>
              <p className="text-[11px] font-bold text-neutral-400 tracking-wider">
                {lang === 'ar' ? '🎯 نقرات التواصل السريع' : '🎯 CALL-TO-ACTION CLICKS'}
              </p>
              <h4 className="text-3xl font-black text-white mt-2 font-mono">
                {(analyticsCounters.clicks_whatsapp || 0) + (analyticsCounters.clicks_phone || 0) + (analyticsCounters.clicks_maps || 0)}
              </h4>
              <p className="text-[10px] text-emerald-400 mt-2 font-medium">
                {lang === 'ar' ? '✅ واتساب واتصالات وخرائط' : '✅ Active Maps & Chat actions'}
              </p>
            </div>
          </div>

          {/* Core Analytics Details Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Right Column: Dance Styles Popularity / Audience Interest (7 Cols) */}
            <div className="lg:col-span-7 rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl space-y-6 text-right">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {lang === 'ar' ? '🔥 اهتمام الجمهور بحسب نوع الرقصة والأنماط' : '🔥 Audience Interest & Dance Styles Preference'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {lang === 'ar' 
                    ? 'ترتيب تنازلي فوري لأنواع الرقصات الأكثر طلباً وبحثاً وتصفية من قبل زوار الموقع والجمهور الحقيقي.' 
                    : 'Real-time ranking of music and dance genres selected by active visitors.'}
                </p>
              </div>

              <div className="space-y-4">
                {(() => {
                  const rawStyles = [
                    { name: 'Salsa', count: analyticsCounters.style_salsa || 0, color: 'bg-amber-500' },
                    { name: 'Bachata', count: analyticsCounters.style_bachata || 0, color: 'bg-purple-500' },
                    { name: 'Kizomba', count: analyticsCounters.style_kizomba || 0, color: 'bg-pink-500' },
                    { name: 'Merengue', count: analyticsCounters.style_merengue || 0, color: 'bg-emerald-500' },
                    { name: 'Tango', count: analyticsCounters.style_tango || 0, color: 'bg-red-500' },
                    { name: 'Zouk', count: analyticsCounters.style_zouk || 0, color: 'bg-blue-500' },
                    { name: 'Cha-Cha', count: analyticsCounters.style_cha_cha || 0, color: 'bg-indigo-500' },
                    { name: 'Reggaeton', count: analyticsCounters.style_reggaeton || 0, color: 'bg-rose-500' },
                    { name: 'Ballroom', count: analyticsCounters.style_ballroom || 0, color: 'bg-yellow-500' },
                    { name: 'Mix & Latin', count: (analyticsCounters.style_mix___latin || analyticsCounters.style_mix_latin || 0), color: 'bg-teal-500' },
                    { name: 'Arabic & Oriental', count: (analyticsCounters.style_arabic___oriental || analyticsCounters.style_arabic_oriental || 0), color: 'bg-cyan-500' }
                  ];
                  const sortedStyles = [...rawStyles].sort((a, b) => b.count - a.count);
                  const maxStyleCount = Math.max(...sortedStyles.map(s => s.count), 1);

                  return sortedStyles.map((item, index) => {
                    const pct = Math.min(Math.round((item.count / maxStyleCount) * 100), 100);
                    return (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-neutral-500 w-5 text-center">
                              #{index + 1}
                            </span>
                            <span className="font-extrabold text-neutral-200">
                              {getStyleLabel(item.name, lang)}
                            </span>
                          </div>
                          <span className="font-bold text-neutral-400">
                            {item.count} {lang === 'ar' ? 'نقرة' : 'clicks'} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/50">
                          <div 
                            className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Right Column: Interaction Clicks & Tab Navigation Breakdown (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-right">
              {/* Box 1: Clicks Breakdown */}
              <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <MousePointerClick className="h-4.5 w-4.5 text-emerald-400" />
                    <span>{lang === 'ar' ? '🎯 الإجراءات المتخذة (CTA)' : '🎯 Customer Call-to-Actions'}</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {lang === 'ar' ? 'تتبع أزرار الاتصال الأكثر استخداماً للوصول إلى المنظمين.' : 'Metrics on actual customer conversions and outreach.'}
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {/* WhatsApp */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{lang === 'ar' ? 'نقرات التواصل عبر واتساب' : 'WhatsApp Chats Started'}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">wa.me outbound link clicks</p>
                      </div>
                    </div>
                    <span className="text-sm font-black font-mono text-emerald-400">{analyticsCounters.clicks_whatsapp || 0}</span>
                  </div>

                  {/* Google Maps */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{lang === 'ar' ? 'خرائط جوجل ومواقع الفعاليات' : 'Google Maps Open'}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">location map navigation requests</p>
                      </div>
                    </div>
                    <span className="text-sm font-black font-mono text-cyan-400">{analyticsCounters.clicks_maps || 0}</span>
                  </div>

                  {/* Phone Calls */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{lang === 'ar' ? 'المكالمات الهاتفية المباشرة' : 'Direct Phone Calls'}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">tel: links launched</p>
                      </div>
                    </div>
                    <span className="text-sm font-black font-mono text-amber-400">{analyticsCounters.clicks_phone || 0}</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Sections engagement */}
              <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Layers className="h-4.5 w-4.5 text-purple-400" />
                    <span>{lang === 'ar' ? '🗺️ نشاط تصفح أقسام التطبيق' : '🗺️ Section & Navigation Usage'}</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {lang === 'ar' ? 'توزع الزوار بين الأبواب الرئيسية في التطبيق.' : 'Page view count breakdown across system tabs.'}
                  </p>
                </div>

                <div className="space-y-2 font-mono text-xs text-right">
                  {/* Explore */}
                  <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/40">
                    <span className="text-neutral-400 font-bold">{lang === 'ar' ? '✨ قسم الاستكشاف الرئيسي' : 'Explore Tab'}</span>
                    <span className="text-white font-extrabold">{analyticsCounters.tab_explore || 0}</span>
                  </div>
                  {/* Trips */}
                  <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/40">
                    <span className="text-neutral-400 font-bold">{lang === 'ar' ? '🌴 قسم الرحلات والمصايف' : 'Trips Tab'}</span>
                    <span className="text-white font-extrabold">{analyticsCounters.tab_trips || 0}</span>
                  </div>
                  {/* Profile */}
                  <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/40">
                    <span className="text-neutral-400 font-bold">{lang === 'ar' ? '👤 صفحة الحساب والمجتمع' : 'Profile/Account Tab'}</span>
                    <span className="text-white font-extrabold">{analyticsCounters.tab_profile || 0}</span>
                  </div>
                  {/* Create Ad */}
                  <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/40">
                    <span className="text-neutral-400 font-bold">{lang === 'ar' ? '➕ صفحة إنشاء الإعلانات' : 'Create Ad Tab'}</span>
                    <span className="text-white font-extrabold">{analyticsCounters.tab_create_ad || 0}</span>
                  </div>
                  {/* Admin Panel */}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-neutral-400 font-bold">{lang === 'ar' ? '⚙️ لوحة تحكم الإدارة' : 'Admin Panel Tab'}</span>
                    <span className="text-white font-extrabold">{analyticsCounters.tab_admin || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Most Favorited Events & Ads Leaderboard */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl space-y-6 text-right">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                <span>{lang === 'ar' ? '💖 إعلانات الحفلات الأكثر حفظاً في المفضلة للجمهور' : '💖 Most Favorited (Saved) Events & Ads Leaderboard'}</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {lang === 'ar' 
                  ? 'قائمة مرتبة تنازلياً توضح عدد المستخدمين الفعليين الذين قاموا بحفظ كل إعلان في قائمتهم المفضلة الخاصة.' 
                  : 'Real-time leaderboard showing how many unique user accounts saved each active event or ad.'}
              </p>
            </div>

            {events.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 font-mono">
                {lang === 'ar' ? '📭 لا توجد إعلانات نشطة حالياً في قاعدة البيانات.' : '📭 No active events found in the database.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="border-b border-neutral-800/60 text-neutral-400 font-bold text-neutral-300">
                      <th className="py-3 px-4 text-center w-12">#</th>
                      <th className="py-3 px-4 text-right">{lang === 'ar' ? 'اسم الإعلان / الحفلة' : 'Event / Ad Title'}</th>
                      <th className="py-3 px-4 text-center">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                      <th className="py-3 px-4 text-center">{lang === 'ar' ? 'تاريخ الفعالية' : 'Event Date'}</th>
                      <th className="py-3 px-4 text-center w-36">{lang === 'ar' ? 'مرات الحفظ في المفضلة' : 'Favorite Count'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const sortedEvents = [...events].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
                      const maxLikes = Math.max(...sortedEvents.map(e => e.likesCount || 0), 1);

                      return sortedEvents.map((ev, index) => {
                        const likes = ev.likesCount || 0;
                        const pct = Math.min(Math.round((likes / maxLikes) * 100), 100);
                        const isTop3 = index < 3;
                        const medalColors = ['text-yellow-500', 'text-slate-300', 'text-amber-600'];

                        return (
                          <tr key={ev.id} className="border-b border-neutral-800/40 hover:bg-neutral-950/40 transition-colors">
                            {/* Rank Column */}
                            <td className="py-3.5 px-4 text-center font-bold font-mono">
                              {isTop3 ? (
                                <span className={`text-sm font-black`}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </span>
                              ) : (
                                <span className="text-neutral-500">#{index + 1}</span>
                              )}
                            </td>

                            {/* Title & Styles */}
                            <td className="py-3.5 px-4 font-extrabold text-white text-right">
                              <div>
                                <p className="text-sm line-clamp-1">
                                  {lang === 'ar' ? ev.titleAr || ev.titleEn : ev.titleEn || ev.titleAr}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1 justify-start">
                                  {ev.styles?.slice(0, 3).map(style => (
                                    <span key={style} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                                      {getStyleLabel(style, lang)}
                                    </span>
                                  ))}
                                  {ev.isWeeklyPromo && (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                                      VIP PROMO
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Category Badge */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono ${
                                ev.category === 'party' 
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                  : ev.category === 'course' 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {ev.category === 'party' 
                                  ? (lang === 'ar' ? 'حفلة' : 'Party') 
                                  : ev.category === 'course' 
                                    ? (lang === 'ar' ? 'دورة' : 'Course') 
                                    : (lang === 'ar' ? 'رحلة' : 'Trip')}
                              </span>
                            </td>

                            {/* Event Date */}
                            <td className="py-3.5 px-4 text-center text-[11px] font-mono font-bold text-neutral-400">
                              {(() => {
                                try {
                                  return new Date(ev.eventDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  });
                                } catch (e) {
                                  return ev.eventDate;
                                }
                              })()}
                            </td>

                            {/* Favorite Clicks & Visual Indicator */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3 justify-center">
                                {/* Favorite count bubble */}
                                <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-2xl text-red-400 shrink-0">
                                  <Heart className="h-3 w-3 fill-current text-red-500" />
                                  <span className="font-extrabold font-mono text-sm">{likes}</span>
                                </div>
                                {/* Progress visualizer */}
                                <div className="hidden sm:block h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800/50">
                                  <div 
                                    className="h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Daily Traffic Chart Card (Full Width) */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl space-y-6 text-right">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <span>{lang === 'ar' ? '📈 مخطط حركة المرور والزوار اليومي' : '📈 Daily Visitor & Traffic Timeline'}</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {lang === 'ar' 
                  ? 'رسم بياني يعرض نشاط الزوار الفريدين (بالأزرق 🔷) وإجمالي مشاهدات الصفحات (بالوردي 🌸) للـ 10 أيام الماضية.' 
                  : 'Time-series bar visualization tracking active unique sessions (cyan) vs total page impressions (pink).'}
              </p>
            </div>

            {dailyAnalytics.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 font-mono">
                {lang === 'ar' ? '📭 لا توجد بيانات مسجلة في السجل اليومي بعد.' : '📭 No daily history records found in Firestore yet.'}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Horizontal Bar Chart representation */}
                <div className="space-y-4">
                  {(() => {
                    const maxSessions = Math.max(...dailyAnalytics.map(d => d.unique_sessions || 0), 1);
                    const maxPageViews = Math.max(...dailyAnalytics.map(d => d.total_page_views || 0), 1);

                    return [...dailyAnalytics].reverse().slice(0, 10).map((day) => {
                      const sessionPct = Math.min(Math.round(((day.unique_sessions || 0) / maxSessions) * 100), 100);
                      const viewsPct = Math.min(Math.round(((day.total_page_views || 0) / maxPageViews) * 100), 100);

                      return (
                        <div key={day.date} className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 border-b border-neutral-800/40 pb-3 text-right">
                          {/* Date Label */}
                          <div className="md:col-span-2 text-xs font-bold font-mono text-neutral-300">
                            📅 {day.date}
                          </div>

                          {/* Dual Bar Render */}
                          <div className="md:col-span-8 space-y-1.5">
                            {/* Sessions (Cyan) */}
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 bg-cyan-500 rounded-full transition-all duration-1000" style={{ width: `${sessionPct}%` }} />
                              <span className="text-[10px] font-mono font-bold text-cyan-400">{day.unique_sessions || 0}</span>
                            </div>

                            {/* Pageviews (Pink) */}
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 bg-pink-500 rounded-full transition-all duration-1000" style={{ width: `${viewsPct}%` }} />
                              <span className="text-[10px] font-mono font-bold text-pink-400">{day.total_page_views || 0}</span>
                            </div>
                          </div>

                          {/* Quick details */}
                          <div className="md:col-span-2 text-left md:text-right text-[11px] font-mono text-neutral-400 flex md:flex-col justify-between">
                            <div><strong className="text-cyan-400">{day.unique_sessions || 0}</strong> {lang === 'ar' ? 'زائر' : 'visitors'}</div>
                            <div><strong className="text-pink-400">{day.total_page_views || 0}</strong> {lang === 'ar' ? 'مشاهدة' : 'views'}</div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Chart Legend */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-neutral-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded bg-cyan-500" />
                    <span className="text-cyan-400 font-extrabold">{lang === 'ar' ? 'الزوار الفريدين (Unique sessions)' : 'Unique visitors'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded bg-pink-500" />
                    <span className="text-pink-400 font-extrabold">{lang === 'ar' ? 'إجمالي المشاهدات (Page views)' : 'Total page impressions'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Back Button */}
          <div className="flex justify-end pt-4 border-t border-neutral-800">
            <button
              onClick={() => {
                setAdminSection(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-3 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white font-extrabold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{lang === 'ar' ? 'الرجوع للوحة التحكم' : 'Back to Dashboard'}</span>
            </button>
          </div>
        </div>
      )}

      {adminSection === 'create_ad_admin' && (
        <div className="space-y-6 animate-fadeIn" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <form onSubmit={handleAdminPublish} className="space-y-6">
            
            {/* Master Control Notice */}
            <div className="rounded-3xl border border-indigo-500/30 bg-neutral-900 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-indigo-500/5 blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {lang === 'ar' ? 'نظام النشر المباشر للإدارة' : 'Admin Instant Publisher'}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      {lang === 'ar' 
                        ? 'أنت تقوم بإنشاء إعلان بشكل مباشر في قاعدة البيانات. سيتجاوز هذا الإعلان المراجعة والدفع ويظهر للجمهور فوراً.' 
                        : 'You are composing an event directly inside Firestore. This bypasses the payment/review queue and updates live feeds instantly.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-black">
                    BYPASS ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Tab Switcher for Full Live Preview (A separate page/tab of its own because of space/area constraints) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-neutral-950/80 border-2 border-indigo-500/30 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="text-right flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {lang === 'ar' ? '👀 معاينة مباشرة تفاعلية بالكامل' : '👀 Live Interactive Preview'}
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    {lang === 'ar' ? 'اعرض مظهر الإعلان النهائي للجمهور أثناء تعبئة الحقول لتعديله فوراً.' : 'See exactly how the final ad renders to dancers as you type.'}
                  </p>
                </div>
              </div>

              <div className="flex rounded-2xl bg-neutral-900 p-1 border border-neutral-800 w-full sm:w-auto shrink-0 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setAdminCreateTab('form');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    adminCreateTab === 'form'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>{lang === 'ar' ? '📝 نموذج البيانات' : '📝 Form Builder'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminCreateTab('preview');
                    setPreviewAlert(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    adminCreateTab === 'preview'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  <span>{lang === 'ar' ? '👁️ المعاينة الحية للجمهور' : '👁️ Live Preview'}</span>
                </button>
              </div>
            </div>

            {/* Removed Floating Action Button per user request to move it near action buttons */}

            {adminCreateTab === 'form' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              
              {/* LEFT COLUMN: Main Form Details */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Section 1: Titles & Descriptions */}
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <span>{lang === 'ar' ? '📝 تفاصيل ونص الإعلان' : '📝 Event Content & Copy'}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title Arabic */}
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'اسم الإعلان / الحفلة (بالعربية) *' : 'Event Title (Arabic) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={adminTitleAr}
                        onChange={(e) => setAdminTitleAr(e.target.value)}
                        placeholder="مثال: سهرة سالسا فخمة في الزمالك"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors text-right"
                      />
                    </div>

                    {/* Title English */}
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'اسم الإعلان / الحفلة (بالإنجليزية) *' : 'Event Title (English) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={adminTitleEn}
                        onChange={(e) => setAdminTitleEn(e.target.value)}
                        placeholder="e.g. Luxury Salsa Night in Zamalek"
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors text-left"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Desc Arabic */}
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'وصف وتفاصيل الإعلان (بالعربية) *' : 'Event Description (Arabic) *'}
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={adminDescAr}
                        onChange={(e) => setAdminDescAr(e.target.value)}
                        placeholder="اكتب تفاصيل الفعالية، المدربين، نوع الموسيقى، شروط الحضور..."
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors text-right"
                      />
                    </div>

                    {/* Desc English */}
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-black text-neutral-300">
                        {lang === 'ar' ? 'وصف وتفاصيل الإعلان (بالإنجليزية) *' : 'Event Description (English) *'}
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={adminDescEn}
                        onChange={(e) => setAdminDescEn(e.target.value)}
                        placeholder="Write details of the event, instructors, music styles, dress codes..."
                        className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors text-left"
                      />
                    </div>
                  </div>
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

                    {/* Direct Text URL Link Input (Fallback) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-neutral-400">
                        {lang === 'ar' ? 'أو أدخل رابط ميديا خارجي مباشرة (URL):' : 'Or enter custom Media URL link:'}
                      </label>
                      <input
                        type="url"
                        value={adminMediaUrl}
                        onChange={(e) => setAdminMediaUrl(e.target.value)}
                        placeholder="https://example.com/flyer.jpg"
                        className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
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
                        {lang === 'ar' ? 'رقم الترتيب في الصفحة الرئيسية' : 'Homepage Display Sort Order'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={adminPosition}
                        onChange={(e) => setAdminPosition(Math.max(1, parseInt(e.target.value) || 1))}
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
                            mediaUrl: adminMediaUrl.trim() || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200',
                            thumbnailUrl: adminMediaType === 'video' ? 
                              (adminMediaUrl.includes('cloudinary.com') ? adminMediaUrl.trim().replace(/\.[^.]+$/, '.jpg') : 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200')
                              : adminMediaUrl.trim() || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200',
                            uploadDate: new Date().toISOString(),
                            eventDate: adminEventDate ? new Date(adminEventDate).toISOString() : new Date().toISOString(),
                            priceAr: adminPriceAr.trim() || '250 ج.م',
                            priceEn: adminPriceEn.trim() || '250 EGP',
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
                            position: Number(adminPosition) || 1
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
                              {(['party', 'course', 'trip'] as DanceCategory[]).map((cat) => (
                                <button
                                  type="button"
                                  key={cat}
                                  onClick={() => { setAdminCategory(cat); setAdminEditingField(null); }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                    adminCategory === cat ? 'bg-indigo-500 text-white' : 'text-neutral-400 hover:bg-neutral-800'
                                  }`}
                                >
                                  {cat === 'party' ? '🎉' : cat === 'course' ? '🎓' : '✈️'}
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
    </div>
  );
};