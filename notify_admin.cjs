const projectId = 'dance-with-me-35e98';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`;

async function notify() {
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.documents) {
    for (const doc of data.documents) {
      if (doc.fields.isAdmin && doc.fields.isAdmin.booleanValue === true) {
        const userId = doc.name.split('/').pop();
        console.log('Found Admin User:', userId);
        
        // Notify them about event 1010
        const notifUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/notifications/notif-retro-1010`;
        const notifResp = await fetch(notifUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              id: { stringValue: 'notif-retro-1010' },
              userId: { stringValue: userId },
              titleAr: { stringValue: 'تم نشر إعلانك الإداري بنجاح! 🎉' },
              titleEn: { stringValue: 'Your Admin Ad is Published! 🎉' },
              messageAr: { stringValue: 'تم نشر إعلانك. كود الحدث (الرقم المرجعي) الخاص بك هو: 1010. استخدم هذا الكود للبحث عن إعلانك أو لمشاركته مع الآخرين.' },
              messageEn: { stringValue: 'Your ad has been published. Your Event Code is: 1010. Use this code to search or share your ad.' },
              date: { stringValue: new Date().toISOString() },
              read: { booleanValue: false },
              type: { stringValue: 'system' }
            }
          })
        });
        
        console.log('Notified for 1010:', notifResp.ok);
      }
    }
  }
}
notify().catch(console.error);
