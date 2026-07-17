const fs = require('fs');
let code = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf-8');

const target1 = `#{promoEvent.position && promoEvent.position > 0 ? promoEvent.position : 1}`;
const replace1 = `#1`;

code = code.replace(target1, replace1);
code = code.replace(target1, replace1);

fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', code);
