const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ActualAttendanceModal.tsx', 'utf8');
code = code.replace(
  "import { COLLECTIONS } from '../../lib/firebase';",
  ""
);
code = code.replace(
  "const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);",
  "const bookingsRef = collection(db, 'bookings');"
);
fs.writeFileSync('src/components/modals/ActualAttendanceModal.tsx', code);
console.log('Fixed collections import');
