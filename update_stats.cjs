const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const target1 = `              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-2">
                <span>{lang === 'ar' ? \`مجموعة الفعاليات والحفلات المخزنة (\${events.length} وثيقة في Firestore)\` : \`Stored Events Collection (\${events.length} docs in Firestore)\`}</span>
                <span className="font-mono text-[11px] text-blue-400 select-all">/databases/(default)/documents/events</span>
              </div>`;

const replace1 = `              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 px-2">
                <span>{lang === 'ar' ? \`مجموعة الفعاليات والحفلات المخزنة (\${events.length} وثيقة في Firestore)\` : \`Stored Events Collection (\${events.length} docs in Firestore)\`}</span>
                <span className="font-mono text-[11px] text-blue-400 select-all">/databases/(default)/documents/events</span>
              </div>
              
              {/* Event Stats */}
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                   <span className="text-xl font-black text-blue-400">{events.length}</span>
                   <span className="text-[10px] text-neutral-400 font-bold uppercase mt-1 text-center">{lang === 'ar' ? 'إجمالي الإعلانات' : 'Total Ads'}</span>
                </div>
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                   <span className="text-xl font-black text-red-400">{events.filter(e => e.isEmpty).length}</span>
                   <span className="text-[10px] text-neutral-400 font-bold uppercase mt-1 text-center">{lang === 'ar' ? 'إعلانات مفرغة (محذوفة)' : 'Empty Ads'}</span>
                </div>
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                   <span className="text-xl font-black text-amber-400">{events.filter(e => e.isPaused).length}</span>
                   <span className="text-[10px] text-neutral-400 font-bold uppercase mt-1 text-center">{lang === 'ar' ? 'موقوفة (مخفية)' : 'Paused (Hidden)'}</span>
                </div>
              </div>`;

code = code.replace(target1, replace1);

const target2 = `                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-blue-400 font-bold select-all">{ev.id}</span>`;

const replace2 = `                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono" title={lang === 'ar' ? 'الرقم التسلسلي' : 'Serial Number'}>
                             #{ev.position && ev.position !== 999999 ? ev.position : '-'}
                          </span>
                          <span className="font-mono text-[10px] text-neutral-500 font-bold select-all">{ev.id}</span>`;

// Replace globally or just the first occurrence if we are sure
code = code.replace(target2, replace2);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
