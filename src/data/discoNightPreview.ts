import type { DanceEvent } from '../types';

export const showDiscoNightPreview =
  import.meta.env.DEV ||
  window.location.hostname === 'dance-with-me-1-git-ai-studio-cityeve-waelcityapps-projects.vercel.app';

export const discoNightPreview: DanceEvent = {
  id: 'disco-night-preview',
  titleAr: 'Disco Night – Free Dance',
  titleEn: 'Disco Night – Free Dance',
  descriptionAr: 'من ١٠ مساءً لوقت متأخر. لاتين، أفرو، أغاني إنجليزي، ريجيتون، عربي والمزيد. الدخول ٢٠٠ جنيه للفرد شامل زجاجة مياه صغيرة. للحجز ابعت اسمك وعدد الضيوف على واتساب.',
  descriptionEn: 'From 10:00 PM till late. Latin, Afro, English hits, reggaeton, Arabic and more. EGP 200 per person, including a small bottle of water. To reserve, send your name and guest count on WhatsApp.',
  category: 'party',
  styles: [],
  mediaType: 'image',
  mediaUrl: '/preview/disco-night.webp',
  uploadDate: '2026-11-22T00:00:00+02:00',
  eventDate: '2026-11-24T22:00:00+02:00',
  priceAr: '٢٠٠ جنيه للفرد',
  priceEn: 'EGP 200 per person',
  adType: 'standard',
  likesCount: 0,
  showViewsCount: false,
  showBookingButton: false,
  location: {
    nameAr: 'Blue Buzz Roof Top في Nile Lounge',
    nameEn: 'Blue Buzz Roof Top at Nile Lounge',
    addressAr: 'شارع عبد العزيز آل سعود، المنيل، الجيزة',
    addressEn: 'Abdel Aziz Al Saud Street, El Manial, Giza',
    googleMapsUrl: 'https://maps.app.goo.gl/CV4MsgcEoHGq39WBA',
    lat: 0,
    lng: 0,
  },
  contact: {
    organizerName: '',
    phone: '01010764256',
    whatsapp: '201010764256',
  },
};
