import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Crown,
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
  Maximize2,
  Compass,
  Eye,
  FileText,
  Edit3,
  Activity,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Languages,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DanceCategory, DanceStyle, ALL_DANCE_STYLES, getStyleLabel, AdSubmission, DanceEvent } from '../../types';
import { EventPaymentCheckout } from './EventPaymentCheckout';
import { convertCloudStorageUrl, isGoogleDriveUrl, getGoogleDrivePreviewUrl, getSafePlayableVideoUrl } from '../../lib/mediaUtils';
import { FullscreenVideoModal } from './FullscreenVideoModal';
import { EventCard } from './EventCard';
import { doc, getDoc } from 'firebase/firestore';
import { db, saveAdSubmissionToFirestore } from '../../lib/firebase';

// Helper to parse coordinates from any Google Maps URL structure
const parseCoordinates = (url: string): { lat: number; lng: number } => {
  const defaultCoords = { lat: 30.0444, lng: 31.2357 }; // Cairo
  if (!url) return defaultCoords;

  try {
    // 1. Check for @lat,lng
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // 2. Check for q=lat,lng or query=lat,lng
    const qMatch = url.match(/[?&](q|query|saddr|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[2]), lng: parseFloat(qMatch[3]) };
    }

    // 3. Check for general path coordinate pair /lat,lng
    const pathMatch = url.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (pathMatch) {
      return { lat: parseFloat(pathMatch[1]), lng: parseFloat(pathMatch[2]) };
    }
  } catch (e) {
    console.error('Failed to parse coordinates from URL', e);
  }

  return defaultCoords;
};

interface CreateEventPageProps {
  onComplete: () => void;
  onCancel?: () => void;
}

export const CreateEventPage: React.FC<CreateEventPageProps> = ({ onComplete, onCancel }) => {
  const { lang, user, addNewEvent, updateEvent, editingEvent, setEditingEvent, isAdminUnlocked, pricingConfig, loadPricingConfig } = useApp();

  const [adType, setAdType] = useState<'vip' | 'standard' | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [titleAr, setTitleAr] = useState(editingEvent ? editingEvent.titleAr : '');
  const [titleEn, setTitleEn] = useState(editingEvent ? editingEvent.titleEn : '');
  const [descAr, setDescAr] = useState(editingEvent ? editingEvent.descriptionAr : '');
  const [descEn, setDescEn] = useState(editingEvent ? editingEvent.descriptionEn : '');
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
  const [addressAr, setAddressAr] = useState(editingEvent && editingEvent.location ? (editingEvent.location.addressAr || 'القاهرة، مصر') : 'القاهرة، مصر');
  const [addressEn, setAddressEn] = useState(editingEvent && editingEvent.location ? (editingEvent.location.addressEn || 'Cairo, Egypt') : 'Cairo, Egypt');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(editingEvent && editingEvent.location ? editingEvent.location.googleMapsUrl : 'https://maps.google.com/?q=30.0444,31.2357');
  const [selectedStyles, setSelectedStyles] = useState<DanceStyle[]>(editingEvent ? editingEvent.styles : ['Salsa', 'Bachata']);
  const [position, setPosition] = useState<number>(editingEvent && editingEvent.position !== undefined ? editingEvent.position : 0);
  const [adNumber, setAdNumber] = useState<string>(editingEvent && editingEvent.adNumber ? editingEvent.adNumber : '');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFullscreenVideoOpen, setIsFullscreenVideoOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  const [createTab, setCreateTab] = useState<'form' | 'preview'>('form');
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');
  const [previewAlert, setPreviewAlert] = useState<string | null>(null);


  // Link violation detection
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|me|co|eg|sa|ae|app|link)(?:\/[^\s]*)?)/i;
  const [hasUrlViolation, setHasUrlViolation] = useState(false);
  const [mapsUrlError, setMapsUrlError] = useState(false);
  
  React.useEffect(() => {
    // Only block URLs in text fields, not in the mediaUrl or googleMapsUrl
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|me|co|eg|sa|ae|app|link)(?:\/[^\s]*)?)/i;
    const hasViolation = [titleAr, titleEn, descAr, descEn].some(text => urlRegex.test(text));
    setHasUrlViolation(hasViolation);
  }, [titleAr, titleEn, descAr, descEn]);

  React.useEffect(() => {
    if (googleMapsUrl && googleMapsUrl.trim() !== '') {
      const mapsRegex = /(https?:\/\/)?(www\.)?(google\.com\/maps|maps\.google\.com|goo\.gl\/maps|maps\.app\.goo\.gl)/i;
      setMapsUrlError(!mapsRegex.test(googleMapsUrl));
    } else {
      setMapsUrlError(false);
    }
  }, [googleMapsUrl]);
  
  // Cloudinary configuration credentials from environment variables (safe and secure for git)
  const cloudinaryCloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side automatic image compression helper
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      // If the file is small enough (< 300KB), don't compress
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
          
          // Downscale to max 1080px width or height to optimize mobile delivery
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
            }, 'image/jpeg', 0.82); // 82% quality is visually indistinguishable but extremely small
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

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
    setUploadProgress(0);
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
        setUploadedFileName(fileToUpload.name);
        setMediaType(type);
        setMediaUrl(URL.createObjectURL(fileToUpload)); // temporary preview
        try {
          const finalUrl = await performUpload(fileToUpload);
          
          // If editing an event and there's an old media URL on Cloudinary, delete it
          if (editingEvent && editingEvent.mediaUrl && editingEvent.mediaUrl.includes('cloudinary.com') && editingEvent.mediaUrl !== finalUrl) {
             try {
               await fetch('/api/delete-media', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ url: editingEvent.mediaUrl, resourceType: editingEvent.mediaType })
               });
             } catch (err) {
               console.error('Failed to delete old media:', err);
             }
          }
          
          setMediaUrl(finalUrl);
          setPendingFile(null);
        } catch (err: any) {
          alert(lang === 'ar' ? `❌ فشل رفع الوسائط: ${err.message}` : `❌ Media upload failed: ${err.message}`);
          setMediaUrl(editingEvent ? editingEvent.mediaUrl : '');
          setPendingFile(null);
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
            e.target.value = '';
            return;
          }
          processUpload(file, 'video');
        };
        video.onerror = () => {
          window.URL.revokeObjectURL(video.src);
          alert(lang === 'ar' ? '❌ فشل تحميل بيانات الفيديو' : '❌ Failed to load video metadata');
        };
        video.src = URL.createObjectURL(file);
      } else {
        processUpload(file, 'image');
      }
    }
  };

  const performUpload = async (file: File): Promise<string> => {
    setIsUploadingMedia(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
        throw new Error('Cloudinary configuration missing (VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET). Please use the manual URL input below.');
      }
      
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToUpload = await compressImage(file);
        } catch (compressErr) {}
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('upload_preset', cloudinaryUploadPreset);
      const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
      
      return await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/${resourceType}/upload`, true);
        xhr.upload.onprogress = (p) => {
          if (p.lengthComputable) setUploadProgress(Math.round((p.loaded / p.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const resp = JSON.parse(xhr.responseText);
            if (resp.secure_url) resolve(resp.secure_url);
            else reject(new Error('No URL returned'));
          } else reject(new Error(`Upload failed ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      throw err;
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Subscription Plan & Terms State
  const [subscriptionDays, setSubscriptionDays] = useState<number>(7);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(!!editingEvent);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'wallet' | 'card'>('instapay');

  // Calculate Subscription Pricing
  const getPriceBreakdown = () => {
    const defaultPricing = { basePrice: 100, extraDayPrice: 20, videoSurchargePercentage: 20 };
    const config = pricingConfig?.[adType] || pricingConfig?.vip || defaultPricing;
    const days = Math.max(7, subscriptionDays || 7);
    const basePrice = Number(config?.basePrice) || 100;
    const extraDayRate = Number(config?.extraDayPrice) || 20;
    const videoSurchargePercentage = Number(config?.videoSurchargePercentage) || 20;
    const extraDays = days - 7;
    const extraPrice = extraDays * extraDayRate;
    const subtotal = basePrice + extraPrice;
    const videoSurcharge = mediaType === 'video' ? Math.round(subtotal * (videoSurchargePercentage / 100)) : 0;
    const total = subtotal + videoSurcharge;
    return {
      days,
      basePrice,
      extraDayRate,
      videoSurchargePercentage,
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
    if (!agreedToTerms || hasUrlViolation || mapsUrlError) return;
    if (!titleAr) setTitleAr(lang === 'ar' ? 'سهرة سالسا وباتشاتا ملكية جديدة' : 'Royal Salsa & Bachata Night');
    if (!titleEn) setTitleEn('Royal Salsa & Bachata Night');
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const containsExternalLink = (text: string) => {
    if (!text) return false;
    const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/ig;
    return linkRegex.test(text);
  };

  const checkLinksAndWarn = () => {
    if (containsExternalLink(titleAr) || containsExternalLink(titleEn) || containsExternalLink(descAr) || containsExternalLink(descEn)) {
      alert(lang === 'ar' ? '⚠️ عذراً، ممنوع وضع أي روابط خارجية في العنوان أو الوصف لأسباب أمنية.' : '⚠️ Sorry, external links are not allowed in the title or description for security reasons.');
      return true;
    }
    return false;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkLinksAndWarn()) return;
    
    if (editingEvent) {
      if (agreedToTerms && !isUploadingMedia) {
        handleFinalPublish();
      }
      return;
    }
    if (agreedToTerms) {
      setCreateTab('preview');
      setPreviewAlert(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const defaultImg = 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80';
  const defaultVid = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  
  let generatedMediaUrl = mediaUrl || (mediaType === 'video' ? defaultVid : defaultImg);
  let generatedThumbnailUrl = mediaType === 'video' ? 
    (generatedMediaUrl.includes('cloudinary.com') ? generatedMediaUrl.replace(/\.[^.]+$/, '.jpg') : defaultImg) 
    : generatedMediaUrl;

  const handleFinalPublish = async () => {
    setIsUploadingMedia(true);
    let finalMediaUrl = mediaUrl;
    
    if (!finalMediaUrl || finalMediaUrl.startsWith('blob:')) {
      finalMediaUrl = mediaType === 'video' ? defaultVid : defaultImg;
    }

    // Generate a proper thumbnailUrl for videos
    let finalThumbnailUrl = finalMediaUrl;
    if (mediaType === 'video' && finalMediaUrl.includes('cloudinary.com')) {
      finalThumbnailUrl = finalMediaUrl.replace(/\.[^.]+$/, '.jpg');
    } else if (mediaType === 'video') {
      finalThumbnailUrl = defaultImg;
    }

    if (editingEvent) {
      const updatedEv: DanceEvent = {
        ...editingEvent,
        titleAr: titleAr || editingEvent.titleAr || 'سهرة سالسا وباتشاتا ملكية جديدة',
        titleEn: titleEn || editingEvent.titleEn || 'Royal Salsa & Bachata Night',
        descriptionAr: descAr || editingEvent.descriptionAr || 'انضموا إلينا في سهرة لاتينية فاخرة بمشاركة نخبة المدربين والمحترفين في الوطن العربي.',
        descriptionEn: descEn || editingEvent.descriptionEn || 'Join us for an exclusive Latin night with top instructors and professionals from across the region.',
        category: (category === 'all' ? 'party' : category) as any,
        styles: selectedStyles.length > 0 ? selectedStyles : ['Salsa'],
        mediaType,
        mediaUrl: finalMediaUrl,
        thumbnailUrl: finalThumbnailUrl,
        eventDate: new Date(eventDate).toISOString(),
        priceAr,
        priceEn,
        location: {
          ...editingEvent.location,
          nameAr: locationNameAr,
          nameEn: locationNameEn,
          addressAr: addressAr || 'القاهرة، مصر',
          addressEn: addressEn || 'Cairo, Egypt',
          googleMapsUrl: googleMapsUrl || 'https://maps.google.com/?q=30.0444,31.2357',
          lat: parseCoordinates(googleMapsUrl).lat,
          lng: parseCoordinates(googleMapsUrl).lng
        },
        contact: {
          ...editingEvent.contact,
          phone,
          whatsapp,
        },
        position: position !== undefined ? Number(position) : (editingEvent.position || 0),
        adNumber: adNumber || editingEvent.adNumber
      };

      updateEvent(updatedEv);

      // Also update the original submission in `ad_submissions` if it exists!
      try {
        const subId = editingEvent.id.startsWith('ad_') || editingEvent.id.startsWith('sub_') ? editingEvent.id : null;
        if (subId) {
          const adDocRef = doc(db, 'ad_submissions', subId);
          const adDocSnap = await getDoc(adDocRef);
          if (adDocSnap.exists()) {
            const subData = adDocSnap.data() as AdSubmission;
            const updatedSub: AdSubmission = {
              ...subData,
              titleAr: updatedEv.titleAr,
              titleEn: updatedEv.titleEn,
              mediaUrl: updatedEv.mediaUrl,
              eventData: updatedEv
            };
            await saveAdSubmissionToFirestore(updatedSub);
          }
        }
      } catch (subErr) {
        console.warn('Could not update matching ad submission in Firestore:', subErr);
      }

      setEditingEvent(null);
    } else {
      // Regular users should NOT call addNewEvent. Their ads must go through the Admin approval flow.
      // Only Admins (or unlocked Admins) can publish an event directly.
      if (user?.isAdmin || isAdminUnlocked) {
        const createdEvent = addNewEvent({
          titleAr: titleAr || 'سهرة سالسا وباتشاتا ملكية جديدة',
          titleEn: titleEn || 'Royal Salsa & Bachata Night',
          descriptionAr: descAr || 'انضموا إلينا في سهرة لاتينية فاخرة بمشاركة نخبة المدربين والمحترفين في الوطن العربي.',
          descriptionEn: descEn || 'Join us for an exclusive Latin night with top instructors and professionals from across the region.',
          category: (category === 'all' ? 'party' : category) as any,
          styles: selectedStyles.length > 0 ? selectedStyles : ['Salsa'],
          mediaType,
          mediaUrl: finalMediaUrl,
          thumbnailUrl: finalThumbnailUrl,
          eventDate: new Date(eventDate).toISOString(),
          priceAr,
          priceEn,
          location: {
            nameAr: locationNameAr,
            nameEn: locationNameEn,
            addressAr: addressAr || 'القاهرة، مصر',
            addressEn: addressEn || 'Cairo, Egypt',
            googleMapsUrl: googleMapsUrl || 'https://maps.google.com/?q=30.0444,31.2357',
            lat: parseCoordinates(googleMapsUrl).lat,
            lng: parseCoordinates(googleMapsUrl).lng
          },
          contact: {
            phone,
            whatsapp,
            organizerName: user?.name || 'إدارة DWM للرقص'
          },
          isFeatured: false,
          isWeeklyPromo: false,
          position: position !== undefined ? Number(position) : 0,
          adNumber: adNumber || `ADM-${Date.now()}`,
          adType
        });
      }
    }

    setIsUploadingMedia(false);
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
        mediaUrl={mediaUrl}
        pendingFile={pendingFile}
        cloudinaryConfig={{ cloudName: cloudinaryCloudName, uploadPreset: cloudinaryUploadPreset }}
        eventData={{
          titleAr: titleAr || 'سهرة سالسا وباتشاتا ملكية جديدة',
          titleEn: titleEn || 'Royal Salsa & Bachata Night',
          descriptionAr: descAr || 'انضموا إلينا في سهرة لاتينية فاخرة بمشاركة نخبة المدربين والمحترفين في الوطن العربي.',
          descriptionEn: descEn || 'Join us for an exclusive Latin night with top instructors and professionals from across the region.',
          category: (category === 'all' ? 'party' : category) as any,
          styles: selectedStyles.length > 0 ? selectedStyles : ['Salsa'],
          mediaType,
          mediaUrl: generatedMediaUrl,
          thumbnailUrl: generatedThumbnailUrl,
          eventDate: new Date(eventDate).toISOString(),
          priceAr,
          priceEn,
          location: {
            nameAr: locationNameAr,
            nameEn: locationNameEn,
            addressAr: addressAr || 'القاهرة، مصر',
            addressEn: addressEn || 'Cairo, Egypt',
            googleMapsUrl: googleMapsUrl || 'https://maps.google.com/?q=30.0444,31.2357',
            lat: parseCoordinates(googleMapsUrl).lat,
            lng: parseCoordinates(googleMapsUrl).lng
          },
          contact: {
            phone,
            whatsapp,
            organizerName: user?.name || 'إدارة DWM للرقص'
          },
          isFeatured: false,
          isWeeklyPromo: false,
          adType
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

{/* Ad Type Selection */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 relative">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            {lang === 'ar' ? 'نوع الإعلان' : 'Ad Type'}
            {isLoadingPricing && <Sparkles className="h-5 w-5 animate-spin text-amber-500 ml-2" />}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {lang === 'ar' ? 'حدد إن كنت تريد إعلاناً مميزاً في مقدمة القائمة أو إعلاناً عادياً.' : 'Choose whether you want a VIP featured ad at the top of the list or a standard ad.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <button
              type="button"
              onClick={async () => {
                setIsLoadingPricing(true);
                await loadPricingConfig();
                setAdType('vip');
                setIsLoadingPricing(false);
              }}
              className={`relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 transform shadow-xl ${
                adType === 'vip' 
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400 text-neutral-950 scale-[1.02] ring-4 ring-amber-500/20' 
                  : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-amber-500/50 hover:scale-[1.01]'
              }`}
            >
              {adType === 'vip' && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
              )}
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`font-black text-lg sm:text-xl ${adType === 'vip' ? 'text-neutral-950' : 'text-white'}`}>
                  {lang === 'ar' ? 'إعلان VIP مميز' : 'VIP Featured Ad'}
                </span>
                {adType === 'vip' && <CheckCircle className="h-6 w-6 text-neutral-950" />}
              </div>
              <p className={`text-sm text-center mt-3 leading-relaxed font-bold ${adType === 'vip' ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {lang === 'ar' ? 'يظهر الإعلان في أول 6 نتائج من القائمة بشكل مميز لضمان أقصى عدد من المشاهدات.' : 'Appears in the first 6 results of the list for maximum visibility.'}
              </p>
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsLoadingPricing(true);
                await loadPricingConfig();
                setAdType('standard');
                setIsLoadingPricing(false);
              }}
              className={`relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 transform shadow-xl ${
                adType === 'standard' 
                  ? 'bg-neutral-700 border-neutral-400 text-white scale-[1.02] ring-4 ring-neutral-500/20' 
                  : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-500/50 hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`font-black text-lg sm:text-xl text-white`}>
                  {lang === 'ar' ? 'إعلان عادي' : 'Standard Ad'}
                </span>
                {adType === 'standard' && <CheckCircle className="h-6 w-6 text-neutral-200" />}
              </div>
              <p className={`text-sm text-center mt-3 leading-relaxed font-bold ${adType === 'standard' ? 'text-neutral-200' : 'text-neutral-400'}`}>
                {lang === 'ar' ? 'يظهر الإعلان بشكل قياسي في قائمة الفعاليات وفقاً لتاريخ الإضافة.' : 'Appears standardly in the events list sorted by date added.'}
              </p>
            </button>
          </div>
        </div>

        

      {adType && (
        <>
      {/* Sub-Tab Switcher for Full Live Preview (Highly prominent card) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-neutral-950/80 border-2 border-amber-500/30 shadow-2xl relative overflow-hidden backdrop-blur-md mb-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="text-right flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div>
            <h4 className="text-sm font-black text-white flex items-center justify-start gap-2">
              <span>{lang === 'ar' ? '👀 معاينة مباشرة تفاعلية بالكامل' : '👀 Live Interactive Preview'}</span>
            </h4>
            <p className="text-[11px] text-neutral-400">
              {lang === 'ar' ? 'اعرض مظهر الإعلان النهائي للجمهور أثناء تعبئة الحقول لتعديله فوراً.' : 'See exactly how the final ad renders to dancers as you type.'}
            </p>
          </div>
        </div>

        <div className="flex rounded-2xl bg-neutral-900 p-1 border border-neutral-800 w-full sm:w-auto shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => setCreateTab('form')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              createTab === 'form'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-lg shadow-amber-500/20 border border-amber-400/30 font-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{lang === 'ar' ? '📝 نموذج البيانات' : '📝 Form Builder'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateTab('preview');
              setPreviewAlert(null);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              createTab === 'preview'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-lg shadow-amber-500/20 border border-amber-400/30 font-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>{lang === 'ar' ? '👁️ المعاينة الحية للجمهور' : '👁️ Live Preview'}</span>
          </button>
        </div>
      </div>

      {/* Removed Floating Action Button per user request to move it near payment button */}

      {createTab === 'preview' && (
        <div className="space-y-6 animate-fadeIn text-right mb-12" dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
          
          {/* Preview Controls Header Block */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-right">
                <h4 className="text-base sm:text-lg font-black text-white flex items-center justify-start gap-2">
                  <Eye className="h-5 w-5 text-amber-400 animate-pulse" />
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
                      ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
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
                      ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  English (EN)
                </button>
              </div>
            </div>

            {/* Dynamic Simulation Toast */}
            {previewAlert && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-bold text-amber-300 flex items-center gap-2.5 animate-fadeIn">
                <Sparkles className="h-4 w-4 text-amber-400 animate-spin animate-spin-slow" />
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
                
                <div className="pt-4">
                  <EventCard
                    event={{
                      id: 'user-preview-id',
                      titleAr: titleAr.trim() || (lang === 'ar' ? 'سهرة سالسا فخمة في الزمالك' : 'Luxury Salsa Night in Zamalek'),
                      titleEn: titleEn.trim() || 'Luxury Salsa Night in Zamalek',
                      descriptionAr: descAr.trim() || (lang === 'ar' ? 'اكتب تفاصيل الفعالية، المدربين، نوع الموسيقى، شروط الحضور...' : 'Event details and description goes here...'),
                      descriptionEn: descEn.trim() || 'Event details and description goes here...',
                      category: category,
                      styles: selectedStyles,
                      mediaType: mediaType,
                      mediaUrl: mediaUrl.trim() || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?q=80&w=1200',
                      thumbnailUrl: mediaType === 'video' ? 
                        (mediaUrl.includes('cloudinary.com') ? mediaUrl.trim().replace(/\.[^.]+$/, '.jpg') : 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?q=80&w=1200') 
                        : mediaUrl.trim() || 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?q=80&w=1200',
                      uploadDate: new Date().toISOString(),
                      eventDate: eventDate ? new Date(eventDate).toISOString() : new Date().toISOString(),
                      priceAr: priceAr.trim() || '250 ج.م',
                      priceEn: priceEn.trim() || '250 EGP',
                      location: {
                        nameAr: locationNameAr.trim() || 'أستوديو الرقص - الزمالك',
                        nameEn: locationNameEn.trim() || 'Dance Studio - Zamalek',
                        addressAr: addressAr.trim() || 'القاهرة، مصر',
                        addressEn: addressEn.trim() || 'Cairo, Egypt',
                        googleMapsUrl: googleMapsUrl.trim(),
                        lat: 30.0444,
                        lng: 31.2357
                      },
                      contact: {
                        phone: phone.trim() || '+201011223344',
                        whatsapp: whatsapp.trim() || '201011223344',
                        organizerName: user?.name || 'الإدارة'
                      },
                      likesCount: 15,
                      isFeatured: false,
                      isWeeklyPromo: false,
                      position: Number(position) || 0,
                      adType
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
            <div className="lg:col-span-6 space-y-6 text-right">
              <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
                <h5 className="text-xs font-black text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center justify-start gap-2">
                  <Activity className="h-4 w-4 text-amber-400" />
                  <span>
                    {lang === 'ar' ? '🔍 فحص الجاهزية والبيانات الفنية للإعلان' : '🔍 Composed Blueprint & Verification'}
                  </span>
                </h5>

                <div className="space-y-3.5 text-xs text-neutral-300 text-right">
                  {/* Rendered Language title */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                    <span className="text-neutral-400">{lang === 'ar' ? 'الاسم المعروض بالعربية:' : 'Arabic Display Title:'}</span>
                    <span className="font-extrabold text-white truncate max-w-[220px]">{titleAr || '⚠️ غير مكتمل / Empty'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                    <span className="text-neutral-400">{lang === 'ar' ? 'الاسم المعروض بالإنجليزية:' : 'English Display Title:'}</span>
                    <span className="font-extrabold text-white truncate max-w-[220px]">{titleEn || '⚠️ غير مكتمل / Empty'}</span>
                  </div>

                  {/* Venue details */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                    <span className="text-neutral-400">{lang === 'ar' ? 'الموقع المقترح:' : 'Venue Name:'}</span>
                    <span className="font-extrabold text-amber-300">
                      {previewLang === 'ar' ? locationNameAr : locationNameEn}
                    </span>
                  </div>

                  {/* Price rendering */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                    <span className="text-neutral-400">{lang === 'ar' ? 'السعر المدخل للراقصين:' : 'Ticket / Price Tag:'}</span>
                    <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                      {previewLang === 'ar' ? priceAr : priceEn}
                    </span>
                  </div>

                  {/* Event Date */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                    <span className="text-neutral-400">{lang === 'ar' ? 'تاريخ الحفلة أو الكورس:' : 'Scheduled Date:'}</span>
                    <span className="font-mono font-black text-white">{eventDate || '⚠️ لم يحدد بعد / Missing'}</span>
                  </div>

                  {/* Location map coordinates status */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                    <span className="text-neutral-400">{lang === 'ar' ? 'تثبيت إحداثيات الخريطة (GPS):' : 'GPS Map Coordinates:'}</span>
                    {googleMapsUrl ? (
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded animate-pulse">
                        DETECTED OK ✔
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                        DEFAULTED CAIRO
                      </span>
                    )}
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
                    ? 'بإمكانك المراجعة والتعديل اللانهائي. إذا كانت الأبعاد والألوان والنصوص صحيحة ومضبوطة تماماً، يمكنك النقر مباشرة على زر "نموذج البيانات" أو استخدام الأزرار أدناه للمتابعة حتى الدفع والنشر.' 
                    : 'Verify spacing and text fitting. If you are satisfied with both translations, use the buttons below to return to the form or complete publication.'}
                </p>
              </div>

              {/* Post-Preview Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCreateTab('form');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 py-3 px-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'العودة لتعديل البيانات' : 'Back to Editing'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={editingEvent ? handleFinalPublish : handleProceedToPayment}
                  disabled={isUploadingMedia}
                  className="flex-[1.5] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-black hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 shadow-lg gold-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4 fill-current animate-pulse-slow" />
                  <span>
                    {isUploadingMedia
                      ? (lang === 'ar' ? 'جاري الحفظ والرفع...' : 'Saving & Uploading...')
                      : (editingEvent 
                        ? (lang === 'ar' ? 'أعد النشر وحفظ التعديلات' : 'Re-publish and Save')
                        : (lang === 'ar' ? `إرسال للمراجعة والدفع (${pricing.total} ج.م)` : `Review & Pay (${pricing.total} EGP)`))}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Standalone Form */}
      {createTab === 'form' && (
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

        <form onSubmit={handleFormSubmit} className="space-y-6">

          {/* Event Code (when editing) */}
          {editingEvent?.eventRef && (
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 mb-6">
              <label className="block text-xs font-bold text-indigo-400 mb-1.5">
                {lang === 'ar' ? 'كود الحدث (الرقم المرجعي)' : 'Event Code (Reference)'}
              </label>
              <input
                disabled
                type="text"
                value={editingEvent.eventRef}
                className="w-full bg-neutral-900/50 border border-indigo-500/30 rounded-xl px-4 py-2 text-indigo-300 font-mono font-bold select-all focus:outline-none opacity-80 cursor-not-allowed"
              />
            </div>
          )}

          {/* Title AR / EN */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
              {lang === 'ar' ? '1. عنوان الفعالية' : '1. Event Title'}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    {lang === 'ar' ? 'عنوان الإعلان (بالعربية)' : 'Title (Arabic)'} <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTranslate(titleEn, 'ar', setTitleAr, 'titleAr')}
                    disabled={!titleEn || isTranslating === 'titleAr'}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-neutral-900 border border-neutral-800 text-amber-500 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTranslating === 'titleAr' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    {lang === 'ar' ? 'ترجمة من الإنجليزية' : 'Translate from English'}
                  </button>
                </div>
                <input
                  type="text"
                  value={titleAr}
                  onChange={e => setTitleAr(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: سهرة سالسا وباتشاتا ملكية على السطح' : 'e.g. Royal Rooftop Salsa Social'}
                  className={`w-full rounded-xl border ${urlRegex.test(titleAr) ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm text-white outline-none transition-colors shadow-inner`}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    {lang === 'ar' ? 'عنوان الإعلان (بالإنجليزية)' : 'Title (English)'} <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTranslate(titleAr, 'en', setTitleEn, 'titleEn')}
                    disabled={!titleAr || isTranslating === 'titleEn'}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-neutral-900 border border-neutral-800 text-amber-500 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTranslating === 'titleEn' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    {lang === 'ar' ? 'ترجمة من العربية' : 'Translate from Arabic'}
                  </button>
                </div>
                <input
                  type="text"
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  placeholder="e.g. Royal Rooftop Salsa Social"
                  className={`w-full rounded-xl border ${urlRegex.test(titleAr) ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm text-white outline-none transition-colors shadow-inner`}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    {lang === 'ar' ? 'الوصف والمميزات (بالعربية)' : 'Description (Arabic)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTranslate(descEn, 'ar', setDescAr, 'descAr')}
                    disabled={!descEn || isTranslating === 'descAr'}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-neutral-900 border border-neutral-800 text-amber-500 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTranslating === 'descAr' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    {lang === 'ar' ? 'ترجمة من الإنجليزية' : 'Translate from English'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={descAr}
                  onChange={e => {
                    if (e.target.value.length <= 500) {
                      setDescAr(e.target.value);
                    }
                  }}
                  maxLength={500}
                  placeholder={lang === 'ar' ? 'تفاصيل الحفلة، أسماء المدربين، التعليمات، وقواعد اللبس (Dress Code)...' : 'Party details, instructor names, guidelines, dress code...'}
                  className={`w-full rounded-xl border ${urlRegex.test(descAr) ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm text-white outline-none transition-colors shadow-inner leading-relaxed`}
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
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    {lang === 'ar' ? 'الوصف والمميزات (بالإنجليزية)' : 'Description (English)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTranslate(descAr, 'en', setDescEn, 'descEn')}
                    disabled={!descAr || isTranslating === 'descEn'}
                    className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-neutral-900 border border-neutral-800 text-amber-500 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTranslating === 'descEn' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    {lang === 'ar' ? 'ترجمة من العربية' : 'Translate from Arabic'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={descEn}
                  onChange={e => {
                    if (e.target.value.length <= 500) {
                      setDescEn(e.target.value);
                    }
                  }}
                  maxLength={500}
                  placeholder="Party details, instructor names, guidelines, dress code..."
                  className={`w-full rounded-xl border ${urlRegex.test(descEn) ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm text-white outline-none transition-colors shadow-inner leading-relaxed`}
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

                {/* Uploaded File Confirmation / Preview & Progress */}
                {isUploadingMedia && (
                  <div className="mt-3 p-4 rounded-2xl bg-neutral-900 border border-amber-500/30 space-y-3 animate-pulse shadow-lg shadow-amber-500/5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <div className="flex items-center gap-2">
                        <span className="h-4.5 w-4.5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin inline-block shrink-0" />
                        <span>
                          {lang === 'ar' 
                            ? `جاري الرفع والتحميل: ${uploadProgress}%` 
                            : `Uploading & hosting: ${uploadProgress}%`}
                        </span>
                      </div>
                      <span className="font-mono text-xs">{uploadProgress}%</span>
                    </div>
                    {/* Glowing Progress bar track */}
                    <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        style={{ width: `${uploadProgress || 5}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                      {mediaType === 'image' 
                        ? (lang === 'ar' 
                            ? '⚡ تم ضغط وتحسين الصورة تلقائياً بالكامل في المتصفح لتوفير الباقة والرفع الفوري!' 
                            : '⚡ Image was automatically compressed client-side to guarantee an instant, data-saving upload!')
                        : (lang === 'ar' 
                            ? '💡 رفع الفيديو قد يستغرق بعض الوقت بناءً على سرعة الإنترنت وحجم الملف.' 
                            : '💡 Video uploads might take longer depending on your connection and file size.')}
                    </p>
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
                      className="text-neutral-400 hover:text-rose-400 font-mono text-[11px] underline shrink-0 transition-colors cursor-pointer"
                    >
                      {lang === 'ar' ? 'إزالة' : 'Remove'}
                    </button>
                  </div>
                )}

                {/* Helpful native video compressor tip */}
                {mediaType === 'video' && !isUploadingMedia && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[11px] text-neutral-400 space-y-1 font-sans animate-fade-in mt-1">
                    <span className="font-bold text-amber-400">💡 {lang === 'ar' ? 'نصيحة ذهبية لسرعة فائقة:' : 'Golden speed tip:'}</span>
                    <p className="leading-relaxed">
                      {lang === 'ar'
                        ? 'لرفع الفيديوهات من الموبايل بسرعة البرق، يُنصح دائماً بأن لا تزيد مدة الفيديو عن 15 ثانية وأن يكون حجمه صغيراً. يمكنك ضغطه في ثوانٍ بمجرد إرساله لنفسك على الواتساب ثم حفظه، حيث يقوم واتساب بضغط الفيديوهات تلقائياً لنسبة تزيد عن 90% مع الحفاظ على وضوحها التام!'
                        : 'For lightning-fast mobile uploads, keep video under 15 seconds. You can instantly compress it by sending it to yourself on WhatsApp first and saving it; WhatsApp automatically compresses videos by over 90% while keeping excellent clarity!'}
                    </p>
                  </div>
                )}

              </div>

              
              <div className="mt-4 p-4 rounded-xl bg-red-950/20 border border-red-500/30">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-400 font-bold leading-relaxed">
                    {lang === 'ar' ? (
                      <>
                        <p className="text-red-500 font-black mb-1">⚠️ تحذير أمني هام:</p>
                        <p>غير مسموح بإضافة روابط خارجية للصور أو الفيديوهات. يجب رفع الملفات مباشرة من جهازك.</p>
                        <p className="mt-1">يقوم النظام الآلي بفحص جميع الملفات المرفوعة بدقة. يُمنع منعاً باتاً رفع أي ملفات تحتوي على فيروسات، برمجيات خبيثة، أو أكواد ضارة (باتشات). في حال اكتشاف أي مخالفة، سيتم حظر حسابك نهائياً واتخاذ الإجراءات القانونية.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-red-500 font-black mb-1">⚠️ SECURITY WARNING:</p>
                        <p>External media links are not allowed. You must upload files directly from your device.</p>
                        <p className="mt-1">Our automated system rigorously scans all uploaded files. It is strictly prohibited to upload any files containing viruses, malware, or malicious code (patches). Any violation will result in a permanent account ban and legal action.</p>
                      </>
                    )}
                  </div>
                </div>
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
                  className={`w-full rounded-xl border ${mapsUrlError ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm font-mono text-white outline-none transition-colors shadow-inner`}
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
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  <span>{lang === 'ar' ? 'العنوان بالتفصيل (بالعربية)' : 'Detailed Address (Arabic)'}</span>
                </label>
                <input
                  type="text"
                  value={addressAr}
                  onChange={e => setAddressAr(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: العين السخنة، البحر الأحمر' : 'e.g. Ain Sokhna, Red Sea'}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  <span>{lang === 'ar' ? 'العنوان بالتفصيل (بالإنجليزية)' : 'Detailed Address (English)'}</span>
                </label>
                <input
                  type="text"
                  value={addressEn}
                  onChange={e => setAddressEn(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: Ain Sokhna, Red Sea' : 'e.g. Ain Sokhna, Red Sea'}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>{lang === 'ar' ? 'رابط موقع جوجل ماب (Google Maps Link)' : 'Google Maps Location Link'}</span>
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={e => setGoogleMapsUrl(e.target.value)}
                placeholder={lang === 'ar' ? 'ضع هنا رابط موقع الحدث من خرائط جوجل ماب' : 'Paste Google Maps location link here'}
                className={`w-full rounded-xl border ${mapsUrlError ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm font-mono text-white outline-none transition-colors shadow-inner`}
              />
              {mapsUrlError && (
                <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'هذا الرابط غير صحيح. يجب أن يكون رابطاً رسمياً من خرائط جوجل.' : 'Invalid link. Must be an official Google Maps link.'}
                </p>
              )}
              <p className="mt-1.5 text-[11px] text-neutral-400 leading-relaxed font-sans">
                {lang === 'ar'
                  ? '💡 انسخ رابط الموقع الجغرافي من تطبيق Google Maps وضعه هنا، ليتيح للزوار الانتقال الفوري لمكانك بضغطة زر واحدة!'
                  : '💡 Simply copy and paste the Google Maps location share link here, so attendees can navigate to your event instantly!'}
              </p>
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
                    {lang === 'ar' ? `اختر مدة اشتراك الإعلان (${adType === 'vip' ? 'مميز' : 'عادي'}) (بالأيام):` : `Select Ad Duration (${adType === 'vip' ? 'VIP' : 'Standard'}) (in Days):`}
                  </label>
                  <p className="text-xs text-neutral-400">
                    {lang === 'ar'
                      ? `الأسبوع الأول 7 أيام بقيمة ${pricing.basePrice} ج.م، وكل يوم إضافي بزيادة ${pricing.extraDayRate} ج.م`
                      : `First 7 days for ${pricing.basePrice} EGP, each extra day is +${pricing.extraDayRate} EGP`}
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
                    <span>{lang === 'ar' ? `تكلفة الأيام الإضافية (${pricing.extraDays} يوم × ${pricing.extraDayRate} ج.م):` : `Extra Days (${pricing.extraDays} days × ${pricing.extraDayRate} EGP):`}</span>
                    <span className="font-mono font-bold">+{pricing.extraPrice} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                  </div>
                )}

                {pricing.videoSurcharge > 0 && (
                  <div className="flex justify-between items-center text-amber-300 py-1 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? `إضافة إعلان فيديو (+${pricing.videoSurchargePercentage}% على القيمة):` : `Video Surcharge (+${pricing.videoSurchargePercentage}% of subtotal):`}</span>
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

          {/* Ad Placement Number & Ad Identifier - Admin Only */}
          {(user?.isAdmin || isAdminUnlocked) && (
            <div className="space-y-6 border-t border-white/5 pt-6 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-black text-amber-400 font-mono tracking-wider uppercase">
                  {lang === 'ar' ? 'إعدادات الإدارة (خاصة بك فقط)' : 'Admin Settings (Private)'}
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Ad Number Field */}
                <div className="rounded-2xl bg-neutral-950 p-5 border border-neutral-800/80 space-y-2">
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    {lang === 'ar' ? 'رقم الإعلان (المعرف)' : 'Ad Reference Number'}
                  </label>
                  <input
                    type="text"
                    value={adNumber}
                    onChange={e => setAdNumber(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: DWM-2026-001' : 'e.g. DWM-2026-001'}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner font-mono"
                  />
                  <p className="text-[10px] text-neutral-500 leading-tight">
                    {lang === 'ar' ? '💡 رقم المعرف الخاص بالإعلان للمراجعة.' : '💡 Unique identifier for this ad.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: Terms & Conditions Agreement & Checkbox */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase flex items-center justify-between">
              <span>{lang === 'ar' ? '7. اتفاقية الاستخدام والشروط والأحكام الخاصة بمنصة "Dance with me"' : '7. Terms & Conditions of "Dance with me" Platform'}</span>
            </h4>

            {/* Simplified Terms Summary / Trigger */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800/80 text-xs sm:text-sm text-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">
                    {lang === 'ar' ? 'مراجعة شروط النشر' : 'Review Publishing Terms'}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {lang === 'ar' ? 'يرجى قراءة الشروط لضمان قبول إعلانك' : 'Please read the terms to ensure ad approval'}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-500/50 hover:bg-neutral-800 text-amber-400 text-xs font-bold transition-all group"
              >
                <span>{lang === 'ar' ? 'عرض شروط النشر كاملة' : 'View Full Publishing Terms'}</span>
                {lang === 'ar' ? <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> : <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </button>
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

          
          {hasUrlViolation && (
            <div className="mb-6 p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/40 animate-pulse shadow-xl shadow-red-500/10">
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <ShieldCheck className="h-10 w-10 text-red-500" />
                <h3 className="text-lg font-black text-red-500">
                  {lang === 'ar' ? '⚠️ تحذير أمني: يمنع منعاً باتاً إضافة روابط خارجية' : '⚠️ Security Warning: External Links Strictly Prohibited'}
                </h3>
                <p className="text-sm font-bold text-red-400 max-w-lg leading-relaxed">
                  {lang === 'ar' 
                    ? 'لقد اكتشف نظام الحماية وجود رابط خارجي في العنوان أو الوصف. لقد تم إيقاف وإغلاق كافة أزرار المعاينة والنشر فوراً.' 
                    : 'The security system has detected an external link in the title or description. All preview and publish buttons have been immediately disabled.'}
                </p>
                <p className="text-xs font-bold text-neutral-400 mt-2 bg-neutral-950 px-4 py-2 rounded-xl border border-red-500/20">
                  {lang === 'ar' 
                    ? 'تنبيه: تكرار هذه المخالفة سيؤدي إلى إرسال تقرير فوري إلى إدارة التطبيق لاتخاذ الإجراءات القانونية اللازمة وحظر حسابك نهائياً.' 
                    : 'Notice: Repeating this violation will result in an immediate report to the app administration for legal action and permanent account ban.'}
                </p>
              </div>
            </div>
          )}
          {/* Actions Button Section */}
          <div className="pt-6 pb-12 sm:pb-16 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {editingEvent ? (
                <motion.button
                  whileHover={agreedToTerms && !isUploadingMedia && !hasUrlViolation ? { scale: 1.01 } : {}}
                  whileTap={agreedToTerms && !isUploadingMedia && !hasUrlViolation ? { scale: 0.98 } : {}}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!agreedToTerms || isUploadingMedia || hasUrlViolation || mapsUrlError) return;
                    handleFinalPublish();
                  }}
                  disabled={!agreedToTerms || isUploadingMedia || hasUrlViolation || mapsUrlError}
                  className={`w-full sm:w-auto min-w-[280px] rounded-2xl py-3 px-8 text-sm font-extrabold transition-all flex items-center justify-center gap-3 border ${
                    hasUrlViolation
                      ? 'hidden pointer-events-none'
                      : agreedToTerms
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-2xl gold-glow border-amber-300/40 cursor-pointer'
                      : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Sparkles className={`h-5 w-5 shrink-0 ${agreedToTerms && !isUploadingMedia ? 'fill-current animate-pulse-slow text-neutral-950' : 'text-neutral-600'}`} />
                  <span>
                    {isUploadingMedia
                      ? (lang === 'ar' ? 'جاري الحفظ والرفع...' : 'Saving & Uploading...')
                      : (lang === 'ar' ? 'أعد النشر وحفظ التعديلات' : 'Re-publish and Save')}
                  </span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={agreedToTerms && !hasUrlViolation ? { scale: 1.01 } : {}}
                  whileTap={agreedToTerms && !hasUrlViolation ? { scale: 0.98 } : {}}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!agreedToTerms || hasUrlViolation || mapsUrlError) return;
                    setCreateTab('preview');
                    setPreviewAlert(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={!agreedToTerms || hasUrlViolation || mapsUrlError}
                  className={`w-full sm:w-auto min-w-[280px] rounded-2xl py-3 px-8 text-sm font-extrabold transition-all flex items-center justify-center gap-3 border ${
                    hasUrlViolation
                      ? 'hidden pointer-events-none'
                      : agreedToTerms
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-2xl gold-glow border-amber-300/40 cursor-pointer'
                      : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Eye className={`h-5 w-5 shrink-0 ${agreedToTerms ? 'text-neutral-950' : 'text-neutral-600'}`} />
                  <span>
                    {lang === 'ar' ? 'معاينة الإعلان وتدقيق البيانات' : 'Preview Ad & Verify Details'}
                  </span>
                </motion.button>
              )}
            </div>
            
            {!agreedToTerms && (
              <p className="mt-3 text-center text-xs text-amber-400/80 font-medium">
                {lang === 'ar' 
                  ? '⚠️ يرجى الموافقة على الشروط والأحكام أعلاه لتفعيل زر معاينة الإعلان'
                  : '⚠️ Please agree to the publishing terms and conditions above to unlock the next step'}
              </p>
            )}
          </div>
        </form>
      </motion.div>
      )}
        </>
      )}

      {/* Full Terms Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-neutral-950/90 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-neutral-900 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <ShieldCheck className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {lang === 'ar' ? 'شروط وأحكام النشر' : 'Publishing Terms'}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">
                      {lang === 'ar' ? 'اتفاقية منصة Dance with me' : 'Dance with me Platform Agreement'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 leading-relaxed text-sm text-neutral-300 custom-scrollbar">
                {lang === 'ar' ? (
                  <div className="space-y-5">
                    <div className="font-bold text-amber-400 text-base border-b border-white/5 pb-3">
                      اتفاقية الاستخدام والشروط والأحكام الخاصة بمنصة "Dance with me"
                    </div>
                    
                    <div>
                      <span className="font-bold text-white block mb-2 text-base">تمهيد:</span>
                      <p className="text-neutral-300">
                        تُعد منصة "Dance with me" وسيطاً تقنياً يهدف إلى تقديم خدمات الإعلانات في مجال الفنون. بدخولك إلى التطبيق واستخدام خدماتنا، فإنك توافق بشكل صريح على الالتزام الكامل بهذه الشروط والأحكام.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5">
                        <span className="font-bold text-amber-300 block mb-2">1. الامتثال القانوني والتشريعي:</span>
                        <p className="text-xs sm:text-sm">
                          يقر المستخدم بأن كافة الأنشطة والخدمات المنشورة عبر المنصة تتوافق كلياً مع القوانين والتشريعات السارية في جمهورية مصر العربية، بما في ذلك قوانين مكافحة جرائم تقنية المعلومات، وقوانين حماية البيانات، وحقوق الملكية الفكرية، كما يؤكد التزامه التام بالأعراف والآداب العامة المتبعة في المجتمع المصري.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5">
                        <span className="font-bold text-amber-300 block mb-2">2. سياسة الإعلانات والرسوم:</span>
                        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm">
                          <li><strong className="text-white">رفض الإعلان:</strong> تلتزم المنصة بإعادة قيمة المبلغ المدفوع في حال رفضها لنشر الإعلان، وذلك دون الحاجة لإبداء أي أسباب تقتضيها سياسة المنصة للحفاظ على جودة المحتوى.</li>
                          <li><strong className="text-white">حذف الإعلان:</strong> لا يحق لصاحب الإعلان المطالبة بأي مبالغ مالية أو تعويضات في حال قام بحذف إعلانه طواعية قبل انتهاء المدة المتفق عليها.</li>
                          <li><strong className="text-white">تعديل الإعلان:</strong> لا يحق للمستخدم إجراء أي تعديلات على الإعلان بعد نشره إلا بعد الرجوع للمنصة والحصول على الموافقة الرسمية، ويُسمح بالتعديل لمرة واحدة فقط طوال فترة عرض الإعلان.</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5">
                        <span className="font-bold text-amber-300 block mb-2">3. الأمن السيبراني والأنشطة المحظورة:</span>
                        <p className="text-xs sm:text-sm">
                          في حال احتواء الإعلان على أي روابط مشبوهة، أو برمجيات خبيثة، أو محاولات اختراق (تهكير)، أو أي أنشطة تثير الشبهات في هذا السياق، يحق للمنصة حذف الإعلان فوراً دون أي تعويضات لصاحب الإعلان. كما يحق للمنصة في هذه الحالة حذف حساب المعلن نهائياً وحظره من استخدام المنصة.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5">
                        <span className="font-bold text-amber-300 block mb-2">4. ملكية المحتوى والمسؤولية:</span>
                        <p className="text-xs sm:text-sm">
                          يقر المستخدم بأن كافة المواد (صور، فيديوهات، نصوص) المنشورة عبر حسابه هي ملكية خاصة له أو يمتلك تصريحاً قانونياً بنشرها. كما يتحمل المستخدم المسؤولية الكاملة عن صحة ودقة البيانات المدرجة.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5">
                        <span className="font-bold text-amber-300 block mb-2">5. المحتوى المحظور:</span>
                        <p className="text-xs sm:text-sm">
                          يُحظر نشر أي محتوى يحرض على العنف أو الكراهية، أو أي محتوى منافٍ للآداب العامة، أو إعلانات لخدمات غير مرخصة، أو القيام بأي محاولات احتيال تقني أو مالي.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5">
                        <span className="font-bold text-amber-300 block mb-2">6. حدود المسؤولية والقانون:</span>
                        <p className="text-xs sm:text-sm">
                          تعمل المنصة كطرف ثالث (وسيط تقني)، ولا تتحمل أي مسؤولية قانونية أو مالية عن الاتفاقات التي تتم بين المستخدمين بشكل مباشر. تخضع هذه الاتفاقية للقوانين المصرية وتختص المحاكم المصرية وحدها بالنظر في أي نزاع.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="font-bold text-amber-400 text-base border-b border-white/5 pb-3">
                      Terms and Conditions of "Dance with me" Platform
                    </div>
                    
                    <div>
                      <span className="font-bold text-white block mb-2 text-base">Preamble:</span>
                      <p className="text-neutral-300">
                        The "Dance with me" platform acts as a technical intermediary aimed at providing advertising services in the arts sector. By entering the app and using our services, you agree to comply with these terms.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5">
                        <span className="font-bold text-amber-300 block mb-2">1. Legal Compliance:</span>
                        <p className="text-xs sm:text-sm">
                          User acknowledges that all activities comply with Egyptian laws, including cybercrime, data protection, and intellectual property laws, adhering to public morals.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5">
                        <span className="font-bold text-amber-300 block mb-2">2. Ads and Fees:</span>
                        <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm">
                          <li><strong>Rejection:</strong> Fees are refunded if an ad is rejected.</li>
                          <li><strong>Deletion:</strong> No refunds for voluntary deletion by the user.</li>
                          <li><strong>Modification:</strong> Allowed once with platform approval.</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-white/5">
                        <span className="font-bold text-amber-300 block mb-2">3. Prohibited Content:</span>
                        <p className="text-xs sm:text-sm">
                          Violence, hatred, immoral content, unlicensed services, and fraud are strictly prohibited.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-neutral-950/50 rounded-b-[2.5rem]">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold shadow-xl gold-glow transition-all active:scale-[0.98]"
                >
                  {lang === 'ar' ? 'فهمت وأوافق على هذه الشروط' : 'I Understand & Agree to These Terms'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

