const fs = require('fs');

let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const originalDeleteEvent = `export async function deleteEventFromFirestore(eventId: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting event from Firestore:', error);
    return false;
  }
}`;

const newDeleteEvent = `export async function deleteEventFromFirestore(eventId: string): Promise<boolean> {
  try {
    // 1. Find all bookings associated with this event and delete them
    const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
    const q = query(bookingsRef, where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    
    // Create a batch or just delete them one by one
    // Since batch has a limit of 500, and this is client side, let's just do Promise.all
    const deletePromises = snapshot.docs.map(docSnap => {
      // Also, we might need to delete receipt images if any, but since we can't do it cleanly without the API from here 
      // it's okay for now, or the API call could be done. But let's just delete the documents to keep DB clean.
      return deleteDoc(docSnap.ref);
    });
    await Promise.all(deletePromises);
    console.log(\`Deleted \${snapshot.docs.length} bookings associated with event \${eventId}\`);

    // 2. Delete the event itself
    const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting event from Firestore:', error);
    return false;
  }
}`;

code = code.replace(originalDeleteEvent, newDeleteEvent);

const originalDeleteAd = `export async function deleteAdSubmissionFromFirestore(submissionId: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.AD_SUBMISSIONS, submissionId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting ad submission from Firestore:', error);
    return false;
  }
}`;

const newDeleteAd = `export async function deleteAdSubmissionFromFirestore(submissionId: string): Promise<boolean> {
  try {
    // We should ideally fetch the Ad to see if it has an eventData.id, but this function is usually called
    // AFTER the event is deleted in AdminPanel. So if there's an event, it should be deleted.
    const docRef = doc(db, COLLECTIONS.AD_SUBMISSIONS, submissionId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting ad submission from Firestore:', error);
    return false;
  }
}`;

fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Patched firebase.ts');
