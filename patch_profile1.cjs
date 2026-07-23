const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

// Add import
if (!code.includes('ActualAttendanceModal')) {
  code = code.replace(
    "import { EventCard } from '../events/EventCard';",
    "import { EventCard } from '../events/EventCard';\nimport { ActualAttendanceModal } from '../modals/ActualAttendanceModal';"
  );
}

// Add state
if (!code.includes('attendanceEventId')) {
  code = code.replace(
    "const [qrModalBooking, setQrModalBooking] = useState<any | null>(null);",
    "const [qrModalBooking, setQrModalBooking] = useState<any | null>(null);\n  const [attendanceEventId, setAttendanceEventId] = useState<string | null>(null);"
  );
}

// Add rendering logic
if (!code.includes('<ActualAttendanceModal')) {
  code = code.replace(
    "      </AnimatePresence>\n    </div>",
    "      </AnimatePresence>\n      <ActualAttendanceModal eventId={attendanceEventId} onClose={() => setAttendanceEventId(null)} />\n    </div>"
  );
}

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
