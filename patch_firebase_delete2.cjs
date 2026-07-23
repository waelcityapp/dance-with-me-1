const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

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
    const docRef = doc(db, COLLECTIONS.AD_SUBMISSIONS, submissionId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.eventData && data.eventData.id) {
        await deleteEventFromFirestore(data.eventData.id);
      }
    }
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting ad submission from Firestore:', error);
    return false;
  }
}`;

code = code.replace(originalDeleteAd, newDeleteAd);

fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Patched firebase deleteAdSubmission2');
