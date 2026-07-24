import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Image as ImageIcon, Video, Calendar as CalendarIcon, 
  MapPin, Phone, MessageCircle, FileText, CheckCircle2, ChevronRight, UploadCloud, AlertCircle,
  Languages, Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DanceCategory, DanceStyle, ALL_DANCE_STYLES, getStyleLabel } from '../../types';
import { compressImage, uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';
import { saveEventToFirestore, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { AdSubmission } from '../../types';

interface AdminEditEventPageProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const AdminEditEventPage: React.FC<AdminEditEventPageProps> = ({ onComplete, onCancel }) => {
  const { lang, updateEvent, addNewEvent, editingEvent, events } = useApp();
  
  const currentDisplayIndex = editingEvent ? events.findIndex(e => e.id === editingEvent.id) + 1 : 0;
  const initialPosition = editingEvent?.position && editingEvent.position > 0 
    ? editingEvent.position 
    : currentDisplayIndex;

  const [titleAr, setTitleAr] = useState(editingEvent?.titleAr || '');
  const [titleEn, setTitleEn] = useState(editingEvent?.titleEn || '');
  const [descAr, setDescAr] = useState(editingEvent?.descriptionAr || '');
  const [descEn, setDescEn] = useState(editingEvent?.descriptionEn || '');
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

  const [category, setCategory] = useState<DanceCategory>(editingEvent?.category || 'party');
  const [mediaType, setMediaType] = useState<'video' | 'image'>(editingEvent?.mediaType || 'image');
  const [mediaUrl, setMediaUrl] = useState(editingEvent?.mediaUrl || '');
  const [eventDate, setEventDate] = useState(() => {
    if (editingEvent?.eventDate) {
      try {
        return new Date(editingEvent.eventDate).toISOString().split('T')[0];
      } catch (e) {
        return '';
      }
    }
    return '';
  });
  const [priceAr, setPriceAr] = useState(editingEvent?.priceAr || '');
  const [priceEn, setPriceEn] = useState(editingEvent?.priceEn || '');
  
  const [organizerName, setOrganizerName] = useState(
    editingEvent?.contact?.organizerName || (editingEvent as any)?.organizerName || ''
  );
  const [phone, setPhone] = useState(editingEvent?.contact?.phone || '');
  const [whatsapp, setWhatsapp] = useState(editingEvent?.contact?.whatsapp || '');
  const [locationNameAr, setLocationNameAr] = useState(editingEvent?.location?.nameAr || '');
  const [locationNameEn, setLocationNameEn] = useState(editingEvent?.location?.nameEn || '');
  const [addressAr, setAddressAr] = useState(editingEvent?.location?.addressAr || '');
  const [addressEn, setAddressEn] = useState(editingEvent?.location?.addressEn || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(editingEvent?.location?.googleMapsUrl || '');
  const [selectedStyles, setSelectedStyles] = useState<DanceStyle[]>(editingEvent?.styles || []);
  const [position, setPosition] = useState<number | ''>(initialPosition);
  const [adNumber, setAdNumber] = useState<string>(editingEvent?.adNumber || '');
  const [adType, setAdType] = useState<'vip' | 'standard'>(editingEvent?.adType || 'standard');
  const [isFeatured, setIsFeatured] = useState<boolean>(editingEvent?.isFeatured || false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingEvent) {
      onCancel();
      return;
    }
    setTitleAr(editingEvent.titleAr || '');
    setTitleEn(editingEvent.titleEn || '');
    setDescAr(editingEvent.descriptionAr || '');
    setDescEn(editingEvent.descriptionEn || '');
    setCategory(editingEvent.category || 'party');
    setMediaType(editingEvent.mediaType || 'image');
    setMediaUrl(editingEvent.mediaUrl || '');
    try {
      if (editingEvent.eventDate) {
        setEventDate(new Date(editingEvent.eventDate).toISOString().split('T')[0]);
      } else {
        setEventDate('');
      }
    } catch(e) {
      setEventDate('');
    }
    setPriceAr(editingEvent.priceAr || '');
    setPriceEn(editingEvent.priceEn || '');
    setOrganizerName(editingEvent.contact?.organizerName || (editingEvent as any)?.organizerName || '');
    setPhone(editingEvent.contact?.phone || '');
    setWhatsapp(editingEvent.contact?.whatsapp || '');
    setLocationNameAr(editingEvent.location?.nameAr || '');
    setLocationNameEn(editingEvent.location?.nameEn || '');
    setAddressAr(editingEvent.location?.addressAr || '');
    setAddressEn(editingEvent.location?.addressEn || '');
    setGoogleMapsUrl(editingEvent.location?.googleMapsUrl || '');
    setSelectedStyles(editingEvent.styles || []);
    setPosition(editingEvent.position && editingEvent.position > 0 ? editingEvent.position : currentDisplayIndex);
    setAdNumber(editingEvent.adNumber || '');
    setAdType(editingEvent.adType || 'standard');
    setIsFeatured(editingEvent.isFeatured || false);
  }, [editingEvent, onCancel]);

  const handleStyleToggle = (style: DanceStyle) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security check: Validate file type and extension to prevent malicious uploads
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const validVideoExts = ['mp4', 'webm', 'mov'];
    
    const isValidImage = validImageTypes.includes(file.type) && validImageExts.includes(ext || '');
    const isValidVideo = validVideoTypes.includes(file.type) && validVideoExts.includes(ext || '');

    if (!isValidImage && !isValidVideo) {
      alert(lang === 'ar' ? '⚠️ تحذير أمني: نوع الملف غير مدعوم أو قد يكون خبيثاً. يرجى رفع صورة أو فيديو بصيغة صحيحة.' : '⚠️ Security Warning: Unsupported or potentially malicious file type. Please upload a valid image or video.');
      e.target.value = '';
      return;
    }

    // Check file size (e.g. limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert(lang === 'ar' ? '⚠️ حجم الملف كبير جداً (أكثر من 50 ميجابايت).' : '⚠️ File is too large (over 50MB).');
      e.target.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video/');
    if (mediaType === 'image' && isVideo) {
      alert(lang === 'ar' ? 'الرجاء اختيار صورة.' : 'Please select an image.');
      return;
    }
    if (mediaType === 'video' && !isVideo) {
      alert(lang === 'ar' ? 'الرجاء اختيار فيديو.' : 'Please select a video.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      let fileToUpload = file;
      if (mediaType === 'image') {
        setUploadProgress(30);
        fileToUpload = await compressImage(file);
      }
      
      setUploadProgress(60);
      const url = await uploadToCloudinary(fileToUpload);
      
      if (url) {
        setMediaUrl(url);
        setUploadProgress(100);
      } else {
        alert(lang === 'ar' ? 'فشل الرفع، يرجى المحاولة مرة أخرى.' : 'Upload failed, please try again.');
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء الرفع.' : 'An error occurred during upload.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    setIsSubmitting(true);
    try {
      const newPos = Number(position) || 0;
      const originalPosition = editingEvent.position && editingEvent.position > 0 ? editingEvent.position : currentDisplayIndex;
      const isPositionChanged = newPos !== originalPosition;

      const baseUpdatedData = {
        ...editingEvent,
        titleAr,
        titleEn,
        descriptionAr: descAr,
        descriptionEn: descEn,
        category,
        mediaType,
        mediaUrl,
        styles: selectedStyles,
        priceAr,
        priceEn,
        eventDate: eventDate ? new Date(eventDate).toISOString() : editingEvent.eventDate,
        location: {
          nameAr: locationNameAr,
          nameEn: locationNameEn,
          addressAr,
          addressEn,
          googleMapsUrl
        },
        contact: {
          organizerName: organizerName.trim(),
          phone,
          whatsapp
        },
        position: newPos,
        adNumber,
        adType,
        isFeatured
      };

      // If position has changed, check if we need to swap with an existing event (or empty placeholder) at the new position
      if (isPositionChanged && newPos > 0) {
        const eventAtNewPos = events.find(ev => ev.position === newPos && ev.id !== editingEvent.id);
        if (eventAtNewPos) {
          const swappedEvent = {
            ...eventAtNewPos,
            position: originalPosition
          };
          updateEvent(swappedEvent);
          await saveEventToFirestore(swappedEvent);
        }
      }

      // Just update existing
      updateEvent(baseUpdatedData);
      await saveEventToFirestore(baseUpdatedData);

      // Sync with ad_submissions in Firestore if matching doc exists
      if (editingEvent.id) {
        try {
          const adDocRef = doc(db, 'ad_submissions', editingEvent.id);
          const adSnap = await getDoc(adDocRef);
          if (adSnap.exists()) {
            await updateDoc(adDocRef, {
              'eventData.contact.organizerName': organizerName.trim(),
              'eventData.contact.phone': phone,
              'eventData.contact.whatsapp': whatsapp,
              'eventData.titleAr': titleAr,
              'eventData.titleEn': titleEn,
              'eventData.descriptionAr': descAr,
              'eventData.descriptionEn': descEn,
              'eventData.location.nameAr': locationNameAr,
              'eventData.location.nameEn': locationNameEn,
              'eventData.priceAr': priceAr,
              'eventData.priceEn': priceEn,
              'eventData.mediaUrl': mediaUrl,
              'eventData.mediaType': mediaType,
              eventData: baseUpdatedData
            });
          }
        } catch (syncErr) {
          console.warn("Could not sync ad_submissions doc:", syncErr);
        }
      }

      // Sync with local storage ad submissions
      try {
        const localSubsRaw = localStorage.getItem('dwm_ad_submissions');
        if (localSubsRaw) {
          const localSubs: AdSubmission[] = JSON.parse(localSubsRaw);
          const updatedSubs = localSubs.map(s => {
            if (s.id === editingEvent.id || (s.eventData && s.eventData.id === editingEvent.id)) {
              return {
                ...s,
                eventData: baseUpdatedData
              };
            }
            return s;
          });
          localStorage.setItem('dwm_ad_submissions', JSON.stringify(updatedSubs));
        }
      } catch (err) {
        console.warn("Could not sync local ad submissions:", err);
      }
      
      // Delete old media from Cloudinary if the URL changed and it was a Cloudinary URL
      if (editingEvent.mediaUrl !== mediaUrl && editingEvent.mediaUrl.includes('cloudinary.com')) {
        await deleteFromCloudinary(editingEvent.mediaUrl, editingEvent.mediaType);
      }

      // Check if we need to clean up an empty placeholder at the new position
      // Actually, we can just do a cleanup pass
      
      onComplete();
    } catch (error) {
      console.error('Failed to update event:', error);
      alert(lang === 'ar' ? 'فشل الحفظ!' : 'Failed to save!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!editingEvent) return null;

  return (
    <div className="animate-fade-in w-full max-w-3xl mx-auto py-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="h-7 w-7 text-blue-500" />
            {lang === 'ar' ? 'تعديل الإعلان الحالي' : 'Edit Current Ad'}
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            {lang === 'ar' 
              ? 'تحديث بيانات الإعلان مباشرة في قاعدة البيانات. انقر حفظ لنشر التعديلات.' 
              : 'Update ad details directly in the database. Click Save to publish.'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Core Info */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-amber-500" />
            {lang === 'ar' ? 'البيانات الأساسية' : 'Core Information'}
          </h2>

          {editingEvent?.eventRef && (
            <div className="space-y-2 mb-6 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <label className="text-sm font-bold text-indigo-400">
                {lang === 'ar' ? 'كود الحدث (الرقم المرجعي)' : 'Event Code (Reference)'}
              </label>
              <input
                disabled
                type="text"
                value={editingEvent.eventRef}
                className="w-full bg-neutral-950/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-indigo-300 font-mono font-bold select-all focus:outline-none opacity-80 cursor-not-allowed"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-neutral-300">
                  {lang === 'ar' ? 'العنوان (بالعربية)' : 'Title (Arabic)'}
                </label>
                <button
                  type="button"
                  onClick={() => handleTranslate(titleEn, 'ar', setTitleAr, 'titleAr')}
                  disabled={!titleEn || isTranslating === 'titleAr'}
                  className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-neutral-900 border border-neutral-800 text-blue-400 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTranslating === 'titleAr' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                  {lang === 'ar' ? 'ترجمة من الإنجليزية' : 'Translate from English'}
                </button>
              </div>
              <input
                required
                type="text"
                value={titleAr}
                onChange={e => setTitleAr(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-neutral-300">
                  {lang === 'ar' ? 'العنوان (بالإنجليزية)' : 'Title (English)'}
                </label>
                <button
                  type="button"
                  onClick={() => handleTranslate(titleAr, 'en', setTitleEn, 'titleEn')}
                  disabled={!titleAr || isTranslating === 'titleEn'}
                  className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-neutral-900 border border-neutral-800 text-blue-400 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTranslating === 'titleEn' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                  {lang === 'ar' ? 'ترجمة من العربية' : 'Translate from Arabic'}
                </button>
              </div>
              <input
                required
                type="text"
                value={titleEn}
                onChange={e => setTitleEn(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'الوصف (بالعربية)' : 'Description (Arabic)'}
              </label>
              <button
                type="button"
                onClick={() => handleTranslate(descEn, 'ar', setDescAr, 'descAr')}
                disabled={!descEn || isTranslating === 'descAr'}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-neutral-900 border border-neutral-800 text-blue-400 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTranslating === 'descAr' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                {lang === 'ar' ? 'ترجمة من الإنجليزية' : 'Translate from English'}
              </button>
            </div>
            <textarea
              required
              rows={3}
              value={descAr}
              onChange={e => {
                if (e.target.value.length <= 500) {
                  setDescAr(e.target.value);
                }
              }}
              maxLength={500}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
            />
            <div className="flex justify-between items-center mt-1 px-1">
              <span className={`text-[11px] transition-colors duration-200 ${500 - descAr.length <= 50 ? 'text-red-500 font-bold' : 'text-blue-400 font-medium'}`}>
                {lang === 'ar' 
                  ? `الحد الأقصى 500 حرف | الحروف المتبقية: ${500 - descAr.length}` 
                  : `Maximum 500 characters | Remaining: ${500 - descAr.length} characters`}
              </span>
              {500 - descAr.length === 0 && (
                <span className="text-[10px] text-red-500 font-bold animate-pulse">
                  {lang === 'ar' ? '⚠️ تم الوصول للحد الأقصى' : '⚠️ Max limit reached'}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'الوصف (بالإنجليزية)' : 'Description (English)'}
              </label>
              <button
                type="button"
                onClick={() => handleTranslate(descAr, 'en', setDescEn, 'descEn')}
                disabled={!descAr || isTranslating === 'descEn'}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-neutral-900 border border-neutral-800 text-blue-400 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTranslating === 'descEn' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                {lang === 'ar' ? 'ترجمة من العربية' : 'Translate from Arabic'}
              </button>
            </div>
            <textarea
              required
              rows={3}
              value={descEn}
              onChange={e => {
                if (e.target.value.length <= 500) {
                  setDescEn(e.target.value);
                }
              }}
              maxLength={500}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none text-left"
              dir="ltr"
            />
            <div className="flex justify-between items-center mt-1 px-1">
              <span className={`text-[11px] transition-colors duration-200 ${500 - descEn.length <= 50 ? 'text-red-500 font-bold' : 'text-blue-400 font-medium'}`}>
                {lang === 'ar' 
                  ? `الحد الأقصى 500 حرف | الحروف المتبقية: ${500 - descEn.length}` 
                  : `Maximum 500 characters | Remaining: ${500 - descEn.length} characters`}
              </span>
              {500 - descEn.length === 0 && (
                <span className="text-[10px] text-red-500 font-bold animate-pulse">
                  {lang === 'ar' ? '⚠️ تم الوصول للحد الأقصى' : '⚠️ Max limit reached'}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'التصنيف' : 'Category'}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as DanceCategory)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="party">{lang === 'ar' ? 'حفلة / سهرة' : 'Party / Social'}</option>
                <option value="course">{lang === 'ar' ? 'كورس / ورشة عمل' : 'Course / Workshop'}</option>
                <option value="trip">{lang === 'ar' ? 'رحلة / معسكر' : 'Trip / Camp'}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'تاريخ الفعالية' : 'Event Date'}
              </label>
              <input
                required
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'السعر (بالعربية)' : 'Price (Arabic)'}
              </label>
              <input
                type="text"
                value={priceAr}
                onChange={e => setPriceAr(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="مثال: ٢٥٠ درهم"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'السعر (بالإنجليزية)' : 'Price (English)'}
              </label>
              <input
                type="text"
                value={priceEn}
                onChange={e => setPriceEn(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all text-left"
                dir="ltr"
                placeholder="e.g. 250 AED"
              />
            </div>
          </div>

          {/* Styles */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-300">
              {lang === 'ar' ? 'أنماط الرقص' : 'Dance Styles'}
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DANCE_STYLES.map(style => {
                const isSelected = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleStyleToggle(style)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 border-amber-400'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                    }`}
                  >
                    {getStyleLabel(style, lang)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Media & Type */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-purple-500" />
            {lang === 'ar' ? 'الوسائط ونوع الإعلان' : 'Media & Ad Type'}
          </h2>
          
          <div className="flex gap-4">
            <label className="flex-1">
              <input type="radio" name="mediaType" className="hidden" checked={mediaType === 'image'} onChange={() => setMediaType('image')} />
              <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${mediaType === 'image' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-neutral-800 bg-neutral-950 text-neutral-500 hover:border-neutral-700'}`}>
                <ImageIcon className="h-6 w-6 mb-2" />
                <span className="font-bold text-sm">{lang === 'ar' ? 'صورة' : 'Image'}</span>
              </div>
            </label>
            <label className="flex-1">
              <input type="radio" name="mediaType" className="hidden" checked={mediaType === 'video'} onChange={() => setMediaType('video')} />
              <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${mediaType === 'video' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-neutral-800 bg-neutral-950 text-neutral-500 hover:border-neutral-700'}`}>
                <Video className="h-6 w-6 mb-2" />
                <span className="font-bold text-sm">{lang === 'ar' ? 'فيديو' : 'Video'}</span>
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-300">
              {lang === 'ar' ? 'الرابط الحالي / الجديد' : 'Current / New URL'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mediaUrl}
                readOnly
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-400 focus:outline-none transition-all text-sm font-mono cursor-not-allowed"
                placeholder="https://"
                dir="ltr"
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-all cursor-pointer border border-neutral-700 disabled:opacity-50"
                title={lang === 'ar' ? 'رفع ملف جديد' : 'Upload new file'}
              >
                {isUploading ? <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : <UploadCloud className="h-5 w-5" />}
              </button>
            </div>
            {isUploading && (
              <div className="mt-2 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            {mediaUrl && mediaType === 'image' && (
              <div className="mt-4 relative rounded-xl overflow-hidden border border-neutral-800 w-full max-w-sm">
                <img src={mediaUrl} alt="Preview" className="w-full object-cover" />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-neutral-800">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'نوع الإعلان' : 'Ad Type'}
              </label>
              <select
                value={adType}
                onChange={e => setAdType(e.target.value as 'vip' | 'standard')}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all cursor-pointer font-bold"
              >
                <option value="vip">VIP 👑</option>
                <option value="standard">{lang === 'ar' ? 'عادي' : 'Standard'}</option>
              </select>
            </div>
            
            <div className="flex items-end mb-1">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-neutral-800 bg-neutral-950 w-full transition-all hover:bg-neutral-900">
                <input 
                  type="checkbox" 
                  checked={isFeatured}
                  onChange={e => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-950" 
                />
                <span className="font-bold text-sm text-amber-400">
                  {lang === 'ar' ? 'تثبيت الإعلان (Featured)' : 'Pin Ad (Featured)'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-emerald-500" />
            {lang === 'ar' ? 'الموقع والتواصل' : 'Location & Contact'}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'اسم المكان (عربي)' : 'Venue Name (Ar)'}
              </label>
              <input
                required
                type="text"
                value={locationNameAr}
                onChange={e => setLocationNameAr(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'اسم المكان (إنجليزي)' : 'Venue Name (En)'}
              </label>
              <input
                required
                type="text"
                value={locationNameEn}
                onChange={e => setLocationNameEn(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                dir="ltr"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'العنوان (عربي)' : 'Address (Ar)'}
              </label>
              <input
                required
                type="text"
                value={addressAr}
                onChange={e => setAddressAr(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'العنوان (إنجليزي)' : 'Address (En)'}
              </label>
              <input
                required
                type="text"
                value={addressEn}
                onChange={e => setAddressEn(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-300">
              {lang === 'ar' ? 'رابط خرائط جوجل' : 'Google Maps URL'}
            </label>
            <input
              required
              type="url"
              value={googleMapsUrl}
              onChange={e => setGoogleMapsUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all text-left"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-neutral-800 pt-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'المنظم' : 'Organizer'}
              </label>
              <input
                required
                type="text"
                value={organizerName}
                onChange={e => setOrganizerName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'الهاتف' : 'Phone'}
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all text-left"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'واتساب' : 'WhatsApp'}
              </label>
              <input
                required
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all text-left"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {lang === 'ar' ? 'إعدادات النظام (متقدم)' : 'System Settings (Advanced)'}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'ترتيب الظهور (Position)' : 'Display Order (Position)'}
              </label>
              <input
                type="number"
                value={position}
                onChange={e => {
                  const val = e.target.value;
                  setPosition(val === '' ? '' : Number(val));
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-300">
                {lang === 'ar' ? 'رقم الإعلان (ID/Number)' : 'Ad Number'}
              </label>
              <input
                type="text"
                value={adNumber}
                onChange={e => setAdNumber(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all font-mono"
              />
              <p className="text-xs text-neutral-500">
                {lang === 'ar' ? 'تغييره قد يؤثر على الربط بالفواتير' : 'Changing this may affect invoice linking'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting || isUploading || !titleAr || !mediaUrl || selectedStyles.length === 0}
            className="w-full py-4 rounded-xl font-black text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-6 w-6" />
                {lang === 'ar' ? 'نشر التعديلات فوراً' : 'Publish Edits Immediately'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
