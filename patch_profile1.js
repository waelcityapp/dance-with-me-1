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
    "export const ProfileView: React.FC<ProfileViewProps> = ({",
    "export const ProfileView: React.FC<ProfileViewProps> = ({\n"
  );
  
  // We'll append it before the final `</div>`
  // But wait, it's easier to append it at the end of the root container or just after AnimatePresence
  code = code.replace(
    "      </AnimatePresence>\n    </div>",
    "      </AnimatePresence>\n      {attendanceEventId && (\n        <ActualAttendanceModal\n          eventId={attendanceEventId}\n          onClose={() => setAttendanceEventId(null)}\n        />\n      )}\n    </div>"
  );
}

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
