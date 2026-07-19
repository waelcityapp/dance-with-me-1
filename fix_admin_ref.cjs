const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

// First remove the old eventRef generation logic
code = code.replace(/\/\/ Generate the unique event code \(eventRef\) before saving\n\s+let maxRef = 1000;\n\s+const assignedRefs = events\.map\(e => e\.eventRef\)\.filter\(\(r\): r is number => typeof r === 'number'\);\n\s+if \(assignedRefs\.length > 0\) \{\n\s+maxRef = Math\.max\(\.\.\.assignedRefs\);\n\s+\}\n\s+const newEventRef = maxRef \+ 1;\n\n\s+if \(eventId && sub\.eventData\) \{ \n\s+sub\.eventData\.id = eventId; \n\s+sub\.eventData\.eventRef = newEventRef;\n\s+\}/, "if (eventId && sub.eventData) { sub.eventData.id = eventId; }");

// Now insert it before eventId = ...
const newEvRegex = /let eventId = '';/;
const newEvReplacement = `// Generate the unique event code (eventRef) before saving
      let maxRef = 1000;
      const assignedRefs = events.map(e => e.eventRef).filter((r): r is number => typeof r === 'number');
      if (assignedRefs.length > 0) {
        maxRef = Math.max(...assignedRefs);
      }
      const newEventRef = maxRef + 1;
      
      let eventId = '';`;

code = code.replace(newEvRegex, newEvReplacement);

// Add eventRef to newEv
const newEvObjectRegex = /uploadDate: new Date\(\)\.toISOString\(\),/;
const newEvObjectReplacement = `uploadDate: new Date().toISOString(),
          eventRef: newEventRef,`;

code = code.replace(newEvObjectRegex, newEvObjectReplacement);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed eventRef placement');
