const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminEditEventPage.tsx', 'utf8');

const target = `              <input
                type="text"
                value={mediaUrl}
                readOnly
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-400 focus:outline-none transition-all text-sm font-mono cursor-not-allowed"
                placeholder="https://"
                dir="ltr"
              />`;

const newCode = `              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-300 focus:outline-none focus:border-amber-500/50 transition-all text-sm font-mono"
                placeholder="https://"
                dir="ltr"
              />`;

content = content.replace(target, newCode);
fs.writeFileSync('src/components/admin/AdminEditEventPage.tsx', content);

console.log('done fixing input');
