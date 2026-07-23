const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const targetStr = `                      {(sub.eventRef || associatedEvent?.eventRef) && (
                        <span className="px-3 py-1 rounded-xl bg-indigo-950/80 text-indigo-400 font-mono text-xs font-black border border-indigo-500/20">
                          {lang === 'ar' ? \`الرقم المرجعي: \${sub.eventRef || associatedEvent?.eventRef}\` : \`Ref No: \${sub.eventRef || associatedEvent?.eventRef}\`}
                        </span>
                      )}`;

const replacementStr = `                      {(sub.eventRef || associatedEvent?.eventRef) && (
                        <span className="px-3 py-1 rounded-xl bg-indigo-950/80 text-indigo-400 font-mono text-xs font-black border border-indigo-500/20">
                          {lang === 'ar' ? \`الرقم المرجعي: \${sub.eventRef || associatedEvent?.eventRef}\` : \`Ref No: \${sub.eventRef || associatedEvent?.eventRef}\`}
                        </span>
                      )}
                      
                      {sub.status === 'approved' && (sub.eventData?.id || sub.id) && (
                        <button
                          onClick={() => setAttendanceEventId(sub.eventData?.id || sub.id)}
                          className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'الحضور الفعلي' : 'Actual Attendance'}
                        </button>
                      )}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
