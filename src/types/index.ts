export type DanceCategory = 'all' | 'party' | 'course' | 'trip';

export type DanceStyle = 
  | 'Salsa' 
  | 'Bachata' 
  | 'Kizomba' 
  | 'Merengue' 
  | 'Tango' 
  | 'Zouk' 
  | 'Cha-Cha' 
  | 'Reggaeton' 
  | 'Ballroom' 
  | 'Mix & Latin' 
  | 'Arabic & Oriental';

export const ALL_DANCE_STYLES: DanceStyle[] = [
  'Salsa',
  'Bachata',
  'Kizomba',
  'Merengue',
  'Tango',
  'Zouk',
  'Cha-Cha',
  'Reggaeton',
  'Ballroom',
  'Mix & Latin',
  'Arabic & Oriental'
];

export function getStyleLabel(style: string, lang: string = 'ar'): string {
  if (style === 'Arabic & Oriental') {
    return lang === 'ar' ? 'منوعات عربي و شرقى' : 'Arabic & Oriental';
  }
  return style;
}

export interface ContactInfo {
  phone: string;
  whatsapp: string;
  instagram?: string;
  organizerName: string;
}

export interface LocationInfo {
  nameAr: string;
  nameEn: string;
  addressAr: string;
  addressEn: string;
  googleMapsUrl: string;
  lat: number;
  lng: number;
}

export interface PricingConfig {
  vip: {
    basePrice: number;
    extraDayPrice: number;
    videoSurchargePercentage: number;
  };
  standard: {
    basePrice: number;
    extraDayPrice: number;
    videoSurchargePercentage: number;
  };
}

export interface DanceEvent {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: 'party' | 'course' | 'trip';
  styles: DanceStyle[];
  mediaType: 'video' | 'image';
  mediaUrl: string;
  thumbnailUrl?: string;
  uploadDate: string; // ISO string e.g. "2026-07-01T10:00:00Z"
  eventDate: string;  // ISO string e.g. "2026-07-15T21:00:00Z"
  priceAr: string;
  priceEn: string;
  location: LocationInfo;
  contact: ContactInfo;
  likesCount: number;
  isFeatured?: boolean;
  isWeeklyPromo?: boolean;
  isExpiredBy15DaysRule?: boolean; // Calculated or manually overridden
  isPaused?: boolean;
  position?: number;
  adNumber?: string;
  adType?: 'vip' | 'standard';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  favoriteStyles: DanceStyle[];
  likedEventIds: string[];
  bookedEventIds: string[];
  isAdmin: boolean;
  createdAt: string;
  password?: string;
  isSuspended?: boolean;
}

export interface NotificationItem {
  id: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  date: string;
  read: boolean;
  type: 'new_party' | 'course_alert' | 'trip' | 'system' | 'expiry_warning' | 'support_reply';
  relatedEventId?: string;
  refNumber?: string;
}

export interface AdSubmission {
  id: string;
  invoiceNumber: string;
  advertiserId?: string;
  advertiserName: string;
  phone: string;
  titleAr: string;
  titleEn: string;
  category: 'party' | 'course' | 'trip';
  styles: DanceStyle[];
  mediaType: 'image' | 'video';
  mediaUrl: string;
  pricing: {
    days: number;
    subtotal: number;
    videoSurcharge: number;
    total: number;
  };
  adType?: 'vip' | 'standard';
  receiptImage?: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  submittedAt: string;
  reviewedAt?: string;
  expiresAt?: string;
  archivedAt?: string;
  renewalCount?: number;
  eventData?: Partial<DanceEvent>;
}

export interface SupportMessage {
  id: string;
  refNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAvatar?: string;
  message: string;
  status: 'pending' | 'replied';
  replyText?: string;
  createdAt: string;
  repliedAt?: string;
}

export interface EventBooking {
  id: string;
  eventId: string;
  eventTitleAr: string;
  eventTitleEn: string;
  eventPrice: number;
  userId: string;
  userName: string;
  userPhone: string;
  numberOfIndividuals: number;
  totalAmount: number;
  receiptImage: string;
  status: 'pending' | 'approved' | 'rejected';
  refNumber: string;
  submittedAt: string;
  reviewedAt?: string;
  barcodeUrl?: string;
  accessCode?: string;
  discountAmount?: number;
  adminNotes?: string;
}

export type Language = 'ar' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';
export type TabType = 'explore' | 'parties' | 'courses' | 'trips' | 'profile' | 'create_ad' | 'admin';
