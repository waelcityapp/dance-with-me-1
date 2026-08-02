const fs = require('fs');
let path = 'src/components/events/WeeklyPromoBanner.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  '<div className="relative mb-8',
  '<div id={`event-${promoEvent.id}`} className="relative mb-8'
);
fs.writeFileSync(path, content);
console.log('Promo patched');
