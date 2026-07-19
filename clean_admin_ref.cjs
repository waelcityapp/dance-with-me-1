const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const regex = /\/\/ Generate the unique event code \(eventRef\) before saving\n\s+let maxRef = 1000;\n\s+const assignedRefs = events\.map\(e => e\.eventRef\)\.filter\(\(r\): r is number => typeof r === 'number'\);\n\s+if \(assignedRefs\.length > 0\) \{\n\s+maxRef = Math\.max\(\.\.\.assignedRefs\);\n\s+\}\n\s+const newEventRef = maxRef \+ 1;\n\n\s+if \(eventId && sub\.eventData\) \{ \n\s+sub\.eventData\.id = eventId; \n\s+sub\.eventData\.eventRef = newEventRef;\n\s+\}/;

code = code.replace(regex, "if (eventId && sub.eventData) { sub.eventData.id = eventId; }");
code = code.replace(/if \(eventId && sub\.eventData\) \{ \n\s+sub\.eventData\.id = eventId; \n\s+sub\.eventData\.eventRef = newEventRef;\n\s+\}/g, "if (eventId && sub.eventData) { sub.eventData.id = eventId; }");

// And also replace the other one in case it was left behind
code = code.replace(/\/\/ Generate the unique event code \(eventRef\) before saving\n\s+let maxRef = 1000;\n\s+const assignedRefs = events\.map\(e => e\.eventRef\)\.filter\(\(r\): r is number => typeof r === 'number'\);\n\s+if \(assignedRefs\.length > 0\) \{\n\s+maxRef = Math\.max\(\.\.\.assignedRefs\);\n\s+\}\n\s+const newEventRef = maxRef \+ 1;\n\s+if \(eventId && sub\.eventData\) \{/g, "if (eventId && sub.eventData) {");

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Cleaned up eventRef');
