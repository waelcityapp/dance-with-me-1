const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ActualAttendanceModal.tsx', 'utf8');

code = code.replace(
  "لا توجد حجوزات معتمدة حتى الآن.",
  "لا يوجد حضور مسجل حتى الآن."
);

code = code.replace(
  "No approved bookings yet.",
  "No actual attendees recorded yet."
);

fs.writeFileSync('src/components/modals/ActualAttendanceModal.tsx', code);
