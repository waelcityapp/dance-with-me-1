import { DanceEvent, NotificationItem, UserProfile } from '../types';
import { DEFAULT_NEUTRAL_AVATAR } from '../utils/avatars';

export const MOCK_EVENTS: DanceEvent[] = [
  {
    id: 'weekly-promo-1',
    titleAr: 'مهرجان هافانا نايتس الملكي للسالسا والباتشاتا (فيديو الأسبوع)',
    titleEn: 'Havana Nights Royal Salsa & Bachata Gala (Weekly Video)',
    descriptionAr: 'الحدث الأضخم هذا الأسبوع! سهرة استثنائية على سطح فندق ريتز كارلتون مع أشهر دي جي لاتيني في الشرق الأوسط وعروض حية من أبطال العالم في السالسا والباتشاتا. تذاكر محدودة جداً مع مشروب ترحيبي مجاني.',
    descriptionEn: 'The biggest Latin event of the week! An exclusive rooftop night at The Ritz-Carlton featuring top international Latin DJs and live shows by world Salsa & Bachata champions. Very limited VIP tickets include complimentary welcome drinks.',
    category: 'party',
    styles: ['Salsa', 'Bachata', 'Cha-Cha'],
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', // Safe reliable sample mp4 loop
    thumbnailUrl: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80',
    uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago (13 days remaining)
    eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days in future
    priceAr: '350 ج.م / للشخص (شامل مشروب)',
    priceEn: '350 EGP / person (includes drink)',
    location: {
      nameAr: 'فندق ريتز كارلتون - الروف توب تراس',
      nameEn: 'The Ritz-Carlton - Rooftop Terrace',
      addressAr: 'كورنيش النيل، وسط البلد، القاهرة',
      addressEn: 'Nile Corniche, Downtown, Cairo',
      googleMapsUrl: 'https://maps.google.com/?q=30.0444,31.2357',
      lat: 30.0444,
      lng: 31.2357
    },
    contact: {
      phone: '+201012345678',
      whatsapp: '201012345678',
      instagram: 'dancewithme_luxury',
      organizerName: 'كارلوس وأكاديمية DWM'
    },
    likesCount: 284,
    isFeatured: true,
    isWeeklyPromo: true
  },
  {
    id: 'course-bachata-sensual',
    titleAr: 'كورس الباتشاتا سينشوال المتقدم (4 أسابيع مع أليكس)',
    titleEn: 'Sensual Bachata Masterclass (4-Week Intensive with Alex)',
    descriptionAr: 'برنامج تدريبي مكثف لنقل مهاراتك في الباتشاتا إلى المستوى الاحترافي. التركيز على قيادة الجسم (Body Movement)، التناغم الموسيقي، وحركات التموج السلسة. يتطلب معرفة أساسيات الباتشاتا.',
    descriptionEn: 'An intensive 4-week training program to take your Bachata skills to the professional level. Focus on body movement, musicality, and smooth isolations. Basic Bachata knowledge required.',
    category: 'course',
    styles: ['Bachata', 'Zouk'],
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago (10 days remaining)
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Starts in 7 days
    priceAr: '1,800 ج.م / للكورس بالكامل (8 محاضرات)',
    priceEn: '1,800 EGP / Full Course (8 Sessions)',
    location: {
      nameAr: 'أستوديو DWM للرقص - فرع الزمالك',
      nameEn: 'DWM Dance Studio - Zamalek Branch',
      addressAr: 'شارع شجرة الدر، الزمالك، القاهرة',
      addressEn: 'Shagaret El Dor St, Zamalek, Cairo',
      googleMapsUrl: 'https://maps.google.com/?q=30.0626,31.2220',
      lat: 30.0626,
      lng: 31.2220
    },
    contact: {
      phone: '+201122334455',
      whatsapp: '201122334455',
      instagram: 'dwm_bachata',
      organizerName: 'أكاديمية DWM - قسم الباتشاتا'
    },
    likesCount: 156,
    isFeatured: false
  },
  {
    id: 'trip-red-sea-kizomba',
    titleAr: 'رحلة ومعسكر الكيزومبا والزوك على شواطئ الجونة (3 أيام لاتينية)',
    titleEn: 'Red Sea Kizomba & Zouk Beach Retreat (3-Day Latin Camp)',
    descriptionAr: 'اهرب من صخب المدينة وانضم إلينا في معسكر رقص استجمامي في منتجع الجونة الساحر. تشمل الرحلة إقامة 3 أيام، ورش عمل صباحية على البيلج، وحفلات غروب وسهرات ليلية على إيقاعات الكيزومبا والأفرو بيتس.',
    descriptionEn: 'Escape the city rush and join us for an immersive beachfront dance retreat in El Gouna. Includes 3 days accommodation, morning beach workshops, sunset socials, and all-night Kizomba & Afrobeats parties.',
    category: 'trip',
    styles: ['Kizomba', 'Zouk', 'Reggaeton'],
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (14 days remaining)
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // In 2 weeks
    priceAr: '5,500 ج.م (شامل الإقامة والتنقلات والحفلات)',
    priceEn: '5,500 EGP (All-inclusive stay, transport & parties)',
    location: {
      nameAr: 'منتجع وكاسا كوك - الجونة، البحر الأحمر',
      nameEn: 'Casa Cook Resort - El Gouna, Red Sea',
      addressAr: 'مارينا الجونة، البحر الأحمر، مصر',
      addressEn: 'El Gouna Marina, Red Sea, Egypt',
      googleMapsUrl: 'https://maps.google.com/?q=27.3952,33.6769',
      lat: 27.3952,
      lng: 33.6769
    },
    contact: {
      phone: '+201234567890',
      whatsapp: '201234567890',
      instagram: 'dwm_trips',
      organizerName: 'فريق DWM للمغامرات والرحلات'
    },
    likesCount: 392,
    isFeatured: true
  },
  {
    id: 'course-salsa-cubana',
    titleAr: 'دورة أساسيات السالسا الكوبية وريدا دي كازينو للمبتدئين',
    titleEn: 'Cuban Salsa & Rueda de Casino Beginners Bootcamp',
    descriptionAr: 'هل ترغب في الرقص بثقة في الحفلات؟ هذه الدورة مصممة خصيصاً من الصفر لتعلم خطوات السالسا الأساسية، الإيقاع الكوبي، وكيفية الرقص الجماعي الممتع (ريدا دي كازينو). لا يشترط وجود شريك رقص!',
    descriptionEn: 'Want to dance with confidence at social parties? This bootcamp is designed from scratch to teach fundamental Salsa steps, Cuban timing, and fun group Rueda dancing. No partner required!',
    category: 'course',
    styles: ['Salsa', 'Merengue'],
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
    uploadDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago (7 days remaining)
    eventDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    priceAr: '1,200 ج.م / للشهر (8 جلسات)',
    priceEn: '1,200 EGP / Month (8 Sessions)',
    location: {
      nameAr: 'أستوديو DWM للرقص - فرع مصر الجديدة',
      nameEn: 'DWM Dance Studio - Heliopolis Branch',
      addressAr: 'شارع الميرغني، مصر الجديدة، القاهرة',
      addressEn: 'El Merghany St, Heliopolis, Cairo',
      googleMapsUrl: 'https://maps.google.com/?q=30.0888,31.3323',
      lat: 30.0888,
      lng: 31.3323
    },
    contact: {
      phone: '+201099887766',
      whatsapp: '201099887766',
      instagram: 'salsa_cairo',
      organizerName: 'رامي وفريق السالسا الكوبية'
    },
    likesCount: 198,
    isFeatured: false
  },
  {
    id: 'party-midnight-tango',
    titleAr: 'سهرة التانغو الأرجنتيني والميرينغي الكلاسيكية في المعادي',
    titleEn: 'Classic Argentine Tango & Merengue Social Night',
    descriptionAr: 'سهرة كلاسيكية فاخرة لعشاق التانغو والميرينغي الهادئ في جو رومانسي على ضوء الشموع. الموسيقى الحية تعزفها فرقة أوركسترا بوينس آيرس الزائرة. اللبس الرسمي (Formal Elegance) مطلوب.',
    descriptionEn: 'A luxury classic night for tango lovers in a romantic candlelight ambiance. Featuring live music by visiting Buenos Aires orchestra. Formal elegance dress code applies.',
    category: 'party',
    styles: ['Tango', 'Merengue', 'Bachata'],
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=80',
    uploadDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), // 11 days ago (4 days remaining)
    eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priceAr: '400 ج.م (شامل البوفيه الخفيف)',
    priceEn: '400 EGP (Includes light tapas)',
    location: {
      nameAr: 'نادي المعادي الملكي - القاعة الكبرى',
      nameEn: 'Maadi Royal Club - Grand Hall',
      addressAr: 'شارع 9، المعادي، القاهرة',
      addressEn: 'Road 9, Maadi, Cairo',
      googleMapsUrl: 'https://maps.google.com/?q=29.9602,31.2569',
      lat: 29.9602,
      lng: 31.2569
    },
    contact: {
      phone: '+201555443322',
      whatsapp: '201555443322',
      instagram: 'tango_egypt',
      organizerName: 'صالون التانغو الكلاسيكي بالقاهرة'
    },
    likesCount: 142,
    isFeatured: false
  },
  // Expired demo event (> 15 days ago) to showcase the automatic cleanup feature!
  {
    id: 'expired-demo-event',
    titleAr: 'مهرجان الصيف اللاتيني السابق (منتهي)',
    titleEn: 'Past Summer Latin Festival (Ended)',
    descriptionAr: 'هذا الحدث انتهى موعده وتم نقله لأرشيف الفعاليات السابقة. يمكنك تصفح الصور والفيديوهات الخاصة بالمهرجان.',
    descriptionEn: 'This event has concluded and moved to past events archive. You can browse videos and photos from the festival.',
    category: 'party',
    styles: ['Salsa', 'Reggaeton'],
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    uploadDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days ago! Expired!
    eventDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    priceAr: 'انتهت الفعالية',
    priceEn: 'Event Completed',
    location: {
      nameAr: 'أوبرا دبي - قاعة العروض',
      nameEn: 'Dubai Opera - Exhibition Hall',
      addressAr: 'بوليفارد محمد بن راشد، دبي',
      addressEn: 'Sheikh Mohammed bin Rashid Blvd, Dubai',
      googleMapsUrl: 'https://maps.google.com/?q=25.1972,55.2744',
      lat: 25.1972,
      lng: 55.2744
    },
    contact: {
      phone: '+971501234567',
      whatsapp: '971501234567',
      organizerName: 'إدارة أوبرا اللاتيني'
    },
    likesCount: 512,
    isFeatured: false,
    isExpiredBy15DaysRule: true
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    titleAr: '🔥 تم نشر فيديو الأسبوع الجديد!',
    titleEn: '🔥 New Weekly Video Uploaded!',
    messageAr: 'شاهد الآن فيديو مهرجان هافانا نايتس الملكي للسالسا والباتشاتا على سطح فندق ريتز كارلتون وبادر بحجز مقعدك قبل نفاد التذاكر.',
    messageEn: 'Watch the Havana Nights Royal Salsa & Bachata Gala weekly video and book your VIP tickets before they sell out.',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    type: 'new_party',
    relatedEventId: 'weekly-promo-1'
  },
  {
    id: 'notif-2',
    titleAr: '💃 خصم مبكر على كورس الباتشاتا سينشوال',
    titleEn: '💃 Early Bird Discount on Bachata Masterclass',
    messageAr: 'احصل على خصم 15% عند حجز كورس أليكس قبل منتصف الليل. المقاعد المتبقية: 6 مقاعد فقط.',
    messageEn: 'Get 15% off when booking Alex masterclass before midnight. Only 6 spots left.',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: false,
    type: 'course_alert',
    relatedEventId: 'course-bachata-sensual'
  },
  {
    id: 'notif-3',
    titleAr: '⏳ انتهاء فترة عرض الإعلان',
    titleEn: '⏳ Promo Display Period Ended',
    messageAr: 'انتهت مدة عرض إعلان "مهرجان الصيف اللاتيني" وتم نقله إلى الأرشيف.',
    messageEn: 'The promotional display for "Past Summer Latin Festival" has concluded and moved to archive.',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    read: true,
    type: 'expiry_warning'
  },
  {
    id: 'notif-4',
    titleAr: '🌴 رحلة كيزومبا البحر الأحمر في انتظارك',
    titleEn: '🌴 Red Sea Kizomba Retreat Awaits',
    messageAr: 'تم فتح باب التسجيل لمعسكر الجونة للرقص اللاتيني. شامل الإقامة والحفلات وورش العمل.',
    messageEn: 'Registration is now open for the El Gouna Latin Dance Retreat. Includes stay, parties & workshops.',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    type: 'trip',
    relatedEventId: 'trip-red-sea-kizomba'
  }
];

export const MOCK_USER_DEFAULT: UserProfile = {
  id: 'user-carlos-vip',
  name: 'عضو النادي (VIP)',
  email: 'member@dwm.app',
  phone: '+201099887766',
  avatar: DEFAULT_NEUTRAL_AVATAR,
  favoriteStyles: ['Salsa', 'Bachata', 'Kizomba'],
  likedEventIds: ['weekly-promo-1', 'trip-red-sea-kizomba'],
  bookedEventIds: ['weekly-promo-1'],
  isAdmin: true,
  createdAt: new Date().toISOString()
};
