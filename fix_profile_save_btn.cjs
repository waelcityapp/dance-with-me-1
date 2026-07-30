const fs = require('fs');
let content = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const target = `                        <button
                          disabled={actionLoading === sub.id}
                          onClick={() => handleSaveEdit(sub)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-extrabold text-xs hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                        >`;

const newCode = `                        <button
                          disabled={actionLoading === sub.id || isUploadingMedia}
                          onClick={() => handleSaveEdit(sub)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-extrabold text-xs hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                        >`;

content = content.replace(target, newCode);
fs.writeFileSync('src/components/profile/ProfileView.tsx', content);

console.log('done fixing ProfileView save button');
