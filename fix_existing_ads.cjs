const projectId = 'dance-with-me-35e98';
const databaseId = '(default)';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/events`;

async function fix() {
  const resp = await fetch(url);
  const data = await resp.json();
  
  if (!data.documents) {
    console.log('No documents found.');
    return;
  }
  
  let maxRef = 1000;
  
  for (const doc of data.documents) {
    if (doc.fields && doc.fields.eventRef && doc.fields.eventRef.integerValue) {
      const ref = parseInt(doc.fields.eventRef.integerValue, 10);
      if (ref > maxRef) maxRef = ref;
    }
  }
  
  console.log('Max existing ref:', maxRef);
  
  for (const doc of data.documents) {
    if (!doc.fields || !doc.fields.eventRef) {
      maxRef++;
      console.log(`Updating document ${doc.name} with eventRef ${maxRef}...`);
      
      const docUrl = `https://firestore.googleapis.com/v1/${doc.name}?updateMask.fieldPaths=eventRef`;
      
      const patchResp = await fetch(docUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: { eventRef: { integerValue: maxRef.toString() } }
        })
      });
      
      if (!patchResp.ok) {
        console.error('Failed to update', doc.name, await patchResp.text());
      } else {
        console.log('Successfully updated', doc.name);
      }
    }
  }
}

fix().catch(console.error);
