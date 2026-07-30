const fs = require('fs');
let content = fs.readFileSync('src/components/events/EventCard.tsx', 'utf8');

const target = `        <div className="mb-4">`;

const newCode = `        <div className="flex flex-1 flex-col p-4 sm:p-5 relative z-10 bg-neutral-900 border-t border-neutral-800">
          {/* Content Box (Title, Price, description) */}
          <div className="mb-4">
            <h3 className="mb-2 text-base sm:text-lg font-black tracking-tight text-white line-clamp-2 leading-snug">
              {lang === 'ar' ? event.titleAr : event.titleEn}
            </h3>
            {/* Price Badge */}
            {(event.priceAr || event.priceEn) && (
              <div className="mb-3 inline-block rounded-lg bg-amber-500/10 px-2.5 py-1 border border-amber-500/20">
                <span className="text-xs font-black tracking-wide text-amber-400">
                  {lang === 'ar' ? event.priceAr : event.priceEn}
                </span>
              </div>
            )}`;

content = content.replace(target, newCode);
fs.writeFileSync('src/components/events/EventCard.tsx', content);

console.log('done fixing EventCard');
