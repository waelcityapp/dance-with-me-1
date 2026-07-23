const fs = require('fs');

let profileCode = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');
profileCode = profileCode.replace(
  "setAttendanceEventId(sub.eventData?.id || sub.id);",
  "setAttendanceEventId(associatedEvent?.id || sub.eventData?.id || sub.id);"
);
fs.writeFileSync('src/components/profile/ProfileView.tsx', profileCode);

console.log('Patched button 2');
