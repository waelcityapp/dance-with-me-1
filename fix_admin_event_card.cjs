const fs = require('fs');
let content = fs.readFileSync('src/components/events/EventCard.tsx', 'utf8');

const target1 = `        {/* Admin Floating Control Toolbar */}
        {user?.isAdmin && (
          <div className="absolute top-14 right-3 z-30 flex flex-col gap-2">
            {/* Position Display next to Admin controls */}
            <div 
              className="flex h-9 items-center justify-center rounded-xl bg-neutral-950/95 border border-amber-500/50 text-[11px] font-black text-amber-400 font-mono shadow-xl px-2 select-all"
              title={lang === 'ar' ? 'الترتيب في الصفحة والموضع' : 'Page order & position'}
            >
              #{index !== undefined ? index + 1 : ''}
              {event.position !== undefined && event.position !== 999999 && event.position !== 0 && (
                <span className="text-[10px] text-neutral-400 font-bold ml-1">
                  ({event.position})
                </span>
              )}
              {index === undefined && (event.position === undefined || event.position === 999999 || event.position === 0) && '-'}
            </div>
            {/* Creator Profile Button */}
            {event.creatorId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setAdminSelectedUserId(event.creatorId!);
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-xl transition-all border border-purple-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                title={lang === 'ar' ? 'عرض ملف منشئ الإعلان' : 'View Ad Creator Profile'}
              >
                <User className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            )}
            {/* Delete button (triggers local confirm) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-xl transition-all border border-red-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'حذف الإعلان نهائياً' : 'Delete Ad Permanently'}
            >
              <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
            {/* Pause / Resume button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                togglePauseEvent(event.id);
              }}
              className={\`flex h-9 w-9 items-center justify-center rounded-xl shadow-xl transition-all border hover:scale-105 active:scale-95 cursor-pointer \${
                event.isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-400/30'
              }\`}
              title={event.isPaused 
                ? (lang === 'ar' ? 'إعادة تشغيل الإعلان' : 'Resume Ad') 
                : (lang === 'ar' ? 'إيقاف مؤقت للإعلان' : 'Pause Ad')
              }
            >
              {event.isPaused ? <Play className="h-4.5 w-4.5 fill-current" /> : <Pause className="h-4.5 w-4.5 fill-current" />}
            </button>
            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setEditingEvent(event);
                setActiveTab('edit_ad_admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl transition-all border border-blue-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'تعديل الإعلان' : 'Edit Ad'}
            >
              <Edit className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>
        )}`;

content = content.replace(target1, '');

const target2 = `    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={\`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1.5 \${
        isExpired
          ? 'border-white/5 bg-neutral-900/60 opacity-80 shadow-[0_15px_35px_rgba(0,0,0,0.5)]'
          : displayAdType === 'vip'
            ? 'border-amber-500/40 bg-neutral-900 shadow-[0_22px_48px_rgba(245,158,11,0.12)] hover:border-amber-400/80 hover:shadow-[0_32px_64px_rgba(245,158,11,0.25)]'
            : 'border-white/10 bg-neutral-900 shadow-[0_22px_48px_rgba(0,0,0,0.7)] hover:border-white/25 hover:shadow-[0_32px_64px_rgba(0,0,0,0.9)]'
      }\`}
    >`;

const replace2 = target2 + `\n` + target1;
content = content.replace(target2, replace2);

fs.writeFileSync('src/components/events/EventCard.tsx', content);
console.log('done moving admin toolbar out of media section');
