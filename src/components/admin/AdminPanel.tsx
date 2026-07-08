import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Phone, 
  Eye, 
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
  Search,
  Ban,
  ShieldCheck,
  ShieldAlert,
  Image as ImageIcon,
  Database,
  Server,
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
  Key
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdSubmission, DanceEvent, UserProfile } from '../../types';
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
  subscribeToSecurityViolations
} from '../../lib/firebase';

export const AdminPanel: React.FC = () => {
  const { lang, setActiveTab, user, addNewEvent, events, deleteEvent, notifications, supportMessages, replyToSupportMessage, cleanUpDuplicateAds } = useApp();
  const [submissions, setSubmissions] = useState<AdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'archived'>('pending');
  const [supportFilter, setSupportFilter] = useState<'all' | 'pending' | 'replied'>('pending');
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminSection, setAdminSection] = useState<'submissions' | 'database' | 'support' | 'users' | 'security' | null>(null);
  const [dbSubTab, setDbSubTab] = useState<'events' | 'submissions' | 'notifications' | 'schema'>('events');
  const [selectedJsonDoc, setSelectedJsonDoc] = useState<{ id: string; title: string; data: any } | null>(null);
  
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usersSubTab, setUsersSubTab] = useState<'search' | 'all'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

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

  const filteredUsers = allUsers.filter(u => {
    const query = userSearchQuery.trim().toLowerCase();
    if (!query) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const password = (u.password || '').toLowerCase();
    return name.includes(query) || email.includes(query) || password.includes(query);
  });

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((users) => {
      setAllUsers(users);
    });
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

    const unsubscribe = subscribeToAdSubmissions((list) => {
      mergeAndSet(list);
    });
    return () => unsubscribe();
  }, []);

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
      project: 'eighth-fuze-l6d0h',
      firestoreDbId: 'ai-studio-dancewithme-3e67ba5d-19d9-4888-a2ba-3c431d39465d',
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
              'bg-purple-500/10 border border-purple-500/30 text-purple-400'
            }`}>
              {adminSection === 'submissions' && <Crown className="h-6 w-6" />}
              {adminSection === 'database' && <Database className="h-6 w-6 animate-pulse" />}
              {adminSection === 'support' && <MessageSquare className="h-6 w-6" />}
              {adminSection === 'users' && <Users className="h-6 w-6" />}
              {adminSection === 'security' && <ShieldAlert className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {adminSection === 'submissions' && (lang === 'ar' ? '📋 مراجعة طلبات الإعلانات VIP' : '📋 VIP Ad Submissions')}
                {adminSection === 'database' && (lang === 'ar' ? '🗄️ مستكشف قاعدة البيانات المباشر (Firestore)' : '🗄️ Live Database Inspector (Firestore)')}
                {adminSection === 'support' && (lang === 'ar' ? '💬 صندوق رسائل ومقترحات التطبيق' : '💬 Support Messages & Feedback')}
                {adminSection === 'users' && (lang === 'ar' ? '👥 إدارة ومراقبة مستخدمي التطبيق' : '👥 App Users Management')}
                {adminSection === 'security' && (lang === 'ar' ? '🔒 إدارة الأمان وجدار الحماية وسجلات الاختراق' : '🔒 Security Firewall & Violation Logs')}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {adminSection === 'submissions' && (lang === 'ar' ? 'مراجعة وتفعيل الإعلانات الفاخرة وتتبع إيصالات التحويل البنكي.' : 'Manage premium ad campaigns, analyze bank receipts, and activate VIP slots.')}
                {adminSection === 'database' && (lang === 'ar' ? 'استعراض البيانات والفعاليات والإشعارات وحذف المخلفات بشكل مباشر.' : 'Real-time viewer of live Firestore collections, schemas, and events.')}
                {adminSection === 'support' && (lang === 'ar' ? 'التواصل المباشر وحل المشاكل التقنية للأعضاء وإرسال الردود الرسمية.' : 'Read user feedback and inquiries directly and send notifications.')}
                {adminSection === 'users' && (lang === 'ar' ? 'البحث عن الحسابات بالأرقام السرية أو الإيميل، تجميد أو حذف الأعضاء.' : 'Audit member profiles, passwords, registration dates, suspend or delete records.')}
                {adminSection === 'security' && (lang === 'ar' ? 'تغيير العبارة السرية، مراقبة محاولات الاختراق، عناوين الـ IP للمهاجمين، وإعداد بلاغات أمنية.' : 'Update VIP secret code, monitor unauthorized access logs, block IPs, and prepare security reports.')}
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
            className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-r from-neutral-900 via-neutral-900/95 to-amber-950/40 p-6 sm:p-8 shadow-2xl gold-glow relative overflow-hidden"
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

          {/* Categories Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card 1: Submissions */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setAdminSection('submissions');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-3xl border-2 border-amber-500/30 hover:border-amber-400 bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/20 p-6 shadow-xl hover:shadow-amber-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
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
              className="rounded-3xl border-2 border-blue-500/30 hover:border-blue-400 bg-gradient-to-br from-neutral-900 via-neutral-900 to-blue-950/20 p-6 shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
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
              className="rounded-3xl border-2 border-emerald-500/30 hover:border-emerald-400 bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/20 p-6 shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
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
              className="rounded-3xl border-2 border-purple-500/30 hover:border-purple-400 bg-gradient-to-br from-neutral-900 via-neutral-900 to-purple-950/20 p-6 shadow-xl hover:shadow-purple-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
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
              className="rounded-3xl border-2 border-red-500/30 hover:border-red-400 bg-gradient-to-br from-neutral-900 via-neutral-900 to-red-950/20 p-6 shadow-xl hover:shadow-red-500/5 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-64"
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
          </div>
        </div>
      )}

      {adminSection === 'database' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Firebase Connection Card */}
          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900 to-blue-950/40 p-6 shadow-xl">
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
                    <span>Project ID: <strong className="text-blue-300 select-all">eighth-fuze-l6d0h</strong></span>
                    <span>Database ID: <strong className="text-blue-300 select-all">ai-studio-dancewithme-3e67ba5d-19d9-4888-a2ba-3c431d39465d</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <a
                  href="https://console.firebase.google.com/project/eighth-fuze-l6d0h/firestore/databases/ai-studio-dancewithme-3e67ba5d-19d9-4888-a2ba-3c431d39465d/data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer border border-blue-400/30"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'فتح في كونسول Firebase الرسمي 🚀' : 'Open Firebase Console 🚀'}</span>
                </a>

                <a
                  href="https://console.cloud.google.com/firestore/databases/ai-studio-dancewithme-3e67ba5d-19d9-4888-a2ba-3c431d39465d/data?project=eighth-fuze-l6d0h"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-all border border-white/10"
                >
                  <ExternalLink className="h-4 w-4 text-neutral-400" />
                  <span>{lang === 'ar' ? 'Google Cloud Console ☁️' : 'Cloud Console ☁️'}</span>
                </a>

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
                <CheckCircle2 className="h-3.5 w-3.5" />
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

              <div className="text-xs text-neutral-400 font-mono flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800/60 sm:border-transparent sm:bg-transparent">
                <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
                <span>{lang === 'ar' ? 'تحديث تلقائي لحظي' : 'Live Firebase Sync'}</span>
              </div>
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
                    <span>{lang === 'ar' ? 'عنوان الإعلان الفاخر:' : 'Ad Title:'}</span>
                  </span>
                  <span className="text-sm font-bold text-white block truncate">
                    {lang === 'ar' ? sub.titleAr : sub.titleEn}
                  </span>
                  <span className="text-xs text-amber-300 font-medium block">
                    {sub.pricing?.days || 3} {lang === 'ar' ? 'أيام ترويج VIP' : 'Days VIP Promo'}
                  </span>
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
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/40 p-6 shadow-xl">
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
                            <CheckCircle2 className="h-3.5 w-3.5" />
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
                          <CheckCircle2 className="h-3.5 w-3.5" />
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
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900 to-purple-950/40 p-6 shadow-xl">
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
            {filteredUsers.length === 0 ? (
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
                      const isOwner = u.email?.trim().toLowerCase() === 'waelvts@gmail.com';
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
    </div>
  );
};