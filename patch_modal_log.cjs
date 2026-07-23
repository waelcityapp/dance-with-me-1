const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ActualAttendanceModal.tsx', 'utf8');
code = code.replace(
  "  if (!eventId) return null;",
  "  console.log('Rendering ActualAttendanceModal, eventId:', eventId);\n  if (!eventId) return null;"
);
fs.writeFileSync('src/components/modals/ActualAttendanceModal.tsx', code);
