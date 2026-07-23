const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const oldCleanup = `      const oldArchived = submissions.filter(s => {
        if (s.status !== 'archived') return false;
        if (!s.archivedAt) return false;
        const archivedTime = new Date(s.archivedAt).getTime();
        return (now - archivedTime) > thirtyDaysMs;
      });`;

const newCleanup = `      const oldArchived = submissions.filter(s => {
        let isArchived = s.status === 'archived';
        let archivedTime = s.archivedAt ? new Date(s.archivedAt).getTime() : 0;

        if (!isArchived && s.expiresAt) {
           const exp = new Date(s.expiresAt).getTime();
           if (now >= exp) {
              isArchived = true;
              archivedTime = exp;
           }
        }

        if (!isArchived || !archivedTime) return false;
        return (now - archivedTime) > thirtyDaysMs;
      });`;

code = code.replace(oldCleanup, newCleanup);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Patched AdminPanel auto cleanup');
