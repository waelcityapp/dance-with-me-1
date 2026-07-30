const fs = require('fs');

let content = fs.readFileSync('src/components/events/EventCard.tsx', 'utf8');

const target1 = `          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenMap(event);
              logAnalyticsEvent('clicks_maps');
            }}
            className="flex items-center justify-between gap-2 text-neutral-300 hover:text-amber-400 cursor-pointer group/map transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <MapPin className="h-4 w-4 text-amber-400 shrink-0 group-hover/map:scale-110 transition-transform" />
              <span className="truncate underline decoration-neutral-700 group-hover/map:decoration-amber-400 font-bold">
                {lang === 'ar' ? event.location.nameAr : event.location.nameEn}
              </span>
            </div>
            {event.location?.googleMapsUrl && event.location.googleMapsUrl.trim().length > 0 && (
              <span className="text-[10px] text-amber-400 font-black shrink-0 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse font-sans">
                {lang === 'ar' ? 'استخدم الخريطة 🗺️' : 'Use Map 🗺️'}
              </span>
            )}
          </div>`;

const replace1 = `          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenMap(event);
              logAnalyticsEvent('clicks_maps');
            }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-neutral-300 hover:text-amber-400 cursor-pointer group/map transition-colors"
          >
            <div className="flex items-start gap-2.5 overflow-hidden w-full">
              <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 group-hover/map:scale-110 transition-transform" />
              <span className="line-clamp-2 underline decoration-neutral-700 group-hover/map:decoration-amber-400 font-bold leading-snug">
                {lang === 'ar' ? event.location.nameAr : event.location.nameEn}
              </span>
            </div>
            {event.location?.googleMapsUrl && event.location.googleMapsUrl.trim().length > 0 && (
              <div className="flex-shrink-0 self-start sm:self-auto ml-6 sm:ml-0 rtl:ml-0 rtl:mr-6 sm:rtl:mr-0">
                <span className="text-[10px] text-amber-400 font-black bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse font-sans shadow-sm inline-flex items-center gap-1">
                  {lang === 'ar' ? 'استخدم الخريطة 🗺️' : 'Use Map 🗺️'}
                </span>
              </div>
            )}
          </div>`;

content = content.replace(target1, replace1);
fs.writeFileSync('src/components/events/EventCard.tsx', content);


let promoContent = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf8');
const target2 = `            <div className="overflow-hidden w-full flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 leading-none">
                  {lang === 'ar' ? 'الموقع' : 'Location'}
                </p>
                <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 mt-1">
                  {lang === 'ar' ? promoEvent.location.nameAr : promoEvent.location.nameEn}
                </p>
              </div>
              {promoEvent.location?.googleMapsUrl && promoEvent.location.googleMapsUrl.trim().length > 0 && (
                <span className="text-[10px] text-amber-400 font-black shrink-0 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse font-sans ml-2 rtl:mr-2">
                  {lang === 'ar' ? 'استخدم الخريطة 🗺️' : 'Use Map 🗺️'}
                </span>
              )}
            </div>`;

const replace2 = `            <div className="overflow-hidden w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 leading-none">
                  {lang === 'ar' ? 'الموقع' : 'Location'}
                </p>
                <p className="text-xs font-bold text-white line-clamp-2 group-hover:text-amber-400 mt-1 leading-snug">
                  {lang === 'ar' ? promoEvent.location.nameAr : promoEvent.location.nameEn}
                </p>
              </div>
              {promoEvent.location?.googleMapsUrl && promoEvent.location.googleMapsUrl.trim().length > 0 && (
                <div className="shrink-0 self-start sm:self-auto">
                  <span className="text-[10px] text-amber-400 font-black bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse font-sans shadow-sm inline-flex items-center gap-1">
                    {lang === 'ar' ? 'استخدم الخريطة 🗺️' : 'Use Map 🗺️'}
                  </span>
                </div>
              )}
            </div>`;

promoContent = promoContent.replace(target2, replace2);
fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', promoContent);

console.log('done layout update');
