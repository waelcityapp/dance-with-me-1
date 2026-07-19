const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const approveTarget = /const updated: AdSubmission = \{\n\s+\.\.\.sub,\n\s+status: 'approved',/;
const approveReplacement = `// Generate the unique event code (eventRef) before saving
      let maxRef = 1000;
      const assignedRefs = events.map(e => e.eventRef).filter((r): r is number => typeof r === 'number');
      if (assignedRefs.length > 0) {
        maxRef = Math.max(...assignedRefs);
      }
      const newEventRef = maxRef + 1;
      
      if (eventId && sub.eventData) { 
        sub.eventData.id = eventId; 
        sub.eventData.eventRef = newEventRef;
      }
      
      const updated: AdSubmission = {
        ...sub,
        status: 'approved',`;

code = code.replace(approveTarget, approveReplacement);

// Now to send the notification
const saveTarget = /await saveAdSubmissionToFirestore\(updated\);/;
const saveReplacement = `await saveAdSubmissionToFirestore(updated);
      
      // Send personal notification to the user with the event code
      if (sub.advertiserId) {
        try {
          const { saveNotificationToFirestore } = await import('../../lib/firebase');
          await saveNotificationToFirestore({
            id: \`notif_appr_\${Date.now()}_\${sub.id}\`,
            userId: sub.advertiserId,
            type: 'system',
            titleAr: 'تم تفعيل إعلانك بنجاح! 🎉',
            titleEn: 'Your Ad is Approved! 🎉',
            messageAr: \`تمت الموافقة على نشر إعلانك "\${sub.titleAr}". كود الحدث (الرقم المرجعي) الخاص بك هو: \${newEventRef}. استخدم هذا الكود للبحث عن إعلانك أو لمشاركته مع الآخرين.\`,
            messageEn: \`Your ad "\${sub.titleEn}" has been published. Your Event Code is: \${newEventRef}. Use this code to search or share your ad.\`,
            date: new Date().toISOString(),
            read: false
          });
        } catch (e) {
          console.error('Failed to send personal approval notification:', e);
        }
      }`;
code = code.replace(saveTarget, saveReplacement);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed admin notification and eventRef generation');
