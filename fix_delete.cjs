const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

const target = `    setEvents(prev => prev.filter(e => e.id !== eventId));
    deleteEventFromFirestore(eventId);
  };`;

const replace = `    // Instead of deleting the event document entirely, we clear its data and mark it as empty
    // to preserve its \`position\` (serial number).
    if (evToDelete) {
      const emptyEv = {
        ...evToDelete,
        titleAr: '',
        titleEn: '',
        descriptionAr: '',
        descriptionEn: '',
        mediaUrl: '',
        thumbnailUrl: '',
        isEmpty: true,
      };
      saveEventToFirestore(emptyEv);
      setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));
    } else {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      deleteEventFromFirestore(eventId);
    }
  };`;

code = code.replace(target, replace);
fs.writeFileSync('src/context/AppContext.tsx', code);
