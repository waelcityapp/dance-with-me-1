const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const target = `<h4 className="font-bold text-white text-sm mt-1 truncate">{ev.isEmpty ? (lang === 'ar' ? 'مساحة إعلان فارغة (تم المسح)' : 'Empty Ad Slot (Deleted)') : (lang === 'ar' ? ev.titleAr : ev.titleEn)}</h4>
                        <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span>💰 <strong className="text-white">{lang === 'ar' ? ev.priceAr : ev.priceEn}</strong></span>
                          <span>❤️ <strong className="text-white">{ev.likesCount}</strong> {lang === 'ar' ? 'إعجاب' : 'likes'}</span>
                          <span>📍 {lang === 'ar' ? ev.location?.nameAr : ev.location?.nameEn}</span>
                        </div>`;

const replace = `<h4 className="font-bold text-white text-sm mt-1 truncate">{ev.isEmpty ? (lang === 'ar' ? 'مساحة إعلان فارغة (تم المسح)' : 'Empty Ad Slot (Deleted)') : (lang === 'ar' ? ev.titleAr : ev.titleEn)}</h4>
                        {!ev.isEmpty && (
                          <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <span>💰 <strong className="text-white">{lang === 'ar' ? ev.priceAr : ev.priceEn}</strong></span>
                            <span>❤️ <strong className="text-white">{ev.likesCount}</strong> {lang === 'ar' ? 'إعجاب' : 'likes'}</span>
                            <span>📍 {lang === 'ar' ? ev.location?.nameAr : ev.location?.nameEn}</span>
                          </div>
                        )}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
