const fs = require('fs');

let appCode = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

appCode = appCode.replace(
  "      setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));\\n    } else {",
  "      setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));\\n      deleteAllBookingsForEvent(eventId);\\n      setBookings(prev => prev.filter(b => b.eventId !== eventId));\\n    } else {"
);

// Manual replace if regex fails due to line endings
if (appCode.indexOf("setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));") !== -1) {
    appCode = appCode.replace(
      "setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));\\n    } else {",
      "setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));\\n      deleteAllBookingsForEvent(eventId);\\n      setBookings(prev => prev.filter(b => b.eventId !== eventId));\\n    } else {"
    );
}

// Let's just do a simple split and join
const search = "setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));\\n    } else {";
const searchReal = "      setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));\n    } else {";
appCode = appCode.replace(searchReal, "      setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));\n      deleteAllBookingsForEvent(eventId);\n      setBookings(prev => prev.filter(b => b.eventId !== eventId));\n    } else {");

fs.writeFileSync('src/context/AppContext.tsx', appCode);
console.log('Patched AppContext successfully');
