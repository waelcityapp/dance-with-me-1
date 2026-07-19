const projectId = 'dance-with-me-35e98';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events`;

async function check() {
  const resp = await fetch(url);
  const data = await resp.json();
  let missing = 0;
  for (const doc of data.documents) {
    if (!doc.fields.eventRef) {
      console.log('MISSING eventRef:', doc.name, doc.fields.titleAr.stringValue);
      missing++;
    }
  }
  console.log('Total missing:', missing);
}
check();
