const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const fullscreenOverlay = `
      {/* Fullscreen Events List Overlay */}
      {isFullscreenEvents && (
        <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col">
          <div className="p-4 bg-neutral-900 border-b border-white/10 flex items-center justify-between shadow-md shrink-0">
             <div className="flex items-center gap-4">
               <h2 className="text-xl font-black text-amber-500">
                 {lang === 'ar' ? 'إدارة الإعلانات (عرض مكبر)' : 'Ads Management (Expanded)'}
               </h2>
               <div className="flex gap-3">
                 <div className="bg-neutral-800 rounded-lg px-3 py-1 flex items-center gap-2">
                   <span className="text-blue-400 font-bold">{events.length}</span>
                   <span className="text-xs text-neutral-400">{lang === 'ar' ? 'إجمالي' : 'Total'}</span>
                 </div>
                 <div className="bg-neutral-800 rounded-lg px-3 py-1 flex items-center gap-2">
                   <span className="text-red-400 font-bold">{events.filter(e => e.isEmpty).length}</span>
                   <span className="text-xs text-neutral-400">{lang === 'ar' ? 'مفرغ' : 'Empty'}</span>
                 </div>
               </div>
             </div>
             <button
               onClick={() => setIsFullscreenEvents(false)}
               className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white hover:bg-red-500/80 transition-all"
             >
               <Minimize2 className="h-6 w-6" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {events.map((ev) => (
                  <div key={ev.id} className={\`flex flex-col gap-4 p-5 sm:p-6 rounded-3xl bg-neutral-900/90 border \${ev.isEmpty ? 'border-red-500/40 opacity-70' : 'border-white/10 hover:border-blue-500/40'} transition-all shadow-xl\`}>
                    <div className="flex items-start gap-4">
                      {ev.isEmpty ? (
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-neutral-800 border-2 border-red-500/20 flex flex-col items-center justify-center shrink-0 shadow-lg">
                           <span className="text-xs font-bold text-red-400 mb-1">فارغ</span>
                           <span className="text-[10px] text-neutral-500">Deleted</span>
                        </div>
                      ) : (
                        <img src={ev.thumbnailUrl || ev.mediaUrl} alt="" className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border border-white/10 shrink-0 shadow-lg" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="px-2 py-1 rounded-md text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono shadow-sm" title={lang === 'ar' ? 'الرقم التسلسلي' : 'Serial Number'}>
                             #{ev.position && ev.position !== 999999 ? ev.position : '-'}
                          </span>
                          <span className="font-mono text-[10px] sm:text-xs text-neutral-500 font-bold select-all">{ev.id}</span>
                        </div>
                        <h4 className="font-bold text-white text-base sm:text-lg leading-tight line-clamp-2">
                           {ev.isEmpty ? (lang === 'ar' ? 'مساحة إعلان فارغة (تم المسح)' : 'Empty Ad Slot (Deleted)') : (lang === 'ar' ? ev.titleAr : ev.titleEn)}
                        </h4>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                           <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-neutral-800 text-neutral-300 uppercase tracking-wider">{ev.category}</span>
                           {ev.isFeatured && !ev.isEmpty && <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">VIP</span>}
                        </div>
                      </div>
                    </div>
                    
                    {!ev.isEmpty && (
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-neutral-400 bg-neutral-950/50 p-3 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5">{lang === 'ar' ? 'السعر' : 'Price'}</span>
                           <span className="font-bold text-emerald-400 truncate">{lang === 'ar' ? ev.priceAr : ev.priceEn}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5">{lang === 'ar' ? 'المكان' : 'Location'}</span>
                           <span className="text-white truncate">{lang === 'ar' ? ev.location?.nameAr : ev.location?.nameEn}</span>
                        </div>
                        <div className="flex flex-col mt-1">
                           <span className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5">{lang === 'ar' ? 'التفاعل' : 'Engagement'}</span>
                           <span className="text-pink-400 font-bold">❤️ {ev.likesCount} {lang === 'ar' ? 'إعجاب' : 'likes'}</span>
                        </div>
                        <div className="flex flex-col mt-1">
                           <span className="text-[10px] uppercase font-bold text-neutral-500 mb-0.5">{lang === 'ar' ? 'التاريخ' : 'Date'}</span>
                           <span className="text-blue-300 truncate">{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : '-'}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                      <button
                        onClick={() => setSelectedJsonDoc({ id: ev.id, title: lang === 'ar' ? ev.titleAr : ev.titleEn, data: ev })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-blue-300 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-blue-500/30 shadow-sm"
                      >
                        <Code className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'عرض وثيقة JSON' : 'Inspect Doc'}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من مسح هذه الفعالية وتفريغ الخانة؟' : 'Are you sure you want to delete this event and empty the slot?')) {
                            deleteEvent(ev.id);
                          }
                        }}
                        className="p-2.5 sm:p-3 rounded-xl bg-neutral-800 text-neutral-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer shadow-sm"
                        title={lang === 'ar' ? 'حذف من القاعدة' : 'Delete Document'}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};`;

code = code.replace(`    </div>\n  );\n};`, fullscreenOverlay);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
