const fs = require('fs');

const path = 'src/components/admin/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const confirmed = await triggerConfirm\(lang === 'ar' \? 'هل أنت متأكد من مسح هذه الفعالية وتفريغ الخانة؟' : 'Are you sure you want to delete this event and empty the slot\?'\);\s*if \(confirmed\) \{\s*deleteEvent\(ev\.id\);\s*\}/g,
  `const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من مسح بيانات هذه الفعالية بالكامل وتفريغ الخانة؟ لن تظهر للمستخدمين بعد الآن.' : 'Are you sure you want to delete this event data and empty the slot? It will no longer show to users.');
                          if (confirmed) {
                            deleteEvent(ev.id);
                            alert(lang === 'ar' ? 'تم مسح الإعلان بنجاح وتفريغ الخانة! لن يظهر للمستخدمين.' : 'Ad deleted and slot emptied successfully! It is now hidden from users.');
                          }`
);

content = content.replace(
  /const confirmed = await triggerConfirm\(lang === 'ar' \? 'هل أنت متأكد من حذف هذه الفعالية من قاعدة البيانات؟' : 'Are you sure you want to delete this event from DB\?'\);\s*if \(confirmed\) \{\s*deleteEvent\(ev\.id\);\s*\}/g,
  `const confirmed = await triggerConfirm(lang === 'ar' ? 'هل أنت متأكد من مسح بيانات هذه الفعالية بالكامل وتفريغ الخانة؟ لن تظهر للمستخدمين بعد الآن.' : 'Are you sure you want to delete this event data and empty the slot? It will no longer show to users.');
                          if (confirmed) {
                            deleteEvent(ev.id);
                            alert(lang === 'ar' ? 'تم مسح الإعلان بنجاح وتفريغ الخانة! لن يظهر للمستخدمين.' : 'Ad deleted and slot emptied successfully! It is now hidden from users.');
                          }`
);

fs.writeFileSync(path, content);
console.log('AdminPanel patched');
