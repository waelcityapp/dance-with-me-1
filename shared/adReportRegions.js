/** @type {Record<string, [string, string]>} */
export const adReportRegionLabels = {
  ALX: ['الإسكندرية', 'Alexandria'],
  ASN: ['أسوان', 'Aswan'],
  AST: ['أسيوط', 'Asyut'],
  BA: ['البحر الأحمر', 'Red Sea'],
  BH: ['البحيرة', 'Beheira'],
  BNS: ['بني سويف', 'Beni Suef'],
  C: ['القاهرة', 'Cairo'],
  DK: ['الدقهلية', 'Dakahlia'],
  DT: ['دمياط', 'Damietta'],
  FYM: ['الفيوم', 'Fayoum'],
  GH: ['الغربية', 'Gharbia'],
  GZ: ['الجيزة', 'Giza'],
  IS: ['الإسماعيلية', 'Ismailia'],
  JS: ['جنوب سيناء', 'South Sinai'],
  KB: ['القليوبية', 'Qalyubia'],
  KFS: ['كفر الشيخ', 'Kafr El Sheikh'],
  KN: ['قنا', 'Qena'],
  LX: ['الأقصر', 'Luxor'],
  MN: ['المنيا', 'Minya'],
  MNF: ['المنوفية', 'Monufia'],
  MT: ['مطروح', 'Matrouh'],
  PTS: ['بورسعيد', 'Port Said'],
  SHG: ['سوهاج', 'Sohag'],
  SHR: ['الشرقية', 'Sharqia'],
  SIN: ['شمال سيناء', 'North Sinai'],
  SUZ: ['السويس', 'Suez'],
  WAD: ['الوادي الجديد', 'New Valley'],
  outside: ['خارج مصر', 'Outside Egypt'],
  unknown: ['غير معروفة', 'Unknown'],
};

export function adReportRegion(headers) {
  const country = String(headers['x-vercel-ip-country'] ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || country === 'XX') return 'unknown';
  if (country !== 'EG') return 'outside';
  const region = String(headers['x-vercel-ip-country-region'] ?? '').trim().toUpperCase();
  return Object.hasOwn(adReportRegionLabels, region) ? region : 'unknown';
}
