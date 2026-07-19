const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const regex = /isFeatured: sub\.adType === 'vip' \|\| sub\.eventData\?\.adType === 'vip',/;
const replacement = `isFeatured: sub.adType === 'vip' || sub.eventData?.adType === 'vip',
          eventRef: newEventRef,`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed newEv');
