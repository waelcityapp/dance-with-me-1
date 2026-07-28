const fs = require('fs');

let content = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const targetStr = `                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-neutral-800 text-amber-400 font-mono text-xs font-bold border border-white/10">
                        {sub.invoiceNumber}
                      </span>
`;

const replacement = `                >
                  <div
                    className="flex justify-between items-center cursor-pointer select-none"
                    onClick={() => {
                      if (expandedSubId === sub.id) {
                        setExpandedSubId(null);
                        setEditingSubId(null);
                      } else {
                        setExpandedSubId(sub.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-black text-white">
                        {lang === 'ar' ? (sub.eventData?.titleAr || sub.titleAr) : (sub.eventData?.titleEn || sub.titleEn)}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap text-[10px] sm:text-xs">
                        <span className="text-amber-400 font-mono font-bold">
                          #{sub.invoiceNumber}
                        </span>
                        <span className={\`px-2 py-0.5 rounded-full font-bold uppercase \${
                          isArchived ? 'bg-amber-500 text-neutral-950 animate-pulse' :
                          sub.status === 'approved' ? 'bg-emerald-500 text-neutral-950' :
                          sub.status === 'pending' ? 'bg-amber-400 text-neutral-950' : 'bg-red-500 text-white'
                        }\`}>
                          {isArchived ? (lang === 'ar' ? 'منتهي (أرشيف)' : 'Archived') : 
                           sub.status === 'approved' ? (lang === 'ar' ? 'نشط' : 'Active') : 
                           sub.status === 'pending' ? (lang === 'ar' ? 'مراجعة' : 'Pending') : 
                           (lang === 'ar' ? 'مرفوض' : 'Rejected')}
                        </span>
                        {(sub.eventRef || associatedEvent?.eventRef) && (
                          <span className="text-indigo-400 font-mono font-bold">
                            {lang === 'ar' ? \`المرجعي: \${sub.eventRef || associatedEvent?.eventRef}\` : \`Ref: \${sub.eventRef || associatedEvent?.eventRef}\`}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4 rtl:mr-4 rtl:ml-0 shrink-0">
                      <div className="bg-neutral-800/50 p-2 rounded-xl">
                        <ChevronDown className={\`w-5 h-5 text-neutral-400 transition-transform \${expandedSubId === sub.id ? 'rotate-180' : ''}\`} />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSubId === sub.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-white/10">

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-neutral-800 text-amber-400 font-mono text-xs font-bold border border-white/10">
                        {sub.invoiceNumber}
                      </span>
`;

content = content.replace(targetStr, replacement);

const targetEnd = `                      </button>
                    </div>
                  )}
                </motion.div>
              );
`;
const replaceEnd = `                      </button>
                    </div>
                  )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
`;

content = content.replace(targetEnd, replaceEnd);

fs.writeFileSync('src/components/profile/ProfileView.tsx', content);
console.log('done');
