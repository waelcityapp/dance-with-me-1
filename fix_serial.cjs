const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const target = `              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-2">`;

const replace = `              <div className="flex justify-end px-2 mb-2">
                <button
                  onClick={() => {
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
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'إصلاح الأرقام التسلسلية المفقودة' : 'Fix Missing Serial Numbers'}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-2">`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
