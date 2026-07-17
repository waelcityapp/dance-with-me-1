const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const targetStr = `                {/* Admin Approval Buttons */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto justify-end">
                  {sub.status === 'pending' && (
                    <>
                      <motion.button`;

const replacementStr = `                {/* Admin Approval Buttons */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto justify-end">
                  {sub.status === 'pending' && (
                    <>
                      <div className="flex items-center gap-2 mr-2">
                        <label className="text-xs font-bold text-neutral-400">{lang === 'ar' ? 'رقم الإعلان:' : 'Position:'}</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="0"
                          value={submissionPositions[sub.id] !== undefined ? submissionPositions[sub.id] : (sub.eventData?.position || '')}
                          onChange={(e) => setSubmissionPositions({ ...submissionPositions, [sub.id]: Number(e.target.value) })}
                          className="w-16 rounded-lg bg-neutral-900 border border-neutral-700 py-2 px-2 text-xs text-white text-center focus:border-amber-500 outline-none"
                        />
                      </div>
                      <motion.button`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
