const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ActualAttendanceModal.tsx', 'utf8');

code = code.replace(
  "            {eventBookings.length === 0 ? (",
  "            {attendedBookings.length === 0 ? ("
);

code = code.replace(
  "              eventBookings.map(booking => {",
  "              attendedBookings.map(booking => {"
);

fs.writeFileSync('src/components/modals/ActualAttendanceModal.tsx', code);
