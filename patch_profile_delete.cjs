const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

code = code.replace(
  "const subToDelete = adSubmissions.find(s => s.id === submissionId);\n      if (subToDelete && subToDelete.eventData && subToDelete.eventData.id) {\n        deleteEvent(subToDelete.eventData.id);\n      }",
  "const subToDelete = adSubmissions.find(s => s.id === submissionId);\n      if (subToDelete) {\n        const eventId = subToDelete.eventData?.id || subToDelete.id;\n        if (eventId) deleteEvent(eventId);\n      }"
);

code = code.replace(
  "const promises = adSubmissions.map(sub => {\n        if (sub.eventData && sub.eventData.id) {\n          deleteEvent(sub.eventData.id);\n        }\n        return deleteAdSubmissionFromFirestore(sub.id);\n      });",
  "const promises = adSubmissions.map(sub => {\n        const eventId = sub.eventData?.id || sub.id;\n        if (eventId) deleteEvent(eventId);\n        return deleteAdSubmissionFromFirestore(sub.id);\n      });"
);

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
console.log('Patched ProfileView delete handlers again');
