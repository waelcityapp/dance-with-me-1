const fs = require('fs');

const path = 'src/components/events/WeeklyPromoBanner.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /deleteEvent\(promoEvent\.id\);\s*setShowDeleteConfirm\(false\);/g,
  `deleteEvent(promoEvent.id);
                setShowDeleteConfirm(false);
                alert(lang === 'ar' ? 'تم حذف الإعلان نهائياً ولن يظهر للمستخدمين بعد الآن.' : 'Ad deleted successfully and is now hidden from users.');`
);

fs.writeFileSync(path, content);
console.log('WeeklyPromoBanner alerted');
