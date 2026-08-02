const fs = require('fs');

let path = 'src/components/events/EventCard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "{lang === 'ar' ? 'موقوف مؤقتاً' : 'Temporarily Paused'}",
  "{lang === 'ar' ? 'موقوف مؤقتاً (مخفي عن المستخدمين)' : 'Temporarily Paused (Hidden from users)'}"
);
fs.writeFileSync(path, content);
console.log('EventCard patched');

path = 'src/components/events/WeeklyPromoBanner.tsx';
content = fs.readFileSync(path, 'utf8');
content = content.replace(
  "{lang === 'ar' ? 'موقوف مؤقتاً' : 'Temporarily Paused'}",
  "{lang === 'ar' ? 'موقوف مؤقتاً (مخفي عن المستخدمين)' : 'Temporarily Paused (Hidden from users)'}"
);
fs.writeFileSync(path, content);
console.log('WeeklyPromoBanner patched');
