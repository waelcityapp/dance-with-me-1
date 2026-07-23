const fs = require('fs');

let firebaseCode = fs.readFileSync('src/lib/firebase.ts', 'utf8');
if (!firebaseCode.includes('deleteAllBookingsForEvent')) {
  firebaseCode += `
export async function deleteAllBookingsForEvent(eventId: string): Promise<boolean> {
  try {
    const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
    const q = query(bookingsRef, where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    console.log(\`Deleted \${snapshot.docs.length} bookings for soft-deleted event \${eventId}\`);
    return true;
  } catch (error) {
    console.error('Error deleting bookings for event:', error);
    return false;
  }
}
`;
  fs.writeFileSync('src/lib/firebase.ts', firebaseCode);
}

let appCode = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Add import
if (!appCode.includes('deleteAllBookingsForEvent')) {
  appCode = appCode.replace(
    "deleteEventFromFirestore,",
    "deleteEventFromFirestore,\n  deleteAllBookingsForEvent,"
  );
}

// Modify deleteEvent
appCode = appCode.replace(
  "      setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));\\n    } else {",
  "      setEvents(prev => prev.map(e => e.id === eventId ? emptyEv : e));\n      deleteAllBookingsForEvent(eventId);\n      setBookings(prev => prev.filter(b => b.eventId !== eventId));\n    } else {"
);

fs.writeFileSync('src/context/AppContext.tsx', appCode);
console.log('Patched AppContext to delete bookings when event is soft-deleted');
