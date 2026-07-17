const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const target = `                  onClick={() => {
                    if (window.confirm(lang === 'ar' ? 'هل تريد تعيين أرقام تسلسلية للإعلانات القديمة التي لا تملك رقماً؟' : 'Assign serial numbers to old ads?')) {
                       let currentMax = events.reduce((max, ev) => (ev.position && ev.position !== 999999 && ev.position > max) ? ev.position : max, 0);
                       events.forEach(ev => {
                         if (!ev.position || ev.position === 999999) {
                           currentMax++;
                           saveEventToFirestore({ ...ev, position: currentMax });
                         }
                       });
                       alert('تم تحديث الأرقام التسلسلية بنجاح!');
                    }
                  }}`;

const replace = `                  onClick={() => {
                    if (window.confirm(lang === 'ar' ? 'هل تريد إعادة ترقيم جميع الإعلانات تسلسلياً (VIP أولاً)؟' : 'Renumber all ads sequentially?')) {
                       // Sort: VIP first, then by current position or upload date
                       const sortedEvents = [...events].sort((a, b) => {
                         if (a.isFeatured && !b.isFeatured) return -1;
                         if (!a.isFeatured && b.isFeatured) return 1;
                         const timeA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
                         const timeB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
                         return timeB - timeA;
                       });
                       
                       sortedEvents.forEach((ev, index) => {
                         const newPos = index + 1;
                         if (ev.position !== newPos) {
                           saveEventToFirestore({ ...ev, position: newPos });
                         }
                       });
                       alert('تم تحديث الأرقام التسلسلية لجميع الإعلانات بنجاح!');
                    }
                  }}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
