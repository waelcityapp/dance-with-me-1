const fs = require('fs');

const extractAndRemoveAll = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const regex = /\{\/\*\s*Admin Floating Control Toolbar\s*\*\/\}\s*\{user\?\.isAdmin && \([\s\S]*?\n\s*\}\)/g;
  
  content = content.replace(regex, '');
  
  return content;
};

let eventCardContent = extractAndRemoveAll('src/components/events/EventCard.tsx');

const adminToolbarEventCard = `        {/* Admin Floating Control Toolbar */}
        {user?.isAdmin && (
          <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap gap-2 justify-end pointer-events-none">
            <div className="pointer-events-auto flex flex-wrap gap-2 bg-neutral-950/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
              {/* Position Display */}
              <div 
                className="flex h-9 px-3 items-center justify-center rounded-xl bg-neutral-950/80 border border-amber-500/50 text-[11px] font-black text-amber-400 font-mono shadow-md select-all"
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
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all border border-purple-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                  title={lang === 'ar' ? 'عرض ملف منشئ الإعلان' : 'View Ad Creator Profile'}
                >
                  <User className="h-4.5 w-4.5 stroke-[2.5]" />
                </button>
              )}
              {/* Pause / Resume button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  togglePauseEvent(event.id);
                }}
                className={\`flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all border hover:scale-105 active:scale-95 cursor-pointer \${
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
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all border border-blue-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                title={lang === 'ar' ? 'تعديل الإعلان' : 'Edit Ad'}
              >
                <Edit className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
              {/* Delete button (triggers local confirm) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowDeleteConfirm(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-all border border-red-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                title={lang === 'ar' ? 'حذف الإعلان نهائياً' : 'Delete Ad Permanently'}
              >
                <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}`;

// Insert it right at the top of the card (or below the header/media)
// If I place it inside the media wrapper, it will be fine.
// Wait, the banner has a 'absolute top-0 inset-x-0' thing. Let's put it at 'top-14 right-3 left-3'.

const eventCardMediaTarget = `      {/* Banner Media Section (Video or Image) */}
      <div className={\`relative w-full overflow-hidden bg-neutral-950 transition-all duration-500 \${aspectRatioClass}\`}>`;

eventCardContent = eventCardContent.replace(eventCardMediaTarget, eventCardMediaTarget + '\n' + adminToolbarEventCard);

fs.writeFileSync('src/components/events/EventCard.tsx', eventCardContent);


let promoBannerContent = extractAndRemoveAll('src/components/events/WeeklyPromoBanner.tsx');

const adminToolbarPromo = `      {/* Admin Floating Control Toolbar */}
      {user?.isAdmin && (
        <div className="absolute top-14 left-4 right-4 z-30 flex flex-wrap gap-2 justify-end pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap gap-2 bg-neutral-950/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
            {/* Position Display */}
            <div 
              className="flex h-9 px-3 items-center justify-center rounded-xl bg-neutral-950/80 border border-amber-500/50 text-[11px] font-black text-amber-400 font-mono shadow-md select-all"
              title={lang === 'ar' ? 'الموضع والترتيب' : 'Placement position'}
            >
              #{promoEvent.position && promoEvent.position !== 999999 ? promoEvent.position : 1}
            </div>

            {/* Creator Profile Button */}
            {promoEvent.creatorId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setAdminSelectedUserId(promoEvent.creatorId!);
                  setActiveTab('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all border border-purple-500/30 hover:scale-105 active:scale-95 cursor-pointer"
                title={lang === 'ar' ? 'عرض ملف منشئ الإعلان' : 'View Ad Creator Profile'}
              >
                <User className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            )}

            {/* Pause / Resume button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                togglePauseEvent(promoEvent.id);
              }}
              className={\`flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all border hover:scale-105 active:scale-95 cursor-pointer \${
                promoEvent.isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30' 
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-400/30'
              }\`}
              title={promoEvent.isPaused 
                ? (lang === 'ar' ? 'إعادة تشغيل الإعلان' : 'Resume Ad') 
                : (lang === 'ar' ? 'إيقاف مؤقت للإعلان' : 'Pause Ad')
              }
            >
              {promoEvent.isPaused ? <Play className="h-4.5 w-4.5 fill-current" /> : <Pause className="h-4.5 w-4.5 fill-current" />}
            </button>

            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setEditingEvent(promoEvent);
                setActiveTab('edit_ad_admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all border border-blue-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'تعديل الإعلان' : 'Edit Ad'}
            >
              <Edit className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-all border border-red-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'حذف الإعلان' : 'Delete Ad'}
            >
              <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}`;

const promoMediaTarget = `      {/* Media Player Container (Video/Image) */}
      <div className={\`relative w-full overflow-hidden bg-neutral-950 transition-all duration-500 \${aspectRatioClass}\`}>`;

promoBannerContent = promoBannerContent.replace(promoMediaTarget, promoMediaTarget + '\n' + adminToolbarPromo);

fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', promoBannerContent);
console.log('done updating both toolbars');
