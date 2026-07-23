const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

code = code.replace(
  "const [attendanceEventId, setAttendanceEventId] = useState<string | null>(null);",
  "const [attendanceEventId, setAttendanceEventId] = useState<string | null>(null);\n  const [attendanceSub, setAttendanceSub] = useState<AdSubmission | null>(null);"
);

code = code.replace(
  `onClick={(e) => {                            e.preventDefault();                            e.stopPropagation();                            setAttendanceEventId(associatedEvent?.id || sub.eventData?.id || sub.id);                          }}`,
  `onClick={(e) => {\n                            e.preventDefault();\n                            e.stopPropagation();\n                            setAttendanceEventId(associatedEvent?.id || sub.eventData?.id || sub.id);\n                            setAttendanceSub(sub);\n                          }}`
);

code = code.replace(
  `<ActualAttendanceModal          eventId={attendanceEventId}          onClose={() => setAttendanceEventId(null)}          />`,
  `<ActualAttendanceModal\n            eventId={attendanceEventId}\n            sub={attendanceSub}\n            onClose={() => {\n              setAttendanceEventId(null);\n              setAttendanceSub(null);\n            }}\n          />`
);

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
console.log('Patched ProfileView for ActualAttendanceModal');
