const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const target = `                {events.map((ev) => (
                  <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-blue-500/40 transition-all shadow-md">
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <img src={ev.thumbnailUrl || ev.mediaUrl} alt="" className="h-14 w-14 rounded-xl object-cover border border-white/10 shrink-0 shadow" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">`;

const replace = `                {events.map((ev) => (
                  <div key={ev.id} className={\`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/90 border \${ev.isEmpty ? 'border-red-500/40 opacity-70' : 'border-white/10 hover:border-blue-500/40'} transition-all shadow-md\`}>
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      {ev.isEmpty ? (
                        <div className="h-14 w-14 rounded-xl bg-neutral-800 border border-red-500/20 flex items-center justify-center shrink-0 shadow">
                           <span className="text-[10px] font-bold text-red-400">فارغ</span>
                        </div>
                      ) : (
                        <img src={ev.thumbnailUrl || ev.mediaUrl} alt="" className="h-14 w-14 rounded-xl object-cover border border-white/10 shrink-0 shadow" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
