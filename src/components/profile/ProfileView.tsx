import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, PlusCircle, Heart, Ticket, ShieldAlert, Sparkles, Clock, Trash2, LogOut, CheckCircle, RotateCcw, FileText, Edit3, RefreshCw, AlertTriangle, Check, X, Upload, MessageSquare, Camera, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EventCard } from '../events/EventCard';
import { DanceEvent, AdSubmission, DanceStyle, ALL_DANCE_STYLES } from '../../types';
import { subscribeToAdSubmissions, saveAdSubmissionToFirestore, saveNotificationToFirestore, deleteAdSubmissionFromFirestore, deleteSupportMessageFromFirestore, saveEventToFirestore } from '../../lib/firebase';
import { GENDER_NEUTRAL_AVATARS, DEFAULT_NEUTRAL_AVATAR } from '../../utils/avatars';
import { compressImage, uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';

interface ProfileViewProps {
  onOpenCreateModal: () => void;
  onOpenAuth: () => void;
  onOpenMap: (event: DanceEvent) => void;
  onOpenShare: (event: DanceEvent) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenCreateModal,
  onOpenAuth,
  onOpenMap,
  onOpenShare
}) => {
  const {
    lang,
    user,
    logoutUser,
    updateUserAvatar,
    updateUserProfile,
    events,
    expiredEvents,
    showExpiredArchive,
    setShowExpiredArchive,
    deleteEvent,
    supportMessages,
    openSupportModal,
    cleanUpDuplicateAds,
    isAdminUnlocked,
    bookings,
    deleteBooking,
    cancelBooking,
    deleteAllBookings,
    clearAllLikedEvents,
    triggerConfirm
  } = useApp();

  const [adSubmissions, setAdSubmissions] = useState<AdSubmission[]>([]);
  const [cleaningUp, setCleaningUp] = useState(false);

  const handleCleanUpClutter = async () => {
    setCleaningUp(true);
    try {
      const dbCount = await cleanUpDuplicateAds();
      const seen = new Set<string>();
      let localRemoved = 0;
      setAdSubmissions(prev => {
        return prev.filter(sub => {
          const hasImg = sub.mediaUrl || (sub.eventData && (sub.eventData.mediaUrl || sub.eventData.thumbnailUrl));
          const key = `${sub.titleAr?.trim()}_${sub.phone?.trim()}_${sub.amount || sub.pricing?.total}`;
          if (!hasImg || seen.has(key)) {
            localRemoved++;
            return false;
          }
          seen.add(key);
          return true;
        });
      });
      alert(lang === 'ar' ? `تم فحص وتنظيف ${dbCount + localRemoved} من الإعلانات بدون صور والمكررة بنجاح لتقليل الزحمة!` : `Successfully cleaned up ${dbCount + localRemoved} imageless and duplicate ads!`);
    } catch (e) {
      console.error(e);
    } finally {
      setCleaningUp(false);
    }
  };

  const handleDeleteAdSubmission = async (submissionId: string) => {
    const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في حذف هذا الإعلان بشكل نهائي؟' : 'Are you sure you want to permanently delete this ad?');
    if (!confirmed) return;
    try {
      await deleteAdSubmissionFromFirestore(submissionId);
      setAdSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
      try {
        const local: AdSubmission[] = JSON.parse(localStorage.getItem('dwm_ad_submissions') || '[]');
        const filtered = local.filter(item => item.id !== submissionId);
        localStorage.setItem('dwm_ad_submissions', JSON.stringify(filtered));
      } catch (e) {}
    } catch (err) {
      console.error('Error deleting ad:', err);
    }
  };

  const handleDeleteAllAdSubmissions = async () => {
    const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في حذف جميع إعلاناتك وفواتيرك بشكل نهائي؟' : 'Are you sure you want to permanently delete all your ads and invoices?');
    if (!confirmed) return;
    try {
      const promises = adSubmissions.map(sub => deleteAdSubmissionFromFirestore(sub.id));
      await Promise.all(promises);
      setAdSubmissions([]);
      localStorage.setItem('dwm_ad_submissions', '[]');
    } catch (err) {
      console.error('Error deleting all ads:', err);
    }
  };

  const handleDeleteSupportMessage = async (messageId: string) => {
    const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?');
    if (!confirmed) return;
    try {
      await deleteSupportMessageFromFirestore(messageId);
    } catch (err) {
      console.error('Error deleting support message:', err);
    }
  };

  const handleDeleteAllSupportMessages = async () => {
    const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في حذف جميع رسائل الدعم بشكل نهائي؟' : 'Are you sure you want to permanently delete all support messages?');
    if (!confirmed) return;
    try {
      const promises = mySupportMessages.map(msg => deleteSupportMessageFromFirestore(msg.id));
      await Promise.all(promises);
    } catch (err) {
      console.error('Error deleting all support messages:', err);
    }
  };
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editTitleAr, setEditTitleAr] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editDescAr, setEditDescAr] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editPriceAr, setEditPriceAr] = useState('');
  const [editPriceEn, setEditPriceEn] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editLocationAr, setEditLocationAr] = useState('');
  const [editLocationEn, setEditLocationEn] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editContactWhatsapp, setEditContactWhatsapp] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editMediaType, setEditMediaType] = useState<'image' | 'video'>('image');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'ads' | 'support' | 'booked' | 'liked' | 'archive'>('booked');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStyles, setEditStyles] = useState<DanceStyle[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleteBkgLoading, setDeleteBkgLoading] = useState(false);

  const handleDeleteBooking = async (bookingId: string) => {
    setDeleteBkgLoading(true);
    try {
      await deleteBooking(bookingId);
      setBookingToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteBkgLoading(false);
    }
  };

  const handleDeleteAllBookings = async () => {
    setDeleteBkgLoading(true);
    try {
      await deleteAllBookings();
      setConfirmDeleteAll(false);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteBkgLoading(false);
    }
  };

  const handleOpenEditProfile = () => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditStyles(user.favoriteStyles || []);
      setIsEditingProfile(true);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      // 1. Compress Image
      const compressed = await compressImage(file);
      
      // 2. Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(compressed);
      
      if (imageUrl) {
        // Try to delete old avatar if it was on Cloudinary
        if (user.avatar && user.avatar.includes('cloudinary.com') && user.avatar !== imageUrl) {
          try {
             await fetch('/api/delete-media', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ url: user.avatar, resourceType: 'image' })
             });
          } catch (delErr) {
             console.error('Failed to delete old avatar:', delErr);
          }
        }
        
        // 3. Update User Profile
        updateUserAvatar(imageUrl);
        setShowAvatarPicker(false);
      } else {
        alert(lang === 'ar' ? 'فشل رفع الصورة. يرجى التأكد من إعدادات Cloudinary' : 'Upload failed. Please check Cloudinary config');
      }
    } catch (err: any) {
      if (err.message === 'CONFIG_MISSING') {
        alert(lang === 'ar' 
          ? 'إعدادات Cloudinary غير مكتملة. يرجى إضافة VITE_CLOUDINARY_CLOUD_NAME و VITE_CLOUDINARY_UPLOAD_PRESET إلى ملف .env' 
          : 'Cloudinary config missing. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env');
      } else {
        console.error('Upload error:', err);
        alert(lang === 'ar' ? 'حدث خطأ أثناء عملية الرفع' : 'Error occurred during upload process');
      }
    } finally {
      setUploadingImage(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    const handleNavigation = (e: any) => {
      if (e.detail) setActiveSection(e.detail);
    };
    window.addEventListener('NAVIGATE_PROFILE_SECTION', handleNavigation);
    return () => window.removeEventListener('NAVIGATE_PROFILE_SECTION', handleNavigation);
  }, []);

  useEffect(() => {
    const loadLocal = () => {
      try {
        const local = JSON.parse(localStorage.getItem('dwm_ad_submissions') || '[]');
        setAdSubmissions(local as AdSubmission[]);
      } catch (e) {}
    };
    loadLocal();

    const unsubscribe = subscribeToAdSubmissions(
      (list) => {
        setAdSubmissions(list);
      },
      user?.id,
      user?.isAdmin || isAdminUnlocked
    );
    return () => unsubscribe();
  }, [user, isAdminUnlocked]);

  const updateLocalAndState = (updated: AdSubmission) => {
    try {
      let local: AdSubmission[] = JSON.parse(localStorage.getItem('dwm_ad_submissions') || '[]');
      const index = local.findIndex(item => item.id === updated.id);
      if (index >= 0) {
        local[index] = updated;
      } else {
        local.unshift(updated);
      }
      localStorage.setItem('dwm_ad_submissions', JSON.stringify(local));
      setAdSubmissions(local);
    } catch (e) {}
  };

  const handleRenewAd = async (sub: AdSubmission) => {
    setActionLoading(sub.id);
    try {
      const updated: AdSubmission = {
        ...sub,
        status: 'pending',
        renewalCount: (sub.renewalCount || 0) + 1,
        submittedAt: new Date().toISOString()
      };
      updateLocalAndState(updated);
      await saveAdSubmissionToFirestore(updated); if (updated.status === "approved" && updated.eventData && updated.eventData.id) { await saveEventToFirestore(updated.eventData as DanceEvent); }

      await saveNotificationToFirestore({
        id: `notif_renew_${Date.now()}`,
        titleAr: '🔄 طلب تجديد إعلان VIP من الأرشيف',
        titleEn: '🔄 VIP Ad Renewal Request from Archive',
        messageAr: `قام المعلن ${sub.advertiserName} (هاتف ${sub.phone}) بطلب تجديد الإعلان رقم الفاتورة ${sub.invoiceNumber} من الأرشيف. يرجى المراجعة وتفعيله.`,
        messageEn: `Advertiser ${sub.advertiserName} requested renewal for invoice ${sub.invoiceNumber} from archive. Please review in Admin Panel.`,
        date: new Date().toISOString(),
        read: false,
        type: 'system'
      });
      alert(lang === 'ar' ? '✅ تم إرسال طلب تجديد الإعلان للإدارة بنجاح! سيتم مراجعة التجديد وتفعيله قريباً.' : '✅ Ad renewal request submitted successfully! Admin will review and reactivate soon.');
    } catch (err) {
      console.error('Error renewing ad:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartEdit = (sub: AdSubmission) => {
    setEditingSubId(sub.id);
    setEditTitleAr(sub.titleAr);
    setEditTitleEn(sub.titleEn);
    setEditDescAr(sub.eventData?.descriptionAr || '');
    setEditDescEn(sub.eventData?.descriptionEn || '');
    setEditPriceAr(sub.eventData?.priceAr || '');
    setEditPriceEn(sub.eventData?.priceEn || '');
    setEditEventDate(sub.eventData?.eventDate ? sub.eventData.eventDate.split('T')[0] : '');
    setEditLocationAr(sub.eventData?.location?.nameAr || '');
    setEditLocationEn(sub.eventData?.location?.nameEn || '');
    setEditContactPhone(sub.eventData?.contact?.phone || sub.phone || '');
    setEditContactWhatsapp(sub.eventData?.contact?.whatsapp || sub.phone || '');
    setEditMediaUrl(sub.eventData?.mediaUrl || sub.mediaUrl || '');
    setEditMediaType(sub.eventData?.mediaType || sub.mediaType || 'image');
  };

  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    if (editMediaType === 'image' && isVideo) {
      alert(lang === 'ar' ? 'الرجاء اختيار صورة.' : 'Please select an image.');
      return;
    }
    if (editMediaType === 'video' && !isVideo) {
      alert(lang === 'ar' ? 'الرجاء اختيار فيديو.' : 'Please select a video.');
      return;
    }

    setIsUploadingMedia(true);
    setMediaUploadProgress(10);
    
    try {
      let fileToUpload = file;
      if (editMediaType === 'image') {
        setMediaUploadProgress(30);
        fileToUpload = await compressImage(file);
      }
      
      setMediaUploadProgress(60);
      const url = await uploadToCloudinary(fileToUpload);
      
      if (url) {
        setEditMediaUrl(url);
        setMediaUploadProgress(100);
      } else {
        alert(lang === 'ar' ? 'فشل الرفع، يرجى المحاولة مرة أخرى.' : 'Upload failed, please try again.');
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء الرفع.' : 'An error occurred during upload.');
    } finally {
      setTimeout(() => {
        setIsUploadingMedia(false);
        setMediaUploadProgress(0);
      }, 500);
    }
  };

  const handleSaveEdit = async (sub: AdSubmission) => {
    setActionLoading(sub.id);
    try {
      const oldMediaUrl = sub.eventData?.mediaUrl || sub.mediaUrl;
      const mediaChanged = editMediaUrl && editMediaUrl !== oldMediaUrl;
      
      const updated: AdSubmission = {
        ...sub,
        titleAr: editTitleAr || sub.titleAr,
        titleEn: editTitleEn || sub.titleEn,
        mediaUrl: mediaChanged ? editMediaUrl : sub.mediaUrl,
        mediaType: editMediaType,
        eventData: sub.eventData ? {
          ...sub.eventData,
          titleAr: editTitleAr || sub.eventData.titleAr || sub.titleAr,
          titleEn: editTitleEn || sub.eventData.titleEn || sub.titleEn,
          descriptionAr: editDescAr || sub.eventData.descriptionAr,
          descriptionEn: editDescEn || sub.eventData.descriptionEn,
          priceAr: editPriceAr || sub.eventData.priceAr,
          priceEn: editPriceEn || sub.eventData.priceEn,
          eventDate: editEventDate ? new Date(editEventDate).toISOString() : sub.eventData.eventDate,
          location: {
            ...sub.eventData.location,
            nameAr: editLocationAr || sub.eventData.location?.nameAr,
            nameEn: editLocationEn || sub.eventData.location?.nameEn
          },
          contact: {
            ...sub.eventData.contact,
            phone: editContactPhone || sub.eventData.contact?.phone,
            whatsapp: editContactWhatsapp || sub.eventData.contact?.whatsapp
          },
          mediaUrl: mediaChanged ? editMediaUrl : sub.eventData.mediaUrl,
          mediaType: editMediaType
        } : undefined
      };

      updateLocalAndState(updated);
      await saveAdSubmissionToFirestore(updated); if (updated.status === "approved" && updated.eventData && updated.eventData.id) { await saveEventToFirestore(updated.eventData as DanceEvent); }
      
      // Delete old media if changed and it was on Cloudinary
      if (mediaChanged && oldMediaUrl && oldMediaUrl.includes('cloudinary.com')) {
        await deleteFromCloudinary(oldMediaUrl, sub.mediaType);
      }

      await saveNotificationToFirestore({
        id: `notif_edit_${Date.now()}`,
        titleAr: '✏️ تم تعديل بيانات الإعلان رقم ' + sub.invoiceNumber,
        titleEn: '✏️ Ad data edited for invoice ' + sub.invoiceNumber,
        messageAr: `قام المعلن ${sub.advertiserName} بتعديل بيانات الإعلان`,
        messageEn: `Advertiser ${sub.advertiserName} edited ad data`,
        date: new Date().toISOString(),
        read: false,
        type: 'system'
      });
      setEditingSubId(null);
      alert(lang === 'ar' ? '✅ تم حفظ التعديلات على إعلانك وإشعار الإدارة بنجاح!' : '✅ Ad modifications saved and notified admin successfully!');
    } catch (err) {
      console.error('Error saving edit:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400 mx-auto mb-4 border border-amber-500/20 shadow-lg gold-glow">
          <User className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          {lang === 'ar' ? 'إنشاء حساب أو دخول إلى الحساب' : 'Create Account or Login'}
        </h2>
        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
          {lang === 'ar'
            ? 'احفظ حفلاتك المفضلة، أدر حجوزات تذاكرك، وتابع أحدث فيديوهات الرقص اللاتيني الحصرية في حسابك الشخصي.'
            : 'Save your favorite salsa nights, manage your bookings, and track exclusive weekly videos.'}
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 px-6 text-sm font-bold text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-xl gold-glow transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4 fill-current" />
          <span>{lang === 'ar' ? 'إنشاء حساب أو دخول إلى الحساب' : 'Create Account or Login'}</span>
        </button>
      </div>
    );
  }

  const likedEvents = events.filter(ev => (user.likedEventIds || []).includes(ev.id));
  const bookedEvents = events.filter(ev => (user.bookedEventIds || []).includes(ev.id));
  const mySupportMessages = supportMessages.filter(m => user && m.userId === user.id);
  const myBookings = bookings.filter(b => user && b.userId === user.id);

  return (
    <div className="space-y-8 pb-12">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-neutral-900 dark:bg-neutral-900 p-6 sm:p-8 shadow-2xl"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div 
              className="relative group cursor-pointer" 
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            >
              <img
                src={user.avatar || DEFAULT_NEUTRAL_AVATAR}
                alt={user.name}
                className="h-28 w-28 rounded-full object-cover border-4 border-neutral-800 shadow-xl transition-transform group-hover:scale-105 group-hover:border-amber-400"
              />
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-bold">{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
              </div>
            </div>
            <button 
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 underline-offset-4 hover:underline transition-all"
            >
              {lang === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-start w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 mb-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{user.name}</h2>
              {user.isAdmin ? (
                <span className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400 border border-red-500/20 flex items-center gap-1">
                  {lang === 'ar' ? 'مدير المنصة (Admin)' : 'PLATFORM ADMIN'}
                </span>
              ) : (
                <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/20">
                  {lang === 'ar' ? 'عضوية VIP' : 'VIP MEMBER'}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-sm font-mono text-neutral-400 mb-5">
              <span>{user.email}</span>
              <span className="hidden sm:inline text-neutral-600">•</span>
              <span dir="ltr">{user.phone}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-6">
              <span className="text-xs text-neutral-500 font-bold ml-1">{lang === 'ar' ? 'الأنماط:' : 'Styles:'}</span>
              {(user.favoriteStyles || []).map(style => (
                <span key={style} className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-300 border border-white/5 shadow-sm">
                  {style}
                </span>
              ))}
              <button 
                onClick={handleOpenEditProfile}
                className="rounded-md bg-neutral-800/50 px-3 py-1 text-xs font-semibold text-amber-500 hover:bg-neutral-800 hover:text-amber-400 border border-dashed border-amber-500/30 transition-colors"
                title={lang === 'ar' ? 'إضافة/تعديل' : 'Add/Edit'}
              >
                +
              </button>
            </div>

            {/* Quick Actions or Avatar Picker */}
            <AnimatePresence mode="wait">
              {!showAvatarPicker ? (
                <motion.div
                  key="quick-actions"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full border-t border-white/5 pt-5 overflow-hidden"
                >
                  <button
                    onClick={onOpenCreateModal}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 shadow-md transition-all"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'إضافة إعلان' : 'Post Ad'}</span>
                  </button>

                  <button
                    onClick={handleOpenEditProfile}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-neutral-800 border border-white/10 px-5 py-2.5 text-sm font-bold text-neutral-200 hover:bg-neutral-700 transition-all"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'تعديل البيانات' : 'Edit Profile'}</span>
                  </button>

                  <button
                    onClick={logoutUser}
                    className="w-full sm:w-auto mt-2 sm:mt-0 sm:ms-auto flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="avatar-picker"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full border-t border-white/10 pt-5 flex flex-col items-center sm:items-start gap-3 overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-mono text-amber-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      {lang === 'ar' ? 'اختر أيقونة لملفك الشخصي:' : 'Select a Profile Avatar:'}
                    </span>
                    <button onClick={() => setShowAvatarPicker(false)} className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-md bg-neutral-800 border border-white/10">✕ {lang === 'ar' ? 'إغلاق' : 'Close'}</button>
                  </div>
              <div className="flex flex-wrap items-center gap-3">
                {GENDER_NEUTRAL_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      updateUserAvatar(av);
                      setShowAvatarPicker(false);
                    }}
                    className={`rounded-2xl overflow-hidden border-2 transition-all p-1 cursor-pointer ${
                      user.avatar === av ? 'border-amber-400 shadow-xl gold-glow scale-110 bg-amber-500/20' : 'border-white/10 hover:border-white/40 bg-neutral-950 opacity-70 hover:opacity-100'
                    }`}
                    title={`Avatar Option ${idx + 1}`}
                  >
                    <img src={av} alt={`Option ${idx + 1}`} className="h-14 w-14 rounded-xl object-cover" />
                  </button>
                ))}
              </div>

              {/* Upload Photo from Device inside Profile View */}
              <div className="w-full mt-2 flex flex-col gap-2">
                <div className="w-full flex items-center justify-between bg-neutral-950 p-3 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="text-xs text-neutral-300 font-mono">
                      {uploadingImage 
                        ? (lang === 'ar' ? 'جاري الضغط والرفع...' : 'Compressing & Uploading...')
                        : (lang === 'ar' ? 'أو ارفع صورة من الجهاز/الكاميرا:' : 'Or upload from device/camera:')}
                    </span>
                  </div>
                  <label className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${uploadingImage ? 'bg-neutral-800 text-neutral-500 border-neutral-700 pointer-events-none' : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'}`}>
                    <span>{lang === 'ar' ? 'اختر ملف / تصوير' : 'Choose File / Capture'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {uploadingImage && (
                  <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "90%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>


      {/* Sticky Modern Tab Bar */}
      <div className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-white/5 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
          <button
            onClick={() => setActiveSection('booked')}
            className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${activeSection === 'booked' || activeSection === 'overview' ? 'bg-emerald-500 text-neutral-950 shadow-md' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}`}
          >
            <Ticket className="h-4 w-4" />
            <span>{lang === 'ar' ? 'تذاكري وحجوزاتي' : 'Bookings'}</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${activeSection === 'booked' || activeSection === 'overview' ? 'bg-neutral-950/20' : 'bg-neutral-800'}`}>{bookedEvents.length}</span>
          </button>
          
          <button
            onClick={() => setActiveSection('liked')}
            className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${activeSection === 'liked' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}`}
          >
            <Heart className="h-4 w-4" />
            <span>{lang === 'ar' ? 'المفضلة' : 'Favorites'}</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${activeSection === 'liked' ? 'bg-black/20' : 'bg-neutral-800'}`}>{likedEvents.length}</span>
          </button>
          
          <button
            onClick={() => setActiveSection('ads')}
            className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${activeSection === 'ads' ? 'bg-amber-500 text-neutral-950 shadow-md gold-glow' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}`}
          >
            <FileText className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إعلاناتي VIP' : 'My Ads'}</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${activeSection === 'ads' ? 'bg-neutral-950/20' : 'bg-neutral-800'}`}>{adSubmissions.length}</span>
          </button>

          <button
            onClick={() => setActiveSection('support')}
            className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${activeSection === 'support' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{lang === 'ar' ? 'الدعم الفني' : 'Support'}</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${activeSection === 'support' ? 'bg-black/20' : 'bg-neutral-800'}`}>{mySupportMessages.length}</span>
          </button>

          <button
            onClick={() => setActiveSection('archive')}
            className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${activeSection === 'archive' ? 'bg-neutral-700 text-white shadow-md' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}`}
          >
            <Clock className="h-4 w-4" />
            <span>{lang === 'ar' ? 'الأرشيف' : 'Archive'}</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${activeSection === 'archive' ? 'bg-black/20' : 'bg-neutral-800'}`}>{expiredEvents.length}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">

          {activeSection === 'archive' && (
            <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                    <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {lang === 'ar' ? 'أرشيف الإعلانات والفعاليات المنقضية' : 'Expired Ads & Events Archive'}
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                {lang === 'ar'
                  ? 'يتم نقل الإعلانات والفعاليات المنقضية إلى الأرشيف لإتاحة مساحة للعروض والإعلانات الجديدة.'
                  : 'Expired promos and events move to the archive to make room for active campaigns.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExpiredArchive(!showExpiredArchive)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition-all ${
                showExpiredArchive
                  ? 'bg-amber-500 text-neutral-950 border-amber-400'
                  : 'bg-neutral-950 text-neutral-300 border-white/10'
              }`}
            >
              {showExpiredArchive
                ? (lang === 'ar' ? `إخفاء الأرشيف المنقضي (${expiredEvents.length})` : `Hide Archive (${expiredEvents.length})`)
                : (lang === 'ar' ? `عرض الأرشيف المنقضي (${expiredEvents.length})` : `View Archive (${expiredEvents.length})`)}
            </button>
          </div>
        </div>

        {/* Expired Archive Display */}
        {showExpiredArchive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-4 border-t border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
              <span>{lang === 'ar' ? 'العناصر المنقضية في الأرشيف:' : 'Expired Items in Archive:'}</span>
              <span>{lang === 'ar' ? 'يمكنك إدارتها أو حذفها' : 'Manage or delete archived items'}</span>
            </div>

            {expiredEvents.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4">{lang === 'ar' ? 'لا توجد إعلانات منقضية حالياً' : 'No expired items found'}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiredEvents.map((ev, idx) => (
                  <div key={ev.id} className="relative">
                    <EventCard event={ev} index={idx} onOpenMap={onOpenMap} onOpenShare={onOpenShare} />
                    <button
                      onClick={() => deleteEvent(ev.id)}
                      className="absolute top-2 left-2 z-40 flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{lang === 'ar' ? 'حذف من الأرشيف' : 'Delete from Archive'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
      )}

      {/* VIP Ad Submissions & Archive Section */}
      {activeSection === 'ads' && (
      <div className="rounded-3xl border-2 border-amber-500/40 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900/95 dark:to-amber-950/20 p-6 sm:p-8 shadow-2xl gold-glow space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 shadow-lg gold-glow shrink-0">
              <FileText className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {lang === 'ar' ? `إعلاناتي وفواتيري VIP وأرشيف الإعلانات (${adSubmissions.length})` : `My VIP Ads & Archive (${adSubmissions.length})`}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30">
                  {lang === 'ar' ? 'نظام شهر' : '30-Day Archive'}
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                {lang === 'ar'
                  ? 'يتم تحويل الإعلان بعد انتهاء فترته إلى الأرشيف بحد أقصى 30 يوماً مع تنبيهك هنا لتجديده أو تعديله قبل الحذف النهائي.'
                  : 'Expired ads move to Archive for max 30 days. Renew or edit your promotions from here before final cleanup.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCleanUpClutter}
              disabled={cleaningUp}
              className="flex items-center gap-2 rounded-xl bg-neutral-800 border border-red-500/30 px-3 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:border-red-500 transition-all cursor-pointer shadow-md"
              title="حذف الإعلانات المكررة وبدون صور"
            >
              <Trash2 className={`h-4 w-4 ${cleaningUp ? 'animate-spin' : ''}`} />
              <span>{cleaningUp ? (lang === 'ar' ? 'جاري التنظيف...' : 'Cleaning...') : (lang === 'ar' ? '🧹 تنظيف الزحمة والمكرر' : '🧹 Clean Clutter')}</span>
            </button>

            {adSubmissions.length > 0 && (
              <button
                onClick={handleDeleteAllAdSubmissions}
                className="flex items-center gap-2 rounded-xl bg-red-600/10 border border-red-500/30 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-md"
                title={lang === 'ar' ? 'حذف جميع الإعلانات والفواتير بشكل نهائي' : 'Delete all ads and invoices permanently'}
              >
                <Trash2 className="h-4 w-4" />
                <span>{lang === 'ar' ? 'حذف الكل' : 'Delete All'}</span>
              </button>
            )}

            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-extrabold text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-md gold-glow transition-all shrink-0 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{lang === 'ar' ? '+ إعلان VIP جديد' : '+ New VIP Ad'}</span>
            </button>
          </div>
        </div>

        {adSubmissions.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-neutral-900/50 p-8 text-center text-neutral-500 text-sm">
            {lang === 'ar' ? 'لم تقم بإرسال أي إعلانات VIP بعد. اضغط على زر "إضافة إعلان" للبدء!' : 'No VIP ad submissions yet. Click "Post Ad" to start promoting!'}
          </div>
        ) : (
          <div className="space-y-4">
            {adSubmissions.map((sub) => {
              const isArchived = sub.status === 'archived' || (sub.expiresAt && new Date(sub.expiresAt).getTime() <= Date.now());
              const isEditing = editingSubId === sub.id;
              const associatedEvent = events.find(e => e.id === sub.eventData?.id || e.id === sub.id);

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                    isArchived
                      ? 'border-amber-500/60 bg-neutral-900 dark:bg-gradient-to-r dark:from-neutral-900 dark:via-neutral-900/90 dark:to-amber-950/30 shadow-xl'
                      : sub.status === 'approved'
                      ? 'border-emerald-500/40 bg-neutral-900/80'
                      : sub.status === 'pending'
                      ? 'border-amber-500/40 bg-neutral-900/80'
                      : 'border-red-500/30 bg-neutral-900/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-neutral-800 text-amber-400 font-mono text-xs font-bold border border-white/10">
                        {sub.invoiceNumber}
                      </span>
                      {(sub.eventRef || associatedEvent?.eventRef) && (
                        <span className="px-3 py-1 rounded-xl bg-indigo-950/80 text-indigo-400 font-mono text-xs font-black border border-indigo-500/20">
                          {lang === 'ar' ? `الرقم المرجعي: ${sub.eventRef || associatedEvent?.eventRef}` : `Ref No: ${sub.eventRef || associatedEvent?.eventRef}`}
                        </span>
                      )}
                      {/* Old block just in case */ false && (
                        <span className="px-3 py-1 rounded-xl bg-indigo-950/80 text-indigo-400 font-mono text-xs font-black border border-indigo-500/20">
                          {lang === 'ar' ? `الرقم المرجعي: ${associatedEvent.eventRef}` : `Ref No: ${associatedEvent.eventRef}`}
                        </span>
                      )}
                      <span className={`text-xs px-3 py-1 rounded-full font-extrabold uppercase ${
                        isArchived ? 'bg-amber-500 text-neutral-950 shadow-md animate-pulse' :
                        sub.status === 'approved' ? 'bg-emerald-500 text-neutral-950' :
                        sub.status === 'pending' ? 'bg-amber-400 text-neutral-950' : 'bg-red-500 text-white'
                      }`}>
                        {isArchived ? (lang === 'ar' ? '📦 منتهي (في الأرشيف لمدة 30 يوم)' : '📦 Archived (30-Day Notice)') :
                         sub.status === 'approved' ? (lang === 'ar' ? '🟢 نشط ومفعل' : '🟢 Active & Live') :
                         sub.status === 'pending' ? (lang === 'ar' ? '🟡 قيد المراجعة' : '🟡 Pending Review') :
                         (lang === 'ar' ? '🔴 مرفوض' : '🔴 Rejected')}
                      </span>
                      {sub.renewalCount && sub.renewalCount > 0 ? (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/10 text-neutral-300 font-mono">
                          {lang === 'ar' ? `تجديدات سابقة: ${sub.renewalCount}` : `Renewals: ${sub.renewalCount}`}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>{new Date(sub.submittedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                    </div>
                  </div>

                  {/* Archive Banner Notice if Archived */}
                  {isArchived && (
                    <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                      <div className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                        <span className="font-bold text-amber-300 block mb-1">
                          {lang === 'ar' ? '⏳ تنبيه الأرشيف: تم انتهاء فترة إعلانك ونقله إلى قاعدة البيانات!' : '⏳ Archive Notice: Your promo ended & moved to DB Archive!'}
                        </span>
                        {lang === 'ar'
                          ? 'يتم الاحتفاظ بالإعلان في الأرشيف بحد أقصى شهر (30 يوماً). يمكنك الآن الضغط على زر "🔄 تجديد الإعلان" لإعادة نشره، أو "✏️ تعديل الإعلان" لتغيير بياناته قبل الحذف النهائي.'
                          : 'Kept in archive for max 30 days. Click "🔄 Renew Ad" to reactivate, or "✏️ Edit Ad" to update details before final cleanup.'}
                      </div>
                    </div>
                  )}

                  {/* Ad Details or Editing Form */}
                  {isEditing ? (
                    <div className="space-y-4 mb-5 p-4 rounded-2xl bg-neutral-950 border border-amber-500/40">
                      <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'تعديل بيانات الإعلان الفاخر' : 'Edit VIP Ad Details'}</span>
                      </h4>

                      {sub.eventRef && (
                        <div className="mb-2 p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                          <label className="text-xs font-bold text-indigo-400 block mb-1">
                            {lang === 'ar' ? 'كود الحدث (الرقم المرجعي)' : 'Event Code (Reference)'}
                          </label>
                          <input
                            disabled
                            type="text"
                            value={sub.eventRef}
                            className="w-full rounded-xl bg-neutral-900/50 border border-indigo-500/30 px-3.5 py-2 text-indigo-300 font-mono font-bold select-all focus:outline-none opacity-80 cursor-not-allowed"
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'عنوان الإعلان (بالعربية)' : 'Title (Arabic)'}</label>
                        <input
                          type="text"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={editTitleAr}
                          onChange={e => setEditTitleAr(e.target.value)}
                          className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'عنوان الإعلان (بالإنجليزية)' : 'Title (English)'}</label>
                        <input
                          type="text"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={editTitleEn}
                          onChange={e => setEditTitleEn(e.target.value)}
                          className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      
                      {/* Description */}
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'الوصف (بالعربية)' : 'Description (Arabic)'}</label>
                        <textarea
                          value={editDescAr}
                          onChange={e => setEditDescAr(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'الوصف (بالإنجليزية)' : 'Description (English)'}</label>
                        <textarea
                          value={editDescEn}
                          onChange={e => setEditDescEn(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none resize-none text-left"
                          dir="ltr"
                        />
                      </div>

                      {/* Price */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'السعر (بالعربية)' : 'Price (Arabic)'}</label>
                          <input
                            type="text"
                            value={editPriceAr}
                            onChange={e => setEditPriceAr(e.target.value)}
                            className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                            placeholder="مثال: ١٠٠ درهم"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'السعر (بالإنجليزية)' : 'Price (English)'}</label>
                          <input
                            type="text"
                            value={editPriceEn}
                            onChange={e => setEditPriceEn(e.target.value)}
                            className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none text-left"
                            dir="ltr"
                            placeholder="e.g. 100 AED"
                          />
                        </div>
                      </div>

                      {/* Event Date */}
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'تاريخ الحدث' : 'Event Date'}</label>
                        <input
                          type="date"
                          value={editEventDate}
                          onChange={e => setEditEventDate(e.target.value)}
                          className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none text-left"
                          dir="ltr"
                        />
                      </div>

                      {/* Location */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'الموقع (بالعربية)' : 'Location (Arabic)'}</label>
                          <input
                            type="text"
                            value={editLocationAr}
                            onChange={e => setEditLocationAr(e.target.value)}
                            className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                            placeholder="مثال: دبي مارينا"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'الموقع (بالإنجليزية)' : 'Location (English)'}</label>
                          <input
                            type="text"
                            value={editLocationEn}
                            onChange={e => setEditLocationEn(e.target.value)}
                            className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none text-left"
                            dir="ltr"
                            placeholder="e.g. Dubai Marina"
                          />
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'هاتف الاتصال' : 'Contact Phone'}</label>
                          <input
                            type="tel"
                            value={editContactPhone}
                            onChange={e => setEditContactPhone(e.target.value)}
                            className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none text-left"
                            dir="ltr"
                            placeholder="971..."
                          />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'رقم واتساب' : 'WhatsApp Number'}</label>
                          <input
                            type="tel"
                            value={editContactWhatsapp}
                            onChange={e => setEditContactWhatsapp(e.target.value)}
                            className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none text-left"
                            dir="ltr"
                            placeholder="971..."
                          />
                        </div>
                      </div>
                      
                      {/* Media Edit */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <label className="text-xs text-neutral-400 block mb-1">
                          {lang === 'ar' ? 'تعديل الصورة / الفيديو' : 'Edit Media (Image / Video)'}
                        </label>
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setEditMediaType('image')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${editMediaType === 'image' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
                          >
                            Image
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditMediaType('video')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${editMediaType === 'video' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
                          >
                            Video
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={editMediaUrl}
                            onChange={(e) => setEditMediaUrl(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                          />
                          <label className="flex items-center justify-center px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer transition-all border border-neutral-700 disabled:opacity-50">
                            {isUploadingMedia ? (
                              <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                            ) : (
                              <span className="text-xs font-bold">{lang === 'ar' ? 'رفع' : 'Upload'}</span>
                            )}
                            <input
                              type="file"
                              className="hidden"
                              accept={editMediaType === 'image' ? 'image/*' : 'video/*'}
                              onChange={handleMediaFileChange}
                              disabled={isUploadingMedia}
                            />
                          </label>
                        </div>
                        {isUploadingMedia && (
                          <div className="mt-1 w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
                            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${mediaUploadProgress}%` }} />
                          </div>
                        )}
                        {editMediaUrl && (
                          <div className="mt-2 relative rounded-lg overflow-hidden border border-neutral-800 w-full max-w-[200px]">
                            {editMediaType === 'video' ? (
                               <video src={editMediaUrl} className="w-full object-cover rounded-lg" controls />
                            ) : (
                               <img src={editMediaUrl} alt="Preview" className="w-full object-cover rounded-lg" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          disabled={actionLoading === sub.id}
                          onClick={() => handleSaveEdit(sub)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-extrabold text-xs hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>{actionLoading === sub.id ? '...' : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}</span>
                        </button>
                        <button
                          onClick={() => setEditingSubId(null)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition-all cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                          <span>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 text-xs">
                      <div>
                        <span className="text-neutral-500 block">{lang === 'ar' ? 'عنوان الإعلان' : 'Ad Title'}</span>
                        <span className="text-white font-bold text-sm">{lang === 'ar' ? (sub.titleAr || sub.titleEn) : (sub.titleEn || sub.titleAr)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">{lang === 'ar' ? 'الباقة والمدة' : 'Package & Duration'}</span>
                        <span className="text-amber-400 font-bold font-mono">
                          {sub.pricing?.days || 3} {lang === 'ar' ? 'أيام' : 'Days'} • ({sub.pricing?.total || 250} {lang === 'ar' ? 'جنيه' : 'EGP'})
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">{lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</span>
                        <span className="text-neutral-300 font-mono font-semibold">
                          {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : (lang === 'ar' ? 'يحدد عند التفعيل' : 'On Approval')}
                        </span>
                      </div>
                    </div>
                  )}

                  {sub.status === 'approved' && (
                    (() => {
                      const eventId = sub.eventData?.id || sub.id;
                      const eventBookings = bookings?.filter(b => b.eventId === eventId) || [];
                      const actualAttendeesCount = eventBookings
                        .filter(b => b.status === 'approved' && b.attended === true)
                        .reduce((sum, b) => sum + (b.numberOfIndividuals || 1), 0);

                      return (
                        <div className="mt-4 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-3 mb-4">
                          <h5 className="font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? '📊 إحصائيات الحضور الفعلية' : '📊 Real Attendance Stats'}</span>
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div>
                              <span className="text-neutral-500 block">{lang === 'ar' ? 'الذين حضروا بالفعل' : 'Actual Attendees'}</span>
                              <span className="text-white font-extrabold text-base font-sans">{actualAttendeesCount} {lang === 'ar' ? 'أفراد' : 'people'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* Advertiser Actions: Renew, Edit & Delete */}
                  {!isEditing && (
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-white/10">
                      {(isArchived || sub.status === 'approved') && (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          disabled={actionLoading === sub.id}
                          onClick={() => handleRenewAd(sub)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-black text-xs hover:from-amber-400 hover:to-amber-500 shadow-lg gold-glow transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${actionLoading === sub.id ? 'animate-spin' : ''}`} />
                          <span>{actionLoading === sub.id ? '...' : (lang === 'ar' ? '🔄 تجديد الإعلان الآن' : '🔄 Renew Ad Now')}</span>
                        </motion.button>
                      )}

                      <button
                        onClick={() => handleStartEdit(sub)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white font-bold text-xs hover:bg-neutral-700 transition-all border border-white/10 cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4 text-amber-400" />
                        <span>{lang === 'ar' ? '✏️ تعديل البيانات' : '✏️ Edit Details'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAdSubmission(sub.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 font-bold text-xs transition-all cursor-pointer"
                        title={lang === 'ar' ? 'حذف هذا الإعلان' : 'Delete this ad'}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Support Messages & Replies Section */}
      {activeSection === 'support' && (
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'ar' ? `رسائلي وإشعارات الدعم الفني (${mySupportMessages.length})` : `My Support Inquiries & Replies (${mySupportMessages.length})`}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {mySupportMessages.length > 0 && (
              <button
                onClick={handleDeleteAllSupportMessages}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/15 px-3 py-2 text-xs font-bold text-red-400 transition-all cursor-pointer"
                title={lang === 'ar' ? 'حذف جميع رسائل الدعم بشكل نهائي' : 'Delete all support messages permanently'}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'حذف الكل' : 'Delete All'}</span>
              </button>
            )}
            <button
              onClick={openSupportModal}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all shadow-md cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{lang === 'ar' ? 'إرسال استفسار أو مقترح جديد' : 'New Inquiry'}</span>
            </button>
          </div>
        </div>

        {mySupportMessages.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-neutral-900/50 p-8 text-center text-neutral-500 text-sm">
            {lang === 'ar'
              ? 'لم تقم بإرسال أي رسائل دعم أو شكاوى حتى الآن. يمكنك التواصل معنا في أي وقت!'
              : 'No support inquiries submitted yet. Feel free to contact us anytime!'}
          </div>
        ) : (
          <div className="space-y-4">
            {mySupportMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                      {msg.refNumber}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {new Date(msg.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {msg.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                        <Clock className="h-3.5 w-3.5" />
                        {lang === 'ar' ? 'قيد مراجعة الإدارة' : 'Pending Reply'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {lang === 'ar' ? 'تم الرد الرسمي' : 'Replied'}
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteSupportMessage(msg.id)}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-500/15 hover:text-red-400 text-zinc-400 border border-zinc-750 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title={lang === 'ar' ? 'حذف هذه الرسالة' : 'Delete this message'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* User message */}
                <div className="space-y-1">
                  <span className="text-xs text-neutral-400 font-mono">
                    {lang === 'ar' ? 'رسالتك:' : 'Your Message:'}
                  </span>
                  <p className="text-sm text-neutral-200 bg-neutral-950 p-3 rounded-2xl border border-neutral-800/80">
                    {msg.message}
                  </p>
                </div>

                {/* Admin Reply */}
                {msg.status === 'replied' && msg.replyText ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:to-neutral-900 border border-emerald-500/40 space-y-2 gold-glow"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span className="flex items-center gap-1.5 font-mono">
                        <CheckCircle className="h-4 w-4" />
                        {lang === 'ar' ? 'رد الإدارة (إشعار رسمي):' : 'Admin Official Reply:'}
                      </span>
                      {msg.repliedAt && (
                        <span className="text-[10px] text-emerald-500/80 font-mono">
                          {new Date(msg.repliedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-emerald-200 leading-relaxed font-medium">
                      {msg.replyText}
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-xs text-amber-400/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? 'تم استلام رسالتك وتوجيهها إلى صندوق رسائل الإدارة. سيتم إرسال الرد وإشعاره هنا قريباً.'
                        : 'Your inquiry has been received and forwarded to admin inbox. Reply will be notified here soon.'}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Booked Tickets Section */}
      {activeSection === 'booked' && (
      <div>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Ticket className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold text-white font-sans">
              {lang === 'ar' ? `تذاكر وحجوزات الحفلات (${myBookings.length})` : `My Bookings & Event Tickets (${myBookings.length})`}
            </h3>
          </div>
          {myBookings.length > 0 && (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/15 text-xs font-bold text-red-400 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'حذف الكل' : 'Delete All'}</span>
            </button>
          )}
        </div>

        {myBookings.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-neutral-900/50 p-12 text-center text-neutral-400 max-w-lg mx-auto">
            <Ticket className="w-12 h-12 text-zinc-600 mx-auto mb-4 stroke-[1.5]" />
            <p className="text-sm font-semibold mb-2 text-zinc-300">
              {lang === 'ar' ? 'لا توجد حجوزات نشطة حالياً' : 'No bookings found'}
            </p>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
              {lang === 'ar' 
                ? 'استكشف فعاليات الرقص والورش التدريبية الرائعة المتاحة الآن، واحجز تذكرتك بلمحة بصر!' 
                : 'Explore available events, workshops and parties, and book your ticket in seconds!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myBookings.map((b) => {
              const isArabic = lang === 'ar';
              return (
                <div 
                  key={b.id} 
                  className="bg-neutral-900 border border-zinc-800 rounded-3xl overflow-hidden relative shadow-lg flex flex-col justify-between min-h-[320px]"
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  {/* Vertical Red Accent - signature visual style! */}
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-600"></div>
                  
                  {/* Ticket Top details */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider">
                          {isArabic ? 'الرقم المرجعي للحجز' : 'REF NUMBER'}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-500">
                          {b.refNumber}
                        </span>
                        {b.submittedAt && (
                          <span className="text-[10px] text-zinc-400 font-sans block mt-1">
                            📅 {new Date(b.submittedAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {b.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            {isArabic ? 'قيد المراجعة' : 'Pending Review'}
                          </span>
                        ) : b.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            {isArabic ? 'مؤكد ومقبول' : 'Confirmed'}
                          </span>
                        ) : b.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-bold border border-zinc-700">
                            <X className="w-3 h-3" />
                            {isArabic ? 'ملغي ومسترجع' : 'Cancelled & Refunded'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/25 text-red-400 text-[10px] font-bold border border-red-500/20">
                            <X className="w-3 h-3" />
                            {isArabic ? 'مرفوض' : 'Rejected'}
                          </span>
                        )}
                        <button
                          onClick={() => setBookingToDelete(b.id)}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-500/15 hover:text-red-400 text-zinc-400 border border-zinc-750 transition-all cursor-pointer flex items-center justify-center shrink-0"
                          title={isArabic ? 'حذف هذا الحجز' : 'Delete this booking'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider">
                        {isArabic ? 'الفعالية / الحفلة' : 'EVENT'}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-100 line-clamp-1">
                        {isArabic ? b.eventTitleAr : b.eventTitleEn}
                      </h4>
                      {(() => {
                        const matchedEvent = events.find(e => e.id === b.eventId);
                        const evDate = b.eventDate || matchedEvent?.eventDate;
                        if (!evDate) return null;
                        return (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 mt-1">
                            <span>📅 {isArabic ? 'تاريخ الحفلة:' : 'Event Date:'}</span>
                            <span className="font-mono text-zinc-200">
                              {new Date(evDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-zinc-800/60">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">
                          {isArabic ? 'اسم الحاجز' : 'Name'}
                        </span>
                        <span className="font-semibold text-zinc-300 font-sans truncate block">
                          {b.userName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">
                          {isArabic ? 'رقم الهاتف' : 'Phone'}
                        </span>
                        <span className="font-mono text-zinc-300 block truncate">
                          {b.userPhone}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">
                          {isArabic ? 'عدد الأفراد' : 'Guests'}
                        </span>
                        <span className="font-semibold text-zinc-300 font-sans">
                          {b.numberOfIndividuals} {isArabic ? 'أفراد' : 'people'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">
                          {isArabic ? 'المبلغ الإجمالي' : 'Total Price'}
                        </span>
                        <span className="font-mono font-bold text-amber-500">
                          {b.totalAmount} {isArabic ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    </div>

                    {/* Purge Notice Warning */}
                    <div className="text-[10px] text-zinc-400 bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-800/80 flex gap-1.5 leading-relaxed">
                      <span className="text-amber-500 mt-0.5 shrink-0">⚠️</span>
                      <div>
                        {isArabic ? (
                          <span>
                            <strong>تنبيه هام جداً:</strong> لخصوصيتك وتوفير مساحة بقاعدة البيانات، <span className="text-amber-400 font-semibold">سيتم حذف صورة الإيصال تلقائياً بعد مرور 24 ساعة من تاريخ الحفلة.</span> يرجى أخذ لقطة شاشة (Screenshot) للتذكرة وبيانات الدخول للتحفظ بها.
                          </span>
                        ) : (
                          <span>
                            <strong>Important Notice:</strong> For privacy and database performance, <span className="text-amber-400 font-semibold">your uploaded receipt image will be deleted 24 hours after the event date.</span> Please take a screenshot of this ticket to keep a permanent backup.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dotted separator with ticket cuts on sides */}
                  <div className="relative flex items-center justify-center px-4 my-1">
                    <div className="absolute left-[-8px] w-4 h-4 rounded-full bg-neutral-950 border-r border-zinc-800"></div>
                    <div className="w-full border-t border-dashed border-zinc-800"></div>
                    <div className="absolute right-[-8px] w-4 h-4 rounded-full bg-neutral-950 border-l border-zinc-800"></div>
                  </div>

                  {/* Ticket Bottom interactive or review area */}
                  <div className="p-5 bg-zinc-950/40 rounded-b-3xl">
                    {b.status === 'pending' ? (
                      <div className="space-y-2.5">
                        <div className="text-xs text-amber-400 bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/10 flex gap-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            {isArabic 
                              ? 'جاري مراجعة إيصال التحويل المرفق للتفعيل وإصدار الباركود وكود الدخول الخاص بك.' 
                              : 'We are verifying your payment screenshot. Your entry code and QR will show up here.'}
                          </p>
                        </div>
                        {b.receiptImage && (
                          <div className="flex items-center gap-3 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80">
                            <img src={b.receiptImage} className="w-10 h-10 object-cover rounded-lg border border-zinc-700" alt="Receipt" />
                            <span className="text-[10px] text-zinc-400 font-sans">
                              {isArabic ? 'إيصال التحويل المرفق' : 'Attached payment receipt'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : b.status === 'approved' ? (
                      b.attended ? (
                        <div className="flex flex-col items-center justify-center text-center bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 space-y-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 font-black text-xl">
                            ✓
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block">
                              {isArabic ? '🟢 تم تأكيد الحضور بنجاح' : '🟢 ATTENDANCE CONFIRMED SUCCESSFULLY'}
                            </span>
                            <span className="text-xs text-zinc-300 block font-mono">
                              {b.attendedAt ? new Date(b.attendedAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              }) : new Date().toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-sans leading-relaxed">
                              {isArabic 
                                ? 'لقد تم تسجيل دخولك لهذه الفعالية بواسطة موظف الأمن.' 
                                : 'Your check-in has been registered for this event by the security officer.'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const matchedEvent = events.find(e => e.id === b.eventId);
                          const evDate = b.eventDate || matchedEvent?.eventDate;
                          let isEventPassed = false;
                          if (evDate) {
                            const eventTime = new Date(evDate).getTime();
                            const nowTime = new Date().getTime();
                            isEventPassed = nowTime > eventTime + (24 * 60 * 60 * 1000); // 24 hours after event
                          }

                          if (isEventPassed) {
                            return (
                              <div className="flex flex-col items-center justify-center text-center bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 space-y-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-500 font-black text-xl">
                                  ⌛
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider block">
                                    {isArabic ? 'انتهت الفعالية' : 'EVENT ENDED'}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 block font-sans leading-relaxed">
                                    {isArabic ? 'تم انتهاء وقت هذه الفعالية ولم يعد الباركود متاحاً.' : 'This event has ended and the QR code is no longer available.'}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-950/85 p-3 rounded-2xl border border-zinc-800">
                              {/* Live QR generator for the entry card */}
                              <div className="w-20 h-20 bg-white p-1 rounded-lg shrink-0 border border-zinc-800">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=245-158-11&data=${encodeURIComponent(
                                    (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') || window.location.origin.includes('0.0.0.0')
                                      ? 'https://ais-pre-zo2q5hnuwpcqcr6exb6plx-497491106818.europe-west1.run.app'
                                      : window.location.origin) + '/?verify=' + b.id
                                  )}`} 
                                  className="w-full h-full object-contain" 
                                  alt="Entry QR" 
                                />
                              </div>
                              <div className="space-y-1 flex-1 text-center sm:text-right">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
                                  {isArabic ? 'كود الدخول والتحقق الرقمي' : 'DIGITAL ENTRY PASSCODE'}
                                </span>
                                <span className="text-sm font-mono font-black text-emerald-400 tracking-widest block">
                                  {b.accessCode || 'DWM-ACTIVE'}
                                </span>
                                <span className="text-[10px] text-zinc-400 block font-sans leading-relaxed">
                                  {isArabic 
                                    ? '✅ أظهر هذا الباركود للمسؤول عند بوابة الحضور للدخول مباشرة!' 
                                    : '✅ Present this barcode at the entry gate to gain access!'}
                                </span>
                              </div>
                            </div>
                          );
                        })()
                      )
                    ) : (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-red-400 block uppercase tracking-wider">
                          {isArabic ? 'سبب الرفض' : 'REJECTION REASON'}
                        </span>
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                          {b.adminNotes || b.notes || (isArabic ? 'التحويل غير مكتمل أو لم يتم استلامه على الرقم 01010764256.' : 'The transfer was incomplete or not received on our payment system.')}
                        </p>
                      </div>
                    )}

                    {/* User Cancellation & Withdrawal Section */}
                    {((b.status === 'pending' || b.status === 'approved') && !b.attended) && (() => {
                      const matchedEvent = events.find(e => e.id === b.eventId);
                      const evDate = b.eventDate || matchedEvent?.eventDate;
                      
                      let isCancelable = false;
                      let remainingHoursText = '';
                      let isEventPassed = false;
                      
                      if (evDate) {
                        const eventTime = new Date(evDate).getTime();
                        const nowTime = new Date().getTime();
                        const diffMs = eventTime - nowTime;
                        const diffHours = diffMs / (1000 * 60 * 60);
                        isCancelable = diffHours > 48;
                        isEventPassed = nowTime > eventTime + (24 * 60 * 60 * 1000);
                        
                        if (!isCancelable) {
                          remainingHoursText = isArabic 
                            ? 'لا يمكنك الآن الإلغاء (المتبقي أقل من 48 ساعة على الفعالية)' 
                            : 'You cannot cancel now (less than 48 hours remaining until event)';
                        }
                      } else {
                        // Default to cancelable if no date metadata is found
                        isCancelable = true;
                      }

                      if (isEventPassed) return null;

                      return (
                        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col gap-2">
                          {isCancelable ? (
                            <button
                              onClick={async () => {
                                const confirmMsg = isArabic
                                  ? `⚠️ هل أنت متأكد من رغبتك في إلغاء الحجز والتراجع عنه؟\n\nشروط سياسة الاسترجاع:\nسوف يتم خصم 5% كرسوم إدارية وتحويل وبنك من إجمالي مبلغ الحجز (${b.totalAmount} ج.م) والباقي يسترجع لك.\n\nهل تود تأكيد طلب الإلغاء؟`
                                  : `⚠️ Are you sure you want to cancel and withdraw your booking?\n\nRefund Policy:\nA 5% fee will be deducted from your total booking amount (${b.totalAmount} EGP) for transfer & administrative fees.\n\nDo you want to confirm cancellation?`;
                                
                                const confirmed = await triggerConfirm(confirmMsg);
                                if (confirmed) {
                                  const success = await cancelBooking(b.id);
                                  if (success) {
                                    alert(isArabic ? 'تم إلغاء الحجز بنجاح!' : 'Booking was cancelled successfully!');
                                  } else {
                                    alert(isArabic ? 'حدث خطأ أثناء محاولة إلغاء الحجز.' : 'An error occurred while cancelling the booking.');
                                  }
                                }
                              }}
                              className="w-full py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>{isArabic ? 'إلغاء أو تراجع ↩️' : 'Cancel or Withdraw ↩️'}</span>
                            </button>
                          ) : (
                            <div className="text-center py-2 px-3 bg-red-950/25 border border-red-500/30 rounded-xl">
                              <span className="text-[11px] text-red-400 font-extrabold block">
                                {remainingHoursText || (isArabic ? 'لا يمكنك الآن الإلغاء ⚠️' : 'You cannot cancel now ⚠️')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Liked Events Section */}
      {activeSection === 'liked' && (
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'ar' ? `الفعاليات المفضلة (${likedEvents.length})` : `My Liked Events (${likedEvents.length})`}
            </h3>
          </div>
          {likedEvents.length > 0 && (
            <button
              onClick={async () => {
                const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في إزالة جميع الفعاليات من المفضلة؟' : 'Are you sure you want to remove all events from your favorites?');
                if (confirmed) {
                  clearAllLikedEvents();
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/15 text-xs font-bold text-red-400 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'حذف الكل' : 'Delete All'}</span>
            </button>
          )}
        </div>

        {likedEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-neutral-900/50 p-8 text-center text-neutral-500 text-sm">
            {lang === 'ar' ? 'لم تعجب بأي فعالية بعد. اضغط على زر القلب في الصفحة الرئيسية!' : 'No liked events yet. Click the heart icon on any party!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {likedEvents.map((ev, idx) => (
                <EventCard 
                  key={ev.id} 
                  event={ev} 
                  index={idx} 
                  onOpenMap={onOpenMap} 
                  onOpenShare={onOpenShare} 
                  isFavoritesTab={true}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      )}
      </div>
      {/* Booking Deletion Confirmation Modals */}
      <AnimatePresence>
        {bookingToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingToDelete(null)}
              className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-500/20 bg-neutral-900 p-6 shadow-2xl text-center font-sans"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="h-6 w-6 stroke-[2]" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                {lang === 'ar' ? 'تأكيد الحذف والإنتباه!' : 'Confirm Deletion!'}
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                {lang === 'ar' 
                  ? 'هل انت متاكد انك تريد حذف هذا الحجز؟ هذا الإجراء لا يمكن التراجع عنه وسيتم إزالة بيانات التذكرة بالكامل.'
                  : 'Are you sure you want to delete this booking? This action cannot be undone and your ticket data will be completely removed.'}
              </p>
              <div className="flex gap-3">
                <button
                  disabled={deleteBkgLoading}
                  onClick={() => setBookingToDelete(null)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs transition-all cursor-pointer border border-neutral-700/60"
                >
                  {lang === 'ar' ? 'تراجع وإلغاء' : 'Cancel'}
                </button>
                <button
                  disabled={deleteBkgLoading}
                  onClick={() => handleDeleteBooking(bookingToDelete)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-neutral-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/10"
                >
                  {deleteBkgLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{lang === 'ar' ? 'نعم، احذف الحجز' : 'Yes, Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {confirmDeleteAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteAll(false)}
              className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-500/20 bg-neutral-900 p-6 shadow-2xl text-center font-sans"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="h-6 w-6 stroke-[2]" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                {lang === 'ar' ? 'انتباه! حذف جميع الحجوزات' : 'Warning! Delete All Bookings'}
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                {lang === 'ar' 
                  ? 'هل انت متاكد انك تريد حذف جميع الحجوزات الخاصة بك؟ سيتم مسح كافة التذاكر والطلبات قيد المراجعة أو المقبولة نهائياً.'
                  : 'Are you sure you want to delete all of your bookings? All of your pending or approved tickets will be permanently deleted.'}
              </p>
              <div className="flex gap-3">
                <button
                  disabled={deleteBkgLoading}
                  onClick={() => setConfirmDeleteAll(false)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs transition-all cursor-pointer border border-neutral-700/60"
                >
                  {lang === 'ar' ? 'تراجع وإلغاء' : 'Cancel'}
                </button>
                <button
                  disabled={deleteBkgLoading}
                  onClick={handleDeleteAllBookings}
                  className="flex-1 px-4 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-neutral-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/10"
                >
                  {deleteBkgLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{lang === 'ar' ? 'نعم، احذف الكل' : 'Yes, Delete All'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingProfile(false)}
              className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-500/20 bg-neutral-900 p-6 shadow-2xl text-right font-sans"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="rounded-xl border border-white/10 bg-neutral-850 p-2 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-amber-400" />
                  <span>{lang === 'ar' ? 'تعديل بيانات الملف الشخصي' : 'Edit Profile Information'}</span>
                </h3>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    {lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-neutral-950 py-3 px-4 text-sm font-semibold text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all text-right"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    {lang === 'ar' ? 'رقم الهاتف (لتلقي التذاكر والواتساب)' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    dir="ltr"
                    className="w-full rounded-2xl border border-white/10 bg-neutral-950 py-3 px-4 text-sm font-semibold text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all text-left"
                    placeholder="e.g. 201015112185"
                  />
                </div>

                {/* Favorite Dance Styles */}
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-2">
                    {lang === 'ar' ? 'أنماط رقصك المفضلة:' : 'Favorite Dance Styles:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto p-2 bg-neutral-950/50 rounded-2xl border border-white/5">
                    {ALL_DANCE_STYLES.map((style) => {
                      const isSelected = editStyles.includes(style);
                      return (
                        <button
                          key={style}
                          onClick={() => {
                            if (isSelected) {
                              setEditStyles(editStyles.filter((s) => s !== style));
                            } else {
                              setEditStyles([...editStyles, style]);
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition-all ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                              : 'border-white/5 bg-neutral-900 text-neutral-400 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3 text-amber-400" />
                          ) : (
                            <div className="h-3 w-3" />
                          )}
                          <span className="truncate">{style}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-3 pt-4 mt-6 border-t border-white/5">
                <button
                  onClick={() => {
                    updateUserProfile(editName.trim(), editPhone.trim(), editStyles);
                    setIsEditingProfile(false);
                  }}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-xl gold-glow transition-all"
                >
                  {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="rounded-2xl border border-white/10 bg-neutral-850 px-6 py-3 text-sm font-semibold text-neutral-300 hover:bg-neutral-700 transition-colors"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
