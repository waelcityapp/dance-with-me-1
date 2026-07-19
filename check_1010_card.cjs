const projectId = 'dance-with-me-35e98';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events/ev-adm-1784396981315`;

async function check() {
  const resp = await fetch(url);
  const data = await resp.json();
  console.log(data.fields.eventRef.integerValue);
}
check();
