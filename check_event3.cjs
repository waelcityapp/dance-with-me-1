const projectId = 'dance-with-me-35e98';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events`;

async function check() {
  const resp = await fetch(url);
  const data = await resp.json();
  let found = data.documents.find(d => {
    let title = d.fields.titleAr?.stringValue || '';
    return title.includes('احترافية');
  });
  console.log(JSON.stringify(found?.fields, null, 2));
}
check();
