const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

code = code.replace(
  "    </div>\n  );\n};",
  "      {attendanceEventId && (\n        <ActualAttendanceModal\n          eventId={attendanceEventId}\n          onClose={() => setAttendanceEventId(null)}\n        />\n      )}\n    </div>\n  );\n};"
);

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
