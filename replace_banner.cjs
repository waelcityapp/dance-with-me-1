const fs = require('fs');
let code = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf-8');

code = code.replace(
  "#{promoEvent.position !== undefined ? promoEvent.position : '-'}",
  "#{promoEvent.position && promoEvent.position > 0 ? promoEvent.position : 1}"
);

code = code.replace(
  "#{promoEvent.position !== undefined ? promoEvent.position : '-'}",
  "#{promoEvent.position && promoEvent.position > 0 ? promoEvent.position : 1}"
);

fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', code);
