const fs = require('fs');

// Patch ProfileView
let profileCode = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');
profileCode = profileCode.replace(
  "      {attendanceEventId && (\n        <ActualAttendanceModal",
  "      <AnimatePresence>\n        {attendanceEventId && (\n          <ActualAttendanceModal"
);
profileCode = profileCode.replace(
  "        />\n      )}",
  "          />\n        )}\n      </AnimatePresence>"
);
fs.writeFileSync('src/components/profile/ProfileView.tsx', profileCode);

// Patch ActualAttendanceModal
let modalCode = fs.readFileSync('src/components/modals/ActualAttendanceModal.tsx', 'utf8');
modalCode = modalCode.replace(
  "  return (\n    <AnimatePresence>\n      <div className=\"fixed inset-0 z-[100]",
  "  return (\n      <div className=\"fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm\">\n        <motion.div"
);
modalCode = modalCode.replace(
  "      </div>\n    </AnimatePresence>\n  );",
  "      </div>\n  );"
);
modalCode = modalCode.replace(
  "z-[100]",
  "z-[9999]"
);
fs.writeFileSync('src/components/modals/ActualAttendanceModal.tsx', modalCode);

console.log('Patched AnimatePresence');
