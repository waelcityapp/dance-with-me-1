const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`          {/* Ticket Information Card */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-neutral-800 bg-neutral-900/95 shadow-xl">
            {/* Ticket Graphic Header decorative */}
            <div className="h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
            
            <div className="p-6 space-y-5">`,
`          {/* Ticket Information Card */}
          <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-md">
            <div className="p-5 space-y-4">`
);

code = code.replace(
`              <div className="border-b border-neutral-800 pb-4">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                  {isArabic ? 'الحدث / الفاعلية المحجوزة' : 'BOOKED EVENT / WORKSHOP'}
                </span>
                <h3 className="text-lg font-black text-white tracking-tight mt-1">
                  {isArabic ? booking.eventTitleAr : booking.eventTitleEn}
                </h3>
              </div>`,
`              <div className="border-b border-neutral-800/50 pb-3">
                <h3 className="text-base font-bold text-white">
                  {isArabic ? booking.eventTitleAr : booking.eventTitleEn}
                </h3>
              </div>`
);

code = code.replace(
`            {/* Ticket dotted cutoff lines */}
            <div className="relative flex items-center justify-center my-1 px-4">
              <div className="absolute left-[-12px] w-6 h-6 rounded-full bg-neutral-950 border-r-2 border-neutral-800" />
              <div className="w-full border-t-2 border-dashed border-neutral-800" />
              <div className="absolute right-[-12px] w-6 h-6 rounded-full bg-neutral-950 border-l-2 border-neutral-800" />
            </div>

            {/* Bottom confirmation verification details */}
            <div className="p-6 bg-neutral-950/60">`,
`            {/* Bottom confirmation verification details */}
            <div className="p-5 bg-neutral-950/40 border-t border-neutral-800/50">`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
