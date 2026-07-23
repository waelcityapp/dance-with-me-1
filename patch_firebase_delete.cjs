const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(
  "export async function deleteAdSubmissionFromFirestore(submissionId: string): Promise<boolean> {\\n  try {\\n    const docRef = doc(db, COLLECTIONS.AD_SUBMISSIONS, submissionId);\\n    await deleteDoc(docRef);\\n    return true;",
  "export async function deleteAdSubmissionFromFirestore(submissionId: string): Promise<boolean> {\n  try {\n    const docRef = doc(db, COLLECTIONS.AD_SUBMISSIONS, submissionId);\n    const snap = await getDoc(docRef);\n    if (snap.exists()) {\n      const data = snap.data();\n      if (data && data.eventData && data.eventData.id) {\n        await deleteEventFromFirestore(data.eventData.id);\n      }\n    }\n    await deleteDoc(docRef);\n    return true;"
);

fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Patched firebase deleteAdSubmission');
