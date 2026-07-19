const projectId = 'dance-with-me-35e98';
const adminUserId = 'Sg7JTQoUxvXUcvIgVexEqxGhacH2';

async function backfill() {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/submissions/sub-adm-retro-1010`;
  
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        id: { stringValue: 'sub-adm-retro-1010' },
        eventRef: { integerValue: '1010' },
        invoiceNumber: { stringValue: `DWM-ADM-1010` },
        advertiserId: { stringValue: adminUserId },
        advertiserName: { stringValue: 'Admin (Retro)' },
        phone: { stringValue: '+201011223344' },
        titleAr: { stringValue: 'لاتين نايت احترافية' },
        titleEn: { stringValue: 'Professional Latin Night' },
        category: { stringValue: 'party' },
        styles: { arrayValue: { values: [] } },
        mediaType: { stringValue: 'image' },
        mediaUrl: { stringValue: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=1200&q=80' },
        pricing: { mapValue: { fields: { days: { integerValue: '30' } } } },
        status: { stringValue: 'approved' },
        createdAt: { stringValue: new Date().toISOString() },
        expiresAt: { stringValue: new Date(Date.now() + 30 * 86400000).toISOString() },
        userRead: { booleanValue: false },
        reviewedAt: { stringValue: new Date().toISOString() },
        eventData: { mapValue: { fields: { id: { stringValue: 'ev-adm-1784396981315' } } } }
      }
    })
  });
  
  console.log('Backfilled submission for 1010:', resp.ok);
}
backfill().catch(console.error);
