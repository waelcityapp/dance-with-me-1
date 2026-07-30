const fs = require('fs');
let content = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf8');

const target = `        <div className="mb-3.5">`;

const newCode = `        <div className="flex flex-col p-4 sm:p-5 relative z-10 bg-neutral-900 border-t border-neutral-800">
          <div className="mb-3.5">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white mb-2 line-clamp-2 leading-snug">
              {lang === 'ar' ? promoEvent.titleAr : promoEvent.titleEn}
            </h3>
            {/* Price Badge */}
            {(promoEvent.priceAr || promoEvent.priceEn) && (
              <div className="mb-3 inline-block rounded-lg bg-amber-500/10 px-2.5 py-1 border border-amber-500/20">
                <span className="text-xs font-black tracking-wide text-amber-400">
                  {lang === 'ar' ? promoEvent.priceAr : promoEvent.priceEn}
                </span>
              </div>
            )}`;

content = content.replace(target, newCode);
fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', content);

console.log('done fixing WeeklyPromoBanner');
