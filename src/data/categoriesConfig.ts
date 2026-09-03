import React from 'react';
import { Sparkles, Music, GraduationCap, Palmtree, Building2, Ticket, Mic2, Compass, Theater, Smile, Flame, Radio, Users, Palette, PartyPopper } from 'lucide-react';
import { DanceCategory } from '../types';

export interface SubCategoryItem {
  id: string;
  labelAr: string;
  labelEn: string;
  aliases?: string[]; // for backwards compatibility matching with existing event styles (e.g. Salsa, Bachata -> Latin)
}

export interface MainCategoryConfig {
  id: DanceCategory;
  labelAr: string;
  labelEn: string;
  icon: string;
  activeBorder: string;
  activeShadow: string;
  activeBadge: string;
  iconColor: string;
  iconBg: string;
  subcategories: SubCategoryItem[];
}

export const PARTY_SUBCATEGORIES: SubCategoryItem[] = [
  { id: 'concerts', labelAr: 'حفلات موسيقية', labelEn: 'Music Concerts' },
  { id: 'oriental_western', labelAr: 'حفلات شرقية وغربية', labelEn: 'Oriental & Western Nights', aliases: ['Arabic & Oriental'] },
  { id: 'latin', labelAr: 'حفلات لاتينية', labelEn: 'Latin Dance Nights', aliases: ['Salsa', 'Bachata', 'Kizomba', 'Merengue', 'Tango', 'Zouk', 'Cha-Cha', 'Reggaeton', 'Ballroom', 'Mix & Latin'] },
  { id: 'opera_classical', labelAr: 'حفلات الأوبرا والموسيقى الكلاسيكية', labelEn: 'Opera & Classical Music' },
  { id: 'theatre', labelAr: 'مسرحيات وعروض مسرحية', labelEn: 'Plays & Theater' },
  { id: 'comedy', labelAr: 'عروض كوميدية وستاند أب', labelEn: 'Stand-up Comedy' },
  { id: 'festivals', labelAr: 'مهرجانات وفعاليات كبرى', labelEn: 'Festivals & Major Events' },
  { id: 'dance_performances', labelAr: 'عروض راقصة واستعراضية', labelEn: 'Dance Performances' },
  { id: 'dj_electronic', labelAr: 'حفلات دي جي وموسيقى إلكترونية', labelEn: 'DJ & Electronic Nights' },
  { id: 'family_kids', labelAr: 'فعاليات عائلية وأطفال', labelEn: 'Family & Kids Events' },
  { id: 'cultural_art', labelAr: 'فعاليات ثقافية وفنية', labelEn: 'Cultural & Art Events' },
  { id: 'general_party', labelAr: 'حفلات وفعاليات متنوعة', labelEn: 'Miscellaneous Events' },
];

export const COURSE_SUBCATEGORIES: SubCategoryItem[] = [
  { id: 'dance_courses', labelAr: 'كورسات رقص ولاتين', labelEn: 'Dance & Latin Classes', aliases: ['Salsa', 'Bachata', 'Kizomba', 'Tango'] },
  { id: 'music_courses', labelAr: 'تعليم موسيقى وغناء', labelEn: 'Music & Vocal Lessons' },
  { id: 'art_crafts', labelAr: 'فنون ورسم وتصميم', labelEn: 'Art & Design Workshops' },
  { id: 'fitness_wellness', labelAr: 'لياقة ويوجا وزومبا', labelEn: 'Fitness & Yoga' },
  { id: 'general_courses', labelAr: 'ورش عمل متنوعة', labelEn: 'General Workshops' },
];

export const TRIP_SUBCATEGORIES: SubCategoryItem[] = [
  { id: 'day_trips', labelAr: 'رحلات اليوم الواحد', labelEn: 'Day Trips' },
  { id: 'camping_adventure', labelAr: 'معسكرات وسفاري', labelEn: 'Camping & Safari' },
  { id: 'dance_trips', labelAr: 'رحلات رقص وسهرات', labelEn: 'Dance Getaways' },
  { id: 'sightseeing', labelAr: 'جولات سياحية وثقافية', labelEn: 'Sightseeing Tours' },
];

export const EXHIBITION_SUBCATEGORIES: SubCategoryItem[] = [
  { id: 'trade_fairs', labelAr: 'معارض تجارية وتسوق', labelEn: 'Trade & Shopping Fairs' },
  { id: 'art_exhibitions', labelAr: 'معارض فنون تشكيلية', labelEn: 'Art Exhibitions' },
  { id: 'conferences', labelAr: 'مؤتمرات ومنتديات أعمال', labelEn: 'Business Conferences' },
  { id: 'book_cultural_fairs', labelAr: 'معارض كتب وثقافة', labelEn: 'Book & Cultural Fairs' },
];

export const SERVICE_SUBCATEGORIES: SubCategoryItem[] = [
  { id: 'wedding_halls', labelAr: 'قاعات أفراح ومناسبات', labelEn: 'Wedding Halls & Venues' },
  { id: 'sound_light', labelAr: 'تجهيزات صوت وإضاءة وشاشات', labelEn: 'Sound, Light & LED Screens' },
  { id: 'wedding_planners', labelAr: 'شركات تنظيم ومصممي أفراح', labelEn: 'Event & Wedding Planners' },
  { id: 'catering', labelAr: 'كاترنج وبوفيهات المأكولات', labelEn: 'Catering & Food Services' },
  { id: 'transportation', labelAr: 'تأجير باصات ونقل ضيوف', labelEn: 'Buses & Transportation' },
  { id: 'decor_farasha', labelAr: 'تجهيزات فراشة وديكورات', labelEn: 'Event Decor & Furniture' },
  { id: 'media_photography', labelAr: 'تصوير فيديو وفوتوجرافي بورتفوليو', labelEn: 'Event Photography & Video' },
  { id: 'security_hosts', labelAr: 'شركات أمن وتنظيم وحراسات', labelEn: 'Security & Crowd Management' },
];

export const JOB_SUBCATEGORIES: SubCategoryItem[] = [
  { id: 'event_organizers', labelAr: 'منظمين ومشرفي حشود (USHER)', labelEn: 'Event Organizers & Ushers' },
  { id: 'photographers_videographers', labelAr: 'مصورين ومونتير', labelEn: 'Photographers & Videographers' },
  { id: 'djs_sound_tech', labelAr: 'دي جي وفنيين صوت وإضاءة', labelEn: 'DJs & Sound Technicians' },
  { id: 'waiters_catering', labelAr: 'ويترز وطباخين كاترنج', labelEn: 'Waiters & Catering Staff' },
  { id: 'drivers_logistics', labelAr: 'سائقين ودعم لوجستي', labelEn: 'Drivers & Logistics Support' },
  { id: 'dancers_performers', labelAr: 'عارضين ومؤدي استعراضات', labelEn: 'Performers & Dancers' },
  { id: 'security_guards', labelAr: 'أفراد أمن وحراسات تنظيمية', labelEn: 'Security Guards & Bouncers' },
];

export function getSubcategoriesForCategory(category: DanceCategory): SubCategoryItem[] {
  switch (category) {
    case 'party':
      return PARTY_SUBCATEGORIES;
    case 'course':
      return COURSE_SUBCATEGORIES;
    case 'trip':
      return TRIP_SUBCATEGORIES;
    case 'exhibition':
      return EXHIBITION_SUBCATEGORIES;
    case 'services':
      return SERVICE_SUBCATEGORIES;
    case 'jobs':
      return JOB_SUBCATEGORIES;
    case 'all':
    default:
      return PARTY_SUBCATEGORIES;
  }
}
