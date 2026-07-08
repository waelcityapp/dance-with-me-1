import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  MapPin, 
  Phone, 
  Calendar, 
  DollarSign, 
  ArrowLeft, 
  Music, 
  Tag,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Lock,
  Check,
  Plus,
  Minus,
  Camera,
  FolderOpen,
  Upload,
  X,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DanceCategory, DanceStyle, ALL_DANCE_STYLES, getStyleLabel } from '../../types';
import { EventPaymentCheckout } from './EventPaymentCheckout';
import { convertCloudStorageUrl, isGoogleDriveUrl, getGoogleDrivePreviewUrl, getSafePlayableVideoUrl } from '../../lib/mediaUtils';
import { FullscreenVideoModal } from './FullscreenVideoModal';

interface CreateEventPageProps {
  onComplete: () => void;
  onCancel?: () => void;
}

export const CreateEventPage: React.FC<CreateEventPageProps> = ({ onComplete, onCancel }) => {
  const { lang, user, addNewEvent, updateEvent, editingEvent, setEditingEvent } = useApp();

  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [titleAr, setTitleAr] = useState(editingEvent ? editingEvent.titleAr : '');
  const [titleEn, setTitleEn] = useState(editingEvent ? editingEvent.titleEn : '');
  const [descAr, setDescAr] = useState(editingEvent ? editingEvent.descriptionAr : '');
  const [descEn, setDescEn] = useState(editingEvent ? editingEvent.descriptionEn : '');
  const [category, setCategory] = useState<DanceCategory>(editingEvent ? editingEvent.category : 'party');
  const [mediaType, setMediaType] = useState<'video' | 'image'>(editingEvent ? editingEvent.mediaType : 'image');
  const [mediaUrl, setMediaUrl] = useState(editingEvent ? editingEvent.mediaUrl : '');
  const [priceAr, setPriceAr] = useState(editingEvent ? editingEvent.priceAr : '250 ج.م');
  const [priceEn, setPriceEn] = useState(editingEvent ? editingEvent.priceEn : '250 EGP');
  const [eventDate, setEventDate] = useState(() => {
    if (editingEvent) {
      try {
        return new Date(editingEvent.eventDate).toISOString().split('T')[0];
      } catch (e) {}
    }
    return new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  });
  const [phone, setPhone] = useState(editingEvent ? editingEvent.contact.phone : (user?.phone || '+201011223344'));
  const [whatsapp, setWhatsapp] = useState(editingEvent ? editingEvent.contact.whatsapp : (user?.phone ? user.phone.replace(/[^0-9]/g, '') : '201011223344'));
  const [locationNameAr, setLocationNameAr] = useState(editingEvent ? editingEvent.location.nameAr : 'أستوديو الرقص - الزمالك');
  const [locationNameEn, setLocationNameEn] = useState(editingEvent ? editingEvent.location.nameEn : 'Dance Studio - Zamalek');
  const [selectedStyles, setSelectedStyles] = useState<DanceStyle[]>(editingEvent ? editingEvent.styles : ['Salsa', 'Bachata']);
  const [position, setPosition] = useState<number>(editingEvent && editingEvent.position !== undefined ? editingEvent.position : 0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFullscreenVideoOpen, setIsFullscreenVideoOpen] = useState(false);
  
  // Cloudinary direct upload state
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState(() => {
    return localStorage.getItem('cloudinary_cloud_name') || 'dt97z8g5z';
  });
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState(() => {
    return localStorage.getItem('cloudinary_upload_preset') || 'dwm_unsigned';
  });
  const [showCloudinarySettings, setShowCloudinarySettings] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCancelClick = () => {
    setEditingEvent(null);
    if (onCancel) {
      onCancel();
    } else {
      onComplete();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (file) {
      setIsUploadingMedia(true);
      setUploadedFileName(file.name);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryUploadPreset);

        const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/${resourceType}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.error?.message || 'Failed to upload to Cloudinary');
        }

        const data = await res.json();
        if (data.secure_url) {
          setMediaUrl(data.secure_url);
        } else {
          throw new Error('No secure URL returned from Cloudinary');
        }
      } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        setUploadError(
          lang === 'ar'
            ? `❌ فشل الرفع إلى كلاوديناري: ${err.message || 'تأكد من إعدادات الحساب ومسبق الرفع'}`
            : `❌ Cloudinary Upload Failed: ${err.message || 'Verify your Cloud Name and Upload Preset'}`
        );
        setUploadedFileName(null);
      } finally {
        setIsUploadingMedia(false);
      }
    }
  };

  // Subscription Plan & Terms State
  const [subscriptionDays, setSubscriptionDays] = useState<number>(7);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'wallet' | 'card'>('instapay');

  // Calculate Subscription Pricing
  const getPriceBreakdown = () => {
    const days = Math.max(7, subscriptionDays);
    const basePrice = 100;
    const extraDays = days - 7;
    const extraPrice = extraDays * 20;
    const subtotal = basePrice + extraPrice;
    const videoSurcharge = mediaType === 'video' ? Math.round(subtotal * 0.2) : 0;
    const total = subtotal + videoSurcharge;
    return {
      days,
      basePrice,
      extraDays,
      extraPrice,
      subtotal,
      videoSurcharge,
      total
    };
  };

  const pricing = getPriceBreakdown();

  const handleProceedToPayment = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!agreedToTerms) return;
    if (!titleAr) setTitleAr(lang === 'ar' ? 'سهرة سالسا وباتشاتا ملكية جديدة' : 'Royal Salsa & Bachata Night');
    if (!titleEn) setTitleEn('Royal Salsa & Bachata Night');
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalPublish = () => {
    const defaultImg = 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80';
    const defaultVid = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

    if (editingEvent) {
      updateEvent({
        ...editingEvent,
        titleAr: titleAr || 'سهرة سالسا وباتشاتا ملكية جديدة',
        titleEn: titleEn || 'Royal Salsa & Bachata Night',
        descriptionAr: descAr || 'انضموا إلينا في سهرة لاتينية فاخرة بمشاركة نخبة المدربين والمحترفين في الوطن العربي.',
        descriptionEn: descEn || 'Join us for an exclusive Latin night with top instructors and professionals from across the region.',
        category: (category === 'all' ? 'party' : category) as any,
        styles: selectedStyles.length > 0 ? selectedStyles : ['Salsa'],
        mediaType,
        mediaUrl: mediaUrl || (mediaType === 'video' ? defaultVid : defaultImg),
        eventDate: new Date(eventDate).toISOString(),
        priceAr,
        priceEn,
        location: {
          ...editingEvent.location,
          nameAr: locationNameAr,
          nameEn: locationNameEn,
        },
        contact: {
          ...editingEvent.contact,
          phone,
          whatsapp,
        },
        position: position !== undefined ? Number(position) : (editingEvent.position || 0)
      });
      setEditingEvent(null);
    } else {
      addNewEvent({
        titleAr: titleAr || 'سهرة سالسا وباتشاتا ملكية جديدة',
        titleEn: titleEn || 'Royal Salsa & Bachata Night',
        descriptionAr: descAr || 'انضموا إلينا في سهرة لاتينية فاخرة بمشاركة نخبة المدربين والمحترفين في الوطن العربي.',
        descriptionEn: descEn || 'Join us for an exclusive Latin night with top instructors and professionals from across the region.',
        category: (category === 'all' ? 'party' : category) as any,
        styles: selectedStyles.length > 0 ? selectedStyles : ['Salsa'],
        mediaType,
        mediaUrl: mediaUrl || (mediaType === 'video' ? defaultVid : defaultImg),
        thumbnailUrl: defaultImg,
        eventDate: new Date(eventDate).toISOString(),
        priceAr,
        priceEn,
        location: {
          nameAr: locationNameAr,
          nameEn: locationNameEn,
          addressAr: 'القاهرة، مصر',
          addressEn: 'Cairo, Egypt',
          googleMapsUrl: 'https://maps.google.com/?q=30.0444,31.2357',
          lat: 30.0444,
          lng: 31.2357
        },
        contact: {
          phone,
          whatsapp,
          organizerName: user?.name || 'إدارة DWM للرقص'
        },
        isFeatured: false,
        isWeeklyPromo: false,
        position: position !== undefined ? Number(position) : 0
      });
    }

    onComplete();
  };

  const toggleStyle = (style: DanceStyle) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  // Format expiration string
  const formatExpirationNotice = () => {
    try {
      const dateObj = new Date(eventDate);
      const dayNameAr = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
      const dateStr = dateObj.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
      const dayNameEn = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStrEn = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

      return lang === 'ar'
        ? `${dayNameAr} ${dateStr} الساعة 11:00 مساءً بتوقيت مصر`
        : `${dayNameEn}, ${dateStrEn} at 11:00 PM Egypt Time`;
    } catch {
      return eventDate;
    }
  };

  if (step === 'payment') {
    return (
      <EventPaymentCheckout
        lang={lang}
        user={user}
        pricing={pricing}
        titleAr={titleAr}
        titleEn={titleEn}
        mediaType={mediaType}
        expirationNotice={formatExpirationNotice()}
        initialPhone={phone}
        category={(category === 'all' ? 'party' : category) as any}
        styles={selectedStyles.length > 0 ? selectedStyles : ['Salsa']}
        mediaUrl={mediaUrl || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80'}
        eventData={{
          titleAr: titleAr || 'سهرة سالسا وباتشاتا ملكية جديدة',
          titleEn: titleEn || 'Royal Salsa & Bachata Night',
          descriptionAr: descAr || 'انضموا إلينا في سهرة لاتينية فاخرة بمشاركة نخبة المدربين والمحترفين في الوطن العربي.',
          descriptionEn: descEn || 'Join us for an exclusive Latin night with top instructors and professionals from across the region.',
          category: (category === 'all' ? 'party' : category) as any,
          styles: selectedStyles.length > 0 ? selectedStyles : ['Salsa'],
          mediaType,
          mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80',
          eventDate: new Date(eventDate).toISOString(),
          priceAr,
          priceEn,
          location: {
            nameAr: locationNameAr,
            nameEn: locationNameEn,
            addressAr: 'القاهرة، مصر',
            addressEn: 'Cairo, Egypt',
            googleMapsUrl: 'https://maps.google.com/?q=30.0444,31.2357',
            lat: 30.0444,
            lng: 31.2357
          },
          contact: {
            phone,
            whatsapp,
            organizerName: user?.name || 'إدارة DWM للرقص'
          },
          isFeatured: false,
          isWeeklyPromo: false
        }}
        onBack={() => {
          setStep('form');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSuccessComplete={handleFinalPublish}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pt-2 pb-36 sm:pb-44" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Welcome Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-neutral-900 via-neutral-900/95 to-amber-950/40 p-6 sm:p-8 shadow-2xl gold-glow relative overflow-hidden mb-8"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shrink-0 overflow-hidden relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex flex-wrap items-center gap-2">
                <span>{lang === 'ar' ? 'أهلاً بك يا' : 'Welcome,'}</span>
                <span className="text-amber-400 border-b-2 border-amber-500/40 pb-0.5">{user?.name || (lang === 'ar' ? 'عضو النادي' : 'Club Member')}</span>
                <span>✨</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 leading-relaxed max-w-xl font-medium">
                {lang === 'ar'
                  ? 'أنت الآن في صفحة إضافة إعلان جديد في منصة Dance With Me. قم بملء البيانات التالية لنشر فعاليتك أو دورتك التدريبية.'
                  : 'You are now creating a new ad on Dance With Me. Fill in the fields below to publish your event or workshop.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelClick}
            className="flex items-center gap-2 rounded-xl bg-neutral-800/90 border border-white/10 px-4 py-2.5 text-xs font-bold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all self-end sm:self-center shrink-0 shadow-md"
          >
            <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span>{lang === 'ar' ? 'عودة للرئيسية' : 'Back to Explore'}</span>
          </button>
        </div>
      </motion.div>

      {/* Main Standalone Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-white/10 bg-neutral-900/90 shadow-2xl p-6 sm:p-8 space-y-8 backdrop-blur-xl"
      >
        <div className="border-b border-white/10 pb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-400" />
            <span>{lang === 'ar' ? 'اختر تصنيف الإعلان' : 'Select Ad Category'}</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {lang === 'ar' ? 'حدد نوع الفعالية لتظهر في القسم المناسب للمستخدمين' : 'Choose event category to appear in the correct section'}
          </p>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { id: 'party', ar: '🎉 حفلة وسهرة', en: '🎉 Party & Social' },
              { id: 'course', ar: '🎓 دورة وكورس', en: '🎓 Dance Course' },
              { id: 'trip', ar: '🌴 رحلة ومعسكر', en: '🌴 Camp & Trip' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id as any)}
                className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all border flex items-center justify-center text-center ${
                  category === cat.id
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-lg gold-glow scale-[1.02]'
                    : 'bg-neutral-950 text-neutral-400 border-white/10 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {lang === 'ar' ? cat.ar : cat.en}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleProceedToPayment} className="space-y-6">
          {/* Title AR / EN */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
              {lang === 'ar' ? '1. عنوان الفعالية' : '1. Event Title'}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === 'ar' ? 'عنوان الإعلان (بالعربية)' : 'Title (Arabic)'} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={e => setTitleAr(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: سهرة سالسا وباتشاتا ملكية على السطح' : 'e.g. Royal Rooftop Salsa Social'}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === 'ar' ? 'عنوان الإعلان (بالإنجليزية)' : 'Title (English)'} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  placeholder="e.g. Royal Rooftop Salsa Social"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Description AR / EN */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
              {lang === 'ar' ? '2. التفاصيل ومواعيد الحضور' : '2. Details & Schedule'}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === 'ar' ? 'الوصف والمميزات (بالعربية)' : 'Description (Arabic)'}
                </label>
                <textarea
                  rows={4}
                  value={descAr}
                  onChange={e => setDescAr(e.target.value)}
                  placeholder={lang === 'ar' ? 'تفاصيل الحفلة، أسماء المدربين، التعليمات، وقواعد اللبس (Dress Code)...' : 'Party details, instructor names, guidelines, dress code...'}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === 'ar' ? 'الوصف والمميزات (بالإنجليزية)' : 'Description (English)'}
                </label>
                <textarea
                  rows={4}
                  value={descEn}
                  onChange={e => setDescEn(e.target.value)}
                  placeholder="Party details, instructor names, guidelines, dress code..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Media Only */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
              {lang === 'ar' ? '3. الوسائط فقط' : '3. Media Only'}
            </h4>

            <div className="space-y-4 bg-neutral-950/60 p-4 sm:p-5 rounded-2xl border border-neutral-800/80">
              <label className="block text-xs font-semibold text-neutral-200 flex items-center justify-between">
                <span>{lang === 'ar' ? 'نوع وسائط البانر (فيديو / صورة):' : 'Banner Media Type (Video / Image):'}</span>
                {mediaType === 'video' && (
                  <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    {lang === 'ar' ? '⚡ يضاف 20% لقيمة الاشتراك للإعلان الفيديو' : '⚡ +20% surcharge for video ads'}
                  </span>
                )}
              </label>

              {/* Media Type Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                    mediaType === 'image' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md' 
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <ImageIcon className="h-4 w-4 text-amber-400" />
                  <span>{lang === 'ar' ? 'صورة إعلانية عالية الجودة' : 'High-Res Image'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                    mediaType === 'video' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md' 
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  <Video className="h-4 w-4 text-amber-400" />
                  <span>{lang === 'ar' ? 'فيديو قصير إعلاني (+20%)' : 'Promo Video Loop (+20%)'}</span>
                </button>
              </div>

              {/* Upload source options */}
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-neutral-300">
                  {lang === 'ar'
                    ? `اختر مصدر تحميل ${mediaType === 'image' ? 'الصورة' : 'الفيديو'} الإعلاني:`
                    : `Select ${mediaType === 'image' ? 'Image' : 'Video'} Source:`}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Camera Option */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/60 hover:bg-neutral-800 transition-all text-left group cursor-pointer shadow-md"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform shadow">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {lang === 'ar' ? 'التقاط من الكاميرا' : 'Capture from Camera'}
                      </span>
                      <span className="block text-[11px] text-neutral-400 font-mono mt-0.5">
                        {lang === 'ar' ? 'تصوير مباشر الآن' : 'Take photo/video now'}
                      </span>
                    </div>
                  </button>

                  {/* File / Studio Option */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/60 hover:bg-neutral-800 transition-all text-left group cursor-pointer shadow-md"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform shadow">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {lang === 'ar' ? 'ملف من الموبايل أو الكمبيوتر' : 'File from Mobile / PC'}
                      </span>
                      <span className="block text-[11px] text-neutral-400 font-mono mt-0.5">
                        {lang === 'ar' ? 'اختر من الاستوديو أو الملفات' : 'Select gallery or folder'}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Uploaded File Confirmation / Preview */}
                {isUploadingMedia && (
                  <div className="mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-400 font-bold">
                    <span className="h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin inline-block shrink-0" />
                    <span>{lang === 'ar' ? 'جاري تحسين وضغط الملف وتحويله لقاعدة البيانات...' : 'Optimizing and processing file...'}</span>
                  </div>
                )}
                {uploadError && (
                  <div className="mt-2 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs text-red-400 font-bold leading-relaxed animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}
                {uploadedFileName && !isUploadingMedia && (
                  <div className="mt-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-emerald-400 font-bold overflow-hidden">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span className="truncate">{lang === 'ar' ? `تم اختيار: ${uploadedFileName}` : `Selected: ${uploadedFileName}`}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaUrl('');
                        setUploadedFileName(null);
                      }}
                      className="text-neutral-400 hover:text-rose-400 font-mono text-[11px] underline shrink-0 transition-colors"
                    >
                      {lang === 'ar' ? 'إزالة' : 'Remove'}
                    </button>
                  </div>
                )}

                {/* Cloudinary Configuration Settings */}
                <div className="mt-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowCloudinarySettings(!showCloudinarySettings)}
                    className="flex items-center justify-between w-full text-xs font-bold text-amber-400 font-mono focus:outline-none"
                  >
                    <span>⚙️ {lang === 'ar' ? 'إعدادات منصة Cloudinary لرفع الميديا' : 'Cloudinary Media Upload Settings'}</span>
                    <span className="text-neutral-500">{showCloudinarySettings ? '▲' : '▼'}</span>
                  </button>

                  {showCloudinarySettings && (
                    <div className="space-y-3 pt-2 text-xs border-t border-white/5 animate-fade-in">
                      <p className="text-neutral-400 leading-relaxed">
                        {lang === 'ar'
                          ? 'يستخدم التطبيق الآن منصة Cloudinary السحابية لرفع الميديا (صور وفيديو) وحفظها سحابياً لضمان تشغيلها الفوري مئة بالمئة على الهواتف والكمبيوتر دون أي قيود على المساحة أو مشكلة الشاشة السوداء.'
                          : 'The application now integrates with Cloudinary to host your images and videos, ensuring high-speed delivery and perfect mobile video decoding without database storage limits.'}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] text-neutral-300 font-semibold mb-1">
                            {lang === 'ar' ? 'اسم السحابة (Cloud Name):' : 'Cloud Name:'}
                          </label>
                          <input
                            type="text"
                            value={cloudinaryCloudName}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              setCloudinaryCloudName(val);
                              localStorage.setItem('cloudinary_cloud_name', val);
                            }}
                            placeholder="e.g. dt97z8g5z"
                            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 font-mono text-[11px] text-white outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-neutral-300 font-semibold mb-1">
                            {lang === 'ar' ? 'مسبق الرفع غير الموقع (Upload Preset):' : 'Unsigned Upload Preset:'}
                          </label>
                          <input
                            type="text"
                            value={cloudinaryUploadPreset}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              setCloudinaryUploadPreset(val);
                              localStorage.setItem('cloudinary_upload_preset', val);
                            }}
                            placeholder="e.g. dwm_unsigned"
                            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 font-mono text-[11px] text-white outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      
                      <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[10.5px] text-neutral-400 leading-relaxed space-y-1">
                        <p className="font-bold text-amber-400">💡 {lang === 'ar' ? 'كيف تحصل على حساب كلاوديناري مجاني في دقيقة؟' : 'How to get a free Cloudinary account?'}</p>
                        <p>
                          {lang === 'ar'
                            ? '1. سجل في cloudinary.com مجاناً. | 2. انسخ الـ Cloud Name الخاص بك وضعه هنا. | 3. اذهب إلى Settings -> Upload -> Upload Presets، وقم بإضافة مسبق رفع جديد واجعل وضعه (Unsigned)، ثم انسخ اسمه وضعه هنا لترفع عليه وسائط إعلاناتك مباشرة!'
                            : '1. Sign up for free at cloudinary.com. | 2. Copy your Cloud Name and paste it above. | 3. Go to Settings -> Upload -> Upload Presets, add a new preset, set its signing mode to "Unsigned", and copy its name here.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* URL fallback & Preview */}
              <div className="pt-2 border-t border-white/5">
                <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                  {lang === 'ar' ? 'أو أدخل رابط ميديا مباشر (اختياري):' : 'Or enter direct Media URL (optional):'}
                </label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={e => {
                    setMediaUrl(e.target.value.trim());
                    if (uploadedFileName) setUploadedFileName(null);
                  }}
                  placeholder={lang === 'ar' ? 'https://example.com/image.jpg أو رابط فيديو mp4 مباشر' : 'https://example.com/image.jpg or direct video mp4'}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 px-3 text-xs font-mono text-white outline-none focus:border-amber-500 transition-colors"
                />
                {mediaUrl && (mediaUrl.includes('docs.google.com/uc') || mediaUrl.includes('raw=1') || mediaUrl.includes('dl=1')) && (
                  <p className="mt-1.5 text-[10px] text-amber-400 font-bold flex items-center gap-1 leading-relaxed">
                    <span>✨</span>
                    <span>
                      {lang === 'ar' 
                        ? 'تم كشف وتحويل رابط التخزين السحابي (Google Drive / Dropbox) تلقائياً لرابط تشغيل مباشر متوافق!' 
                        : 'Cloud storage link (Google Drive / Dropbox) detected and converted automatically to a direct stream URL!'}
                    </span>
                  </p>
                )}
              </div>

              {/* Visual Media Preview */}
              {mediaUrl && (
                <div className="mt-3 relative rounded-2xl overflow-hidden border border-amber-500/30 bg-neutral-900/90 p-2 shadow-xl">
                  <div className="text-[11px] font-mono text-amber-400 mb-2 flex items-center justify-between px-1">
                    <span>{lang === 'ar' ? '👁️ معاينة الوسائط المختارة:' : '👁️ Media Preview:'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaUrl('');
                        setUploadedFileName(null);
                      }}
                      className="text-neutral-400 hover:text-rose-400 text-xs transition-colors flex items-center gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'حذف' : 'Clear'}</span>
                    </button>
                  </div>
                  {mediaType === 'image' ? (
                    <img src={mediaUrl} alt="Ad Preview" className="w-full h-44 sm:h-56 object-contain rounded-xl bg-neutral-950 border border-white/5" />
                  ) : (
                    <div className="relative group/vidpreview">
                      <video src={getSafePlayableVideoUrl(mediaUrl)} controls className="w-full h-44 sm:h-56 object-contain rounded-xl bg-neutral-950 border border-white/5" />
                      <button
                        type="button"
                        onClick={() => setIsFullscreenVideoOpen(true)}
                        className="absolute top-2 right-2 z-10 flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-full bg-neutral-950/80 text-white border border-neutral-800 hover:bg-amber-500 hover:text-neutral-950 transition-all shadow-lg backdrop-blur-md text-[10px] font-semibold"
                        title={lang === 'ar' ? 'معاينة بملء الشاشة' : 'View Full Screen'}
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'معاينة بملء الشاشة' : 'Full Screen'}</span>
                      </button>
                    </div>
                  )}

                  {/* Fullscreen Video Modal for ultimate player experience */}
                  <FullscreenVideoModal
                    isOpen={isFullscreenVideoOpen}
                    onClose={() => setIsFullscreenVideoOpen(false)}
                    videoUrl={mediaUrl}
                    titleAr={titleAr || undefined}
                    titleEn={titleEn || undefined}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Dance Styles */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
              {lang === 'ar' ? '4. أنماط الرقص المتضمنة' : '4. Included Dance Styles'}
            </h4>
            <div className="bg-neutral-950/60 p-4 sm:p-5 rounded-2xl border border-neutral-800/80 space-y-2">
              <label className="block text-xs font-semibold text-neutral-200">
                {lang === 'ar' ? 'اختر نمط أو أكثر لسهولة تصنيف الإعلان والوصول إليه:' : 'Select one or more styles for easy filtering:'}
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {ALL_DANCE_STYLES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-mono transition-all flex items-center gap-1.5 ${
                      selectedStyles.includes(s)
                        ? 'bg-amber-500 text-neutral-950 border border-amber-400 font-extrabold shadow-md gold-glow scale-105'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <Music className="h-3 w-3 shrink-0" />
                    <span>#{getStyleLabel(s, lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date, Price, Contact & Location */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
              {lang === 'ar' ? '5. الموعد، التذاكر، والموقع' : '5. Date, Tickets & Venue'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  <span>{lang === 'ar' ? 'تاريخ الفعالية' : 'Event Date'}</span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm font-mono text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                  <span>{lang === 'ar' ? 'سعر التذكرة / الاشتراك' : 'Ticket / Course Price'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={priceAr}
                    onChange={e => setPriceAr(e.target.value)}
                    placeholder="250 ج.م"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-3 text-xs sm:text-sm font-mono text-white outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={priceEn}
                    onChange={e => setPriceEn(e.target.value)}
                    placeholder="250 EGP"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-3 text-xs sm:text-sm font-mono text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Special Expiration Notice Box */}
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-amber-300 block">
                  {lang === 'ar' ? '⚡ قاعدة انتهاء ظهور الإعلان:' : '⚡ Ad Auto-Expiration Rule:'}
                </span>
                <p className="text-neutral-300 leading-relaxed font-medium">
                  {lang === 'ar' 
                    ? `ينتهي ظهور هذا الإعلان في مساء يوم الحدث الموافق (${formatExpirationNotice()}) أو بانتهاء مدة الاشتراك المحجوزة أيهما أقرب.`
                    : `This ad will expire on the evening of the event date (${formatExpirationNotice()}) or at the end of your booked subscription duration.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  <span>{lang === 'ar' ? 'اسم المكان / الأستوديو (بالعربية)' : 'Venue Name (Arabic)'}</span>
                </label>
                <input
                  type="text"
                  value={locationNameAr}
                  onChange={e => setLocationNameAr(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  <span>{lang === 'ar' ? 'اسم المكان / الأستوديو (بالإنجليزية)' : 'Venue Name (English)'}</span>
                </label>
                <input
                  type="text"
                  value={locationNameEn}
                  onChange={e => setLocationNameEn(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-amber-400" />
                  <span>{lang === 'ar' ? 'رقم الهاتف للاستفسار' : 'Contact Phone'}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm font-mono text-white outline-none focus:border-amber-500 text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-green-400" />
                  <span>{lang === 'ar' ? 'رقم الواتساب للحجز المباشر' : 'WhatsApp Number'}</span>
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm font-mono text-white outline-none focus:border-amber-500 text-left"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: Subscription Plan & Dynamic Calculation */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase flex items-center justify-between">
              <span>{lang === 'ar' ? '6. نظام ومدة الاشتراك (Ad Subscription Plan)' : '6. Ad Subscription Plan'}</span>
              <span className="text-xs text-neutral-400 font-sans font-normal">
                {lang === 'ar' ? 'أقل مدة اشتراك أسبوع (7 أيام)' : 'Min. 1 Week (7 Days)'}
              </span>
            </h4>

            <div className="rounded-3xl bg-neutral-950/90 border border-neutral-800 p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-white mb-1">
                    {lang === 'ar' ? 'اختر مدة اشتراك الإعلان (بالأيام):' : 'Select Ad Duration (in Days):'}
                  </label>
                  <p className="text-xs text-neutral-400">
                    {lang === 'ar'
                      ? 'الأسبوع الأول 7 أيام بقيمة 100 ج.م، وكل يوم إضافي بزيادة 20 ج.م'
                      : 'First 7 days for 100 EGP, each extra day is +20 EGP'}
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 p-1.5 rounded-2xl self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setSubscriptionDays(Math.max(7, subscriptionDays - 1))}
                    disabled={subscriptionDays <= 7}
                    className="h-10 w-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="px-4 text-center">
                    <span className="text-base sm:text-lg font-mono font-extrabold text-amber-400">{subscriptionDays}</span>
                    <span className="text-xs text-neutral-400 block font-mono">{lang === 'ar' ? 'أيام' : 'Days'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubscriptionDays(subscriptionDays + 1)}
                    className="h-10 w-10 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center justify-center transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Pricing Breakdown Card */}
              <div className="rounded-2xl bg-neutral-900/80 border border-white/5 p-4 space-y-2.5 text-xs sm:text-sm font-medium">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>{lang === 'ar' ? 'تكلفة الأسبوع الأساسي (7 أيام):' : 'Base 7-Day Fee:'}</span>
                  <span className="font-mono font-bold">{pricing.basePrice} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>

                {pricing.extraDays > 0 && (
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>{lang === 'ar' ? `تكلفة الأيام الإضافية (${pricing.extraDays} يوم × 20 ج.م):` : `Extra Days (${pricing.extraDays} days × 20 EGP):`}</span>
                    <span className="font-mono font-bold">+{pricing.extraPrice} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                  </div>
                )}

                {pricing.videoSurcharge > 0 && (
                  <div className="flex justify-between items-center text-amber-300 py-1 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'إضافة إعلان فيديو (+20% على القيمة):' : 'Video Surcharge (+20% of subtotal):'}</span>
                    </span>
                    <span className="font-mono font-bold">+{pricing.videoSurcharge} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-amber-500/20 text-base sm:text-lg font-extrabold text-amber-400">
                  <span>{lang === 'ar' ? 'إجمالي قيمة اشتراك الإعلان:' : 'Total Ad Subscription Fee:'}</span>
                  <span className="font-mono bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-xl">
                    {pricing.total} {lang === 'ar' ? 'جنيه مصري (EGP)' : 'EGP'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ad Placement Number (Sequence position) */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
              {lang === 'ar' ? 'ترتيب الإعلان في الصفحة (رقم الترتيب)' : 'Ad Placement Position (Order Number)'}
            </h4>
            <div className="rounded-2xl bg-neutral-950 p-5 border border-neutral-800/80 space-y-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                {lang === 'ar' ? 'حدد رقم ترتيب الإعلان لتحديد مكان ظهوره (مثال: رقم 1 يظهر أولاً، رقم 2 يظهر ثانياً، وهكذا)' : 'Specify the position number to determine where this ad appears (e.g. 1 appears first, 2 appears second, etc.)'}
              </label>
              <input
                type="number"
                min="1"
                value={position || ''}
                onChange={e => setPosition(e.target.value ? Number(e.target.value) : 0)}
                placeholder={lang === 'ar' ? 'مثال: 1' : 'e.g. 1'}
                className="w-full sm:w-48 rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner font-mono"
              />
            </div>
          </div>

          {/* SECTION 7: Terms & Conditions Agreement & Checkbox */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase flex items-center justify-between">
              <span>{lang === 'ar' ? '7. اتفاقية الاستخدام والشروط والأحكام الخاصة بمنصة "Dance with me"' : '7. Terms & Conditions of "Dance with me" Platform'}</span>
              <span className="text-xs text-neutral-400 font-sans font-normal">
                {lang === 'ar' ? 'يرجى التمرير والقراءة بعناية' : 'Please scroll & read carefully'}
              </span>
            </h4>

            {/* Scrollable Terms Container */}
            <div className="max-h-64 overflow-y-auto p-4 sm:p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800/80 text-xs sm:text-sm text-neutral-300 space-y-3.5 leading-relaxed font-sans shadow-inner">
              {lang === 'ar' ? (
                <div className="space-y-3">
                  <div className="font-bold text-amber-400 border-b border-white/10 pb-2">
                    اتفاقية الاستخدام والشروط والأحكام الخاصة بمنصة "Dance with me"
                  </div>
                  <div>
                    <span className="font-bold text-white block mb-0.5">تمهيد:</span>
                    <p className="text-neutral-300">
                      تُعد منصة "Dance with me" وسيطاً تقنياً يهدف إلى تقديم خدمات الإعلانات في مجال الفنون. بدخولك إلى التطبيق واستخدام خدماتنا، فإنك توافق بشكل صريح على الالتزام الكامل بهذه الشروط والأحكام.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">1. الامتثال القانوني والتشريعي:</span>
                    <p className="text-neutral-300">
                      يقر المستخدم بأن كافة الأنشطة والخدمات المنشورة عبر المنصة تتوافق كلياً مع القوانين والتشريعات السارية في جمهورية مصر العربية، بما في ذلك قوانين مكافحة جرائم تقنية المعلومات، وقوانين حماية البيانات، وحقوق الملكية الفكرية، كما يؤكد التزامه التام بالأعراف والآداب العامة المتبعة في المجتمع المصري.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-1">2. سياسة الإعلانات والرسوم:</span>
                    <ul className="list-disc list-inside space-y-1.5 pr-2 text-neutral-300">
                      <li><strong className="text-white">رفض الإعلان:</strong> تلتزم المنصة بإعادة قيمة المبلغ المدفوع في حال رفضها لنشر الإعلان، وذلك دون الحاجة لإبداء أي أسباب تقتضيها سياسة المنصة للحفاظ على جودة المحتوى.</li>
                      <li><strong className="text-white">حذف الإعلان:</strong> لا يحق لصاحب الإعلان المطالبة بأي مبالغ مالية أو تعويضات في حال قام بحذف إعلانه طواعية قبل انتهاء المدة المتفق عليها.</li>
                      <li><strong className="text-white">تعديل الإعلان:</strong> لا يحق للمستخدم إجراء أي تعديلات على الإعلان بعد نشره إلا بعد الرجوع للمنصة والحصول على الموافقة الرسمية، ويُسمح بالتعديل لمرة واحدة فقط طوال فترة عرض الإعلان.</li>
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">3. الأمن السيبراني والأنشطة المحظورة:</span>
                    <p className="text-neutral-300">
                      في حال احتواء الإعلان على أي روابط مشبوهة، أو برمجيات خبيثة، أو محاولات اختراق (تهكير)، أو أي أنشطة تثير الشبهات في هذا السياق، يحق للمنصة حذف الإعلان فوراً دون أي تعويضات لصاحب الإعلان. كما يحق للمنصة في هذه الحالة حذف حساب المعلن نهائياً وحظره من استخدام المنصة، مع احتفاظ المنصة بحقها الكامل في اتخاذ الإجراءات القانونية اللازمة ضد صاحب الحساب.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">4. ملكية المحتوى والمسؤولية:</span>
                    <p className="text-neutral-300">
                      يقر المستخدم بأن كافة المواد (صور، فيديوهات، نصوص) المنشورة عبر حسابه هي ملكية خاصة له أو يمتلك تصريحاً قانونياً بنشرها. كما يتحمل المستخدم المسؤولية الكاملة عن صحة ودقة البيانات المدرجة.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">5. المحتوى المحظور:</span>
                    <p className="text-neutral-300">
                      يُحظر نشر أي محتوى يحرض على العنف أو الكراهية، أو أي محتوى منافٍ للآداب العامة، أو إعلانات لخدمات غير مرخصة، أو القيام بأي محاولات احتيال تقني أو مالي.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">6. صلاحيات المنصة:</span>
                    <p className="text-neutral-300">
                      تحتفظ منصة "Dance with me" بالحق الكامل في مراجعة، تعديل، إيقاف، أو حذف أي إعلان تراه مخالفاً لهذه الشروط أو القوانين المعمول بها في جمهورية مصر العربية دون سابق إنذار.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">7. حدود المسؤولية:</span>
                    <p className="text-neutral-300">
                      تعمل المنصة كطرف ثالث (وسيط تقني)، ولا تتحمل أي مسؤولية قانونية أو مالية عن الاتفاقات أو المعاملات التي تتم بين المستخدمين بشكل مباشر.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">8. القانون الواجب التطبيق:</span>
                    <p className="text-neutral-300">
                      تخضع هذه الاتفاقية وتُفسر وفقاً للقوانين والتشريعات المعمول بها في جمهورية مصر العربية، وتختص المحاكم المصرية وحدها بالنظر في أي نزاع ينشأ عنها.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="font-bold text-amber-400 border-b border-white/10 pb-2">
                    Terms and Conditions of "Dance with me" Platform
                  </div>
                  <div>
                    <span className="font-bold text-white block mb-0.5">Preamble:</span>
                    <p className="text-neutral-300">
                      The "Dance with me" platform acts as a technical intermediary aimed at providing advertising services in the arts sector. By entering the app and using our services, you explicitly agree to fully comply with these terms and conditions.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">1. Legal and Regulatory Compliance:</span>
                    <p className="text-neutral-300">
                      The user acknowledges that all activities and services published through the platform fully comply with the laws and regulations applicable in the Arab Republic of Egypt, including cybercrime laws, data protection laws, and intellectual property rights, and confirms total adherence to the customs and public morals observed in Egyptian society.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-1">2. Advertising and Fee Policy:</span>
                    <ul className="list-disc list-inside space-y-1.5 pl-2 text-neutral-300">
                      <li><strong className="text-white">Ad Rejection:</strong> The platform commits to refunding the amount paid in case it rejects publishing the ad, without the need to state reasons required by the platform's policy to maintain content quality.</li>
                      <li><strong className="text-white">Ad Deletion:</strong> The ad owner has no right to claim any financial amounts or compensation if they voluntarily delete their ad before the end of the agreed period.</li>
                      <li><strong className="text-white">Ad Modification:</strong> The user has no right to make any modifications to the ad after publication except after referring to the platform and obtaining official approval, and modification is allowed only once throughout the display period of the ad.</li>
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">3. Cybersecurity and Prohibited Activities:</span>
                    <p className="text-neutral-300">
                      In case the ad contains any suspicious links, malicious software, hacking attempts, or any activities raising suspicion in this context, the platform has the right to delete the ad immediately without any compensation to the ad owner. The platform also has the right in this case to permanently delete the advertiser's account and ban them from using the platform, while reserving its full right to take necessary legal action against the account owner.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">4. Content Ownership and Responsibility:</span>
                    <p className="text-neutral-300">
                      The user acknowledges that all materials (images, videos, texts) published through their account are their private property or they have legal permission to publish them. The user also bears full responsibility for the validity and accuracy of the listed data.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">5. Prohibited Content:</span>
                    <p className="text-neutral-300">
                      It is strictly prohibited to publish any content inciting violence or hatred, or any content contrary to public morals, or ads for unlicensed services, or attempting any technical or financial fraud.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">6. Platform Powers:</span>
                    <p className="text-neutral-300">
                      The "Dance with me" platform reserves the full right to review, modify, suspend, or delete any ad it considers violating these terms or applicable laws in the Arab Republic of Egypt without prior notice.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">7. Limitation of Liability:</span>
                    <p className="text-neutral-300">
                      The platform acts as a third party (technical intermediary) and bears no legal or financial responsibility for agreements or transactions conducted directly between users.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">8. Governing Law:</span>
                    <p className="text-neutral-300">
                      This agreement is governed by and interpreted in accordance with the laws and regulations applicable in the Arab Republic of Egypt, and Egyptian courts alone have jurisdiction over any dispute arising therefrom.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox */}
            <label 
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className="flex items-start gap-3.5 p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800/80 hover:border-amber-500/40 cursor-pointer transition-all select-none"
            >
              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                agreedToTerms 
                  ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow-md gold-glow' 
                  : 'bg-neutral-900 border-neutral-700 text-transparent'
              }`}>
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <div className="text-xs sm:text-sm leading-relaxed text-neutral-200">
                <span className="font-bold text-white block mb-1">
                  {lang === 'ar'
                    ? 'أقر بأنني اطلعت على جميع الشروط والأحكام الخاصة بالنشر على منصة Dance with me، وأتعهد بالالتزام بها وبكافة التشريعات والقوانين والأعراف المتبعة في جمهورية مصر العربية، وأوافق عليها جميعاً دون أي تحفظ.'
                    : 'I acknowledge that I have read all the terms and conditions for publishing on the Dance with me platform, commit to abide by them and all laws and customs observed in the Arab Republic of Egypt, and agree to all of them without reservation.'}
                </span>
                <span className="text-neutral-400 text-xs block mt-1">
                  {lang === 'ar'
                    ? `تنويه: الإعلان ينتهي مساء يوم الحدث (${formatExpirationNotice()})، وإجمالي المطلوب دفعه هو (${pricing.total} ج.م).`
                    : `Notice: This ad expires on the evening of the event date (${formatExpirationNotice()}), with a total payable amount of (${pricing.total} EGP).`}
                </span>
              </div>
            </label>
          </div>

          {/* Proceed to Payment or Re-publish Button Section */}
          <div className="pt-6 pb-12 sm:pb-16">
            <motion.button
              whileHover={agreedToTerms ? { scale: 1.01 } : {}}
              whileTap={agreedToTerms ? { scale: 0.98 } : {}}
              type="button"
              onClick={editingEvent ? handleFinalPublish : handleProceedToPayment}
              disabled={!agreedToTerms}
              className={`w-full rounded-2xl py-4 sm:py-5 px-6 text-base sm:text-lg font-extrabold transition-all flex items-center justify-center gap-3 border ${
                agreedToTerms
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-2xl gold-glow border-amber-300/40 cursor-pointer'
                  : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
              }`}
            >
              <Sparkles className={`h-6 w-6 shrink-0 ${agreedToTerms ? 'fill-current animate-spin-slow text-neutral-950' : 'text-neutral-600'}`} />
              <span>
                {editingEvent ? (
                  lang === 'ar' 
                    ? 'أعد النشر وحفظ التعديلات' 
                    : 'Re-publish and Save Changes'
                ) : (
                  lang === 'ar' 
                    ? `الانتقال إلى صفحة الدفع (${pricing.total} ج.م)` 
                    : `Proceed to Payment (${pricing.total} EGP)`
                )}
              </span>
            </motion.button>
            
            {!agreedToTerms && (
              <p className="mt-3 text-center text-xs text-amber-400/80 font-medium">
                {lang === 'ar' 
                  ? '⚠️ يرجى الموافقة على الشروط والأحكام أعلاه لتفعيل زر الحفظ والنشر'
                  : '⚠️ Please agree to the publishing terms and conditions above to unlock save step'}
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

