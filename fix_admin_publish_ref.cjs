const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const regex = /const newEventId = \`ev-adm-\$\{Date\.now\(\)\}\`;/;
const replacement = `let maxRef = 1000;
      const assignedRefs = events.map(e => e.eventRef).filter((r): r is number => typeof r === 'number');
      if (assignedRefs.length > 0) {
        maxRef = Math.max(...assignedRefs);
      }
      const newEventRef = maxRef + 1;
      
      const newEventId = \`ev-adm-\${Date.now()}\`;`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed admin publish eventRef');
