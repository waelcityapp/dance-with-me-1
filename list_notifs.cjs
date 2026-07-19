const projectId = 'dance-with-me-35e98';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/notifications`;

async function list() {
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.documents) {
    for (const doc of data.documents) {
      console.log(doc.name);
      console.log(doc.fields.titleAr ? doc.fields.titleAr.stringValue : 'NO TITLE');
      if (doc.fields.userId) {
        console.log('userId:', doc.fields.userId.stringValue);
      }
    }
  }
}
list();
