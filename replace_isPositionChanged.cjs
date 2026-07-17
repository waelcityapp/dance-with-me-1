const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminEditEventPage.tsx', 'utf-8');

const target = `      const newPos = Number(position) || 0;
      const isPositionChanged = newPos !== (editingEvent.position || 0);`;

const replacement = `      const newPos = Number(position) || 0;
      const originalPosition = editingEvent.position && editingEvent.position > 0 ? editingEvent.position : currentDisplayIndex;
      const isPositionChanged = newPos !== originalPosition;`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/admin/AdminEditEventPage.tsx', code);
