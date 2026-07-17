const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const target = `                          {ev.isFeatured && <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">VIP</span>}`;
const replace = `                          {ev.isFeatured && !ev.isEmpty && <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">VIP</span>}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
