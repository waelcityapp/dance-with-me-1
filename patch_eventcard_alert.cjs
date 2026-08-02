const fs = require('fs');

const path = 'src/components/events/EventCard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /setShowDeleteConfirm\(false\);\s*deleteEvent\(event\.id\);/g,
  `setShowDeleteConfirm(false);
                  deleteEvent(event.id);
                  alert(lang === 'ar' ? 'تم حذف الإعلان نهائياً ولن يظهر للمستخدمين بعد الآن.' : 'Ad deleted successfully and is now hidden from users.');`
);

fs.writeFileSync(path, content);
console.log('EventCard alerted');
