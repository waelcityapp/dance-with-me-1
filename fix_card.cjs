const fs = require('fs');
let code = fs.readFileSync('src/components/events/EventCard.tsx', 'utf-8');

const target1 = `#{index !== undefined ? index + 1 : '-'}`;
const replace1 = `#{event.position && event.position !== 999999 && event.position > 0 ? event.position : (index !== undefined ? index + 1 : '-')}`;

code = code.replace(target1, replace1);
code = code.replace(target1, replace1);

fs.writeFileSync('src/components/events/EventCard.tsx', code);
