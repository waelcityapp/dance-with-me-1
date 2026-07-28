const fs = require('fs');

let content = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const targetStr = `                  className="bg-neutral-900 border border-zinc-800 rounded-3xl overflow-hidden relative shadow-lg flex flex-col justify-between min-h-[320px]"
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  {/* Vertical Red Accent - signature visual style! */}
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-600"></div>
                  
                  {/* Ticket Top details */}
                  <div className="p-5 space-y-4">`;

const replacement = `                  className="bg-neutral-900 border border-zinc-800 rounded-3xl overflow-hidden relative shadow-lg flex flex-col"
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  {/* Vertical Red Accent - signature visual style! */}
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-600"></div>
                  
                  {/* Title Toggle Area */}
                  <div
                    className="p-5 flex justify-between items-center cursor-pointer select-none border-b border-zinc-800/60"
                    onClick={() => setExpandedBookingId(expandedBookingId === b.id ? null : b.id)}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider">
                        {isArabic ? 'الفعالية / الحفلة' : 'EVENT'}
                      </span>
                      <h4 className="text-base font-bold text-zinc-100 line-clamp-1">
                        {isArabic ? (b.eventTitleAr || b.eventTitleEn) : (b.eventTitleEn || b.eventTitleAr)}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        {b.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            {isArabic ? 'قيد المراجعة' : 'Pending Review'}
                          </span>
                        ) : b.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            {isArabic ? 'مؤكد ومقبول' : 'Confirmed'}
                          </span>
                        ) : b.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-bold border border-zinc-700">
                            <X className="w-3 h-3" />
                            {isArabic ? 'ملغي ومسترجع' : 'Cancelled & Refunded'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/25 text-red-400 text-[10px] font-bold border border-red-500/20">
                            <X className="w-3 h-3" />
                            {isArabic ? 'مرفوض' : 'Rejected'}
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-amber-500">
                          #{b.refNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-400 hidden sm:inline-block">
                        {expandedBookingId === b.id ? (isArabic ? 'إخفاء التفاصيل' : 'Hide Details') : (isArabic ? 'عرض التفاصيل' : 'View Details')}
                      </span>
                      <div className="bg-neutral-800/50 p-2 rounded-xl">
                        <ChevronDown className={\`w-5 h-5 text-neutral-400 transition-transform \${expandedBookingId === b.id ? 'rotate-180' : ''}\`} />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedBookingId === b.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden flex flex-col justify-between"
                      >
                        <div className="p-5 space-y-4">`;

content = content.replace(targetStr, replacement);

fs.writeFileSync('src/components/profile/ProfileView.tsx', content);
console.log('done1');
