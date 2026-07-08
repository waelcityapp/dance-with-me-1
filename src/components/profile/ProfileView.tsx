import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, PlusCircle, Heart, Ticket, ShieldAlert, Sparkles, Clock, Trash2, LogOut, CheckCircle2, RotateCcw, FileText, Edit3, RefreshCw, AlertTriangle, Check, X, Upload, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EventCard } from '../events/EventCard';
import { DanceEvent, AdSubmission, DanceStyle, ALL_DANCE_STYLES } from '../../types';
import { subscribeToAdSubmissions, saveAdSubmissionToFirestore, saveNotificationToFirestore } from '../../lib/firebase';
import { GENDER_NEUTRAL_AVATARS, DEFAULT_NEUTRAL_AVATAR } from '../../utils/avatars';

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
    cleanUpDuplicateAds
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
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editTitleAr, setEditTitleAr] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'ads' | 'support' | 'booked' | 'liked' | 'archive'>('overview');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStyles, setEditStyles] = useState<DanceStyle[]>([]);

  const handleOpenEditProfile = () => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditStyles(user.favoriteStyles || []);
      setIsEditingProfile(true);
    }
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && user) {
          updateUserAvatar(result);
          setShowAvatarPicker(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const loadLocal = () => {
      try {
        const local = JSON.parse(localStorage.getItem('dwm_ad_submissions') || '[]');
        setAdSubmissions(local as AdSubmission[]);
      } catch (e) {}
    };
    loadLocal();

    const unsubscribe = subscribeToAdSubmissions((list) => {
      setAdSubmissions(list);
    });
    return () => unsubscribe();
  }, []);

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
      await saveAdSubmissionToFirestore(updated);

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
  };

  const handleSaveEdit = async (sub: AdSubmission) => {
    setActionLoading(sub.id);
    try {
      const updated: AdSubmission = {
        ...sub,
        titleAr: editTitleAr || sub.titleAr,
        titleEn: editTitleEn || sub.titleEn
      };
      updateLocalAndState(updated);
      await saveAdSubmissionToFirestore(updated);

      await saveNotificationToFirestore({
        id: `notif_edit_${Date.now()}`,
        titleAr: '✏️ تم تعديل بيانات الإعلان رقم ' + sub.invoiceNumber,
        titleEn: '✏️ Ad data edited for invoice ' + sub.invoiceNumber,
        messageAr: `قام المعلن ${sub.advertiserName} بتعديل عنوان الإعلان إلى: ${updated.titleAr}`,
        messageEn: `Advertiser ${sub.advertiserName} edited ad title to: ${updated.titleEn}`,
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

  const likedEvents = events.filter(ev => user.likedEventIds.includes(ev.id));
  const bookedEvents = events.filter(ev => user.bookedEventIds.includes(ev.id));
  const mySupportMessages = supportMessages.filter(m => user && m.userId === user.id);

  return (
    <div className="space-y-8 pb-12">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 sm:p-8 shadow-2xl gold-glow"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-start">
          <div className="relative group cursor-pointer flex flex-col items-center" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
            <img
              src={user.avatar || DEFAULT_NEUTRAL_AVATAR}
              alt={user.name}
              className="h-24 w-24 rounded-2xl object-cover border-2 border-amber-400 shadow-xl transition-transform group-hover:scale-105"
            />
            <span className="mt-1.5 text-[11px] font-mono font-bold text-amber-300 underline underline-offset-2">
              {lang === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-2xl font-extrabold text-white">{user.name}</h2>
              <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-mono font-bold text-amber-300 border border-amber-500/30">
                {lang === 'ar' ? 'عضو النادي (VIP)' : 'VIP CLUB MEMBER'}
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400 mb-4">{user.email} • {user.phone}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-4">
              <span className="text-xs text-neutral-400 font-mono mr-1">{lang === 'ar' ? 'الأنماط:' : 'Styles:'}</span>
              {user.favoriteStyles.map(style => (
                <span key={style} className="rounded-md bg-white/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-300 border border-white/10">
                  #{style}
                </span>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 border-t border-white/10">
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 shadow-md gold-glow transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'إضافة إعلان' : 'Post Ad'}</span>
              </button>

              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                {lang === 'ar' ? 'اختيار أيقونة' : 'Choose Avatar'}
              </button>

              <button
                onClick={handleOpenEditProfile}
                className="rounded-xl border border-white/10 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                {lang === 'ar' ? 'تعديل الملف' : 'Edit Profile'}
              </button>

              <button
                onClick={logoutUser}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600/10 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all ml-auto"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'خروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gender-Neutral Avatar Picker Section */}
        <AnimatePresence>
          {showAvatarPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-5 border-t border-white/10 flex flex-col items-center sm:items-start gap-3 overflow-hidden"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono text-amber-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  {lang === 'ar' ? 'اختر أيقونة لملفك الشخصي:' : 'Select a Profile Avatar:'}
                </span>
                <button onClick={() => setShowAvatarPicker(false)} className="text-xs text-neutral-400 hover:text-white">✕</button>
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
              <div className="w-full mt-2 flex items-center justify-between bg-neutral-950 p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-neutral-300 font-mono">
                    {lang === 'ar' ? 'أو قم برفع صورة شخصية من جهازك:' : 'Or upload a custom photo from your device:'}
                  </span>
                </div>
                <label className="cursor-pointer rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all flex items-center gap-1.5">
                  <span>{lang === 'ar' ? 'اختر صورة من جهازك' : 'Choose Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {activeSection === 'overview' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Confirmed Bookings */}
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            onClick={() => setActiveSection('booked')}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl cursor-pointer hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-neutral-950 transition-colors">
                  <Ticket className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 font-mono">
                  {bookedEvents.length}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                {lang === 'ar' ? 'تذاكري وحجوزاتي المؤكدة' : 'My Confirmed Bookings'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {lang === 'ar' ? 'عرض وحفظ تذاكر الحضور والتفاصيل الخاصة بالفعاليات التي قمت بحجزها.' : 'View your booked event tickets, dates, and check-in details.'}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-emerald-400 pt-3 border-t border-white/5">
              <span>{lang === 'ar' ? 'عرض التذاكر' : 'View Tickets'}</span>
              <span>{lang === 'ar' ? '←' : '→'}</span>
            </div>
          </motion.div>

          {/* Card 2: Liked Events */}
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            onClick={() => setActiveSection('liked')}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl cursor-pointer hover:border-red-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <Heart className="h-6 w-6 fill-current" />
                </div>
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 font-mono">
                  {likedEvents.length}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                {lang === 'ar' ? 'الفعاليات والحفلات المفضلة' : 'My Liked Events'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {lang === 'ar' ? 'قائمة الحفلات وورش العمل التي قمت بحفظها في المفضلة للرجوع إليها.' : 'List of parties and workshops you saved to your favorites.'}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-red-400 pt-3 border-t border-white/5">
              <span>{lang === 'ar' ? 'عرض المفضلة' : 'View Favorites'}</span>
              <span>{lang === 'ar' ? '←' : '→'}</span>
            </div>
          </motion.div>

          {/* Card 3: VIP Ad Submissions & Host Dashboard */}
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            onClick={() => setActiveSection('ads')}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-amber-950/20 p-6 shadow-xl cursor-pointer hover:border-amber-500/50 transition-all group flex flex-col justify-between gold-glow"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 font-mono">
                  {adSubmissions.length}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                {lang === 'ar' ? 'إعلاناتي وفواتيري VIP' : 'My VIP Ads & Invoices'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {lang === 'ar' ? 'إدارة إعلاناتك المرفوعة، متابعة حالات الموافقة، التعديل، أو التجديد من الأرشيف.' : 'Manage your promo submissions, track approvals, edits, or renewals.'}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-amber-400 pt-3 border-t border-white/5">
              <span>{lang === 'ar' ? 'إدارة الإعلانات' : 'Manage Ads'}</span>
              <span>{lang === 'ar' ? '←' : '→'}</span>
            </div>
          </motion.div>

          {/* Card 4: Support Messages */}
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            onClick={() => setActiveSection('support')}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl cursor-pointer hover:border-blue-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-neutral-950 transition-colors">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400 font-mono">
                  {mySupportMessages.length}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                {lang === 'ar' ? 'رسائلي والدعم الفني' : 'Support Inquiries & Replies'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {lang === 'ar' ? 'متابعة استفساراتك المرسلة للإدارة وقراءة الردود والإشعارات الرسمية عليها.' : 'Track your submitted support inquiries and check admin replies.'}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-blue-400 pt-3 border-t border-white/5">
              <span>{lang === 'ar' ? 'عرض الرسائل' : 'View Inquiries'}</span>
              <span>{lang === 'ar' ? '←' : '→'}</span>
            </div>
          </motion.div>

          {/* Card 5: Expired Archive */}
          <motion.div
            whileHover={{ scale: 1.02, y: -3 }}
            onClick={() => setActiveSection('archive')}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 shadow-xl cursor-pointer hover:border-amber-500/50 transition-all group flex flex-col justify-between sm:col-span-2 lg:col-span-2"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                      {lang === 'ar' ? 'أرشيف الإعلانات والفعاليات المنقضية' : 'Expired Ads & Events Archive'}
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {lang === 'ar' ? 'الأرشيف التلقائي للفعاليات المنتهية' : 'Automatic Archive for Concluded Events'}
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-bold text-amber-300 font-mono border border-white/10">
                  {expiredEvents.length}
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {lang === 'ar'
                  ? 'الوصول إلى أرشيف الإعلانات والفعاليات التي انتهى موعد عرضها وإدارتها أو تنظيفها.'
                  : 'Access archived ads and events whose date has passed, manage or clean up past listings.'}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs font-bold text-amber-400 pt-3 border-t border-white/5">
              <span>{lang === 'ar' ? 'فتح الأرشيف والفعاليات المنقضية' : 'Open Expired Archive'}</span>
              <span>{lang === 'ar' ? '←' : '→'}</span>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between rounded-2xl bg-neutral-900 border border-white/10 p-4 shadow-lg">
            <button
              onClick={() => setActiveSection('overview')}
              className="flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-neutral-700 transition-all cursor-pointer"
            >
              <span>{lang === 'ar' ? '→ عودة للقائمة الرئيسية للملف الشخصي' : '← Back to Profile Overview'}</span>
            </button>
            <span className="text-xs sm:text-sm font-extrabold text-amber-400 font-mono">
              {activeSection === 'booked' && (lang === 'ar' ? '🎟️ تذاكري وحجوزاتي المؤكدة' : '🎟️ My Confirmed Bookings')}
              {activeSection === 'liked' && (lang === 'ar' ? '❤️ الفعاليات والحفلات المفضلة' : '❤️ My Liked Events')}
              {activeSection === 'ads' && (lang === 'ar' ? '📢 إعلاناتي وفواتيري VIP' : '📢 My VIP Ads & Invoices')}
              {activeSection === 'support' && (lang === 'ar' ? '💬 رسائلي وإشعارات الدعم الفني' : '💬 My Support Inquiries')}
              {activeSection === 'archive' && (lang === 'ar' ? '📦 أرشيف الإعلانات والفعاليات المنقضية' : '📦 Expired Ads & Events Archive')}
            </span>
          </div>

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
      <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-neutral-900 via-neutral-900/95 to-amber-950/20 p-6 sm:p-8 shadow-2xl gold-glow space-y-6">
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

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                    isArchived
                      ? 'border-amber-500/60 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/30 shadow-xl'
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
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'عنوان الإعلان (بالعربية)' : 'Title (Arabic)'}</label>
                        <input
                          type="text"
                          value={editTitleAr}
                          onChange={e => setEditTitleAr(e.target.value)}
                          className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">{lang === 'ar' ? 'عنوان الإعلان (بالإنجليزية)' : 'Title (English)'}</label>
                        <input
                          type="text"
                          value={editTitleEn}
                          onChange={e => setEditTitleEn(e.target.value)}
                          className="w-full rounded-xl bg-neutral-900 border border-white/10 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                        />
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

                  {/* Advertiser Actions: Renew & Edit */}
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'ar' ? `رسائلي وإشعارات الدعم الفني (${mySupportMessages.length})` : `My Support Inquiries & Replies (${mySupportMessages.length})`}
            </h3>
          </div>
          <button
            onClick={openSupportModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all shadow-md cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إرسال استفسار أو مقترح جديد' : 'New Inquiry'}</span>
          </button>
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

                  <div>
                    {msg.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                        <Clock className="h-3.5 w-3.5" />
                        {lang === 'ar' ? 'قيد مراجعة الإدارة' : 'Pending Reply'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {lang === 'ar' ? 'تم الرد الرسمي' : 'Replied'}
                      </span>
                    )}
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
                    className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-neutral-900 border border-emerald-500/40 space-y-2 gold-glow"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span className="flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="h-4 w-4" />
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
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Ticket className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {lang === 'ar' ? `حجوزاتي المؤكدة (${bookedEvents.length})` : `My Confirmed Bookings (${bookedEvents.length})`}
          </h3>
        </div>

        {bookedEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-neutral-900/50 p-8 text-center text-neutral-500 text-sm">
            {lang === 'ar' ? 'لم تقم بحجز تذاكر لأي فعالية بعد.' : 'No booked events yet. Explore salsa nights and book!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookedEvents.map((ev, idx) => (
              <EventCard key={ev.id} event={ev} index={idx} onOpenMap={onOpenMap} onOpenShare={onOpenShare} />
            ))}
          </div>
        )}
      </div>
      )}

      {/* Liked Events Section */}
      {activeSection === 'liked' && (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
            <Heart className="h-4 w-4 fill-current" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {lang === 'ar' ? `الفعاليات المفضلة (${likedEvents.length})` : `My Liked Events (${likedEvents.length})`}
          </h3>
        </div>

        {likedEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-neutral-900/50 p-8 text-center text-neutral-500 text-sm">
            {lang === 'ar' ? 'لم تعجب بأي فعالية بعد. اضغط على زر القلب في الصفحة الرئيسية!' : 'No liked events yet. Click the heart icon on any party!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {likedEvents.map((ev, idx) => (
              <EventCard key={ev.id} event={ev} index={idx} onOpenMap={onOpenMap} onOpenShare={onOpenShare} />
            ))}
          </div>
        )}
      </div>
      )}
        </div>
      )}

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
