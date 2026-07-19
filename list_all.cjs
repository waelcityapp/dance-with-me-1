const projectId = 'dance-with-me-35e98';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events`;
fetch(url).then(r=>r.json()).then(d=>{
  d.documents.forEach(doc => {
    console.log(doc.fields.titleAr.stringValue, doc.fields.eventRef?.integerValue || 'MISSING');
  });
});
