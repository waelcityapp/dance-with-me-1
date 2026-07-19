const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

code = code.replace(/if \(eventId && sub\.eventData\) \{ sub\.eventData\.id = eventId; \}/,
`if (eventId && sub.eventData) { 
        sub.eventData.id = eventId; 
        sub.eventData.eventRef = newEventRef;
      }`);

code = code.replace(/const updated: AdSubmission = \{/, "const updated: AdSubmission = { eventRef: newEventRef,");

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed AdminPanel save');
