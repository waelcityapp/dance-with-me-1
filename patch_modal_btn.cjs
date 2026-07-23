const fs = require('fs');

// Patch ProfileView
let profileCode = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');
profileCode = profileCode.replace(
  "                          onClick={() => setAttendanceEventId(sub.eventData?.id || sub.id)}",
  "                          onClick={(e) => {\n                            e.preventDefault();\n                            e.stopPropagation();\n                            setAttendanceEventId(sub.eventData?.id || sub.id);\n                          }}"
);
fs.writeFileSync('src/components/profile/ProfileView.tsx', profileCode);

console.log('Patched button');
