const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

code = code.replace(
`      if (user?.isAdmin || isAdminUnlocked) {
        addNewEvent({
          titleAr: titleAr || 'سهرة سالسا وباتشاتا ملكية جديدة',`,
`      if (user?.isAdmin || isAdminUnlocked) {
        const createdEvent = addNewEvent({
          titleAr: titleAr || 'سهرة سالسا وباتشاتا ملكية جديدة',`
);

code = code.replace(
`        });
        
        onComplete();
      } else {`,
`        });
        
        if (createdEvent && createdEvent.eventRef) {
          alert(lang === 'ar' ? \`✅ تم إنشاء الحدث بنجاح! الرقم المرجعي (كود الحدث) هو: \${createdEvent.eventRef}\` : \`✅ Event created successfully! Event Code (Ref): \${createdEvent.eventRef}\`);
        }
        
        onComplete();
      } else {`
);

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
