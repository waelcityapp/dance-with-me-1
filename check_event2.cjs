const projectId = 'dance-with-me-35e98';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events`;

async function check() {
  const resp = await fetch(url);
  const data = await resp.json();
  data.documents.forEach(d => {
    let title = d.fields.titleAr?.stringValue || '';
    let eventRef = d.fields.eventRef?.integerValue || d.fields.eventRef?.stringValue;
    console.log(title, '=>', eventRef);
  });
}
check();
