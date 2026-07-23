const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ActualAttendanceModal.tsx', 'utf8');
code = code.replace(
  "  const totalAttendedCount = attendedBookings.reduce((sum, b) => sum + (b.numberOfIndividuals || 1), 0);",
  "  const totalAttendedCount = attendedBookings.reduce((sum, b) => sum + Number(b.numberOfIndividuals || 1), 0);"
);
code = code.replace(
  "  const totalBookedCount = eventBookings.reduce((sum, b) => sum + (b.numberOfIndividuals || 1), 0);",
  "  const totalBookedCount = eventBookings.reduce((sum, b) => sum + Number(b.numberOfIndividuals || 1), 0);"
);
fs.writeFileSync('src/components/modals/ActualAttendanceModal.tsx', code);
