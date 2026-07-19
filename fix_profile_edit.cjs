const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const targetStr = `                  {/* Ad Details or Editing Form */}
                  {isEditing ? (
                    <div className="space-y-4 mb-5 p-4 rounded-2xl bg-neutral-950 border border-amber-500/40">
                      <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'تعديل بيانات الإعلان الفاخر' : 'Edit VIP Ad Details'}</span>
                      </h4>`;

const newStr = `                  {/* Ad Details or Editing Form */}
                  {isEditing ? (
                    <div className="space-y-4 mb-5 p-4 rounded-2xl bg-neutral-950 border border-amber-500/40">
                      <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'تعديل بيانات الإعلان الفاخر' : 'Edit VIP Ad Details'}</span>
                      </h4>

                      {sub.eventRef && (
                        <div className="mb-2 p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                          <label className="text-xs font-bold text-indigo-400 block mb-1">
                            {lang === 'ar' ? 'كود الحدث (الرقم المرجعي)' : 'Event Code (Reference)'}
                          </label>
                          <input
                            disabled
                            type="text"
                            value={sub.eventRef}
                            className="w-full rounded-xl bg-neutral-900/50 border border-indigo-500/30 px-3.5 py-2 text-indigo-300 font-mono font-bold select-all focus:outline-none opacity-80 cursor-not-allowed"
                          />
                        </div>
                      )}`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
console.log('Fixed profile edit');
