const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const targetStr = `      // Send personal notification to admin with the event code
      if (user?.id) {`;

const newStr = `      // Also create an AdSubmission so the admin can see it in their Profile -> My Ads
      if (user?.id) {
        try {
          const submissionId = \`sub-adm-\${Date.now()}\`;
          await saveAdSubmissionToFirestore({
            id: submissionId,
            eventRef: newEventRef,
            invoiceNumber: \`DWM-ADM-\${Math.floor(100000 + Math.random() * 900000)}\`,
            advertiserId: user.id,
            advertiserName: user.name || 'Admin',
            phone: adminPhone.trim() || '+201011223344',
            titleAr: adminTitleAr.trim(),
            titleEn: adminTitleEn.trim(),
            category: adminCategory,
            styles: adminSelectedStyles,
            mediaType: adminMediaType,
            mediaUrl: finalMediaUrl,
            pricing: { days: 30, subtotal: 0, tax: 0, total: 0 },
            status: 'approved',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
            userRead: false,
            reviewedAt: new Date().toISOString(),
            eventData: createdEvent
          } as any);
        } catch (e) {
          console.error('Failed to create admin ad submission link:', e);
        }
      }

      // Send personal notification to admin with the event code
      if (user?.id) {`;

code = code.replace(targetStr, newStr);

// Also need to make sure saveAdSubmissionToFirestore is imported in AdminPanel.tsx
if (!code.includes('saveAdSubmissionToFirestore')) {
  code = code.replace('saveEventToFirestore,', 'saveEventToFirestore, saveAdSubmissionToFirestore,');
}

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed admin publish submission');
