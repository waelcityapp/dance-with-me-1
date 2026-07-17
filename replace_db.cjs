const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminEditEventPage.tsx', 'utf-8');
code = code.replace("addNewEvent(newEvent);\n        // Save to Firestore but DO NOT delete original media since it might still be used by the original event", "addNewEvent(newEvent);\n        await saveEventToFirestore(newEvent);\n        // Save to Firestore but DO NOT delete original media since it might still be used by the original event");
fs.writeFileSync('src/components/admin/AdminEditEventPage.tsx', code);
