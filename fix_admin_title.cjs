const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const target = `                        <h4 className="font-bold text-white text-sm mt-1 truncate">{lang === 'ar' ? ev.titleAr : ev.titleEn}</h4>`;
const replace = `                        <h4 className="font-bold text-white text-sm mt-1 truncate">{ev.isEmpty ? (lang === 'ar' ? 'مساحة إعلان فارغة (تم المسح)' : 'Empty Ad Slot (Deleted)') : (lang === 'ar' ? ev.titleAr : ev.titleEn)}</h4>`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
