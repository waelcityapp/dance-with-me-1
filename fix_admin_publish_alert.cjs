const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const targetStr = `      await saveNotificationToFirestore(newNotif);

      setAdminSaveStatus('success');
      localStorage.removeItem(DRAFT_KEY);
      alert(lang === 'ar' ? '🎉 تم إنشاء ونشر الإعلان فوراً وربطه بالتنبيهات العامة بنجاح!' : '🎉 Ad has been published and broadcasted via real-time alerts successfully!');`;

const newStr = `      await saveNotificationToFirestore(newNotif);

      // Send personal notification to admin with the event code
      if (user?.id) {
        try {
          const personalNotifId = \`notif-adm-personal-\${Date.now()}\`;
          await saveNotificationToFirestore({
            id: personalNotifId,
            userId: user.id,
            titleAr: 'تم نشر إعلانك الإداري بنجاح! 🎉',
            titleEn: 'Your Admin Ad is Published! 🎉',
            messageAr: \`تم نشر إعلانك "\${createdEvent.titleAr}". كود الحدث (الرقم المرجعي) الخاص بك هو: \${newEventRef}. استخدم هذا الكود للبحث عن إعلانك أو لمشاركته مع الآخرين.\`,
            messageEn: \`Your ad "\${createdEvent.titleEn}" has been published. Your Event Code is: \${newEventRef}. Use this code to search or share your ad.\`,
            date: new Date().toISOString(),
            read: false,
            type: 'system'
          } as any);
        } catch (e) {
          console.error('Failed to send personal admin notification:', e);
        }
      }

      setAdminSaveStatus('success');
      localStorage.removeItem(DRAFT_KEY);
      alert(lang === 'ar' 
        ? \`🎉 تم النشر بنجاح! كود الحدث (الرقم المرجعي) الخاص بك هو: \${newEventRef}\` 
        : \`🎉 Published successfully! Your Event Code is: \${newEventRef}\`);`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed admin publish alert and added personal notification');
