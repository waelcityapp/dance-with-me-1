import { DanceEvent } from '../types';

export const MODERN_FEATURED_EVENTS: DanceEvent[] = [
  {
    id: 'evt_hero_cairo_nights',
    titleAr: 'سهرة ليالي اللاتين والرقص الكبرى - القاهرة',
    titleEn: 'Grand Latin Dance & Salsa Night - Cairo',
    descriptionAr: 'أقوى سهرة لاتينية تجمع عشاق السالسا والباتشاتا والكيزومبا مع أفضل الـ DJs في أجواء ساحرة وموسيقى لايف.',
    descriptionEn: 'The biggest Latin dance night bringing together Salsa, Bachata, and Kizomba lovers with top DJs and live music.',
    eventDate: '2026-10-15T21:00:00Z',
    category: 'party',
    styles: ['Salsa', 'Bachata', 'Kizomba'],
    mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    priceAr: '350 ج.م شامل مشروب',
    priceEn: '350 EGP with drink',
    adType: 'vip',
    position: 1,
    viewsCount: 1840,
    likesCount: 342,
    location: {
      nameAr: 'رويال كلوب - الزمالك، القاهرة',
      nameEn: 'Royal Club - Zamalek, Cairo',
      addressAr: 'شارع الجزيرة، الزمالك',
      addressEn: 'Gezira St, Zamalek',
      googleMapsUrl: 'https://maps.google.com/?q=Zamalek,Cairo',
      lat: 30.0618,
      lng: 31.2185
    },
    contact: {
      organizerName: 'Cairo Latin Stars',
      phone: '01012345678',
      whatsapp: '201012345678'
    },
    uploadDate: new Date().toISOString()
  },
  {
    id: 'evt_party_rooftop_bachata',
    titleAr: 'سهرة الباتشاتا على الروف المطل على النيل',
    titleEn: 'Rooftop Bachata & Salsa Sunset Party',
    descriptionAr: 'استمتع بأروع إطلالة على النيل مع دروس تمهيدية وسوشيال دانس حتى منتصف الليل.',
    descriptionEn: 'Enjoy breathtaking Nile views with intro workshops and social dancing till midnight.',
    eventDate: '2026-10-22T20:00:00Z',
    category: 'party',
    styles: ['Bachata', 'Salsa'],
    mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80',
    mediaType: 'image',
    priceAr: '250 ج.م',
    priceEn: '250 EGP',
    adType: 'vip',
    position: 2,
    viewsCount: 1250,
    likesCount: 215,
    location: {
      nameAr: 'سكاي فيو روف بار - كورنيش المعادي',
      nameEn: 'Sky View Rooftop - Maadi Corniche',
      addressAr: 'كورنيش المعادي، القاهرة',
      addressEn: 'Maadi Corniche, Cairo',
      googleMapsUrl: 'https://maps.google.com/?q=Maadi,Cairo',
      lat: 29.9602,
      lng: 31.2569
    },
    contact: {
      organizerName: 'Nile Dance Community',
      phone: '01123456789',
      whatsapp: '201123456789'
    },
    uploadDate: new Date().toISOString()
  },
  {
    id: 'evt_expo_tech_design',
    titleAr: 'معرض القاهرة الدولي للفعاليات والفنون والتقنية 2026',
    titleEn: 'Cairo International Events & Tech Expo 2026',
    descriptionAr: 'الملتقى الأضخم لصناع الفعاليات والمصممين وشركات الإنتاج والتسويق الرقمي.',
    descriptionEn: 'The biggest gathering for event organizers, designers, production agencies, and digital tech.',
    eventDate: '2026-11-05T10:00:00Z',
    category: 'exhibition',
    styles: ['Salsa'],
    mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=700&q=80',
    mediaType: 'image',
    priceAr: 'دخول مجاني بالتسجيل',
    priceEn: 'Free with Registration',
    adType: 'vip',
    position: 3,
    viewsCount: 2400,
    likesCount: 410,
    location: {
      nameAr: 'مركز المنارة للمؤتمرات الدولية - التجمع الخامس',
      nameEn: 'Al Manara International Center - New Cairo',
      addressAr: 'محور المشير طنطاوي، القاهرة الجديدة',
      addressEn: 'El Moshir Axis, New Cairo',
      googleMapsUrl: 'https://maps.google.com/?q=Al+Manara,Cairo',
      lat: 30.0157,
      lng: 31.4288
    },
    contact: {
      organizerName: 'City Events Expo Egypt',
      phone: '01234567890',
      whatsapp: '201234567890'
    },
    uploadDate: new Date().toISOString()
  },
  {
    id: 'evt_course_masterclass',
    titleAr: 'كورس ماستركلاس الرقص اللاتيني الاحترافي',
    titleEn: 'Latin Dance Masterclass & Musicality Workshop',
    descriptionAr: 'برنامج تدريبي مكثف للمستويات المتوسطة والمتقدمة لتحسين التكنيك والاتزان والموسيقى مع مدربين معتمدين دولياً.',
    descriptionEn: 'Intensive masterclass for intermediate and advanced dancers covering technique, balance, and musicality.',
    eventDate: '2026-10-28T17:00:00Z',
    category: 'course',
    styles: ['Salsa', 'Bachata'],
    mediaUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1000&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=700&q=80',
    mediaType: 'image',
    priceAr: '600 ج.م',
    priceEn: '600 EGP',
    adType: 'vip',
    position: 4,
    viewsCount: 890,
    likesCount: 180,
    location: {
      nameAr: 'أكاديمية موشن دانس - مدينة نصر',
      nameEn: 'Motion Dance Academy - Nasr City',
      addressAr: 'شارع عباس العقاد، مدينة نصر',
      addressEn: 'Abbas El Akkad, Nasr City',
      googleMapsUrl: 'https://maps.google.com/?q=Nasr+City,Cairo',
      lat: 30.0561,
      lng: 31.3417
    },
    contact: {
      organizerName: 'Motion Academy',
      phone: '01099887766',
      whatsapp: '201099887766'
    },
    uploadDate: new Date().toISOString()
  },
  {
    id: 'evt_trip_redsea_festival',
    titleAr: 'مهرجان ورحلة الجونة اللاتينية على اليخت والريزورت',
    titleEn: 'El Gouna Latin Sea Retreat & Yacht Party',
    descriptionAr: '3 أيام من المرح والرقص في الجونة تشمل إقامة فندقية وسهرات شاطئية وحفلة يخت خاصة.',
    descriptionEn: '3 days of dance and relaxation in El Gouna including resort stay, beach parties, and private yacht cruise.',
    eventDate: '2026-11-18T10:00:00Z',
    category: 'trip',
    styles: ['Salsa', 'Bachata', 'Kizomba'],
    mediaUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=700&q=80',
    mediaType: 'image',
    priceAr: '3200 ج.م شامل الإقامة',
    priceEn: '3200 EGP All Inclusive',
    adType: 'vip',
    position: 5,
    viewsCount: 3100,
    likesCount: 580,
    location: {
      nameAr: 'مارينا الجونة - البحر الأحمر',
      nameEn: 'El Gouna Marina - Red Sea',
      addressAr: 'أبو تيج مارينا، الجونة',
      addressEn: 'Abu Tig Marina, El Gouna',
      googleMapsUrl: 'https://maps.google.com/?q=El+Gouna,Red+Sea',
      lat: 27.3976,
      lng: 33.6766
    },
    contact: {
      organizerName: 'Red Sea Adventures',
      phone: '01001122334',
      whatsapp: '201001122334'
    },
    uploadDate: new Date().toISOString()
  },
  {
    id: 'evt_party_alex_sea_view',
    titleAr: 'سهرة الإسكندرية الساحلية - إيقاعات الكاريبي',
    titleEn: 'Alexandria Coastal Latin Night - Caribbean Vibes',
    descriptionAr: 'سهرة خاصة على شاطئ البحر في الإسكندرية مع عروض استعراضية حية وفقرات دي جي عالمية.',
    descriptionEn: 'Special coastal night on Alexandria beachfront with live dance shows and international DJ sets.',
    eventDate: '2026-10-30T20:30:00Z',
    category: 'party',
    styles: ['Salsa', 'Bachata'],
    mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=700&q=80',
    mediaType: 'image',
    priceAr: '200 ج.م',
    priceEn: '200 EGP',
    adType: 'standard',
    position: 6,
    viewsCount: 940,
    likesCount: 160,
    location: {
      nameAr: 'شاطئ ستانلي - الإسكندرية',
      nameEn: 'Stanley Beach - Alexandria',
      addressAr: 'كوبري ستانلي، طريق الجيش، الإسكندرية',
      addressEn: 'Stanley Bridge, Corniche, Alexandria',
      googleMapsUrl: 'https://maps.google.com/?q=Stanley,Alexandria',
      lat: 31.2333,
      lng: 29.9500
    },
    contact: {
      organizerName: 'Alex Dance Hub',
      phone: '01223344556',
      whatsapp: '201223344556'
    },
    uploadDate: new Date().toISOString()
  }
];
