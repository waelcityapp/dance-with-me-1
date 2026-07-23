const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

code = code.replace(
  "onClick={(e) => {\\n                            e.preventDefault();\\n                            e.stopPropagation();\\n                            setAttendanceEventId(associatedEvent?.id || sub.eventData?.id || sub.id);\\n                          }}",
  "type=\"button\" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAttendanceEventId(associatedEvent?.id || sub.eventData?.id || sub.id); }}"
);
// I'll just use string replacement on a smaller substring
code = code.replace(
  "className=\"px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm\"",
  "type=\"button\" className=\"relative z-50 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm\""
);

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
